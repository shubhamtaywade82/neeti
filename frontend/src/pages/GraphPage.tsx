import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import {
  Network,
  Search,
  BookOpen,
  Eye,
  Link as LinkIcon,
  Tag,
  Book,
  Activity,
  ChevronRight
} from 'lucide-react'

interface GraphNode {
  id: string
  name: string
  category: string
  sutras: {
    id: number
    canonical_id: string
    translation_en: string
    chapter: number
  }[]
}

interface GraphEdge {
  source: string
  target: string
  type: string
  strength: number
}

export function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [searchVal, setSearchVal] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/graph')
      .then((r) => {
        setNodes(r.data.nodes || [])
        setEdges(r.data.edges || [])
      })
      .catch(() => {})
  }, [])

  // Get all unique themes (represented by categories or unique node names)
  const allThemes = Array.from(new Set(nodes.map((n) => n.name)))

  // Filter nodes
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      node.category.toLowerCase().includes(searchVal.toLowerCase())
    const matchesTheme = !selectedTheme || node.name === selectedTheme
    return matchesSearch && matchesTheme
  })

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  // Get related edges
  const relatedEdges = selectedNodeId
    ? edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
    : []

  const relatedNodes = relatedEdges
    .map((edge) => {
      const otherId = edge.source === selectedNodeId ? edge.target : edge.source
      const node = nodes.find((n) => n.id === otherId)
      return node ? { edge, node } : null
    })
    .filter(Boolean) as { edge: GraphEdge; node: GraphNode }[]

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden font-body animate-fade-in relative z-20">
      {/* ── Left Sidebar (List Explorer) ── */}
      <div className="w-80 shrink-0 border-r border-wisdom-700/40 bg-wisdom-900/40 flex flex-col h-full z-10 select-none">
        {/* Search */}
        <div className="p-4 border-b border-wisdom-700/30 space-y-3">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-saffron-500" />
            <h2 className="text-sm font-bold text-wisdom-100 font-display">
              Knowledge Graph
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-wisdom-900 border border-wisdom-700/40 px-3 py-1.5 focus-within:border-saffron-600/60 focus-within:shadow-glow transition-all duration-200">
            <Search className="w-4 h-4 text-wisdom-500" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-transparent border-none text-wisdom-100 placeholder-wisdom-500 text-xs focus:outline-none focus:ring-0 py-0"
            />
          </div>
        </div>

        {/* Theme Chips */}
        <div className="p-4 border-b border-wisdom-700/30">
          <div className="text-[9px] font-bold text-wisdom-500 uppercase tracking-widest mb-2.5">
            Themes
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {allThemes.map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 border ${
                  selectedTheme === theme
                    ? 'bg-saffron-500/10 border-saffron-500/30 text-saffron-400'
                    : 'bg-wisdom-900 border-wisdom-700/40 text-wisdom-400 hover:text-wisdom-200'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* List of filtered nodes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-[9px] font-bold text-wisdom-500 uppercase tracking-widest mb-3">
            Nodes ({filteredNodes.length})
          </div>
          {filteredNodes.map((node) => {
            const isActive = selectedNodeId === node.id
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`w-full text-left p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col gap-1.5 ${
                  isActive
                    ? 'bg-saffron-500/5 border-saffron-500/30 text-saffron-400'
                    : 'bg-wisdom-800/40 border-wisdom-700/40 text-wisdom-300 hover:border-wisdom-700/80 hover:bg-wisdom-800/60'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider text-wisdom-500">
                  <span className="text-saffron-400">{node.category}</span>
                  <span>Pack Reference</span>
                </div>
                <div className="text-xs font-semibold leading-relaxed truncate capitalize">
                  {node.name}
                </div>
              </div>
            )
          })}

          {filteredNodes.length === 0 && (
            <div className="text-center py-10 text-wisdom-500 italic text-xs">
              No matching nodes found
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content detail area ── */}
      <div className="flex-1 overflow-y-auto bg-wisdom-950 p-6 sm:p-8">
        {selectedNode ? (
          <div className="space-y-6 max-w-4xl animate-fade-in-up">
            {/* Header path */}
            <div className="flex items-center gap-1.5 text-xs text-wisdom-500 font-semibold select-none">
              <span className="cursor-pointer hover:text-wisdom-300" onClick={() => setSelectedNodeId(null)}>
                Graph Explorer
              </span>
              <span>/</span>
              <span className="text-saffron-400 capitalize">{selectedNode.category}</span>
            </div>

            {/* Title / Badges */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold font-display text-wisdom-100 capitalize">
                {selectedNode.name}
              </h1>
              <div className="flex flex-wrap gap-2 text-xs select-none">
                <span className="px-2.5 py-0.5 rounded bg-saffron-500/10 border border-saffron-500/20 text-saffron-400 uppercase tracking-wider text-[10px] font-bold">
                  {selectedNode.category}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-wisdom-800 border border-wisdom-700/40 text-wisdom-400 text-[10px] font-semibold">
                  Source: Knowledge Corpus DB
                </span>
              </div>
            </div>

            {/* Split Details columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content box */}
              <div className="lg:col-span-2 space-y-6">
                {/* Referencing sutras list */}
                <div className="glass-card border border-wisdom-700/40 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-wisdom-200 font-display flex items-center gap-2 border-b border-wisdom-700/20 pb-3">
                    <BookOpen className="w-4 h-4 text-saffron-500" />
                    Referencing Sutras
                  </h3>
                  <div className="space-y-4">
                    {selectedNode.sutras.map((s) => (
                      <div key={s.id} className="p-4 bg-wisdom-900/60 border border-wisdom-700/40 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-wisdom-500 uppercase tracking-widest select-none">
                          <span>Sutra {s.canonical_id}</span>
                          <span>Ch.{s.chapter}</span>
                        </div>
                        <p className="text-xs text-wisdom-300 leading-relaxed font-body">
                          "{s.translation_en}"
                        </p>
                      </div>
                    ))}
                    {selectedNode.sutras.length === 0 && (
                      <p className="text-xs text-wisdom-500 italic">No direct referencing sutras found.</p>
                    )}
                  </div>
                </div>

                {/* Connections list */}
                <div className="glass-card border border-wisdom-700/40 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-wisdom-200 font-display flex items-center gap-2 border-b border-wisdom-700/20 pb-3 select-none">
                    <LinkIcon className="w-4 h-4 text-rose-400" />
                    Connected Concepts & Relationships
                  </h3>
                  <div className="space-y-3">
                    {relatedNodes.map(({ edge, node }) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className="w-full flex items-center justify-between p-3.5 bg-wisdom-900 border border-wisdom-700/40 hover:border-saffron-500/30 rounded-xl cursor-pointer transition-all duration-200 group"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="flex flex-col items-center shrink-0">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                edge.type === 'supports'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : edge.type === 'contradicts'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-wisdom-800 text-wisdom-400 border border-wisdom-700/40'
                              }`}
                            >
                              {edge.type}
                            </span>
                            <span className="text-[9px] text-wisdom-500 font-semibold mt-1">
                              {Math.round(edge.strength * 100)}% strength
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-wisdom-200 group-hover:text-saffron-300 transition-colors capitalize">
                              {node.name}
                            </h4>
                            <span className="text-[10px] text-wisdom-500 uppercase">{node.category}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-wisdom-500 group-hover:text-saffron-400 transition-colors" />
                      </div>
                    ))}
                    {relatedNodes.length === 0 && (
                      <p className="text-xs text-wisdom-500 italic">No direct connections mapped.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar meta details */}
              <div className="space-y-6 select-none">
                {/* Category details */}
                <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-wisdom-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-saffron-500" />
                    Classification
                  </h4>
                  <span className="inline-block px-2.5 py-1 rounded bg-wisdom-900 border border-wisdom-700/40 text-wisdom-300 text-[10px] font-semibold uppercase">
                    {selectedNode.category}
                  </span>
                </div>

                {/* Provenance */}
                <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-3 font-semibold">
                  <h4 className="text-xs font-bold text-wisdom-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Book className="w-3.5 h-3.5 text-saffron-500" />
                    Provenance
                  </h4>
                  <div className="space-y-2.5 text-xs text-wisdom-400">
                    <div className="flex justify-between border-b border-wisdom-700/10 pb-2">
                      <span className="text-wisdom-500">Source</span>
                      <span className="text-wisdom-200">Knowledge Graph DB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-wisdom-500">Connections</span>
                      <span className="text-wisdom-200">{relatedNodes.length} mapped</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto select-none">
            <div className="w-14 h-14 rounded-2xl bg-wisdom-900 border border-wisdom-700/40 flex items-center justify-center text-wisdom-600 mb-4 animate-float">
              <Network className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-wisdom-300 font-display">
              Explore the Knowledge Graph
            </h3>
            <p className="text-xs text-wisdom-500 mt-2 leading-relaxed">
              Select a node from the explorer list on the left to inspect its relationships, citations, Devanagari script, and cross-references across active packs.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
