class User < ApplicationRecord
  has_many :conversations,  dependent: :destroy
  has_many :user_insights,  dependent: :destroy
end
