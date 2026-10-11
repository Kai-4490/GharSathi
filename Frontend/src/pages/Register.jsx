import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthCard from '../components/AuthCard'
import * as authApi from '../api/auth'
import { toastError } from '../api/client'
import { REGISTRABLE_ROLES, ROLE_LABEL } from '../constants/enums'
import { emptyToNull, isValidEmail, isValidMobile, normalizeMobile } from '../utils/normalize'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', mobileNumber: '', email: '', role: 'SEEKER' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const mobile = normalizeMobile(form.mobileNumber)
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!isValidMobile(mobile)) errs.mobileNumber = 'Enter a 10-digit mobile number'
    if (form.email.trim() && !isValidEmail(form.email.trim())) errs.email = 'Enter a valid email address'
    if (!REGISTRABLE_ROLES.includes(form.role)) errs.role = 'Choose an option'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setBusy(true)
    try {
      const body = emptyToNull({ name: form.name.trim(), email: form.email.trim(), mobileNumber: mobile, role: form.role })
      await authApi.register(body)
      toast.success('Registered. Now verify your mobile number.')
      navigate('/verify-otp', { state: { mobileNumber: mobile } })
    } catch (err) {
      toastError(err, 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Find a flat or a roommate who matches how you live."
      footer={<>Already registered? <Link to="/login" className="font-medium text-brand-700 hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" className="input" value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="mobile" className="label">Mobile number</label>
          <input id="mobile" type="tel" inputMode="numeric" className="input" value={form.mobileNumber} onChange={set('mobileNumber')} placeholder="98XXXXXXXX" autoComplete="tel" aria-invalid={!!errors.mobileNumber} />
          {errors.mobileNumber && <p className="field-error">{errors.mobileNumber}</p>}
        </div>
        <div>
          <label htmlFor="email" className="label">Email (optional)</label>
          <input id="email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="role" className="label">I am…</label>
          <select id="role" className="input" value={form.role} onChange={set('role')}>
            {REGISTRABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          {errors.role && <p className="field-error">{errors.role}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
      </form>
    </AuthCard>
  )
}
