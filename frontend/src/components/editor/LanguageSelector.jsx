import { useEffect, useRef, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { LANGUAGE_LABELS } from './constants.js'

const languages = Object.entries(LANGUAGE_LABELS)

const LanguageSelector = ({ language, onSelect }) => {
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
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-gray-300 hover:bg-white/10 hover:text-orange-200"
      >
        {LANGUAGE_LABELS[language]} <ChevronUp size={12} />
      </button>

      {open && (
        <ul className="absolute bottom-full right-0 z-20 mb-2 min-w-52 rounded-lg border border-white/10 bg-[#0d0f1a] py-1 shadow-xl">
          {languages.map(([lang, label]) => (
            <li key={lang}>
              <button
                type="button"
                onClick={() => {
                  onSelect(lang)
                  setOpen(false)
                }}
                className={`w-full px-3 py-1.5 text-left text-sm ${
                  lang === language
                    ? 'bg-orange-400/15 text-orange-200'
                    : 'text-gray-300 hover:bg-white/5 hover:text-orange-200'
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LanguageSelector