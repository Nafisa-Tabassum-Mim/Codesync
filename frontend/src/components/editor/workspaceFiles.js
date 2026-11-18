import * as Y from 'yjs'

export const MAX_WORKSPACE_FILES = 20
export const MAX_IMPORT_SIZE = 64 * 1024

const TEXT_EXTENSIONS = new Set([
  'txt', 'py', 'js', 'jsx', 'ts', 'tsx', 'java', 'c', 'h', 'cpp', 'hpp',
  'html', 'css', 'scss', 'json', 'md', 'xml', 'yaml', 'yml', 'sql',
  'sh', 'bat', 'ps1', 'rb', 'go', 'rs', 'php', 'swift', 'kt', 'csv',
])

const FILE_LANGUAGES = {
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  hpp: 'cpp',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  md: 'markdown',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  sql: 'sql',
  sh: 'shell',
  bat: 'bat',
  ps1: 'powershell',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  csv: 'plaintext',
  txt: 'plaintext',
}

export function getFileLanguage(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return FILE_LANGUAGES[extension] ?? 'plaintext'
}

export function isTextFileName(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return TEXT_EXTENSIONS.has(extension)
}

export function getWorkspaceFiles(ydoc) {
  return ydoc.getMap('workspaceFiles')
}

export function getWorkspaceFile(ydoc, fileId) {
  if (!fileId) return null
  return getWorkspaceFiles(ydoc).get(fileId) ?? null
}

export function getWorkspaceFileText(ydoc, fileId) {
  const file = getWorkspaceFile(ydoc, fileId)
  return file?.get('content') ?? null
}

export function listWorkspaceFiles(ydoc) {
  return Array.from(getWorkspaceFiles(ydoc).entries())
    .map(([id, file]) => ({ id, name: file.get('name') }))
    .filter((file) => typeof file.name === 'string')
    .sort((a, b) => a.name.localeCompare(b.name))
}

function validateFileName(fileName) {
  const name = String(fileName ?? '').trim()
  if (
    !name || name.length > 100 || name === '.' || name === '..' ||
    /[\\/:*?"<>|\x00-\x1f]/.test(name) || name.endsWith('.')
  ) {
    throw new Error('Enter a valid file name (maximum 100 characters, no folder paths).')
  }
  return name
}

function ensureUniqueName(files, name, excludeId = null) {
  const duplicate = Array.from(files.entries()).some(
    ([id, file]) => id !== excludeId &&
      file.get('name')?.toLowerCase() === name.toLowerCase(),
  )
  if (duplicate) throw new Error('A file with this name already exists.')
}

export function createWorkspaceFile(ydoc, fileName, content = '') {
  const name = validateFileName(fileName)
  if (typeof content !== 'string' || new TextEncoder().encode(content).length > MAX_IMPORT_SIZE) {
    throw new Error('File content is too large (64 KB maximum).')
  }

  const files = getWorkspaceFiles(ydoc)
  if (files.size >= MAX_WORKSPACE_FILES) {
    throw new Error(`You can create up to ${MAX_WORKSPACE_FILES} files in a room.`)
  }
  ensureUniqueName(files, name)

  const fileId = crypto.randomUUID()
  const file = new Y.Map()
  const text = new Y.Text()

  ydoc.transact(() => {
    file.set('name', name)
    file.set('content', text)
    files.set(fileId, file)
    if (content) text.insert(0, content)
  })
  return fileId
}

export function renameWorkspaceFile(ydoc, fileId, fileName) {
  const name = validateFileName(fileName)
  const files = getWorkspaceFiles(ydoc)
  const file = files.get(fileId)
  if (!file) throw new Error('This file no longer exists.')
  ensureUniqueName(files, name, fileId)
  if (file.get('name') !== name) {
    ydoc.transact(() => file.set('name', name))
  }
}

export function deleteWorkspaceFile(ydoc, fileId) {
  const files = getWorkspaceFiles(ydoc)
  if (!files.has(fileId)) throw new Error('This file no longer exists.')
  ydoc.transact(() => files.delete(fileId))
}
