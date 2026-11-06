export function applyTextDiff(model, next) {
  const prev = model.getValue()
  if (prev === next) return
  let start = 0
  const min = Math.min(prev.length, next.length)
  while (start < min && prev[start] === next[start]) start++
  let endPrev = prev.length
  let endNext = next.length
  while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
    endPrev--
    endNext--
  }
  const from = model.getPositionAt(start)
  const to = model.getPositionAt(endPrev)
  model.applyEdits([
    {
      range: {
        startLineNumber: from.lineNumber,
        startColumn: from.column,
        endLineNumber: to.lineNumber,
        endColumn: to.column,
      },
      text: next.slice(start, endNext),
    },
  ])
}