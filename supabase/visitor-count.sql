-- Run once in your existing Supabase project's SQL Editor.
-- Re-running this script preserves existing visitors and the total.
begin;

create table if not exists public.portfolio_visitors (
  visitor_id uuid primary key
);

create table if not exists public.portfolio_visitor_totals (
  singleton boolean primary key default true check (singleton),
  total bigint not null default 0 check (total >= 0)
);

insert into public.portfolio_visitor_totals (singleton, total)
select true, count(*) from public.portfolio_visitors
on conflict (singleton) do nothing;

alter table public.portfolio_visitors enable row level security;
alter table public.portfolio_visitor_totals enable row level security;
revoke all on public.portfolio_visitors, public.portfolio_visitor_totals from public, anon, authenticated;
grant select, insert on public.portfolio_visitors to service_role;
grant select, update on public.portfolio_visitor_totals to service_role;

create or replace function public.portfolio_visitor_count(p_visitor_id uuid default null)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
  visitor_total bigint;
begin
  if p_visitor_id is not null then
    insert into public.portfolio_visitors (visitor_id)
    values (p_visitor_id)
    on conflict (visitor_id) do nothing;
    get diagnostics inserted_count = row_count;

    if inserted_count = 1 then
      update public.portfolio_visitor_totals
      set total = total + 1
      where singleton = true
      returning total into visitor_total;
      return visitor_total;
    end if;
  end if;

  select total into visitor_total
  from public.portfolio_visitor_totals where singleton = true;
  return visitor_total;
end;
$$;

revoke all on function public.portfolio_visitor_count(uuid) from public, anon, authenticated;
grant execute on function public.portfolio_visitor_count(uuid) to service_role;

commit;
