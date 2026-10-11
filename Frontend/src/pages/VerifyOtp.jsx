import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthCard, { DevOtpHint } from '../components/AuthCard'
import * as authApi from '../api/auth'
import { toastError } from '../api/client'
import { isValidMobile, normalizeMobile } from '../utils/normalize'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const fromState = state?.mobileNumber || ''
  const [mobile, setMobile] = useState(fromState)
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const m = normalizeMobile(mobile)
    const errs = {}
    if (!isValidMobile(m)) errs.mobile = 'Enter a 10-digit mobile number'
    if (!/^\d{6}$/.test(otp)) errs.otp = 'Enter the 6-digit OTP'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await authApi.verifyOtp(m, otp)
      toast.success('Verified')
      navigate('/login', { state: { mobileNumber: m } })
    } catch (err) {
      toastError(err, 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    const m = normalizeMobile(mobile)
    if (!isValidMobile(m)) return setErrors({ mobile: 'Enter a 10-digit mobile number' })
    setResending(true)
    try {
      await authApi.requestOtp(m)
      toast.success('OTP sent')
    } catch (err) {
      toastError(err, 'Could not send OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthCard
      title="Verify your mobile number"
      subtitle="Enter the 6-digit OTP. It is valid for 5 minutes."
      footer={<Link to="/login" className="font-medium text-brand-700 hover:underline">Back to log in</Link>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="v-mobile" className="label">Mobile number</label>
          <input id="v-mobile" type="tel" inputMode="numeric" className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} readOnly={!!fromState} />
          {errors.mobile && <p className="field-error">{errors.mobile}</p>}
        </div>
        <div>
          <label htmlFor="otp" className="label">OTP</label>
          <input id="otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="input tracking-widest" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
          {errors.otp && <p className="field-error">{errors.otp}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</button>
        <button type="button" onClick={resend} disabled={resending} className="w-full text-center text-sm font-medium text-brand-700 hover:underline disabled:opacity-50">
          {resending ? 'Sending…' : 'Resend OTP'}
        </button>
      </form>
      <DevOtpHint />
    </AuthCard>
  )
}
