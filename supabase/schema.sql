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

-- 내 여행 일정 (AI 비서가 만든 시간표 저장)
create table if not exists trips (
  id bigint generated always as identity primary key,
  nickname text not null,
  title text not null,
  question text,
  content text not null,
  tools text[] default '{}',
  created_at timestamptz default now()
);
alter table trips enable row level security;
create policy "trips read"   on trips for select using (true);
create policy "trips insert" on trips for insert with check (true);
create policy "trips delete" on trips for delete using (true);

-- 탐험하기: 스탬프 기록 (같은 장소는 한 번만)
create table if not exists stamps (
  id bigint generated always as identity primary key,
  nickname text not null,
  spot_id text not null,
  kind text not null,          -- oreum | sea | history | food
  name text not null,
  created_at timestamptz default now(),
  unique (nickname, spot_id)
);
alter table stamps enable row level security;
create policy "stamps read"   on stamps for select using (true);
create policy "stamps insert" on stamps for insert with check (true);
create policy "stamps update" on stamps for update using (true);
create policy "stamps delete" on stamps for delete using (true);
-- 탐험 코스는 trips 테이블을 그대로 쓴다 (tools 에 'explorer-course' 가 들어간 행 = 탐험가들이 만든 코스)
