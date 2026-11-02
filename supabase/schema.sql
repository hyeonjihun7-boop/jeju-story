-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run (실습용: 누구나 읽기·쓰기)
create table if not exists favorites (
  id bigint generated always as identity primary key,
  nickname text not null,
  kind text not null,          -- oreum | olle | indoor | festival | brand | news
  item_id text not null,
  title text not null,
  note text,
  created_at timestamptz default now()
);
create table if not exists chat_logs (
  id bigint generated always as identity primary key,
  nickname text not null,
  question text not null,
  answer text not null,
  tools text[] default '{}',
  created_at timestamptz default now()
);
alter table favorites enable row level security;
alter table chat_logs enable row level security;
create policy "favorites read"   on favorites for select using (true);
create policy "favorites insert" on favorites for insert with check (true);
create policy "favorites delete" on favorites for delete using (true);
create policy "chat read"   on chat_logs for select using (true);
create policy "chat insert" on chat_logs for insert with check (true);
