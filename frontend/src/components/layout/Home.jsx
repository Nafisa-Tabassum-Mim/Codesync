import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar'
import Footer from '../layout/Footer'

const Home = () => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#070611] text-white">
      {/* background glows */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />

      <Navbar />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Home