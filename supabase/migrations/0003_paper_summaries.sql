-- Paper summaries table for caching AI-generated summaries
create table if not exists paper_summaries (
  id uuid primary key default gen_random_uuid(),
  paper_id text not null, -- Using text to match the paper ID format (e.g., "arxiv:2401.12345")
  title text not null,
  abstract text not null,
  summary text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(paper_id)
);

-- Enable Row Level Security
alter table paper_summaries enable row level security;

-- RLS Policies - allow all authenticated users to read/write summaries
-- This is because summaries are shared across users for the same papers
create policy "paper_summaries read" on paper_summaries for select using (auth.role() = 'authenticated');
create policy "paper_summaries insert" on paper_summaries for insert with check (auth.role() = 'authenticated');
create policy "paper_summaries update" on paper_summaries for update using (auth.role() = 'authenticated');

-- Index for performance
create index if not exists paper_summaries_paper_id_idx on paper_summaries(paper_id);
create index if not exists paper_summaries_created_at_idx on paper_summaries(created_at desc);
