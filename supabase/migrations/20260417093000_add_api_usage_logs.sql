create table if not exists public.api_usage_logs (
  id bigserial primary key,
  provider text not null,
  operation text not null,
  model text,
  request_count integer not null default 1,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  usage_units integer,
  usage_unit_label text,
  success boolean not null default true,
  status_code integer,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists api_usage_logs_created_at_idx on public.api_usage_logs (created_at desc);
create index if not exists api_usage_logs_provider_idx on public.api_usage_logs (provider, created_at desc);

alter table public.api_usage_logs enable row level security;
