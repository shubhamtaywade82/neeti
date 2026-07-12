import { useState, useEffect, useRef } from 'react'
import { apiClient } from '../api/client'
import {
  FileText,
  Upload,
  Search,
  Grid3X3,
  List,
  Trash2,
  File,
  FileType,
  Loader2,
  X
} from 'lucide-react'

interface Document {
  id: number
  filename: string
  title: string
  file_type: string
  file_size: number
  status: string
  collection_id: number | null
  collection_name: string | null
  created_at: string
  page_count: number
  chunk_count: number
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = () => {
    apiClient.get<{ documents: Document[] }>('/documents')
      .then(r => setDocuments(r.data.documents))
      .catch(() => {})
  }

  const handleUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'md', 'txt', 'docx'].includes(ext || '')) {
      setUploadProgress(`Unsupported file type: .${ext}`)
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadProgress('File too large (max 20MB)')
      return
    }

    setUploading(true)
    setUploadProgress(`Uploading ${file.name}...`)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name)

    try {
      await apiClient.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadProgress(`${file.name} uploaded. Processing...`)
      loadDocuments()
      setTimeout(() => { setUploadProgress(''); setShowUpload(false) }, 2000)
    } catch (e: any) {
      setUploadProgress(e.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/documents/${id}`)
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch (e) { /* ignore */ }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-accent-400 bg-accent-500/10 border-accent-500/20'
      case 'processing': return 'text-primary-400 bg-primary-500/10 border-primary-500/20'
      case 'error': return 'text-danger-400 bg-danger-500/10 border-danger-500/20'
      default: return 'text-surface-500 bg-surface-200/50 border-surface-700/20'
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const fileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-danger-400" />
      case 'md': return <FileType className="w-5 h-5 text-primary-400" />
      default: return <File className="w-5 h-5 text-surface-400" />
    }
  }

  const filtered = documents.filter(d =>
    d.filename.toLowerCase().includes(search.toLowerCase()) ||
    d.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-1">
            Files
          </span>
          <h1 className="text-3xl font-bold font-display text-surface-800">
            Documents
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Upload and manage your documents
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary flex items-center gap-2 !py-2 !px-3 !text-xs"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-surface-100/50 border border-surface-700/40 px-3.5 py-2 flex-1 max-w-md focus-within:border-primary-600/60 focus-within:shadow-glow transition-all duration-200">
          <Search className="w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-surface-800 placeholder-surface-500 text-xs focus:outline-none focus:ring-0 py-0"
          />
        </div>
        <div className="flex gap-1 p-1 bg-surface-100 border border-surface-700/40 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-surface-200/80 text-surface-600' : 'text-surface-500 hover:text-surface-600'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-surface-200/80 text-surface-600' : 'text-surface-500 hover:text-surface-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showUpload && (
        <div
          className={`glass-strong rounded-2xl p-8 text-center border-2 border-dashed transition-all duration-200 ${
            dragOver ? 'border-primary-500 bg-primary-500/5' : 'border-surface-700/40'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,.txt,.docx"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          />
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
              <p className="text-sm text-surface-500">{uploadProgress}</p>
            </div>
          ) : (
            <div className="space-y-3" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-surface-500 mx-auto" />
              <p className="text-sm font-medium text-surface-600">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-surface-500">
                PDF, Markdown, TXT, DOCX — up to 20 MB
              </p>
              <button
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="btn-primary !py-1.5 !px-4 !text-xs inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Select Files
              </button>
            </div>
          )}
          {!uploading && (
            <button
              onClick={() => setShowUpload(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-surface-200/50 text-surface-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {uploadProgress && !uploading && (
        <div className="text-sm text-surface-500 text-center py-2">{uploadProgress}</div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="card group hover:border-primary-500/30 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-200/50 border border-surface-700/30 flex items-center justify-center">
                    {fileIcon(doc.file_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-800 truncate max-w-[180px]">
                      {doc.title}
                    </p>
                    <p className="text-[10px] text-surface-500">{formatSize(doc.file_size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger-500/10 text-surface-500 hover:text-danger-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor(doc.status)}`}>
                  {doc.status}
                </span>
                {doc.page_count > 0 && (
                  <span className="text-[10px] text-surface-500">{doc.page_count} pages</span>
                )}
              </div>
              {doc.collection_name && (
                <p className="text-[10px] text-surface-500 mt-2">
                  📁 {doc.collection_name}
                </p>
              )}
              <p className="text-[10px] text-surface-500 mt-1">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div key={doc.id} className="card flex items-center gap-4 py-3 px-4 group hover:border-primary-500/30 transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-surface-200/50 border border-surface-700/30 flex items-center justify-center shrink-0">
                {fileIcon(doc.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{doc.title}</p>
                <div className="flex items-center gap-3 text-[10px] text-surface-500 mt-0.5">
                  <span>{formatSize(doc.file_size)}</span>
                  <span className={`px-1.5 py-0.5 rounded-full ${statusColor(doc.status)}`}>{doc.status}</span>
                  {doc.collection_name && <span>📁 {doc.collection_name}</span>}
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
        </div>
      )}

      {filtered.length === 0 && !showUpload && (
        <div className="glass-strong border border-surface-700/40 p-12 text-center rounded-2xl">
          <FileText className="w-10 h-10 text-surface-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-surface-600">No documents yet</h3>
          <p className="text-sm text-surface-500 mt-1 mb-4">
            Upload PDFs, Markdown files, or documents to chat with them
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload your first document
          </button>
        </div>
      )}
    </div>
  )
}
