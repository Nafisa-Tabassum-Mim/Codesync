import { Link } from 'react-router-dom'
import { Code2, Mail } from 'lucide-react'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Editor', to: '/editor' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/about' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Login', to: '/login' },
      { label: 'Sign Up', to: '/register' },
    ],
  },
]

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
)

const socials = [
  { label: 'GitHub', href: 'https://github.com/', icon: <GithubIcon /> },
  { label: 'LinkedIn', href: 'https://linkedin.com/', icon: <LinkedinIcon /> },
  { label: 'Email', href: 'mailto:hello@codesync.dev', icon: <Mail size={18} /> },
]

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#070611]/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-5">
          {/* brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
              <Code2 className="text-orange-300" size={26} />
              CodeSync
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              A real-time collaborative code editor to build, learn and create
              together, from anywhere, anytime.
            </p>

            <div className="mt-5 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-gray-300 transition hover:border-orange-300/50 hover:text-white"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-gray-400 transition hover:text-orange-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} CodeSync. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-gray-300">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gray-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer