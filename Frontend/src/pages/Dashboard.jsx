import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="page">
      <NavBar />
      <div className="page-content" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>Welcome, {user?.name}</h1>
          <p className="auth-subtitle">
            You're logged in as {user?.role}. This is a placeholder - the real listings
            feed lands here in Phase 3.
          </p>
        </div>
      </div>
    </div>
  )
}
