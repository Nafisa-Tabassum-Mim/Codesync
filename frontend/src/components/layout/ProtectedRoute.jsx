import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="p-10 text-center text-gray-400">Loading...</p>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export default ProtectedRoute