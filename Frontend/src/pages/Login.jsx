import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { requestOtp, login as loginApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [mobileNumber, setMobileNumber] = useState(location.state?.mobileNumber || '')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('mobile') // 'mobile' | 'otp'
  const [devOtp, setDevOtp] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRequestOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await requestOtp({ mobileNumber })
      if (!res.success) {
        setError(res.message)
        return
      }
      const otpMatch = res.message.match(/otp=(\d+)/)
      setDevOtp(otpMatch ? otpMatch[1] : null)
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi({ mobileNumber, otp })
      if (!res.success) {
        setError(res.message)
        return
      }
      login(res.data) // res.data is { token, user }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-content">
        <div className="auth-shell">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">
            {step === 'mobile' ? "We'll text you a one-time code." : `Enter the code sent to ${mobileNumber}.`}
          </p>

          {devOtp && step === 'otp' && (
            <div className="banner banner-dev-otp">
              Dev mode - no SMS provider connected yet. Your code is: <strong>{devOtp}</strong>
            </div>
          )}

          {error && <div className="banner banner-error">{error}</div>}

          {step === 'mobile' ? (
            <form onSubmit={handleRequestOtp}>
              <div className="field">
                <label htmlFor="mobileNumber">Mobile number</label>
                <input
                  id="mobileNumber"
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Sending code...' : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="otp">6-digit code</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
              <button
                type="button"
                className="btn-link"
                style={{ marginTop: '12px' }}
                onClick={() => setStep('mobile')}
              >
                Use a different number
              </button>
            </form>
          )}

          <p style={{ marginTop: '24px', fontSize: '0.9rem' }}>
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
