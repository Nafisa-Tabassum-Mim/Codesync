"""Several clients make random concurrent edits; everyone must converge.

Each fake client is a real Yjs doc (pycrdt) that edits locally, then exchanges
updates through a RoomDoc relay with shuffled, duplicated and delayed delivery.
"""
import random

import pytest
from pycrdt import Doc, Map, Text

from app.services.room_doc import EMPTY_UPDATE, InvalidUpdate, RoomDoc

ALPHABET = "abcdefghij \n"  # ASCII only: pycrdt lengths are UTF-8 bytes


class Client:
    def __init__(self, name: str):
        self.name = name
        self.doc = Doc()
        self.text = self.doc.get("text", type=Text)
        self.outbox: list[bytes] = []
        self.doc.observe(lambda e: None)  # keep doc live

    def edit(self, rng: random.Random) -> None:
        """One random insert or delete, captured as an update."""
        before = self.doc.get_state()
        n = len(self.text)
        if n and rng.random() < 0.4:
            i = rng.randrange(n)
            j = min(n, i + rng.randint(1, 4))
            del self.text[i:j]
        else:
            i = rng.randint(0, n)
            self.text.insert(i, "".join(rng.choice(ALPHABET) for _ in range(rng.randint(1, 5))))
        self.outbox.append(self.doc.get_update(before))

    def receive(self, update: bytes) -> None:
        self.doc.apply_update(update)

    @property
    def content(self) -> str:
        return str(self.text)


def run_session(seed: int, n_clients: int = 5, rounds: int = 60, ordered: bool = True) -> None:
    """ordered=True models WebSockets: each connection is FIFO, but connections
    are delayed independently and messages may be duplicated.
    ordered=False is the worst case (any reordering); it ends with the full-state
    resync every client performs on reconnect."""
    rng = random.Random(seed)
    server = RoomDoc()
    clients = [Client(f"c{i}") for i in range(n_clients)]
    queues = {c.name: [] for c in clients}  # per-destination in-flight updates

    def deliver_some():
        for c in clients:
            q = queues[c.name]
            if not ordered:
                rng.shuffle(q)
            for _ in range(rng.randint(0, len(q))):
                c.receive(q.pop(0))

    for _ in range(rounds):
        c = rng.choice(clients)
        c.edit(rng)  # edits happen with NO knowledge of others' pending edits
        news = server.apply(c.outbox.pop())
        if news != EMPTY_UPDATE:
            for other in clients:
                if other is not c:
                    queues[other.name].append(news)
                    if rng.random() < 0.3:  # duplicate delivery
                        queues[other.name].append(news)
        deliver_some()

    for c in clients:  # network heals: flush everything left
        for u in queues[c.name]:
            c.receive(u)
        if not ordered:
            c.receive(server.full_state())  # reconnect resync

    expected = server.content
    for c in clients:
        assert c.content == expected, f"seed={seed} {c.name} diverged"


@pytest.mark.parametrize("seed", range(60))
def test_random_concurrent_edits_converge(seed):
    run_session(seed)


@pytest.mark.parametrize("seed", range(40))
def test_converge_even_with_arbitrary_reordering_after_resync(seed):
    run_session(seed, ordered=False)


def test_many_clients_heavy():
    run_session(seed=999, n_clients=12, rounds=400)


def test_offline_client_resyncs_with_full_state():
    rng = random.Random(7)
    server = RoomDoc()
    a, b = Client("a"), Client("b")
    for _ in range(20):
        a.edit(rng)
        server.apply(a.outbox.pop())
    # b was offline the whole time and also typed locally
    for _ in range(10):
        b.edit(rng)
        server.apply(b.outbox.pop())
    # reconnect: exchange full state both ways
    b.receive(server.full_state())
    a.receive(server.full_state())
    server.apply(b.doc.get_update())
    assert a.content == b.content == server.content


def test_duplicate_update_is_not_rebroadcast():
    server = RoomDoc()
    c = Client("c")
    c.edit(random.Random(1))
    upd = c.outbox.pop()
    assert server.apply(upd) != EMPTY_UPDATE
    assert server.apply(upd) == EMPTY_UPDATE


def test_garbage_update_rejected_and_state_untouched():
    server = RoomDoc()
    c = Client("c")
    c.edit(random.Random(2))
    server.apply(c.outbox.pop())
    before = server.content
    with pytest.raises(InvalidUpdate):
        server.apply(b"\xff\xff\xff")
    assert server.content == before


def test_seed_only_happens_once():
    server = RoomDoc()
    first = server.seed("python", "print('hi')\n")
    second = server.seed("python", "print('hi')\n")
    assert first != EMPTY_UPDATE and second == EMPTY_UPDATE
    assert server.content == "print('hi')\n"


def test_concurrent_language_switches_serialize():
    """Two clients click different languages 'at once': server picks an order,
    and everyone ends on one consistent (language, code) pair."""
    server = RoomDoc()
    server.seed("python", "A\n")
    watchers = [Client("w1"), Client("w2")]
    for w in watchers:
        w.receive(server.full_state())
    u1 = server.set_language("javascript", "JS\n")
    u2 = server.set_language("go", "GO\n")
    # delivered in different orders
    watchers[0].receive(u1)
    watchers[0].receive(u2)
    watchers[1].receive(u2)
    watchers[1].receive(u1)
    assert server.language == "go" and server.content == "GO\n"
    assert watchers[0].content == watchers[1].content == "GO\n"


def test_late_joiner_gets_full_state():
    server = RoomDoc()
    server.seed("python", "x = 1\n")
    c = Client("late")
    c.receive(server.full_state())
    assert c.content == "x = 1\n"


def test_language_switch_without_snippet_keeps_code():
    server = RoomDoc()
    server.seed("python", "keep me\n")
    watcher = Client("w")
    watcher.receive(server.full_state())
    upd = server.set_language("java")
    watcher.receive(upd)
    assert server.language == "java" and server.content == "keep me\n"
    assert watcher.content == "keep me\n"
    assert watcher.doc.get("meta", type=Map).get("language") == "java"