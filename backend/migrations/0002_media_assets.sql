CREATE TABLE media_assets (
  key TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  bytes INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX media_assets_site_id ON media_assets(site_id);
