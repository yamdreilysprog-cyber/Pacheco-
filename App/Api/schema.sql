CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1886 AND 2100),
  mileage INTEGER NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  price_usd INTEGER NOT NULL CHECK (price_usd >= 0),
  status TEXT NOT NULL CHECK (status IN ('available', 'workshop', 'sold')),
  condition TEXT NOT NULL DEFAULT 'Operativo',
  description TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX vehicles_status_idx ON vehicles(status);
