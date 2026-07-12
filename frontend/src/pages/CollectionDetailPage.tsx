import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import {
  FolderOpen,
  ArrowLeft,
  Upload,
  FileText,
  FileType,
  File,
  Trash2,
  Loader2
} from 'lucide-react'

interface Collection {
  id: number
  name: string
  description: string | null
  icon: string
  document_count: number
}

interface Document {
  id: number
  filename: string
  title: string
  file_type: string
  file_size: number
  status: string
  created_at: string
  page_count: number
  chunk_count: number
}

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      apiClient.get<{ collection: Collection }>(`/collections/${id}`),
      apiClient.get<{ documents: Document[] }>(`/documents?collection_id=${id}`)
    ]).then(([cRes, dRes]) => {
      setCollection(cRes.data.collection)
      setDocuments(dRes.data.documents)
    }).catch(() => navigate('/collections'))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'md', 'txt', 'docx'].includes(ext || '')) return
    if (file.size > 20 * 1024 * 1024) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name)
    formData.append('collection_id', id!)

    try {
      const { data } = await apiClient.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setDocuments(prev => [data.document, ...prev])
      setCollection(prev => prev ? { ...prev, document_count: prev.document_count + 1 } : prev)
    } catch { /* ignore */ }
    setUploading(false)
  }

  const handleDelete = async (docId: number) => {
    try {
      await apiClient.delete(`/documents/${docId}`)
      setDocuments(prev => prev.filter(d => d.id !== docId))
      setCollection(prev => prev ? { ...prev, document_count: prev.document_count - 1 } : prev)
    } catch { /* ignore */ }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-accent-400 bg-accent-500/10 border-accent-500/20'
      case 'processing': return 'text-primary-400 bg-primary-500/10 border-primary-500/20'
      case 'error': return 'text-danger-400 bg-danger-500/10 border-danger-500/20'
      default: return 'text-surface-500 bg-surface-200/50 border-surface-700/20'
    }
  }

  const fileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-danger-400" />
      case 'md': return <FileType className="w-5 h-5 text-primary-400" />
      default: return <File className="w-5 h-5 text-surface-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!collection) return null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/collections')}
        className="inline-flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-400 transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Collections
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-2xl">
            {collection.icon}
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-1">
              Collection
            </span>
            <h1 className="text-3xl font-bold font-display text-surface-800">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-surface-500 mt-1">{collection.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary flex items-center gap-2 !py-2 !px-3 !text-xs"
        >
          <Upload className="w-4 h-4" />
          Add Document
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md,.txt,.docx"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
        />
      </div>

      {uploading && (
        <div className="glass-strong rounded-2xl p-6 text-center border-2 border-dashed border-primary-500">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
          <p className="text-sm text-surface-500 mt-2">Uploading and processing...</p>
        </div>
      )}

      <div className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="card flex items-center gap-4 py-3 px-4 group hover:border-primary-500/30 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-surface-200/50 border border-surface-700/30 flex items-center justify-center shrink-0">
              {fileIcon(doc.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">{doc.title}</p>
              <div className="flex items-center gap-3 text-[10px] text-surface-500 mt-0.5">
                <span>{formatSize(doc.file_size)}</span>
                <span className={`px-1.5 py-0.5 rounded-full ${statusColor(doc.status)}`}>{doc.status}</span>
                {doc.page_count > 0 && <span>{doc.page_count} pages</span>}
                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(doc.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger-500/10 text-surface-500 hover:text-danger-400 transition-all shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="glass-strong border border-surface-700/40 p-12 text-center rounded-2xl">
            <FolderOpen className="w-10 h-10 text-surface-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-surface-600">No documents in this collection</h3>
            <p className="text-sm text-surface-500 mt-1">
              Upload documents to organize them in this collection
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary !py-2 !px-4 !text-xs inline-flex items-center gap-1.5 mt-4"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
