import os
import psycopg2
from typing import Optional
from datetime import datetime
from config import settings
from schemas.auth import UserResponse, RefreshTokenRecord
from db.connection import get_sqlite_connection

class UserRepository:
    def __init__(self, db_path: Optional[str] = None):
        self.conn_str = f"dbname={settings.postgres_db} user={settings.postgres_user} password={settings.postgres_password} host={settings.postgres_host} port={settings.postgres_port}"
        self.db_path = db_path or settings.db_path
        self._prefer_sqlite = False
        self._sqlite_initialized = False

    def _init_sqlite(self):
        if self._sqlite_initialized:
            return
        conn = get_sqlite_connection(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT DEFAULT 'PROCUREMENT_OFFICER',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                revoked_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);")
        conn.commit()
        self._sqlite_initialized = True

    def _get_pg_connection(self):
        if self._prefer_sqlite:
            return None
        try:
            return psycopg2.connect(self.conn_str, connect_timeout=2)
        except Exception:
            self._prefer_sqlite = True
            return None

    def create_user(self, email: str, hashed_password: str, full_name: str) -> UserResponse:
        pg_conn = self._get_pg_connection()
        if pg_conn:
            try:
                with pg_conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO users (email, hashed_password, full_name)
                        VALUES (%s, %s, %s)
                        RETURNING id, email, full_name, role, is_active, created_at, updated_at
                    """, (email, hashed_password, full_name))
                    row = cur.fetchone()
                    pg_conn.commit()
                    return UserResponse(
                        id=row[0], email=row[1], full_name=row[2], 
                        role=row[3], is_active=row[4], created_at=row[5], updated_at=row[6]
                    )
            finally:
                pg_conn.close()

        # SQLite fallback
        self._init_sqlite()
        conn = get_sqlite_connection(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO users (email, hashed_password, full_name)
            VALUES (?, ?, ?)
            RETURNING id, email, full_name, role, is_active, created_at, updated_at
        """, (email, hashed_password, full_name))
        row = cur.fetchone()
        conn.commit()
        return UserResponse(
            id=row[0], email=row[1], full_name=row[2],
            role=row[3] or "PROCUREMENT_OFFICER", is_active=bool(row[4]),
            created_at=row[5] or datetime.utcnow(), updated_at=row[6] or datetime.utcnow()
        )

    def get_user_by_email(self, email: str) -> Optional[dict]:
        pg_conn = self._get_pg_connection()
        if pg_conn:
            try:
                with pg_conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, email, hashed_password, full_name, role, is_active, created_at, updated_at
                        FROM users
                        WHERE email = %s
                    """, (email,))
                    row = cur.fetchone()
                    if row:
                        return {
                            "id": row[0], "email": row[1], "hashed_password": row[2],
                            "full_name": row[3], "role": row[4], "is_active": row[5],
                            "created_at": row[6], "updated_at": row[7]
                        }
                    return None
            finally:
                pg_conn.close()

        # SQLite fallback
        self._init_sqlite()
        conn = get_sqlite_connection(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, email, hashed_password, full_name, role, is_active, created_at, updated_at
            FROM users
            WHERE email = ?
        """, (email,))
        row = cur.fetchone()
        if row:
            return {
                "id": row[0], "email": row[1], "hashed_password": row[2],
                "full_name": row[3], "role": row[4] or "PROCUREMENT_OFFICER", "is_active": bool(row[5]),
                "created_at": row[6], "updated_at": row[7]
            }
        return None

    def get_user_by_id(self, user_id: int) -> Optional[UserResponse]:
        pg_conn = self._get_pg_connection()
        if pg_conn:
            try:
                with pg_conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, email, full_name, role, is_active, created_at, updated_at
                        FROM users
                        WHERE id = %s
                    """, (user_id,))
                    row = cur.fetchone()
                    if row:
                        return UserResponse(
                            id=row[0], email=row[1], full_name=row[2], 
                            role=row[3], is_active=row[4], created_at=row[5], updated_at=row[6]
                        )
                    return None
            finally:
                pg_conn.close()

        # SQLite fallback
        self._init_sqlite()
        conn = get_sqlite_connection(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, email, full_name, role, is_active, created_at, updated_at
            FROM users
            WHERE id = ?
        """, (user_id,))
        row = cur.fetchone()
        if row:
            return UserResponse(
                id=row[0], email=row[1], full_name=row[2],
                role=row[3] or "PROCUREMENT_OFFICER", is_active=bool(row[4]),
                created_at=row[5], updated_at=row[6]
            )
        return None

    def create_refresh_token(self, user_id: int, token_hash: str, expires_at: datetime) -> None:
        pg_conn = self._get_pg_connection()
        if pg_conn:
            try:
                with pg_conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
                        VALUES (%s, %s, %s)
                    """, (user_id, token_hash, expires_at))
                    pg_conn.commit()
                    return
            finally:
                pg_conn.close()

        # SQLite fallback
        self._init_sqlite()
        conn = get_sqlite_connection(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        """, (user_id, token_hash, expires_at.isoformat()))
        conn.commit()

    def get_refresh_token_by_hash(self, token_hash: str) -> Optional[RefreshTokenRecord]:
        pg_conn = self._get_pg_connection()
        if pg_conn:
            try:
                with pg_conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, user_id, token_hash, expires_at, revoked_at, created_at, last_used_at
                        FROM refresh_tokens
                        WHERE token_hash = %s
                    """, (token_hash,))
                    row = cur.fetchone()
                    if row:
                        return RefreshTokenRecord(
                            id=row[0], user_id=row[1], token_hash=row[2], 
                            expires_at=row[3], revoked_at=row[4], created_at=row[5], last_used_at=row[6]
                        )
                    return None
            finally:
                pg_conn.close()

        # SQLite fallback
        self._init_sqlite()
        conn = get_sqlite_connection(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, token_hash, expires_at, revoked_at, created_at, last_used_at
            FROM refresh_tokens
            WHERE token_hash = ?
        """, (token_hash,))
        row = cur.fetchone()
        if row:
            return RefreshTokenRecord(
                id=row[0], user_id=row[1], token_hash=row[2],
                expires_at=row[3], revoked_at=row[4], created_at=row[5], last_used_at=row[6]
            )
        return None

    def revoke_refresh_token(self, token_hash: str) -> None:
        pg_conn = self._get_pg_connection()
        if pg_conn:
            try:
                with pg_conn.cursor() as cur:
                    cur.execute("""
                        UPDATE refresh_tokens
                        SET revoked_at = CURRENT_TIMESTAMP
                        WHERE token_hash = %s AND revoked_at IS NULL
                    """, (token_hash,))
                    pg_conn.commit()
                    return
            finally:
                pg_conn.close()

        # SQLite fallback
        self._init_sqlite()
        conn = get_sqlite_connection(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            UPDATE refresh_tokens
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE token_hash = ? AND revoked_at IS NULL
        """, (token_hash,))
        conn.commit()

    def update_refresh_token_last_used(self, token_hash: str) -> None:
        pg_conn = self._get_pg_connection()
        if pg_conn:
            try:
                with pg_conn.cursor() as cur:
                    cur.execute("""
                        UPDATE refresh_tokens
                        SET last_used_at = CURRENT_TIMESTAMP
                        WHERE token_hash = %s
                    """, (token_hash,))
                    pg_conn.commit()
                    return
            finally:
                pg_conn.close()

        # SQLite fallback
        self._init_sqlite()
        conn = get_sqlite_connection(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            UPDATE refresh_tokens
            SET last_used_at = CURRENT_TIMESTAMP
            WHERE token_hash = ?
        """, (token_hash,))
        conn.commit()
