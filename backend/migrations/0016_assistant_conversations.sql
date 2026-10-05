CREATE TABLE assistant_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX assistant_messages_conversation ON assistant_messages (conversation_id, created_at);
CREATE INDEX assistant_messages_site ON assistant_messages (site_id, created_at);
