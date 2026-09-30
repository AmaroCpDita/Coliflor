create table public.bucket_list_items (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  title text not null,
  category text not null,
  is_completed boolean default false not null,
  completed_at timestamp with time zone,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.bucket_list_items enable row level security;

-- Políticas de RLS
create policy "Users can view their couple's bucket list items"
  on public.bucket_list_items for select
  using (
    exists (
      select 1 from public.couples
      where id = bucket_list_items.couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

create policy "Users can insert bucket list items for their couple"
  on public.bucket_list_items for insert
  with check (
    exists (
      select 1 from public.couples
      where id = couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
    and created_by = auth.uid()
  );

create policy "Users can update their couple's bucket list items"
  on public.bucket_list_items for update
  using (
    exists (
      select 1 from public.couples
      where id = bucket_list_items.couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

create policy "Users can delete their couple's bucket list items"
  on public.bucket_list_items for delete
  using (
    exists (
      select 1 from public.couples
      where id = bucket_list_items.couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );
