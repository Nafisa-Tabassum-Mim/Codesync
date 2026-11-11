import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Code2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
]

const Navbar = () => {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
        <Code2 className="text-orange-300" size={26} />
        CodeSync
      </Link>

      <nav className="hidden items-center gap-10 md:flex">
        {links.map((l) => (
          <NavLink
            key={l.label}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `border-b-2 pb-1 text-sm transition ${isActive
                ? 'border-orange-300 text-white'
                : 'border-transparent text-gray-300 hover:text-white'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {loading ? null : user ? (
          <>
            <Link
              to="/dashboard"
              className="rounded-lg bg-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-400/30 hover:bg-orange-300"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-orange-100/60 px-5 py-2 text-sm text-white hover:bg-orange-300/10"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-lg border border-orange-300/60 px-5 py-2 text-sm text-white hover:bg-orange-300/10"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-orange-400 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-orange-400/30 hover:bg-orange-300"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar