import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import {
  FolderOpen,
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react'

interface Collection {
  id: number
  name: string
  description: string | null
  icon: string
  document_count: number
  created_at: string
}

export function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    apiClient.get<{ collections: Collection[] }>('/collections')
      .then(r => setCollections(r.data.collections))
      .catch(() => {})
  }, [])

  const createCollection = async () => {
    if (!newName.trim()) return
    try {
      const { data } = await apiClient.post('/collections', { name: newName, description: newDesc })
      setCollections(prev => [data.collection, ...prev])
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
    } catch (e) { /* ignore */ }
  }

  const deleteCollection = async (id: number) => {
    try {
      await apiClient.delete(`/collections/${id}`)
      setCollections(prev => prev.filter(c => c.id !== id))
    } catch (e) { /* ignore */ }
  }

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-1">
            Organization
          </span>
          <h1 className="text-3xl font-bold font-display text-surface-800">
            Collections
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Organize your documents into collections
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 !py-2 !px-3 !text-xs"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {showCreate && (
        <div className="glass-strong rounded-2xl p-6 space-y-4 animate-scale-in">
          <h3 className="font-semibold text-surface-800">Create Collection</h3>
          <input
            type="text"
            placeholder="Collection name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="input-field"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="input-field"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={createCollection} className="btn-primary !py-1.5 !px-4 !text-xs">Create</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl bg-surface-100/50 border border-surface-700/40 px-3.5 py-2 max-w-md focus-within:border-primary-600/60 focus-within:shadow-glow transition-all duration-200">
        <Search className="w-4 h-4 text-surface-500" />
        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent border-none text-surface-800 placeholder-surface-500 text-xs focus:outline-none focus:ring-0 py-0"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(collection => (
          <div
            key={collection.id}
            onClick={() => navigate(`/collections/${collection.id}`)}
            className="card group cursor-pointer hover:border-primary-500/30 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-lg">
                  {collection.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-surface-800 group-hover:text-primary-400 transition-colors">
                    {collection.name}
                  </h3>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {collection.document_count} documents
                  </p>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteCollection(collection.id) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger-500/10 text-surface-500 hover:text-danger-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {collection.description && (
              <p className="text-xs text-surface-500 mt-3 line-clamp-2">{collection.description}</p>
            )}
            <div className="mt-4 pt-3 border-t border-surface-700/20 flex items-center gap-2 text-[10px] text-surface-500">
              <FileText className="w-3 h-3" />
              <span>{collection.document_count} file{collection.document_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full glass-strong border border-surface-700/40 p-12 text-center rounded-2xl">
            <FolderOpen className="w-10 h-10 text-surface-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-surface-600">No collections yet</h3>
            <p className="text-sm text-surface-500 mt-1">
              Create your first collection to organize documents
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
