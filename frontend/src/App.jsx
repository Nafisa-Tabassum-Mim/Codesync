import { Link, Route, Routes } from 'react-router-dom'
import CodeEditor from './components/editor/CodeEditor.jsx'

function App() {
  return (
    <div className="min-h-screen bg-[#06050a] px-6 py-12 text-gray-800">
      <Routes>
        <Route path="/" element={<CodeEditor />} />
        <Route
          path="*"
          element={
            <div className="text-white">
              <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
              <Link to="/" className="text-[#569cd6] hover:underline">
                Go to the code editor
              </Link>
            </div>
          }
        />
      </Routes>
    </div>
  )
}

export default App