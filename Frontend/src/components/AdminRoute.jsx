import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  useEffect(() => {
    if (!isAdmin) toast.error('Admins only', { id: 'admins-only' })
  }, [isAdmin])
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
