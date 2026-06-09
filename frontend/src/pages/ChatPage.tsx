import { useState } from 'react'
import { ChatWindow } from '../components/ChatWindow'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { SubscriptionModal } from '../components/SubscriptionModal'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

export function ChatPage() {
  const [activeConvoId, setActiveConvoId] = useState<number | undefined>()
  const [showUpgrade, setShowUpgrade]     = useState(false)
  const logout                            = useAuthStore((s) => s.logout)
  const user                              = useAuthStore((s) => s.user)
  const navigate                          = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-stone-950">
      <ConversationSidebar
        activeId={activeConvoId}
        onSelect={(id) => setActiveConvoId(id)}
        onNewChat={() => setActiveConvoId(undefined)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 border-b border-stone-800">
          <span className="text-stone-500 text-xs">{user?.email}</span>
          <div className="flex gap-2">
            {user?.plan === 'free' && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-xs text-amber-400 border border-amber-700 px-3 py-1 rounded-lg hover:bg-amber-700/20 transition-colors"
              >
                Upgrade ⬆
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-stone-500 hover:text-stone-300 px-2 py-1"
            >
              Logout
            </button>
          </div>
        </div>

        <ChatWindow
          conversationId={activeConvoId}
          onConversationCreated={(id) => setActiveConvoId(id)}
        />
      </div>

      <SubscriptionModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  )
}
