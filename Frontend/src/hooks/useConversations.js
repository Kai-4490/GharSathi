import { useCallback, useEffect, useRef, useState } from 'react'
import * as matchesApi from '../api/matches'
import * as messagesApi from '../api/messages'
import { toastError } from '../api/client'
import { otherUser } from '../utils/match'
import { parseDate } from '../utils/dates'

// Conversation list for the Messages sidebar: everyone I have an INTERESTED / ACCEPTED
// match with, plus anyone who sent me an unread message. Newest conversation first.
export default function useConversations(user) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const loadedOnce = useRef(false)
  const timer = useRef(null)

  const load = useCallback(async () => {
    try {
      const matches = await matchesApi.forUser(user.id)
      const people = new Map()
      matches
        .filter((m) => m.status === 'INTERESTED' || m.status === 'ACCEPTED')
        .forEach((m) => {
          const o = otherUser(m, user)
          if (o && !people.has(o.id)) people.set(o.id, o)
        })
      const unread = await messagesApi.unread(user.id)
      unread.forEach((m) => {
        if (m.sender && !people.has(m.sender.id)) people.set(m.sender.id, m.sender)
      })
      const built = await Promise.all(
        [...people.values()].map(async (p) => {
          const convo = await messagesApi.conversation(user.id, p.id).catch(() => [])
          const last = convo[convo.length - 1] || null
          const unreadCount = convo.filter((m) => m.receiver?.id === user.id && !m.read).length
          return { person: p, last, unreadCount }
        }),
      )
      built.sort((a, b) => (parseDate(b.last?.sentAt)?.getTime() ?? -1) - (parseDate(a.last?.sentAt)?.getTime() ?? -1))
      setRows(built)
      setError(false)
    } catch (e) {
      if (!loadedOnce.current) {
        setError(true)
        toastError(e, 'Could not load conversations')
      }
    } finally {
      loadedOnce.current = true
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 20000)
    return () => {
      clearInterval(id)
      clearTimeout(timer.current)
    }
  }, [load])

  // Debounced refresh, called by the open thread when messages arrive or get marked read.
  const refresh = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(load, 800)
  }, [load])

  const retry = useCallback(() => {
    setLoading(true)
    setError(false)
    load()
  }, [load])

  return { rows, loading, error, refresh, retry }
}
