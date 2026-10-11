import { Link } from 'react-router-dom'

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Link to="/" className="mb-6 flex items-center gap-3 font-display text-3xl font-bold tracking-tight text-brand-900">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sun-400 font-sans text-xl font-bold text-brand-900" aria-hidden="true">G</span>
        GharSathi
      </Link>
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
      {footer && <div className="mt-4 text-sm text-slate-600">{footer}</div>}
    </div>
  )
}

export const DevOtpHint = () =>
  import.meta.env.DEV ? (
    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
      Dev mode: read the OTP from the backend console (<code>DEV OTP for &lt;mobile&gt;: &lt;otp&gt;</code>).
    </p>
  ) : null
