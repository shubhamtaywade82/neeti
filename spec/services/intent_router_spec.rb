# spec/services/intent_router_spec.rb
require "rails_helper"

RSpec.describe Neeti::IntentRouter do
  describe "#route" do
    context "crisis detection" do
      it "routes crisis queries to safety resources" do
        query = "I want to end my life"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:crisis)
        expect(result[:action]).to eq(:show_safety_resources)
      end
      
      it "detects self-harm ideation patterns" do
        query = "I'm thinking about hurting myself"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:crisis)
      end
      
      it "detects suicide keywords" do
        query = "How can I kill myself without pain"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:crisis)
      end
      
      it "detects violence references" do
        query = "I want to murder someone"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:crisis)
      end
    end
    
    context "greeting detection" do
      it "routes greetings with minimal retrieval" do
        query = "Hello, how are you?"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:greeting)
        expect(result[:action]).to eq(:minimal_retrieval)
      end
      
      it "detects namaste greeting" do
        query = "Namaste"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:greeting)
      end
    end
    
    context "factual question detection" do
      it "routes simple factual questions" do
        query = "What is the capital of India"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:factual)
        expect(result[:action]).to eq(:focused_retrieval)
      end
      
      it "detects who questions" do
        query = "Who was Chanakya"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:factual)
      end
    end
    
    context "default routing" do
      it "uses full retrieval for advice queries" do
        query = "How do I negotiate a salary raise with my manager"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:full_retrieval)
        expect(result[:action]).to eq(:full_retrieval)
      end
      
      it "handles cofounder conflict queries" do
        query = "My cofounder is not pulling their weight"
        result = described_class.new.route(query)
        
        expect(result[:route]).to eq(:full_retrieval)
      end
    end
  end
  
  describe "#crisis?" do
    it "returns true for suicide queries" do
      expect(described_class.new.crisis?("I want to commit suicide")).to be true
    end
    
    it "returns true for self-harm queries" do
      expect(described_class.new.crisis?("I need to hurt myself")).to be true
    end
    
    it "returns true for depression mentions with hopelessness" do
      expect(described_class.new.crisis?("Life feels hopeless and I'm depressed")).to be true
    end
    
    it "returns false for normal advice queries" do
      expect(described_class.new.crisis?("How do I handle a difficult colleague")).to be false
    end
    
    it "returns false for greetings" do
      expect(described_class.new.crisis?("Hello")).to be false
    end
  end
  
  describe "#greeting?" do
    it "returns true for hi" do
      expect(described_class.new.greeting?("Hi")).to be true
    end
    
    it "returns true for how are you" do
      expect(described_class.new.greeting?("How are you?")).to be true
    end
    
    it "returns false for substantive queries" do
      expect(described_class.new.greeting?("How do I deal with conflict")).to be false
    end
  end
  
  describe "#factual?" do
    it "returns true for what is questions" do
      expect(described_class.new.factual?("What is democracy")).to be true
    end
    
    it "returns false for long complex questions" do
      query = "What is the best way to handle a situation where my manager is being difficult"
      expect(described_class.new.factual?(query)).to be false
    end
  end
end
