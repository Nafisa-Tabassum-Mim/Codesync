import { useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import { executeCode } from '../services/api.js'

const Output = ({ editorRef, language, result, onResult }) => {
  const [isLoading, setIsLoading] = useState(false)

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue()
    if (!sourceCode) return
    try {
      setIsLoading(true)
      const { run } = await executeCode(language, sourceCode)
      onResult({ text: run.output, isError: Boolean(run.stderr) })
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Unable to run code', { toastId: 'run-error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-1/2">
      <p className="mb-2 text-lg text-[#cccccc]">Output</p>

      <button
        type="button"
        onClick={runCode}
        disabled={isLoading}
        className="mb-4 rounded-md border border-[#4ec9b0] px-4 py-2 text-[#4ec9b0] hover:bg-[#094771] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Running...' : 'Run Code'}
      </button>
      {result?.by && <span className="ml-3 text-xs text-gray-400">Run by {result.by}</span>}

      <div
        className={`h-[75vh] overflow-y-auto rounded border bg-[#1e1e1e] p-2 font-mono text-sm ${
          result?.isError
            ? 'border-[#f14c4c] text-[#f48771]'
            : 'border-[#454545] text-[#d4d4d4]'
        }`}
      >
        {result ? (
          result.text.split('\n').map((line, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {line}
            </p>
          ))
        ) : (
          <p className="text-[#858585]">Click "Run Code" to see the output here</p>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
    </div>
  )
}

export default Output