import { useState } from 'react'
import { toast } from 'react-toastify'
import { Play } from 'lucide-react'
import { executeCode } from '../services/api.js'

const Output = ({ editorRef, language, result, onResult }) => {
  const [isLoading, setIsLoading] = useState(false)

  const runCode = async () => {
    const sourceCode = editorRef.current?.getValue()
    if (!sourceCode) return
    try {
      setIsLoading(true)
      const { run } = await executeCode(language, sourceCode)
      onResult({ text: run.output, isError: Boolean(run.stderr) })
    } catch (error) {
      console.log(error)
      const message =
        error.response?.status === 401
          ? 'Please log in to run code'
          : error.response?.data?.detail || error.message || 'Unable to run code'
      toast.error(message, { toastId: 'run-error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="flex h-[40vh] min-h-0 flex-col gap-3 lg:h-auto">
      <button
        type="button"
        onClick={runCode}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-400 py-3 text-sm font-semibold text-[#1a1208] shadow-lg shadow-orange-500/20 hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Play size={16} fill="currentColor" />
        {isLoading ? 'Running...' : 'Run Code'}
      </button>

      <section
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-[#0a0c16] ${
          result?.isError ? 'border-red-400/60' : 'border-white/10'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <h2 className="text-sm font-medium text-gray-200">Output</h2>
          {result?.by && <span className="text-xs text-gray-400">Run by {result.by}</span>}
        </div>
        <div
          className={`min-h-0 flex-1 overflow-auto p-4 font-mono text-sm ${
            result?.isError ? 'text-[#f48771]' : 'text-slate-200'
          }`}
        >
          {result ? (
            result.text.split('\n').map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {line}
              </p>
            ))
          ) : (
            <p className="text-gray-500">Click "Run Code" to see the output here</p>
          )}
        </div>
      </section>
    </aside>
  )
}

export default Output