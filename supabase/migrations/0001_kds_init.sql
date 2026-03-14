create type public.order_status as enum (
  'pending',
  'running',
  'completed',
  'failed',
  'canceled'
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  external_order_id bigint not null unique,
  client_id bigint not null,
  tray_number integer not null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_commands (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  command_external_id bigint not null,
  command_code text not null,
  command_level numeric not null default 0,
  bot_completed boolean not null default false,
  bot_failed boolean not null default false,
  bot_disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, command_external_id)
);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id bigint references public.orders(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_tray_number on public.orders(tray_number);
create index if not exists idx_order_commands_order_id on public.order_commands(order_id);
