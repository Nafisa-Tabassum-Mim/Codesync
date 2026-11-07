import './monacoSetup.js' 
import Editor from '@monaco-editor/react'
import { FileCode2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MonacoBinding } from 'y-monaco'
import { CODE_SNIPPETS, FILE_NAMES } from './constants.js'
import LanguageSelector from './LanguageSelector.jsx'
import Output from './Output.jsx'
import { useRoomSocket } from './useRoomSocket.js'


const defineThemes = (monaco) => {
  monaco.editor.defineTheme('codesync-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'fdba74' },
      { token: 'string', foreground: '7dd3fc' },
      { token: 'number', foreground: 'fcd34d' },
      { token: 'type', foreground: '93c5fd' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#0a0c16',
      'editor.lineHighlightBackground': '#ffffff0a',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#fdba74',
      'editorCursor.foreground': '#fdba74',
      'editor.selectionBackground': '#fb923c33',
    },
  })
}

// Monaco's built-in JS/TS checker can leave stale error marks on a model after
// switching to a different language, so we clear them when the language changes.
function clearStaleMarkers(monaco, model) {
  const lang = model.getLanguageId()
  for (const owner of ['javascript', 'typescript']) {
    if (owner !== lang && monaco.editor.getModelMarkers({ resource: model.uri, owner }).length) {
      monaco.editor.setModelMarkers(model, owner, [])
    }
  }
}

const CodeEditor = ({
  initialLanguage = 'javascript',
  roomSlug,
  theme = 'codesync-dark',
  fontSize = 14,
  onLive,
}) => {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const bindingRef = useRef(null)
  const markerListener = useRef(null)

  const [language, setLanguage] = useState(initialLanguage)
  const [result, setResult] = useState(null)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })

  const onOutput = useCallback((msg) => {
    setResult({ text: msg.output, isError: msg.isError, by: msg.user })
  }, [])

  const seed = useMemo(
    () => ({ language: initialLanguage, snippet: CODE_SNIPPETS[initialLanguage] ?? '' }),
    [initialLanguage],
  )

  const { ydoc, awarenessRef, status, presence, sendOutput, sendLanguage } = useRoomSocket(
    roomSlug,
    { onOutput, seed },
  )

  // the shared language lives inside the Yjs doc, so every client switches together
  useEffect(() => {
    const meta = ydoc.getMap('meta')
    const sync = () => setLanguage(meta.get('language') ?? initialLanguage)
    sync()
    meta.observe(sync)
    return () => meta.unobserve(sync)
  }, [ydoc, initialLanguage])

  // when the language changes, apply it to the editor and drop stale error marks
  useEffect(() => {
    const monaco = monacoRef.current
    const model = editorRef.current?.getModel()
    if (!monaco || !model) return
    monaco.editor.setModelLanguage(model, language)
    clearStaleMarkers(monaco, model)
  }, [language])

  // tear down the Yjs binding and the marker listener with the component
  useEffect(
    () => () => {
      bindingRef.current?.destroy()
      markerListener.current?.dispose()
    },
    [],
  )

  // tell the page who is connected (the header shows it)
  useEffect(() => {
    onLive?.({ status, presence })
  }, [status, presence, onLive])

  const handleResult = (r) => {
    setResult({ ...r, by: null })
    sendOutput(r.text, r.isError)
  }

  const onMount = (editor, monaco) => {
    monacoRef.current = monaco
    editorRef.current = editor
    const model = editor.getModel()
    monaco.editor.setModelLanguage(model, language)

    markerListener.current = monaco.editor.onDidChangeMarkers(() => {
      const m = editor.getModel()
      if (m) clearStaleMarkers(monaco, m)
    })

    model.setEOL(monaco.editor.EndOfLineSequence.LF) // Yjs text uses \n; Windows must not add \r\n

    bindingRef.current = new MonacoBinding(
      ydoc.getText('text'),
      model,
      new Set([editor]),
      awarenessRef.current,
    )

    editor.onDidChangeCursorPosition((e) =>
      setCursor({ line: e.position.lineNumber, col: e.position.column }),
    )
    editor.focus()
  }

  // Switch the shared language and load that language's starter snippet.
  // The server applies both changes as one Yjs transaction for every client.
  const onSelect = (lang) => sendLanguage(lang, CODE_SNIPPETS[lang] ?? '')

  const denied = status === 'denied'
  const options = useMemo(
    () => ({
      fontSize,
      readOnly: denied,
      minimap: { enabled: false },
      padding: { top: 24 }, // room above line 1 for other people's name labels
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      detectIndentation: false,
    }),
    [fontSize, denied],
  )

  const fileName = FILE_NAMES[language] ?? 'main.txt'

  return (
    <div className="relative z-10 grid min-h-0 flex-1 gap-4 p-4 pt-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)]">
      {/* editor card */}
      <section className="flex h-[65vh] min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0c16] lg:h-auto">
        {/* tab bar */}
        <div className="flex border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 border-b-2 border-orange-400 bg-orange-400/10 px-4 py-2.5 text-sm text-white">
            <FileCode2 size={15} className="text-orange-300" />
            {fileName}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <Editor
            height="100%"
            language={language}
            theme={theme}
            beforeMount={defineThemes}
            onMount={onMount}
            options={options}
          />
        </div>

        {/* status bar */}
        <div className="flex items-center justify-end gap-5 border-t border-white/10 px-4 py-1.5 text-xs text-gray-400">
          <span>
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <LanguageSelector language={language} onSelect={onSelect} />
        </div>
      </section>

      {/* Run Code + Output */}
      <Output
        editorRef={editorRef}
        language={language}
        result={result}
        onResult={handleResult}
      />
    </div>
  )
}

export default CodeEditor