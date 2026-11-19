import { useEffect, useRef, useState } from 'react'
import { FilePlus2, FileCode2, FileUp, Pencil, Trash2 } from 'lucide-react'
import {
  MAX_IMPORT_SIZE,
  createWorkspaceFile,
  deleteWorkspaceFile,
  getWorkspaceFiles,
  isTextFileName,
  listWorkspaceFiles,
  renameWorkspaceFile,
} from './workspaceFiles.js'

function FileExplorer({ ydoc, mainFileName, selectedFileId, onSelectFile }) {
  const [files, setFiles] = useState([])
  const importRef = useRef(null)

  useEffect(() => {
    const workspace = getWorkspaceFiles(ydoc)
    const refreshFiles = (events) => {
      if (events && !events.some((event) => event.path.length <= 1)) return
      setFiles(listWorkspaceFiles(ydoc))
    }
    workspace.observeDeep(refreshFiles)
    refreshFiles()
    return () => workspace.unobserveDeep(refreshFiles)
  }, [ydoc])

  const handleCreateFile = () => {
    const name = window.prompt('New file name (example: hello.py)')
    if (name === null) return
    try {
      const id = createWorkspaceFile(ydoc, name)
      onSelectFile(id)
    } catch (error) {
      window.alert(error.message)
    }
  }

  const handleRename = (file) => {
    const name = window.prompt('Rename file', file.name)
    if (name === null) return
    try {
      renameWorkspaceFile(ydoc, file.id, name)
    } catch (error) {
      window.alert(error.message)
    }
  }

  const handleDelete = (file) => {
    if (!window.confirm(`Delete "${file.name}" for everyone in this room?`)) return
    try {
      deleteWorkspaceFile(ydoc, file.id)
      if (selectedFileId === file.id) onSelectFile(null)
    } catch (error) {
      window.alert(error.message)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      if (!isTextFileName(file.name)) {
        throw new Error('Choose a supported text or source code file.')
      }
      if (file.size > MAX_IMPORT_SIZE) {
        throw new Error('File is too large (64 KB maximum).')
      }
      const content = await file.text()
      if (content.includes('\0')) throw new Error('Binary files cannot be imported.')
      const id = createWorkspaceFile(ydoc, file.name, content)
      onSelectFile(id)
    } catch (error) {
      window.alert(error.message)
    }
  }

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111827] p-3 text-white">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">EXPLORER</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={handleCreateFile} title="Create file" aria-label="Create file" className="rounded p-1.5 hover:bg-white/10">
            <FilePlus2 size={17} />
          </button>
          <button type="button" onClick={() => importRef.current?.click()} title="Import text file" aria-label="Import text file" className="rounded p-1.5 hover:bg-white/10">
            <FileUp size={17} />
          </button>
          <input ref={importRef} type="file" className="hidden" accept=".txt,.py,.js,.jsx,.ts,.tsx,.java,.c,.h,.cpp,.hpp,.html,.css,.scss,.json,.md,.xml,.yaml,.yml,.sql,.sh,.bat,.ps1,.rb,.go,.rs,.php,.swift,.kt,.csv" onChange={handleImport} />
        </div>
      </div>
      <p className="mb-2 text-xs text-slate-400">Shared files ({files.length})</p>
      <div className="min-h-0 space-y-1 overflow-auto">
        <button
          type="button"
          onClick={() => onSelectFile(null)}
          className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-white/10 ${selectedFileId === null ? 'bg-orange-400/15 text-orange-200' : ''}`}
          title="Original room file"
        >
          <FileCode2 size={16} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{mainFileName}</span>
        </button>
        {files.map((file) => (
          <div
            key={file.id}
            className={`group flex min-w-0 items-center rounded hover:bg-white/10 ${selectedFileId === file.id ? 'bg-orange-400/15 text-orange-200' : ''}`}
          >
            <button type="button" onClick={() => onSelectFile(file.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm" title={file.name}>
              <FileCode2 size={16} className="shrink-0" />
              <span className="truncate">{file.name}</span>
            </button>
            <button type="button" onClick={() => handleRename(file)} title={`Rename ${file.name}`} aria-label={`Rename ${file.name}`} className="shrink-0 rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white">
              <Pencil size={13} />
            </button>
            <button type="button" onClick={() => handleDelete(file)} title={`Delete ${file.name}`} aria-label={`Delete ${file.name}`} className="mr-1 shrink-0 rounded p-1 text-slate-300 hover:bg-red-500/20 hover:text-red-300">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-4 text-slate-400">Changes sync across everyone in this room. Imports: text files, up to 64 KB.</p>
    </aside>
  )
}

export default FileExplorer
