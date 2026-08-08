# app/tools/policy_search_tool.rb
class PolicySearchTool < RubyLLM::Tool
  description "Searches the Neeti internal database for compliance guidelines and historical rulings."

  params do
    string :query, description: "The compliance topic or keyword to search for."
    integer :limit, description: "Maximum number of documents to retrieve.", default: 3
  end

  def execute(query:, limit: 3)
    # Use pg_search or Elasticsearch integration securely
    documents = PolicyDocument.search(query).limit(limit)
    documents.map { |doc| { id: doc.id, title: doc.title, summary: doc.summary } }
  rescue => e
    { error: "Policy search failed: #{e.message}" }
  end
end
