"""Server-side Yjs document for one room.

The server never edits text character-by-character: clients do that, and Yjs
merges their edits. The server only
  * keeps the merged state so late joiners can catch up,
  * applies each incoming update and reports what was actually new, and
  * seeds the starter snippet / switches language (whole-document ops that must
    be serialized so two clients cannot both do them).

Pure pycrdt: no database or settings imports, so it is trivially testable.
"""
from __future__ import annotations

from pycrdt import Doc, Map, Text

EMPTY_UPDATE = b"\x00\x00"  # what get_update() returns when nothing is new


class InvalidUpdate(ValueError):
    """Client sent bytes that are not a valid Yjs update."""


class RoomDoc:
    def __init__(self) -> None:
        self.doc = Doc()
        self.text: Text = self.doc.get("text", type=Text)
        self.meta: Map = self.doc.get("meta", type=Map)

    # ---- reading ---------------------------------------------------------
    @property
    def content(self) -> str:
        return str(self.text)

    @property
    def language(self) -> str | None:
        return self.meta.get("language")

    def full_state(self) -> bytes:
        """Everything a new client needs (an update from the empty state)."""
        return self.doc.get_update()

    # ---- writing ---------------------------------------------------------
    def apply(self, update: bytes) -> bytes:
        """Apply a client update. Returns the part that was genuinely new
        (EMPTY_UPDATE if it was a duplicate), so callers only broadcast news."""
        before = self.doc.get_state()
        try:
            self.doc.apply_update(update)
        except Exception as exc:  # pycrdt raises ValueError on garbage
            raise InvalidUpdate(str(exc)) from exc
        return self.doc.get_update(before)

    def seed(self, language: str, snippet: str) -> bytes:
        """Give a brand-new room its starter code. No-op if already seeded."""
        if self.language is not None:
            return EMPTY_UPDATE
        return self._change(language, snippet)

    def set_language(self, language: str, snippet: str | None = None) -> bytes:
        """Switch language. With a snippet the document is replaced by it;
        with snippet=None the code is kept and only the language changes."""
        if snippet is None:
            before = self.doc.get_state()
            self.meta["language"] = language
            return self.doc.get_update(before)
        return self._change(language, snippet)

    def _change(self, language: str, snippet: str) -> bytes:
        before = self.doc.get_state()
        with self.doc.transaction():
            self.meta["language"] = language
            del self.text[0 : len(self.text)]
            self.text.insert(0, snippet)
        return self.doc.get_update(before)