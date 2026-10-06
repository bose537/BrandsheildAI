import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path


def path():
    return os.environ.get('BRANDSHIELD_DB', str(Path(__file__).parent / 'data' / 'brandshield.db'))


@contextmanager
def connection():
    Path(path()).parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path(), timeout=15)
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('CREATE TABLE IF NOT EXISTS records (kind TEXT, id TEXT, body TEXT NOT NULL, PRIMARY KEY(kind,id))')
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def all_records(db, kind):
    return [json.loads(row[0]) for row in db.execute('SELECT body FROM records WHERE kind=? ORDER BY rowid', (kind,))]


def get(db, kind, key):
    row = db.execute('SELECT body FROM records WHERE kind=? AND id=?', (kind, key)).fetchone()
    return json.loads(row[0]) if row else None


def save(db, kind, value):
    db.execute('INSERT INTO records VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET body=excluded.body', (kind, value['id'], json.dumps(value)))
