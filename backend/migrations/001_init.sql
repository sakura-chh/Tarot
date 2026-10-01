CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);
INSERT OR IGNORE INTO schema_migrations VALUES(1);
CREATE TABLE IF NOT EXISTS cards(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS draw_sessions(
 request_id TEXT PRIMARY KEY, parameter_hash TEXT NOT NULL, response_json TEXT NOT NULL,
 expires_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS draw_sessions_expiry ON draw_sessions(expires_at);
