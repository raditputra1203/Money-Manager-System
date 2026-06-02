-- AOL Money Manager — jalankan di Supabase SQL Editor atau via CLI
-- Auth users live in auth.users; app data is scoped by user_id

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  premium boolean not null default false,
  settings jsonb not null default '{"notifications":true,"compactNumbers":false}'::jsonb,
  default_book_id uuid,
  created_at timestamptz not null default now()
);

-- Books
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  subtitle text default '',
  variant text not null default 'purple',
  balance numeric not null default 0,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_default_book_fkey
  foreign key (default_book_id) references public.books (id) on delete set null;

-- Accounts
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  balance numeric not null default 0,
  kind text not null default 'asset',
  status text not null default 'active',
  account_source text not null default 'debit',
  goal_amount numeric,
  is_used boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Categories (per user; default ids c1–c6, i1–i4)
create table if not exists public.categories (
  id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  icon text not null default '📁',
  kind text not null check (kind in ('expense', 'income')),
  primary key (user_id, id)
);

-- Ledger transactions (income / expense)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  category_id text not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  note text default '',
  created_at timestamptz not null default now()
);

-- Transfer / top-up (non-ledger)
create table if not exists public.account_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('transfer', 'topup')),
  from_account_id uuid references public.accounts (id) on delete restrict,
  to_account_id uuid references public.accounts (id) on delete restrict,
  account_id uuid references public.accounts (id) on delete restrict,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null,
  name text not null,
  icon text not null default '📊',
  amount numeric not null default 0,
  period text not null default 'monthly',
  start_date date not null default current_date,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.account_movements enable row level security;
alter table public.budget_plans enable row level security;
alter table public.feedbacks enable row level security;
alter table public.ratings enable row level security;

create policy "profiles_own" on public.profiles for all using (auth.uid() = id);
create policy "books_own" on public.books for all using (auth.uid() = user_id);
create policy "accounts_own" on public.accounts for all using (auth.uid() = user_id);
create policy "categories_own" on public.categories for all using (auth.uid() = user_id);
create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id);
create policy "movements_own" on public.account_movements for all using (auth.uid() = user_id);
create policy "budget_plans_own" on public.budget_plans for all using (auth.uid() = user_id);
create policy "feedbacks_own" on public.feedbacks for all using (auth.uid() = user_id);
create policy "ratings_own" on public.ratings for all using (auth.uid() = user_id);
