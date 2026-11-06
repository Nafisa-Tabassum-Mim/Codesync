import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Code2,
  Container,
  Database,
  Gauge,
  GitMerge,
  History,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Lock,
  Mic,
  MousePointer2,
  RefreshCw,
  Server,
  Share2,
  ShieldAlert,
  Undo2,
  UserCircle,
  WifiOff,
  FolderTree,
} from 'lucide-react'

// status: 'live' | 'soon'
const sections = [
  {
    title: 'Editor',
    blurb: 'A full-featured editor that feels like your desktop IDE.',
    features: [
      {
        icon: Code2,
        name: 'Monaco editor',
        desc: 'Syntax highlighting, autocomplete, indentation, themes, and language selection.',
        status: 'live',
      },
      {
        icon: FolderTree,
        name: 'Multi-file workspace',
        desc: 'A file explorer with files and folders shared by everyone in the room.',
        status: 'soon',
      },
      {
        icon: Undo2,
        name: 'Per-user undo / redo',
        desc: 'Undo only your own changes without touching what teammates typed.',
        status: 'soon',
      },
    ],
  },
  {
    title: 'Collaboration',
    blurb: 'Edit together without conflicts or overwrites.',
    features: [
      {
        icon: GitMerge,
        name: 'Conflict-free editing',
        desc: 'CRDT-based sync means concurrent edits always merge to the same result.',
        status: 'soon',
      },
      {
        icon: Share2,
        name: 'Shareable rooms',
        desc: 'Unguessable room links, with each room isolated from the others.',
        status: 'soon',
      },
      {
        icon: UserCircle,
        name: 'Presence',
        desc: 'See who is connected, each with their own name and color.',
        status: 'soon',
      },
      {
        icon: MousePointer2,
        name: 'Live cursors',
        desc: 'Watch teammates’ cursors and selections move in real time.',
        status: 'soon',
      },
      {
        icon: Mic,
        name: 'Voice chat',
        desc: 'Talk to your team inside the room while you code.',
        status: 'soon',
      },
    ],
  },
  {
    title: 'Execution',
    blurb: 'Run code safely, in any supported language.',
    features: [
      {
        icon: Container,
        name: 'Sandboxed runs',
        desc: 'Every run happens in an isolated Docker container with no network access.',
        status: 'soon',
      },
      {
        icon: Gauge,
        name: 'Resource limits',
        desc: 'CPU, memory, process, time, and output caps with clear error messages.',
        status: 'soon',
      },
      {
        icon: ListChecks,
        name: 'Job queue and stdin',
        desc: 'Queued, running, and completed states, cancellation, and an input box.',
        status: 'soon',
      },
      {
        icon: ShieldAlert,
        name: 'Abuse protection',
        desc: 'Size limits, rate limits, and safe handling of untrusted code.',
        status: 'soon',
      },
    ],
  },
  {
    title: 'Reliability',
    blurb: 'Your work survives refreshes, outages, and restarts.',
    features: [
      {
        icon: WifiOff,
        name: 'Offline editing',
        desc: 'Keep typing without a connection. Changes sync when you are back.',
        status: 'soon',
      },
      {
        icon: RefreshCw,
        name: 'Auto resync',
        desc: 'Recover from refreshes, network drops, and server restarts without losing edits.',
        status: 'soon',
      },
      {
        icon: Database,
        name: 'Persistent rooms',
        desc: 'Snapshots are saved, so a room comes back after a restart.',
        status: 'soon',
      },
      {
        icon: History,
        name: 'Version history',
        desc: 'Browse earlier snapshots and restore any version.',
        status: 'soon',
      },
    ],
  },
  {
    title: 'Accounts and access',
    blurb: 'Control who can see and change your code.',
    features: [
      {
        icon: KeyRound,
        name: 'Accounts',
        desc: 'Sign up with email or GitHub, with secure sessions.',
        status: 'soon',
      },
      {
        icon: LayoutDashboard,
        name: 'My Rooms',
        desc: 'A dashboard of every room tied to your account.',
        status: 'soon',
      },
      {
        icon: Lock,
        name: 'Permissions',
        desc: 'Read-only and edit links, roles, and room passwords checked on the server.',
        status: 'soon',
      },
    ],
  },
  {
    title: 'Scale',
    blurb: 'Built to handle many rooms and many users.',
    features: [
      {
        icon: Server,
        name: 'Multi-instance servers',
        desc: 'Redis pub/sub and room-aware routing across several servers.',
        status: 'soon',
      },
      {
        icon: Activity,
        name: 'Metrics and load tests',
        desc: 'Connections, latency, and throughput tracked in Prometheus and Grafana.',
        status: 'soon',
      },
    ],
  },
]

const badge = {
  live: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  soon: 'border-white/15 bg-white/5 text-gray-400',
}

const FeatureCard = ({ icon: Icon, name, desc, status }) => (
  <div className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-50/40 hover:bg-orange-300/5">
    <div className="mb-4 flex items-start justify-between">
      <span className="rounded-lg bg-orange-300/15 p-2.5 text-orange-50">
        <Icon size={20} />
      </span>
      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] ${badge[status]}`}>
        {status === 'live' ? 'Available' : 'Coming soon'}
      </span>
    </div>
    <h3 className="font-semibold text-white">{name}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{desc}</p>
  </div>
)

const Features = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
      {/* heading */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-5xl">
          Everything you need to{' '}
          <span className="bg-gradient-to-r from-orange-300 to-blue-300 bg-clip-text text-transparent">
            code together
          </span>
        </h1>
        <p className="mt-5 text-gray-300">
          From a fast editor to safe code execution, CodeSync covers the whole
          workflow for teams, classrooms, and interviews.
        </p>
      </div>

      {/* sections */}
      <div className="mt-16 space-y-16">
        {sections.map((section) => (
          <section key={section.title}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <p className="mt-1 text-sm text-gray-400">{section.blurb}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {section.features.map((f) => (
                <FeatureCard key={f.name} {...f} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* call to action */}
      <div className="mt-20 rounded-2xl border border-orange-300/30 bg-gradient-to-r from-orange-400/20 to-orange-400/20 px-6 py-12 text-center">
        <h2 className="text-3xl font-bold">Ready to code together?</h2>
        <p className="mt-2 text-gray-300">Create a room and invite your team in seconds.</p>
        <Link
          to="/register"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-400 px-6 py-3 font-medium text-white shadow-lg shadow-orange-400/30 hover:bg-orange-300"
        >
          <ArrowRight size={18} /> Get Started Free
        </Link>
      </div>
    </div>
  )
}


export default Features