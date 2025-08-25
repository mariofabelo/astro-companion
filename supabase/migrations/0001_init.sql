-- Extensions
create extension if not exists vector;

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  full_name text
);

-- Projects table
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

-- Papers table
create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  owner uuid not null references auth.users(id) on delete cascade,
  title text,
  doi text,
  arxiv_id text,
  ads_bibcode text,
  csl jsonb,
  pdf_path text,
  created_at timestamptz default now()
);

-- Chunks table for RAG
create table if not exists chunks (
  id bigserial primary key,
  paper_id uuid not null references papers(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  tokens int,
  created_at timestamptz default now()
);

-- Indexes for chunks
create index if not exists chunks_paper_idx on chunks(paper_id);
create index if not exists chunks_embedding_hnsw on chunks using hnsw (embedding vector_cosine_ops);

-- References library
create table if not exists references_library (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  csl jsonb not null,
  doi text,
  arxiv_id text,
  unique_key text,
  created_at timestamptz default now()
);

-- Notes table
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  owner uuid not null references auth.users(id) on delete cascade,
  title text,
  content jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Note citations junction table
create table if not exists note_citations (
  note_id uuid references notes(id) on delete cascade,
  ref_id uuid references references_library(id) on delete cascade,
  primary key (note_id, ref_id)
);

-- Media table for audio files
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  kind text check (kind in ('tts_audio')),
  path text not null,
  paper_id uuid references papers(id) on delete set null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table projects enable row level security;
alter table papers enable row level security;
alter table chunks enable row level security;
alter table references_library enable row level security;
alter table notes enable row level security;
alter table note_citations enable row level security;
alter table media enable row level security;

-- RLS Policies
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "project owner full" on projects for all using (owner = auth.uid()) with check (owner = auth.uid());
create policy "paper owner full" on papers for all using (owner = auth.uid()) with check (owner = auth.uid());
create policy "chunks owner read" on chunks for select using (
  exists (select 1 from papers p where p.id = chunks.paper_id and p.owner = auth.uid())
);
create policy "chunks owner write" on chunks for insert with check (
  exists (select 1 from papers p where p.id = chunks.paper_id and p.owner = auth.uid())
);
create policy "refs owner full" on references_library for all using (owner = auth.uid()) with check (owner = auth.uid());
create policy "notes owner full" on notes for all using (owner = auth.uid()) with check (owner = auth.uid());
create policy "note_cites owner" on note_citations for all using (
  exists (select 1 from notes n where n.id = note_citations.note_id and n.owner = auth.uid())
) with check (
  exists (select 1 from notes n where n.id = note_citations.note_id and n.owner = auth.uid())
);
create policy "media owner full" on media for all using (owner = auth.uid()) with check (owner = auth.uid());

-- Function for matching chunks
create or replace function match_chunks(
  query_embedding vector(1536),
  paper_ids uuid[] default null,
  match_count int default 12
) returns table (
  id bigint,
  paper_id uuid,
  content text,
  similarity float
) language plpgsql as $$
begin
  return query
  select c.id, c.paper_id, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where (paper_ids is null or c.paper_id = any(paper_ids))
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
