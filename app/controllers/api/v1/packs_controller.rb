# frozen_string_literal: true

module Api
  module V1
    class PacksController < ApplicationController
      ALL_PACKS = [
        {
          id: 'chanakya',
          name: 'Chanakya Neeti',
          emoji: '🪔',
          author: 'Kautilya',
          version: '2.1',
          tier: 'Free',
          rating: 4.9,
          reviews: 1240,
          nodes: 432,
          edges: 1280,
          themes: 28,
          color: '#E8A020',
          borderColor: 'rgba(232,160,32,0.35)',
          bgColor: 'rgba(232,160,32,0.08)',
          desc: '432 structured sutras on statecraft, ethics, leadership, and human nature — with themes, concepts, and relational edges.',
          tags: ['Leadership', 'Ethics', 'Strategy', 'Philosophy'],
          official: true,
          premium: false
        },
        {
          id: 'gita',
          name: 'Bhagavad Gita',
          emoji: '🌺',
          author: 'Vyasa',
          version: '1.4',
          tier: 'Free',
          rating: 4.8,
          reviews: 987,
          nodes: 700,
          edges: 2100,
          themes: 34,
          color: '#5C8A6A',
          borderColor: 'rgba(92,138,106,0.35)',
          bgColor: 'rgba(92,138,106,0.08)',
          desc: '700 verses from 18 chapters, mapped to dharma, karma, detachment, and cosmic order with multi-tradition commentary.',
          tags: ['Dharma', 'Yoga', 'Metaphysics', 'Duty'],
          official: true,
          premium: false
        },
        {
          id: 'arthashastra',
          name: 'Arthashastra',
          emoji: '⚖️',
          author: 'Kautilya',
          version: '1.0',
          tier: 'Strategist',
          rating: 4.6,
          reviews: 423,
          nodes: 6000,
          edges: 12000,
          themes: 62,
          color: '#9B8AE0',
          borderColor: 'rgba(155,138,224,0.35)',
          bgColor: 'rgba(155,138,224,0.08)',
          desc: "Kautilya's complete treatise on statecraft, economic policy, and military strategy — 15 books, 6,000 sutras on governance.",
          tags: ['Statecraft', 'Economics', 'Military', 'Governance'],
          official: true,
          premium: true
        },
        {
          id: 'stoic',
          name: 'Stoic Meditations',
          emoji: '🏛️',
          author: 'Marcus Aurelius',
          version: '1.0',
          tier: 'Free',
          rating: 4.9,
          reviews: 1560,
          nodes: 310,
          edges: 890,
          themes: 22,
          color: '#94A3B8',
          borderColor: 'rgba(148,163,184,0.35)',
          bgColor: 'rgba(148,163,184,0.08)',
          desc: "Marcus Aurelius's private reflections on virtue, reason, and the good life — structured as concepts and principles.",
          tags: ['Stoicism', 'Virtue', 'Resilience', 'Philosophy'],
          official: false,
          premium: false
        },
        {
          id: 'sunzi',
          name: 'The Art of War',
          emoji: '🎴',
          author: 'Sun Tzu',
          version: '1.1',
          tier: 'Free',
          rating: 4.7,
          reviews: 1890,
          nodes: 260,
          edges: 720,
          themes: 18,
          color: '#F87171',
          borderColor: 'rgba(248,113,113,0.35)',
          bgColor: 'rgba(248,113,113,0.08)',
          desc: "Sun Tzu's 13 chapters on military strategy, competitive intelligence, and the psychology of conflict.",
          tags: ['Strategy', 'Conflict', 'Intelligence', 'Competition'],
          official: true,
          premium: false
        },
        {
          id: 'atomic',
          name: 'Atomic Habits',
          emoji: '⚡',
          author: 'James Clear',
          version: '1.2',
          tier: 'Seeker',
          rating: 4.7,
          reviews: 2100,
          nodes: 180,
          edges: 540,
          themes: 14,
          color: '#60A5FA',
          borderColor: 'rgba(96,165,250,0.35)',
          bgColor: 'rgba(96,165,250,0.08)',
          desc: 'Frameworks, habit loops, identity-based change models, and behavior design principles from the bestselling book.',
          tags: ['Habits', 'Productivity', 'Behavior', 'Systems'],
          official: true,
          premium: true
        }
      ].freeze

      def index
        # Return all packs along with installed status
        installed = current_user.installed_packs || []
        render json: {
          packs: ALL_PACKS,
          installed: installed
        }
      end

      def install
        pack_id = params[:pack_id]
        installed = current_user.installed_packs || []
        unless installed.include?(pack_id)
          installed << pack_id
          current_user.update!(installed_packs: installed)
        end
        render json: { success: true, installed: installed }
      end

      def uninstall
        pack_id = params[:pack_id]
        installed = current_user.installed_packs || []
        if installed.include?(pack_id)
          installed.delete(pack_id)
          current_user.update!(installed_packs: installed)
        end
        render json: { success: true, installed: installed }
      end
    end
  end
end
