import { Link } from 'react-router-dom'
import { ArrowRight, History, Languages, Play, ShieldCheck, Users } from 'lucide-react'
import editorPreview from '../../assets/editor-preview.png'

const features = [
  { icon: Users, title: 'Real-time', sub: 'Collaboration' },
  { icon: Languages, title: 'Multi-language', sub: 'Support' },
  { icon: ShieldCheck, title: 'Secure & Isolated', sub: 'Execution' },
  { icon: History, title: 'Version History', sub: '& More' },
]

const Hero = () => {
  return (
    <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-2">
      {/* left side */}
      <div>
        <span className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-orange-100">
          Real-time &nbsp;•&nbsp; Collaborative &nbsp;•&nbsp; Powerful
        </span>

        <h1 className="mt-6 text-5xl font-extrabold leading-tight text-white md:text-6xl">
          Code Together,
          <br />
          <span className="bg-gradient-to-r from-orange-300 to-blue-300 bg-clip-text text-transparent">
            Build Faster.
          </span>
        </h1>

        <p className="mt-6 max-w-md text-gray-300">
          CodeSync is a real-time collaborative code editor that lets you build,
          learn and create together — from anywhere, anytime.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-lg bg-orange-400 px-6 py-3 font-medium text-white shadow-lg shadow-orange-400/30 hover:bg-orange-300"
          >
            <ArrowRight size={18} /> Get Started Free
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-orange-300/60 px-6 py-3 text-white hover:bg-orange-300/10"
          >
            <Play size={16} /> Watch Demo
          </button>
        </div>

        <div className="mt-12 flex flex-wrap gap-8">
          {features.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="rounded-lg bg-orange-300/15 p-2 text-orange-200">
                <Icon size={18} />
              </span>
              <p className="text-xs leading-tight text-gray-300">
                {title}
                <br />
                {sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* right side: preview image */}
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-orange-400/30 blur-3xl" />
        <img
          src={editorPreview}
          alt="CodeSync editor preview showing collaborators editing main.py"
          className="relative w-full rounded-xl border border-white/10 shadow-2xl shadow-orange-500/40"
        />
      </div>
    </section>
  )
}

export default Hero