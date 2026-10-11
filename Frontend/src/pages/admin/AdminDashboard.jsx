import { NavLink, Outlet } from 'react-router-dom'

const tabClass = ({ isActive }) =>
  `flex min-h-[44px] items-center rounded-md px-4 text-sm font-medium ${isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
      <nav aria-label="Admin sections" className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-200 p-1">
        <NavLink to="/admin/users" className={tabClass}>Users</NavLink>
        <NavLink to="/admin/reports" className={tabClass}>Reports</NavLink>
        <NavLink to="/admin/verifications" className={tabClass}>Verifications</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
