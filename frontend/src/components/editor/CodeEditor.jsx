import Editor from '@monaco-editor/react'
import { useRef, useState } from 'react'
import LanguageSelector from './LanguageSelector'
import { CODE_SNIPPETS } from './constants.js'
import Output from './Output.jsx'

// const CodeEditor = () => {
//   const editorRef = useRef()
//   const [language, setLanguage] = useState('javascript')
//   const [value, setValue] = useState(CODE_SNIPPETS.javascript)
const CodeEditor = ({ initialLanguage = 'javascript' }) => {
  const editorRef = useRef()
  const [language, setLanguage] = useState(initialLanguage)
  const [value, setValue] = useState(CODE_SNIPPETS[initialLanguage] ?? '')

  const onMount = (editor) => {
    editorRef.current = editor
    editor.focus()
  }

  const onSelect = (language) => {
    setLanguage(language)
    setValue(CODE_SNIPPETS[language])
  }

  return (
    <div className="h-[90vh]">
      <div className="flex gap-4">
        <div className="w-1/2">
          <LanguageSelector language={language} onSelect={onSelect} />
          <Editor
            height="75vh"
            language={language}
            theme="vs-dark"
            onMount={onMount}
            value={value}
            onChange={(value) => setValue(value)}
          />
        </div>
        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  )
}

export default CodeEditor