# spec/lib/neeti/evaluator_spec.rb
require 'rails_helper'

RSpec.describe Neeti::Evaluator do
  before do
    create(:theme, name: 'laziness',        related_theme_names: ['self-discipline'])
    create(:theme, name: 'self-discipline', related_theme_names: ['laziness'])
    create(:sutra, themes: ['laziness'],        translation_en: 'Laziness destroys progress')
    create(:sutra, themes: ['self-discipline'], translation_en: 'Discipline leads to success')
    create(:sutra, themes: ['courage'],         translation_en: 'The brave succeed')
  end

  describe '.run' do
    it 'returns a report hash with quality metrics' do
      stub_const('Neeti::Evaluator::BENCHMARK_PATH',
        Rails.root.join('db/eval/benchmark_queries.json'))

      # Use just first 3 queries to keep test fast
      report = described_class.run(limit: 3)

      expect(report).to include(:avg_recall, :total_queries, :results)
      expect(report[:total_queries]).to eq(3)
      expect(report[:avg_recall]).to be_between(0.0, 1.0)
    end
  end
end
