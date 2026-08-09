class AddInstalledPacksToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :installed_packs, :text, array: true, default: [ 'chanakya', 'gita' ]
  end
end
