import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-orange-300'

const Login = () => {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form) // sets the user, then the check below redirects
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  // if a user exists, never show the login page
  if (loading) return null
  if (user) return <Navigate to={redirectTo} replace />

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-400">Log in to continue to CodeSync.</p>

        {error && (
          <p className="mt-5 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-orange-400 px-5 py-3 font-medium text-white shadow-lg shadow-orange-400/30 hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          New to CodeSync?{' '}
          <Link to="/register" className="text-orange-200 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login