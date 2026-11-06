import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    desc: 'For learning and small side projects.',
    cta: 'Get Started Free',
    to: '/register',
    featured: false,
    features: [
      'Up to 3 active rooms',
      '5 collaborators per room',
      'Core languages',
      'Limited run time per day',
      '7-day version history',
    ],
  },
  {
    name: 'Pro',
    monthly: 12,
    yearly: 120,
    desc: 'For developers and small teams.',
    cta: 'Start Pro',
    to: '/register',
    featured: true,
    features: [
      'Unlimited rooms',
      '25 collaborators per room',
      'All languages',
      'Higher run limits and priority queue',
      '90-day version history',
      'Password-protected rooms',
    ],
  },
  {
    name: 'Team',
    monthly: 29,
    yearly: 290,
    desc: 'For classrooms and companies.',
    cta: 'Contact Sales',
    to: '/about',
    featured: false,
    features: [
      'Everything in Pro',
      'Roles and permissions',
      'Shared team workspace',
      'Unlimited version history',
      'Priority support',
    ],
  },
]

const faqs = [
  {
    q: 'Can I change plans later?',
    a: 'Yes. You can upgrade or downgrade at any time from your account.',
  },
  {
    q: 'Is the Free plan really free?',
    a: 'Yes, with no card needed. It has lower limits on rooms and code runs.',
  },
  {
    q: 'How does code execution stay safe?',
    a: 'Code runs in isolated containers with no network access and strict resource limits.',
  },
]

const Pricing = () => {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070611] text-white">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10">
        {/* heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-orange-100">
            Pricing
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-5xl">
            Simple plans,{' '}
            <span className="bg-gradient-to-r from-orange-300 to-blue-300 bg-clip-text text-transparent">
              no surprises
            </span>
          </h1>
          <p className="mt-5 text-gray-300">
            Start free and upgrade when your team grows.
          </p>

          {/* billing toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-1.5 transition ${
                !yearly ? 'bg-orange-400 text-white' : 'text-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-full px-5 py-1.5 transition ${
                yearly ? 'bg-orange-400 text-white' : 'text-gray-300'
              }`}
            >
              Yearly <span className="ml-1 text-xs text-emerald-300">Save 2 months</span>
            </button>
          </div>
        </div>

        {/* plans */}
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                p.featured
                  ? 'border-orange-300/60 bg-orange-300/10 shadow-xl shadow-orange-500/30'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-orange-400 px-3 py-0.5 text-xs font-medium">
                  Most popular
                </span>
              )}

              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="mt-1 text-sm text-gray-400">{p.desc}</p>

              <p className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-extrabold">
                  ${yearly ? p.yearly : p.monthly}
                </span>
                <span className="pb-1 text-sm text-gray-400">
                  {p.monthly === 0 ? '' : yearly ? '/ year' : '/ month'}
                </span>
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-300">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={p.to}
                className={`mt-8 rounded-lg px-5 py-3 text-center font-medium transition ${
                  p.featured
                    ? 'bg-orange-400 text-white shadow-lg shadow-orange-400/30 hover:bg-orange-300'
                    : 'border border-orange-300/60 text-white hover:bg-orange-300/10'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* faq */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-6 text-center text-2xl font-bold">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-gray-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Pricing