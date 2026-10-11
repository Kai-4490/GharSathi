import { useCallback, useEffect, useState } from 'react'
import * as messagesApi from '../api/messages'
import { useAuth } from '../context/AuthContext'

export const UNREAD_REFRESH_EVENT = 'gs:unread-refresh'
export const refreshUnread = () => window.dispatchEvent(new Event(UNREAD_REFRESH_EVENT))

// Polls the unread count every 20 s; pauses while the tab is hidden; refreshes on demand.
export default function useUnreadCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    if (!user) return
    try {
      setCount(await messagesApi.unreadCount(user.id))
    } catch {
      /* ignore transient errors */
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setCount(0)
      return undefined
    }
    load()
    const tick = () => {
      if (document.visibilityState === 'visible') load()
    }
    const id = setInterval(tick, 20000)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(UNREAD_REFRESH_EVENT, load)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(UNREAD_REFRESH_EVENT, load)
    }
  }, [user, load])

  return count
}
