# frozen_string_literal: true

module Neeti
  module Providers
    class Base
      # @param messages [Array<Hash>] array of {role:, content:} hashes
      # @param stream [Boolean|Proc] false = return full string, Proc = yield tokens
      # @return [String] complete response content
      def chat(messages:, stream: false)
        raise NotImplementedError, "#{self.class}#chat not implemented"
      end

      def name
        raise NotImplementedError, "#{self.class}#name not implemented"
      end
    end
  end
end
