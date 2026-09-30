create table public.map_pins (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  lat double precision not null,
  lng double precision not null,
  title text not null,
  description text,
  icon_emoji text default '📍' not null,
  visited_date date,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.map_pins enable row level security;

-- Políticas de RLS
create policy "Users can view their couple's map pins"
  on public.map_pins for select
  using (
    exists (
      select 1 from public.couples
      where id = map_pins.couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

create policy "Users can insert map pins for their couple"
  on public.map_pins for insert
  with check (
    exists (
      select 1 from public.couples
      where id = couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
    and created_by = auth.uid()
  );

create policy "Users can update their couple's map pins"
  on public.map_pins for update
  using (
    exists (
      select 1 from public.couples
      where id = map_pins.couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

create policy "Users can delete their couple's map pins"
  on public.map_pins for delete
  using (
    exists (
      select 1 from public.couples
      where id = map_pins.couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );
