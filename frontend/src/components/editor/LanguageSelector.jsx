import { useEffect, useRef, useState } from 'react'
import { LANGUAGE_VERSIONS } from './constants.js'

const languages = Object.entries(LANGUAGE_VERSIONS)

const LanguageSelector = ({ language, onSelect }) => {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  // close the dropdown when clicking outside it
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="mb-4 ml-2" ref={wrapperRef}>
      <p className="mb-2 text-lg text-[#cccccc]">Language:</p>

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-[#454545] bg-[#3c3c3c] px-4 py-2 text-[#cccccc] hover:bg-[#505050]"
        >
          {language}
        </button>

        {open && (
          <ul className="absolute left-0 z-10 mt-1 min-w-48 rounded-md border border-[#454545] bg-[#252526] py-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {languages.map(([lang, version]) => {
              const isActive = lang === language
              return (
                <li key={lang}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(lang)
                      setOpen(false)
                    }}
                    className={`w-full px-3 py-1.5 text-left ${
                      isActive
                        ? 'bg-[#094771] text-white'
                        : 'text-[#cccccc] hover:bg-[#2a2d2e] hover:text-[#569cd6]'
                    }`}
                  >
                    {lang}{' '}
                    <span className="text-sm text-[#6a9955]">({version})</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default LanguageSelector