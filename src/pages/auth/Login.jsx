import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    try {
      setLoading(true)
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      if (err.message === 'Account has been deactivated') {
        setError('Your account has been deactivated. Please contact an administrator.')
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Failed to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-apple-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-heading">
            AirDoc
          </h1>
          <p className="text-apple-text-secondary mt-2">
            Operations Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-apple shadow-apple p-8">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
            Sign In
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-apple-sm">
              <p className="text-sm text-apple-red text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              pill
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-apple-text-secondary mt-6">
          Contact your administrator if you need access
        </p>
      </div>
    </div>
  )
}
