# frozen_string_literal: true

module Api
  module V1
    class AdvisorController < ApplicationController
      include ActionController::Live

      before_action :check_credits!
      before_action :grant_daily_credits_if_due

      CONSULTATION_COST = 1

      def create
        unless params[:query].to_s.strip.present?
          response.headers['Content-Type'] = 'text/event-stream'
          sse = SSE.new(response.stream, retry: 300)
          sse.write({ type: 'error', message: 'Query cannot be empty.' }.to_json)
          sse.close
          return
        end

        response.headers['Content-Type']      = 'text/event-stream'
        response.headers['Cache-Control']     = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'

        sse          = SSE.new(response.stream, retry: 300)
        advisor_param = params[:advisor]
        advisor_name = if advisor_param.is_a?(ActionController::Parameters)
                         advisor_param[:advisor]
                       elsif advisor_param.is_a?(String)
                         advisor_param
                       end
        advisor_name ||= 'chanakya'

        # Create Consultation record (replaces Conversation/Message model)
        consultation = current_user.consultations.create!(
          query_text: params[:query],
          title: params[:query].truncate(60),
          status: 'submitted'
        )

        agent        = Neeti::Agent.new
        accumulated_advice = +""

        # Prepare citation gate with retrieved sutras (will be populated by agent)
        citation_gate = nil
        stream_parser = nil

        stream_proc = ->(token) {
          # Use citation gate if initialized, otherwise accumulate normally
          if stream_parser
            stream_parser.write_token(token)
          else
            accumulated_advice << token
            sse.write({ type: 'token', content: token }.to_json)
          end
        }

        mode = params[:mode]&.to_sym == :cag ? :cag : :retrieval
        advisor = advisor_name.to_sym
        scope = params[:retrieval_scope].presence || 'library'
        
        # Route query through IntentRouter BEFORE retrieval
        intent_router = Neeti::IntentRouter.new(params[:query].to_s, logger: Rails.logger)
        verdict = intent_router.call
        
        if verdict.routed?
          consultation.update!(status: 'routed', routed_category: verdict.category.to_s, detection_stage: verdict.stage.to_s, query_text: nil)
          
          # Do NOT consume credits for routed queries
          # Return safety resources immediately
          sse.write({
            type: 'crisis',
            message: 'It sounds like you\'re going through something difficult.',
            category: verdict.category,
            resources: safety_resources_for(verdict.category)
          }.to_json)
          sse.close
          return
        end
        
        consultation.update!(status: 'retrieving')

        result = agent.advise(
          params.require(:query),
          user:             current_user,
          consultation:     consultation,
          stream_proc:      stream_proc,
          mode:             mode,
          advisor:          advisor,
          retrieval_scope:  scope
        )
        
        # Initialize citation gate with retrieved sutras
        retrieved_sutras = Sutra.where(id: result[:cited_sutra_ids])
        citation_gate = Neeti::CitationGate.new(retrieved_sutra_ids: retrieved_sutras)
        
        # Apply CitationGate to filter hallucinated citations
        filtered_advice = result[:advice]
        if citation_gate.hallucinated?(filtered_advice)
          filtered_advice = citation_gate.process(filtered_advice)
          consultation.update!(gate_violations: citation_gate.dropped_citations.count)
        end
        
        # Check if any contextual sutras were cited - inject wrappers server-side
        contextual_wrappers = build_contextual_wrappers(result[:cited_sutra_ids])
        
        consultation.update!(
          status: 'delivered',
          response_text: filtered_advice,
          citations_proposed: result[:cited_sutra_ids]&.count || 0,
          retrieval_ms: result[:retrieval_ms],
          generation_ms: result[:generation_ms],
          model_used: result[:model_used],
          corpus_version: result[:corpus_version]
        )

        # Consume credits ONLY on successful delivery
        begin
          current_user.spend_credits(
            amount: CONSULTATION_COST,
            consultation_id: consultation.id,
            description: "Consultation #{consultation.public_id}"
          )
          consultation.credits_consumed = CONSULTATION_COST
          consultation.save!
        rescue ArgumentError => e
          # Insufficient credits - refund and error
          consultation.update!(status: 'errored')
          sse.write({ type: 'error', message: 'Insufficient credits. Please purchase more.' }.to_json)
          sse.close
          return
        end

        # Build cited sutras response with contextual wrapper metadata
        cited = Sutra.where(id: result[:cited_sutra_ids]).map do |s|
          wrapper = Neeti::ContextualWrapper.new(s).as_json
          {
            type: 'sutra',
            id: s.canonical_id,
            preview: s.translation_en&.truncate(80),
            sanskrit: s.sanskrit,
            transliteration: s.transliteration,
            translation_en: s.translation_en,
            translation_hi: s.translation_hi,
            chapter: s.chapter,
            chapter_title: s.chapter_title,
            pack: s.knowledge_pack&.slug,
            advisory_status: s.advisory_status,
            contextual_wrapper: wrapper
          }
        end

        doc_cited = if result[:cited_document_ids].present?
          Document.where(id: result[:cited_document_ids]).map do |d|
            {
              type: 'document',
              id: d.id,
              filename: d.filename,
              title: d.title,
              file_type: d.file_type,
              collection: d.collection&.name
            }
          end
        else
          []
        end

        sse.write({
          type:             'complete',
          consultation_id:  consultation.public_id,
          cited_sutras:     cited,
          cited_documents:  doc_cited,
          contextual_wrappers: contextual_wrappers,
          credits_consumed: CONSULTATION_COST,
          remaining_credits: current_user.credit_balance,
          mode:             mode
        }.to_json)

      rescue ActionController::Live::ClientDisconnected
        # Client disconnected mid-stream. Save what was generated but don't charge.
        if accumulated_advice.strip.present?
          consultation.update!(
            status: 'errored',
            response_text: accumulated_advice
          )
        end
      rescue => e
        consultation.update!(status: 'errored') if consultation.persisted?
        sse.write({ type: 'error', message: 'Advisor temporarily unavailable.' }.to_json)
        Rails.logger.error("Advisor error: #{e.class}: #{e.message}\n#{e.backtrace.join("\n")}")
      ensure
        sse.close
      end

      private

      def safety_resources_for(category)
        case category.to_sym
        when :self_harm
          [
            { name: 'National Suicide Prevention Lifeline', contact: '988 (US/Canada)', url: 'https://988lifeline.org' },
            { name: 'International Association for Suicide Prevention', contact: 'https://www.iasp.info/resources/Crisis_Centres/' },
            { name: 'Crisis Text Line', contact: 'Text HOME to 741741' }
          ]
        when :abuse, :sexual_violence
          [
            { name: 'National Domestic Violence Hotline', contact: '1-800-799-SAFE (7233)', url: 'https://www.thehotline.org' },
            { name: 'RAINN Sexual Assault Hotline', contact: '1-800-656-HOPE (4673)', url: 'https://www.rainn.org' },
            { name: 'Women's Helpline (India)', contact: '181' }
          ]
        when :minors
          [
            { name: 'Childhelp National Child Abuse Hotline', contact: '1-800-4-A-CHILD', url: 'https://www.childhelp.org' },
            { name: 'CHILDLINE (India)', contact: '1098' }
          ]
        when :medical
          [
            { name: 'Emergency Services', contact: '911 (US) / 112 (EU) / 108 (India)' },
            { name: 'Mental Health Crisis Line', contact: '988' }
          ]
        when :legal
          [
            { name: 'Legal Aid Society', url: 'https://www.legalaidsociety.org' },
            { name: 'Find Legal Aid (US)', url: 'https://www.lsc.gov/find-legal-aid' }
          ]
        else
          []
        end
      end

      def build_contextual_wrappers(sutra_ids)
        return [] if sutra_ids.blank?
        
        Sutra.where(id: sutra_ids).filter_map do |s|
          next unless s.contextual?
          wrapper = Neeti::ContextualWrapper.new(s)
          {
            sutra_id: s.canonical_id,
            category: wrapper.as_json[:category],
            heading: wrapper.as_json[:heading],
            framing_text: wrapper.as_json[:framing_text]
          }
        end
      end

      def check_credits!
        # Fail closed: no credits = no consultation
        unless current_user.can_afford_consultation?(cost: CONSULTATION_COST)
          render json: {
            error: 'Insufficient credits',
            balance: current_user.credit_balance,
            cost: CONSULTATION_COST,
            purchase_url: '/pricing'
          }, status: :payment_required
        end
      end
      
      def grant_daily_credits_if_due
        current_user.grant_daily_credits!
      end
    end
  end
end
