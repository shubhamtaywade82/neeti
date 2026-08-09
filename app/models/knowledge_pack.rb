class KnowledgePack < ApplicationRecord
  has_many :sutras, dependent: :nullify

  validates :slug, presence: true, uniqueness: true
  validates :name, presence: true
  validates :tier, inclusion: { in: %w[Free Seeker Strategist Raja] }, allow_nil: true

  scope :official, -> { where(official: true) }
  scope :free, -> { where(premium: false) }
  scope :premium, -> { where(premium: true) }

  PACK_SEEDS = [
    {
      slug: "chanakya",
      name: "Chanakya Neeti",
      description: "432 structured sutras on statecraft, ethics, leadership, and human nature \u2014 with themes, concepts, and relational edges.",
      icon: "\u{1FA94}",
      color: "#E8A020",
      author: "Kautilya",
      version: "2.1",
      tier: "Free",
      official: true,
      premium: false,
      node_count: 432,
      edge_count: 1280
    },
    {
      slug: "gita",
      name: "Bhagavad Gita",
      description: "700 verses from 18 chapters, mapped to dharma, karma, detachment, and cosmic order with multi-tradition commentary.",
      icon: "\u{1F33A}",
      color: "#5C8A6A",
      author: "Vyasa",
      version: "1.4",
      tier: "Free",
      official: true,
      premium: false,
      node_count: 700,
      edge_count: 2100
    },
    {
      slug: "arthashastra",
      name: "Arthashastra",
      description: "Kautilya's complete treatise on statecraft, economic policy, and military strategy — 15 books, 6,000 sutras on governance.",
      icon: "\u2696\uFE0F",
      color: "#9B8AE0",
      author: "Kautilya",
      version: "1.0",
      tier: "Strategist",
      official: true,
      premium: true,
      node_count: 6000,
      edge_count: 12000
    },
    {
      slug: "stoic",
      name: "Stoic Meditations",
      description: "Marcus Aurelius's private reflections on virtue, reason, and the good life — structured as concepts and principles.",
      icon: "\u{1F3DB}\uFE0F",
      color: "#94A3B8",
      author: "Marcus Aurelius",
      version: "1.0",
      tier: "Free",
      official: false,
      premium: false,
      node_count: 310,
      edge_count: 890
    },
    {
      slug: "sunzi",
      name: "The Art of War",
      description: "Sun Tzu's 13 chapters on military strategy, competitive intelligence, and the psychology of conflict.",
      icon: "\u{1F3B4}",
      color: "#F87171",
      author: "Sun Tzu",
      version: "1.1",
      tier: "Free",
      official: true,
      premium: false,
      node_count: 260,
      edge_count: 720
    },
    {
      slug: "atomic",
      name: "Atomic Habits",
      description: "Frameworks, habit loops, identity-based change models, and behavior design principles from the bestselling book.",
      icon: "\u26A1",
      color: "#60A5FA",
      author: "James Clear",
      version: "1.2",
      tier: "Seeker",
      official: true,
      premium: true,
      node_count: 180,
      edge_count: 540
    }
  ].freeze

  def self.seed!
    PACK_SEEDS.each do |attrs|
      find_or_create_by!(slug: attrs[:slug]) do |pack|
        pack.assign_attributes(attrs)
      end
    end
  end
end
