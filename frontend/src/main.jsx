import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './components/layout/Home.jsx'
import App from './App.jsx'
import Features from './components/pages/Features.jsx'
import Pricing from './components/pages/Pricing.jsx'
import About from './components/pages/About.jsx'
import Hero from './components/layout/Hero.jsx'
import Register from './components/pages/Register.jsx'
import Login from './components/pages/Login.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import { AuthProvider } from './components/context/AuthContext.jsx'
import Dashboard from './components/Workspace/Dashboard.jsx'
import Myroom from './components/Workspace/Myroom.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    children: [
      { index: true, element: <Hero /> },
      { path: 'features', element: <Features /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'about', element: <About /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
  {
    path: '/editor',
    element: <ProtectedRoute><App /></ProtectedRoute>
  },
  {
    path: '/dashboard',
    element: (<ProtectedRoute><Dashboard /></ProtectedRoute>),
  },
  {
    path: '/room/:slug',
    element: (<ProtectedRoute><Myroom /></ProtectedRoute>),
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)