# frozen_string_literal: true

module Neeti
  module Providers
    class NullProvider < Base
      def initialize(response: "Wisdom awaits.")
        @response = response
      end

      def name = :null

      def chat(messages:, stream: false)
        stream.call(@response) if stream.respond_to?(:call)
        @response
      end
    end
  end
end
