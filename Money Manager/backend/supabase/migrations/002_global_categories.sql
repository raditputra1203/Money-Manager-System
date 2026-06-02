-- AOL Money Manager — jadikan categories global (bukan per-user)
-- Jalankan di Supabase SQL Editor setelah 001_initial_schema.sql

-- Hapus semua data kategori per-user (akan diganti dengan global + custom)
delete from public.categories where user_id is not null;

-- Hapus RLS policy lama
drop policy if exists "categories_own" on public.categories;

-- Hapus primary key lama (user_id, id)
alter table public.categories drop constraint if exists categories_pkey;

-- Update baris yang masih ada: set user_id = null (jadikan global)
update public.categories set user_id = null;

-- Jadikan user_id nullable (null = global, not null = custom milik user)
alter table public.categories alter column user_id drop not null;

-- Primary key baru: id saja
alter table public.categories add primary key (id);

-- Isi/update kategori global default (10 baris)
insert into public.categories (id, name, icon, kind) values
  ('c1', 'Food & Dining', '🍽️', 'expense'),
  ('c2', 'Transportation', '🚗', 'expense'),
  ('c3', 'Shopping', '🛍️', 'expense'),
  ('c4', 'Entertainment', '🍿', 'expense'),
  ('c5', 'Bills & Utilities', '📄', 'expense'),
  ('c6', 'Health', '💊', 'expense'),
  ('i1', 'Salary', '💼', 'income'),
  ('i2', 'Bonus', '🎁', 'income'),
  ('i3', 'Investment', '📈', 'income'),
  ('i4', 'Part-time', '💻', 'income')
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  kind = excluded.kind;

-- RLS baru: semua user bisa baca (global), hanya pemilik bisa tulis
create policy "categories_read" on public.categories for select using (true);
create policy "categories_insert" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete" on public.categories for delete using (auth.uid() = user_id);
