-- Research Spaces table
create table if not exists research_spaces (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  papers jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table research_spaces enable row level security;

-- RLS Policies
create policy "research_spaces owner full" on research_spaces for all using (owner = auth.uid()) with check (owner = auth.uid());

-- Index for performance
create index if not exists research_spaces_owner_idx on research_spaces(owner);
create index if not exists research_spaces_created_at_idx on research_spaces(created_at desc);
