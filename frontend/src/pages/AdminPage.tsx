import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import {
  Shield,
  Users,
  MessageSquare,
  Activity,
  Layers,
  Search,
  UserCheck,
  Trash2,
  ChevronRight,
  TrendingUp,
  Settings,
  X
} from 'lucide-react'

interface AdminStats {
  users: {
    total: number
    admins: number
    by_plan: Record<string, number>
    new_today: number
    new_week: number
  }
  conversations: {
    total: number
    today: number
  }
  messages: {
    total: number
    today: number
  }
  sutras: { total: number }
  themes: { total: number }
  insights: { total: number }
}

interface UserInfo {
  id: number
  email: string
  plan: string
  role: string
  daily_query_count: number
  created_at: string
  conversations_count: number
}

export function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [searchVal, setSearchVal] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const [editPlan, setEditPlan] = useState('free')
  const [editRole, setEditRole] = useState('user')

  useEffect(() => {
    // Restrict access if not admin
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }

    // Load stats
    apiClient.get<AdminStats>('/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => {})

    // Load users
    loadUsers()
  }, [user, navigate])

  const loadUsers = () => {
    const params: Record<string, string> = {}
    if (searchVal.trim()) params.q = searchVal.trim()
    if (selectedPlan) params.plan = selectedPlan

    apiClient.get<{ users: UserInfo[] }>('/admin/users', { params })
      .then((r) => setUsers(r.data.users || []))
      .catch(() => {})
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (user?.role === 'admin') loadUsers()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchVal, selectedPlan])

  const handleUpdateUser = async (id: number) => {
    try {
      await apiClient.patch(`/admin/users/${id}`, { plan: editPlan, role: editRole })
      setEditUserId(null)
      loadUsers()
      // Reload stats in case roles changed
      apiClient.get<AdminStats>('/admin/stats')
        .then((r) => setStats(r.data))
        .catch(() => {})
    } catch (e) {}
  }

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this user account and all of their active conversations/insights?')) {
      try {
        await apiClient.delete(`/admin/users/${id}`)
        loadUsers()
        // Reload stats
        apiClient.get<AdminStats>('/admin/stats')
          .then((r) => setStats(r.data))
          .catch(() => {})
      } catch (e) {}
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/25 flex items-center justify-center text-primary-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-1">
            System Console
          </span>
          <h1 className="text-3xl font-bold font-display text-surface-800">
            Admin Control Panel
          </h1>
        </div>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.users.total, sub: `${stats.users.admins} Admins · +${stats.users.new_today} today`, icon: Users, color: 'text-primary-400 bg-primary-500/10 border-primary-500/10' },
            { label: 'Conversations', value: stats.conversations.total, sub: `+${stats.conversations.today} active today`, icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' },
            { label: 'Total Messages', value: stats.messages.total, sub: `+${stats.messages.today} today`, icon: Activity, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/10' },
            { label: 'Database Sutras', value: stats.sutras.total, sub: `${stats.themes.total} themes mapped`, icon: Layers, color: 'text-sky-400 bg-sky-500/10 border-sky-500/10' },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="glass-card border border-surface-200/40 p-5 rounded-xl flex flex-col justify-between h-28 hover:border-surface-200/80 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-surface-800 font-display">
                    {stat.value}
                  </h3>
                  <p className="text-[10px] text-surface-400 mt-1">
                    {stat.sub}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Users Management Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-surface-800 font-display flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-500" />
          User Management
        </h2>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl bg-surface-50 border border-surface-200/40 px-3.5 py-2 flex-1 max-w-md focus-within:border-primary-600/60 focus-within:shadow-glow transition-all duration-200">
            <Search className="w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-transparent border-none text-surface-800 placeholder-surface-400 text-xs focus:outline-none focus:ring-0 py-0"
            />
          </div>

          {/* Filter plan */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-50 border border-surface-200/40 rounded-xl">
            <Layers className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="bg-transparent border-none text-surface-600 text-xs font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-5 py-0"
            >
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="seeker">Seeker</option>
              <option value="strategist">Strategist</option>
              <option value="raja">Raja</option>
            </select>
          </div>
        </div>

        {/* Table of Users */}
        <div className="glass-card border border-surface-200/40 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50/60 border-b border-surface-200/40 text-[10px] font-bold text-surface-500 uppercase tracking-wider select-none">
                  <th className="p-4">Email</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-center">Convos</th>
                  <th className="p-4 text-center">Daily Usage</th>
                  <th className="p-4">Joined At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/20 text-xs">
                {users.map((u) => {
                  const isEditing = editUserId === u.id
                  return (
                    <tr key={u.id} className="hover:bg-surface-50/25 transition-colors">
                      <td className="p-4 font-semibold text-surface-700">{u.email}</td>
                      <td className="p-4 uppercase tracking-wider font-bold">
                        {isEditing ? (
                          <select
                            value={editPlan}
                            onChange={(e) => setEditPlan(e.target.value)}
                            className="bg-surface-50 border border-surface-200/40 rounded px-1.5 py-0.5 text-surface-700 text-xs focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="free">Free</option>
                            <option value="seeker">Seeker</option>
                            <option value="strategist">Strategist</option>
                            <option value="raja">Raja</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              u.plan === 'raja' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                              u.plan === 'strategist' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                              u.plan === 'seeker' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' :
                              'bg-surface-100 text-surface-500 border border-surface-200/40'
                            }`}
                          >
                            {u.plan}
                          </span>
                        )}
                      </td>
                      <td className="p-4 capitalize">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="bg-surface-50 border border-surface-200/40 rounded px-1.5 py-0.5 text-surface-700 text-xs focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              u.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' : 'bg-surface-100 text-surface-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold text-surface-600">
                        {u.conversations_count}
                      </td>
                      <td className="p-4 text-center font-semibold text-surface-600">
                        {u.daily_query_count}
                      </td>
                      <td className="p-4 text-surface-500">
                        {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateUser(u.id)}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-surface-0 rounded font-bold uppercase text-[9px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditUserId(null)}
                              className="px-2 py-1 bg-surface-100 hover:bg-surface-200 text-surface-600 rounded font-bold uppercase text-[9px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditUserId(u.id)
                                setEditPlan(u.plan)
                                setEditRole(u.role)
                              }}
                              className="p-1.5 rounded-lg border border-surface-200/40 bg-surface-50 hover:border-primary-500/30 text-surface-400 hover:text-primary-400 transition-colors"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg border border-surface-200/40 bg-surface-50 hover:border-red-500/30 text-surface-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-surface-400 italic">
                      No matching user accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
