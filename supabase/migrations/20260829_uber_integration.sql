create table if not exists public.uber_connections (
  id uuid primary key default gen_random_uuid(),
  driver_id text not null unique,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  updated_at timestamptz not null default now()
);

alter table public.uber_connections enable row level security;

create index if not exists uber_connections_updated_at_idx
  on public.uber_connections(updated_at);
