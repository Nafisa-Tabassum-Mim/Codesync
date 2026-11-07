import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import { Code2, Settings, Share2 } from 'lucide-react'
import CodeEditor from '../editor/CodeEditor'
import { THEMES } from '../editor/constants.js'
import { copyText, inviteUrl, joinRoom } from '../services/roomService'

const AVATAR_COLORS = ['bg-orange-400', 'bg-sky-400', 'bg-amber-300', 'bg-blue-400']
const DEFAULT_SETTINGS = { theme: 'codesync-dark', fontSize: 14 }

const DOT = {
  live: 'bg-emerald-400',
  connecting: 'bg-yellow-400',
  denied: 'bg-red-500',
  offline: 'bg-gray-500',
}
const STATUS_TEXT = {
  connecting: 'Connecting...',
  denied: 'No access',
  offline: 'Offline',
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('codesync-settings')) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

const Logo = () => (
  <Link
    to="/dashboard"
    title="Back to dashboard"
    className="flex items-center gap-2 text-lg font-bold"
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-400 text-[#1a1208]">
      <Code2 size={20} />
    </span>
    CodeSync
  </Link>
)

const Avatars = ({ users }) => {
  const shown = users.slice(0, 4)
  const extra = users.length - shown.length
  return (
    <div className="flex -space-x-2">
      {shown.map((name, i) => (
        <span
          key={i}
          title={name}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#07080f] text-xs font-bold text-[#1a1208] ${
            AVATAR_COLORS[i % AVATAR_COLORS.length]
          }`}
        >
          {name[0].toUpperCase()}
        </span>
      ))}
      {extra > 0 && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#07080f] bg-white/15 text-xs text-gray-200">
          +{extra}
        </span>
      )}
    </div>
  )
}

const SettingsMenu = ({ settings, onChange }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Editor settings"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-white/10 p-2 text-gray-300 hover:border-orange-400/50 hover:text-orange-200"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-white/10 bg-[#0d0f1a] p-4 shadow-2xl">
          <label htmlFor="theme" className="mb-1.5 block text-sm text-gray-300">
            Theme
          </label>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) => onChange({ ...settings, theme: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-orange-400 [&>option]:bg-[#0d0f1a]"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <label htmlFor="font-size" className="mb-1.5 mt-4 block text-sm text-gray-300">
            Font size: {settings.fontSize}px
          </label>
          <input
            id="font-size"
            type="range"
            min={12}
            max={24}
            value={settings.fontSize}
            onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
            className="w-full accent-orange-400"
          />
        </div>
      )}
    </div>
  )
}

const Screen = ({ children }) => (
  <div className="min-h-screen bg-[#07080f] px-6 py-6 text-white">{children}</div>
)

const Myroom = () => {
  const { slug } = useParams()
  const [room, setRoom] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | missing | error
  const [settings, setSettings] = useState(loadSettings)
  // connection state reported by the editor's WebSocket
  const [live, setLive] = useState({
    status: 'connecting',
    presence: { count: 0, users: [] },
  })

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    // joining adds this user as a member (the owner already is one)
    joinRoom(slug)
      .then((data) => {
        if (cancelled) return
        setRoom(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.status === 404 ? 'missing' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    try {
      localStorage.setItem('codesync-settings', JSON.stringify(settings))
    } catch {
      // storage can be blocked; settings just won't persist
    }
  }, [settings])

  useEffect(() => {
    if (!room) return
    const previous = document.title
    document.title = `${room.name} · CodeSync`
    return () => {
      document.title = previous
    }
  }, [room])

  const handleShare = async () => {
    if (await copyText(inviteUrl(slug))) toast.success('Invite link copied')
    else toast.error('Could not copy the link')
  }

  if (status === 'loading') {
    return (
      <Screen>
        <p className="py-20 text-center text-gray-400">Joining room...</p>
      </Screen>
    )
  }

  if (status !== 'ready') {
    return (
      <Screen>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold">
            {status === 'missing' ? 'Room not found' : 'Could not open this room'}
          </h1>
          <p className="mt-2 text-gray-400">
            {status === 'missing'
              ? 'This room does not exist or was deleted.'
              : 'Something went wrong. Please try again.'}
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg bg-orange-400 px-5 py-2.5 text-sm font-semibold text-[#1a1208] hover:bg-orange-300"
          >
            Back to dashboard
          </Link>
        </div>
      </Screen>
    )
  }

  const isLive = live.status === 'live'
  // who is connected right now; before that, the room's members
  const avatarNames = isLive ? live.presence.users : (room.members ?? [])

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#07080f] text-white lg:h-screen">
      {/* blue background shading */}
      <div className="pointer-events-none absolute -left-40 top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

      <header className="relative z-20 flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${DOT[live.status] ?? DOT.connecting}`} />
            {isLive ? (
              <span className="text-emerald-300">{live.presence.count} online</span>
            ) : (
              <span className="text-gray-400">{STATUS_TEXT[live.status]}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Avatars users={avatarNames} />
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg bg-orange-400 px-5 py-2 text-sm font-semibold text-[#1a1208] shadow-lg shadow-orange-500/20 hover:bg-orange-300"
          >
            <Share2 size={15} /> Share
          </button>
          <SettingsMenu settings={settings} onChange={setSettings} />
        </div>
      </header>

      <CodeEditor
        key={slug}
        initialLanguage={room.language}
        roomSlug={slug}
        theme={settings.theme}
        fontSize={settings.fontSize}
        onLive={setLive}
      />

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />
    </div>
  )
}

export default Myroom