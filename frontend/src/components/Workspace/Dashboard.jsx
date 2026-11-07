import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import {
  Clock,
  Code2,
  Copy,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Share2,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  copyText,
  createRoom,
  deleteRoom,
  getMyRooms,
  getSharedRooms,
  inviteUrl,
} from '../services/roomService'

const LANGUAGES = ['python', 'javascript', 'typescript', 'java']

const LANG_STYLE = {
  python: 'bg-sky-500/20 text-sky-300',
  javascript: 'bg-yellow-400/20 text-yellow-300',
  typescript: 'bg-blue-500/20 text-blue-300',
  java: 'bg-red-500/20 text-red-300',
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-rooms', label: 'My Rooms', icon: FolderOpen },
  { id: 'shared', label: 'Shared with me', icon: Users },
  { id: 'activity', label: 'Recent Activity', icon: Clock },
]

function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

/* ---------- small building blocks ---------- */

const Modal = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0f1a] p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const CreateRoomModal = ({ onClose, onCreate, creating }) => {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('javascript')

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({ name: name.trim(), language })
  }

  return (
    <Modal title="Create a room" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="room-name" className="mb-1.5 block text-sm text-gray-300">
            Room name
          </label>
          <input
            id="room-name"
            autoFocus
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Web Development"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-orange-400"
          />
        </div>

        <div>
          <label htmlFor="room-language" className="mb-1.5 block text-sm text-gray-300">
            Language
          </label>
          <select
            id="room-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 capitalize text-white outline-none focus:border-orange-400 [&>option]:bg-[#0d0f1a]"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-5 py-2 text-sm text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="rounded-lg bg-orange-400 px-5 py-2 text-sm font-semibold text-[#1a1208] hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const ConfirmDeleteModal = ({ room, onCancel, onConfirm, deleting }) => (
  <Modal title="Delete this room?" onClose={onCancel}>
    <p className="text-sm text-gray-300">
      <span className="font-medium text-orange-300">"{room.name}"</span> will be
      deleted for good. Members will lose access, and its invite link will stop
      working.
    </p>
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-white/15 px-5 py-2 text-sm text-gray-300 hover:bg-white/5"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={deleting}
        className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60"
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </Modal>
)

const StatCard = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-400/15 text-orange-300">
      <Icon size={20} />
    </span>
    <div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  </div>
)

const RoomRow = ({ room, onCopy, onDelete }) => (
  <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-orange-400/30">
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
        LANG_STYLE[room.language] || 'bg-white/10 text-white'
      }`}
    >
      <Code2 size={20} />
    </span>

    <div className="min-w-0 flex-1">
      <p className="truncate font-medium">{room.name}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span className="rounded bg-white/5 px-2 py-0.5 capitalize">{room.language}</span>
        {!room.is_owner && <span>by {room.owner_name}</span>}
      </div>
    </div>

    <p className="flex items-center gap-1.5 text-sm text-sky-300">
      <Users size={14} />
      {room.member_count} {room.member_count === 1 ? 'member' : 'members'}
    </p>

    <p className="w-32 text-sm text-gray-400">
      {room.is_owner ? 'Created' : 'Joined'}{' '}
      {timeAgo(room.is_owner ? room.created_at : room.joined_at)}
    </p>

    <div className="flex items-center gap-2">
      <button
        type="button"
        title="Copy invite link"
        onClick={() => onCopy(room)}
        className="rounded-lg border border-white/10 p-2 text-gray-300 hover:border-blue-400/50 hover:text-white"
      >
        <Copy size={16} />
      </button>
      {room.is_owner && (
        <button
          type="button"
          title="Delete room"
          onClick={() => onDelete(room)}
          className="rounded-lg border border-white/10 p-2 text-gray-300 hover:border-red-400/50 hover:text-red-300"
        >
          <Trash2 size={16} />
        </button>
      )}
      <Link
        to={`/room/${room.slug}`}
        className="rounded-lg bg-orange-400 px-5 py-2 text-sm font-semibold text-[#1a1208] hover:bg-orange-300"
      >
        Open
      </Link>
    </div>
  </div>
)

const RoomList = ({ rooms, loading, emptyText, onCopy, onDelete }) => {
  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-400">Loading your rooms...</p>
  }
  if (rooms.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/15 py-10 text-center text-sm text-gray-400">
        {emptyText}
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <RoomRow key={room.id} room={room} onCopy={onCopy} onDelete={onDelete} />
      ))}
    </div>
  )
}

const ActivityItem = ({ item }) => {
  const Icon = item.verb === 'created' ? Plus : Users
  return (
    <li className="flex items-start gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-orange-300">
        <Icon size={15} />
      </span>
      <div className="min-w-0 text-sm">
        <p className="truncate">
          You {item.verb}{' '}
          <span className="font-medium text-orange-300">"{item.name}"</span>
        </p>
        <p className="text-xs text-gray-400">{timeAgo(item.time)}</p>
      </div>
    </li>
  )
}

const CreateButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 rounded-lg bg-orange-400 px-5 py-2.5 text-sm font-semibold text-[#1a1208] shadow-lg shadow-orange-500/20 hover:bg-orange-300"
  >
    <Plus size={16} /> Create Room
  </button>
)

/* ---------- the page ---------- */

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [myRooms, setMyRooms] = useState([])
  const [sharedRooms, setSharedRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([getMyRooms(), getSharedRooms()])
      .then(([mine, shared]) => {
        if (cancelled) return
        setMyRooms(mine)
        setSharedRooms(shared)
      })
      .catch((err) =>
        toast.error(err.message || 'Could not load your rooms', { toastId: 'load-error' }),
      )
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const q = query.trim().toLowerCase()
  const matches = (r) => !q || r.name.toLowerCase().includes(q) || r.language.includes(q)
  const filteredMine = myRooms.filter(matches)
  const filteredShared = sharedRooms.filter(matches)

  const activity = useMemo(() => {
    const items = [
      ...myRooms.map((r) => ({ id: `c${r.id}`, verb: 'created', name: r.name, time: r.created_at })),
      ...sharedRooms.map((r) => ({ id: `j${r.id}`, verb: 'joined', name: r.name, time: r.joined_at })),
    ]
    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20)
  }, [myRooms, sharedRooms])

  const roomMembers = myRooms.reduce((sum, r) => sum + (r.member_count - 1), 0)

  const handleCreate = async ({ name, language }) => {
    setCreating(true)
    try {
      const room = await createRoom({ name, language })
      setMyRooms((rooms) => [room, ...rooms])
      setShowCreate(false)
      toast.success(`Room "${room.name}" created`)
    } catch (err) {
      toast.error(err.message || 'Could not create the room', { toastId: 'create-error' })
    } finally {
      setCreating(false)
    }
  }

  // "Share Invite Link": create a new room and copy its link
  const handleInvite = async () => {
    setInviting(true)
    try {
      const firstName = user.name.split(' ')[0]
      const room = await createRoom({ name: `${firstName}'s room`, language: 'javascript' })
      setMyRooms((rooms) => [room, ...rooms])

      const link = inviteUrl(room.slug)
      if (await copyText(link)) {
        toast.success('New room created and invite link copied')
      } else {
        toast.info(`New room created. Copy this link: ${link}`, { autoClose: false })
      }
    } catch (err) {
      toast.error(err.message || 'Could not create the invite link', { toastId: 'invite-error' })
    } finally {
      setInviting(false)
    }
  }

  const handleCopy = async (room) => {
    if (await copyText(inviteUrl(room.slug))) {
      toast.success('Invite link copied')
    } else {
      toast.error('Could not copy the link')
    }
  }

  const handleDelete = async () => {
    if (!roomToDelete) return
    setDeleting(true)
    try {
      await deleteRoom(roomToDelete.id)
      setMyRooms((rooms) => rooms.filter((r) => r.id !== roomToDelete.id))
      toast.success(`Room "${roomToDelete.name}" deleted`)
      setRoomToDelete(null)
    } catch (err) {
      toast.error(err.message || 'Could not delete the room', { toastId: 'delete-error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080f] text-white">
      {/* blue background shading */}
      <div className="pointer-events-none absolute -left-40 top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

      {/* top bar */}
      <header className="relative z-10 flex items-center gap-4 border-b border-white/10 bg-[#07080f]/80 px-4 py-3 backdrop-blur sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-400 text-[#1a1208]">
            <Code2 size={20} />
          </span>
          <span className="hidden sm:block">CodeSync</span>
        </Link>

        <div className="relative ml-2 w-full max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-400 font-bold text-[#1a1208]">
            {user.name[0].toUpperCase()}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-orange-400/50 px-4 py-2 text-sm text-orange-200 hover:bg-orange-400/10"
          >
            <LogOut size={15} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full  flex-col gap-4 p-4 lg:flex-row">
        {/* sidebar */}
        <nav className="flex gap-2 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition ${
                tab === id
                  ? 'border-orange-400/40 bg-orange-400/15 text-orange-200'
                  : 'border-transparent text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        {/* main content */}
        <main className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          {tab === 'dashboard' && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Welcome back, {user.name} 👋</h1>
                  <p className="mt-1 text-sm text-gray-400">
                    Here's what's happening with your rooms.
                  </p>
                </div>
                <CreateButton onClick={() => setShowCreate(true)} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard icon={FolderOpen} value={myRooms.length} label="Total Rooms" />
                <StatCard icon={Share2} value={sharedRooms.length} label="Shared With Me" />
                <StatCard icon={Users} value={roomMembers} label="Room Members" />
                <StatCard icon={Clock} value={activity.length} label="Recent Activity" />
              </div>

              <div className="mt-8 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Rooms</h2>
                <button
                  type="button"
                  onClick={() => setTab('my-rooms')}
                  className="text-sm text-orange-300 hover:underline"
                >
                  View all →
                </button>
              </div>
              <div className="mt-3">
                <RoomList
                  rooms={filteredMine.slice(0, 5)}
                  loading={loading}
                  emptyText={q ? 'No rooms match your search.' : 'No rooms yet. Click "Create Room" to start.'}
                  onCopy={handleCopy}
                  onDelete={setRoomToDelete}
                />
              </div>
            </>
          )}

          {tab === 'my-rooms' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">My Rooms</h1>
                <CreateButton onClick={() => setShowCreate(true)} />
              </div>
              <div className="mt-5">
                <RoomList
                  rooms={filteredMine}
                  loading={loading}
                  emptyText={q ? 'No rooms match your search.' : 'No rooms yet. Click "Create Room" to start.'}
                  onCopy={handleCopy}
                  onDelete={setRoomToDelete}
                />
              </div>
            </>
          )}

          {tab === 'shared' && (
            <>
              <h1 className="text-2xl font-bold">Shared with me</h1>
              <p className="mt-1 text-sm text-gray-400">
                Rooms you joined through someone's invite link.
              </p>
              <div className="mt-5">
                <RoomList
                  rooms={filteredShared}
                  loading={loading}
                  emptyText={q ? 'No rooms match your search.' : 'Nothing shared with you yet.'}
                  onCopy={handleCopy}
                  onDelete={setRoomToDelete}
                />
              </div>
            </>
          )}

          {tab === 'activity' && (
            <>
              <h1 className="text-2xl font-bold">Recent Activity</h1>
              <ul className="mt-5 space-y-2">
                {activity.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-white/15 py-10 text-center text-sm text-gray-400">
                    No activity yet.
                  </li>
                ) : (
                  activity.map((item) => <ActivityItem key={item.id} item={item} />)
                )}
              </ul>
            </>
          )}
        </main>

        {/* right column */}
        <aside className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
          <section className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-white/[0.03] to-transparent p-5">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-400/15 text-orange-300">
              <Share2 size={22} />
            </span>
            <h2 className="font-semibold">Invite your friends</h2>
            <p className="mt-1 text-sm text-gray-400">
              Creates a new room and copies its invite link. Friends need an
              account to join.
            </p>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting}
              className="mt-4 w-full rounded-lg bg-orange-400 py-2.5 text-sm font-semibold text-[#1a1208] hover:bg-orange-300 disabled:opacity-60"
            >
              {inviting ? 'Creating room...' : 'Share Invite Link'}
            </button>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent Activity</h2>
              <button
                type="button"
                onClick={() => setTab('activity')}
                className="text-sm text-orange-300 hover:underline"
              >
                View all →
              </button>
            </div>
            <ul className="space-y-2">
              {activity.length === 0 ? (
                <li className="py-4 text-center text-sm text-gray-400">No activity yet.</li>
              ) : (
                activity.slice(0, 3).map((item) => <ActivityItem key={item.id} item={item} />)
              )}
            </ul>
          </section>
        </aside>
      </div>

      {showCreate && (
        <CreateRoomModal
          creating={creating}
          onCreate={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
      {roomToDelete && (
        <ConfirmDeleteModal
          room={roomToDelete}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setRoomToDelete(null)}
        />
      )}

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />
    </div>
  )
}

export default Dashboard