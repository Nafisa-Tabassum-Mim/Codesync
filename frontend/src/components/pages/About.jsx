import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, Lightbulb, ShieldCheck, Users, Zap } from 'lucide-react'

const stats = [
    { value: '22+', label: 'Features planned' },
    { value: '10+', label: 'Languages supported' },
    { value: '<100ms', label: 'Target sync latency' },
    { value: '100%', label: 'Isolated code runs' },
]

const values = [
    {
        icon: Users,
        title: 'Built for people',
        desc: 'Coding is better together. Every feature starts with how teams actually work.',
    },
    {
        icon: ShieldCheck,
        title: 'Safe by default',
        desc: 'Untrusted code runs in locked-down containers, never on your machine.',
    },
    {
        icon: Zap,
        title: 'Fast and reliable',
        desc: 'Edits merge instantly and survive refreshes, outages, and restarts.',
    },
    {
        icon: Lightbulb,
        title: 'Open to learn',
        desc: 'Great for classrooms, interviews, and pair programming sessions.',
    },
]

const team = [
    { name: 'Your Name', role: 'Founder and Developer', color: 'bg-orange-300' },
    { name: 'Teammate', role: 'Backend Engineer', color: 'bg-sky-400' },
    { name: 'Teammate', role: 'Designer', color: 'bg-orange-300' },
]

const About = () => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#070611] text-white">
            <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-orange-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />


            <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10">
                {/* heading */}
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-5xl">
                        We make coding{' '}
                        <span className="bg-gradient-to-r from-orange-300 to-blue-300 bg-clip-text text-transparent">
                            a shared experience
                        </span>
                    </h1>
                    <p className="mt-5 text-gray-300">
                        CodeSync is a real-time collaborative code editor that lets you build,
                        learn and create together, from anywhere.
                    </p>
                </div>

                {/* stats */}
                <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center"
                        >
                            <p className="bg-gradient-to-r from-orange-300 to-blue-300 bg-clip-text text-3xl font-extrabold text-transparent">
                                {s.value}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* story */}
                <section className="mt-20 grid items-center gap-10 lg:grid-cols-2">
                    <div>
                        <h2 className="text-2xl font-bold">Our story</h2>
                        <p className="mt-4 leading-relaxed text-gray-300">
                            CodeSync started with a simple question: why is it so hard to code
                            with someone else? Sharing screens and sending files back and forth
                            slows everyone down.
                        </p>
                        <p className="mt-4 leading-relaxed text-gray-300">
                            So we built an editor where everyone types in the same file at the
                            same time, runs code safely in the cloud, and never loses work.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-orange-300/30 bg-gradient-to-br from-orange-400/20 to-orange-400/20 p-8">
                        <h3 className="text-lg font-semibold">Our mission</h3>
                        <p className="mt-3 text-gray-300">
                            Make collaborative coding simple, safe, and fast for students,
                            teachers, and teams everywhere.
                        </p>
                    </div>
                </section>

                {/* values */}
                <section className="mt-20">
                    <h2 className="mb-6 text-2xl font-bold">What we believe</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {values.map(({ icon: Icon, title, desc }) => (
                            <div
                                key={title}
                                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-300/40"
                            >
                                <span className="mb-4 inline-block rounded-lg bg-orange-300/15 p-2.5 text-orange-200">
                                    <Icon size={20} />
                                </span>
                                <h3 className="font-semibold">{title}</h3>
                                <p className="mt-1.5 text-sm text-gray-400">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* team */}
                <section className="mt-20">
                    <h2 className="mb-6 text-2xl font-bold">The team</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {team.map((m, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5"
                            >
                                <span
                                    className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-black ${m.color}`}
                                >
                                    {m.name[0]}
                                </span>
                                <div>
                                    <p className="font-semibold">{m.name}</p>
                                    <p className="text-sm text-gray-400">{m.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* contact / cta */}
                <div className="mt-20 rounded-2xl border border-orange-300/30 bg-gradient-to-r from-orange-400/20 to-orange-400/20 px-6 py-12 text-center">
                    <h2 className="text-3xl font-bold">Want to get in touch?</h2>
                    <p className="mt-2 text-gray-300">
                        Questions, feedback, or ideas? We would love to hear from you.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 rounded-lg bg-orange-400 px-6 py-3 font-medium text-white shadow-lg shadow-orange-400/30 hover:bg-orange-300"
                        >
                            <ArrowRight size={18} /> Get Started Free
                        </Link>
                        <a
                            href="https://github.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-orange-300/60 px-6 py-3 text-white hover:bg-orange-300/10"
                        >
                            <ExternalLink size={18} /> View on GitHub
                        </a>

                    </div>
                </div>
            </main>
        </div>
    )
}

export default About