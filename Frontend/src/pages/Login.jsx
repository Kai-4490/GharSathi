import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthCard, { DevOtpHint } from '../components/AuthCard'
import * as authApi from '../api/auth'
import { errorMessage, toastError } from '../api/client'
import { homeFor, useAuth } from '../context/AuthContext'
import { isValidMobile, normalizeMobile } from '../utils/normalize'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [mobile, setMobile] = useState(state?.mobileNumber || '')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [needsVerify, setNeedsVerify] = useState(false)
  const [busy, setBusy] = useState(false)

  const requestOtp = async (e) => {
    e?.preventDefault()
    const m = normalizeMobile(mobile)
    if (!isValidMobile(m)) return setError('Enter a 10-digit mobile number')
    setError('')
    setBusy(true)
    try {
      await authApi.requestOtp(m)
      toast.success('OTP sent')
      setStep(2)
    } catch (err) {
      setError(errorMessage(err, 'Could not send OTP'))
    } finally {
      setBusy(false)
    }
  }

  const submitLogin = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP')
    setError('')
    setNeedsVerify(false)
    setBusy(true)
    try {
      const { token, user } = await authApi.login(normalizeMobile(mobile), otp)
      login(token, user)
      navigate(homeFor(user.role), { replace: true })
    } catch (err) {
      const msg = errorMessage(err, 'Login failed')
      setError(msg)
      if (err.response?.status === 403 && /not verified/i.test(msg)) setNeedsVerify(true)
      else toastError(err, 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const goVerify = async () => {
    const m = normalizeMobile(mobile)
    try {
      await authApi.requestOtp(m)
    } catch (err) {
      toastError(err, 'Could not send OTP')
    }
    navigate('/verify-otp', { state: { mobileNumber: m } })
  }

  return (
    <AuthCard
      title="Log in"
      subtitle={step === 1 ? 'We will send a one-time password to your mobile number.' : `Enter the OTP sent to ${normalizeMobile(mobile)}.`}
      footer={<>New here? <Link to="/register" className="font-medium text-brand-700 hover:underline">Create an account</Link></>}
    >
      {step === 1 ? (
        <form onSubmit={requestOtp} noValidate className="space-y-4">
          <div>
            <label htmlFor="l-mobile" className="label">Mobile number</label>
            <input id="l-mobile" type="tel" inputMode="numeric" className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" />
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send OTP'}</button>
        </form>
      ) : (
        <form onSubmit={submitLogin} noValidate className="space-y-4">
          <div>
            <label htmlFor="l-otp" className="label">OTP</label>
            <input id="l-otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="input tracking-widest" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus />
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          {needsVerify && <button type="button" className="btn-secondary w-full" onClick={goVerify}>Verify my account</button>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <div className="flex justify-between text-sm">
            <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => { setStep(1); setOtp(''); setError(''); setNeedsVerify(false) }}>Change number</button>
            <button type="button" className="font-medium text-brand-700 hover:underline disabled:opacity-50" disabled={busy} onClick={requestOtp}>Resend OTP</button>
          </div>
        </form>
      )}
      <DevOtpHint />
    </AuthCard>
  )
}
