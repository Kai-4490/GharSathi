import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand">Gharsaathi</a>
      <div className="navbar-user">
        <a href="/profile" style={{ color: 'var(--color-ink-soft)', textDecoration: 'none' }}>Profile</a>
        <span>{user?.name}</span>
        <button className="btn-link" onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  )
}
