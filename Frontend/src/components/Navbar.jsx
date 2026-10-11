import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useUnreadCount from '../hooks/useUnreadCount'
import { initials } from '../utils/ui'

// Desktop: white text, amber underline on the active tab. Mobile menu: stacked rows.
const desktopLink = ({ isActive }) =>
  `flex h-16 items-center border-b-[3px] px-4 text-[15px] font-medium transition-colors ${isActive ? 'border-sun-400 font-semibold text-white' : 'border-transparent text-brand-200 hover:text-white'}`
const mobileLink = ({ isActive }) =>
  `flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium ${isActive ? 'bg-brand-700 text-white' : 'text-brand-200 hover:bg-brand-800'}`

export default function Navbar() {
  const { user, logout } = useAuth()
  const unread = useUnreadCount()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDoc = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false)
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const doLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const links = [
    { to: '/listings', label: 'Search' },
    { to: '/suggestions', label: 'Suggestions' },
    { to: '/my-listings', label: 'My listings' },
    { to: '/matches', label: 'Matches' },
    { to: '/messages', label: 'Messages', badge: unread },
    { to: '/profile', label: 'Profile' },
  ]
  if (user?.role === 'ADMIN') links.push({ to: '/admin', label: 'Admin' })

  const renderLinks = (cls) =>
    links.map((l) => (
      <NavLink key={l.to} to={l.to} className={cls} end={l.to === '/listings'}>
        {l.label}
        {l.badge > 0 && (
          <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-sun-400 px-1.5 text-xs font-bold text-brand-900" aria-label={`${l.badge} unread messages`}>
            {l.badge}
          </span>
        )}
      </NavLink>
    ))

  return (
    <header className="on-dark sticky top-0 z-40 bg-brand-900 text-white">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-400 font-sans text-lg font-bold text-brand-900" aria-hidden="true">G</span>
          GharSathi
        </Link>

        <nav className="hidden flex-1 items-center gap-1 pl-6 md:flex" aria-label="Main">{renderLinks(desktopLink)}</nav>

        <div className="flex items-center gap-1">
          <div className="relative hidden md:block" ref={menuRef}>
            <button type="button" className="flex min-h-[44px] items-center gap-3 rounded-full pr-2 text-[15px] font-medium text-white hover:text-sun-300" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sun-400 text-sm font-bold text-brand-900" aria-hidden="true">
                {initials(user?.name)}
              </span>
              <span className="max-w-[9rem] truncate">{user?.name}</span>
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl bg-white py-1 text-slate-800 shadow-card">
                <Link role="menuitem" to="/blocked" className="flex min-h-[44px] items-center px-3 text-sm text-slate-700 hover:bg-slate-50">Blocked users</Link>
                <button role="menuitem" type="button" onClick={doLogout} className="flex min-h-[44px] w-full items-center px-3 text-left text-sm text-red-600 hover:bg-slate-50">Log out</button>
              </div>
            )}
          </div>

          <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-brand-800 md:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((o) => !o)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mobileOpen ? <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            {!mobileOpen && unread > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-sun-400" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-brand-700 bg-brand-900 px-4 py-2 md:hidden" aria-label="Mobile">
          <div className="flex flex-col">{renderLinks(mobileLink)}</div>
          <div className="mt-2 border-t border-brand-700 pt-2">
            <p className="px-3 py-1 text-xs text-brand-300">Signed in as {user?.name}</p>
            <Link to="/blocked" className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-brand-200 hover:bg-brand-800">Blocked users</Link>
            <button type="button" onClick={doLogout} className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm text-coral-400 hover:bg-brand-800">Log out</button>
          </div>
        </nav>
      )}
    </header>
  )
}
