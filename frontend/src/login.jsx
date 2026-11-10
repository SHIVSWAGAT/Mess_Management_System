import { useState } from 'react'
import { loginAdmin } from './services/api'
import './login.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedEmail.startsWith('b') && !/^b[1-5]\d{5}@iiit-bh\.ac\.in$/.test(normalizedEmail)) {
      setError('Invalid Email ID. Please use your registered institute email.')
      return
    }

    setLoading(true)

    try {
      await loginAdmin(normalizedEmail, password)
      onLogin()
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-story">
        <div className="login-mark">DD</div>
        <div>
          <h1>DineDesk</h1>
          <p className="login-tagline">
            "Your Mess. Your Menu. Your Convenience."
          </p>
          <div className="login-points">
            <span>Weekly breakfast, lunch, snacks, and dinner</span>
            <span>Student feedback and complaints</span>
            <span>Plain payment and attendance records</span>
          </div>
        </div>
        <small>DineDesk · Your Mess. Your Menu. Your Convenience.</small>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <span className="gh-kicker">Sign in</span>
          <h2>Welcome to DineDesk</h2>
          <p>Use your admin or student account.</p>

          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <div className="login-input-wrap">
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="b100001@iiit-bh.ac.in"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-show-password"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Enter DineDesk'}
          </button>
          <p className="login-note">
            Students land on their own desk. Admins can manage the mess.
          </p>
        </form>
      </section>
    </div>
  )
}
