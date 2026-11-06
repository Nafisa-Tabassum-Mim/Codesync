import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, Copy } from 'lucide-react'
import CodeEditor from '../editor/CodeEditor'
import { copyText, inviteUrl, joinRoom } from '../services/roomService'

const Screen = ({ children }) => (
  <div className="min-h-screen bg-[#07080f] px-6 py-6 text-white">{children}</div>
)

const Myroom = () => {
  const { slug } = useParams()
  const [room, setRoom] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | missing | error

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    // joining adds this user as a member (the owner is already one)
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

  const handleCopy = async () => {
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

  return (
    <Screen>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
          >
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <h1 className="text-lg font-semibold">{room.name}</h1>
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs capitalize text-gray-300">
            {room.language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-orange-400/50 px-4 py-1.5 text-sm text-orange-200 hover:bg-orange-400/10"
        >
          <Copy size={15} /> Copy invite link
        </button>
      </div>

      <CodeEditor initialLanguage={room.language} />
    </Screen>
  )
}

export default Myroom