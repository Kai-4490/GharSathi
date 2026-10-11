import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

// Pages that open with a full-width <PageHero> manage their own gutters.
const HERO_PAGES = new Set(['/listings', '/suggestions', '/my-listings', '/matches'])
// Messages is a split-pane workspace that fills the screen under the navbar.
const isWorkspace = (path) => path === '/messages' || path.startsWith('/chat/')

export default function Layout() {
  const { pathname } = useLocation()
  const workspace = isWorkspace(pathname)
  const hero = HERO_PAGES.has(pathname)

  return (
    <div className={workspace ? 'flex h-dvh flex-col overflow-hidden' : 'min-h-screen'}>
      <Navbar />
      <main className={workspace ? 'flex min-h-0 flex-1 flex-col' : hero ? '' : 'shell py-8'}>
        <Outlet />
      </main>
    </div>
  )
}
