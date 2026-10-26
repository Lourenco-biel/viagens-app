create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null check (char_length(btrim(name)) between 3 and 80),
  destination text not null check (char_length(btrim(destination)) between 2 and 120),
  search_text text generated always as (
    translate(lower(name || ' ' || destination), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
  ) stored,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  created_at timestamptz not null default now()
);

create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  day date not null,
  start_time time,
  location text not null default '' check (char_length(location) <= 200),
  estimated_cost numeric(12,2) not null default 0 check (estimated_cost between 0 and 1000000),
  status text not null default 'proposed' check (status in ('proposed', 'confirmed')),
  created_at timestamptz not null default now()
);

create table public.activity_votes (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (activity_id, user_id)
);

create table public.trip_invites (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create index trip_members_user_idx on public.trip_members(user_id);
create index trips_owner_idx on public.trips(owner_id);
create index activities_trip_day_idx on public.activities(trip_id, day, start_time);
create index activity_votes_user_idx on public.activity_votes(user_id);

create function public.is_trip_member(target_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trip_members where trip_id = target_trip and user_id = (select auth.uid())
  );
$$;

create function public.is_trip_owner(target_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips where id = target_trip and owner_id = (select auth.uid())
  );
$$;

revoke all on function public.is_trip_member(uuid), public.is_trip_owner(uuid) from public;
grant execute on function public.is_trip_member(uuid), public.is_trip_owner(uuid) to authenticated;

create function public.add_trip_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.trip_members(trip_id, user_id, display_name)
  select new.id, new.owner_id,
    left(coalesce(nullif(raw_user_meta_data->>'name', ''), 'Viajante'), 80)
  from auth.users where id = new.owner_id;
  return new;
end;
$$;

create trigger trip_owner_member after insert on public.trips
for each row execute function public.add_trip_owner();

create function public.validate_activity_period()
returns trigger language plpgsql security definer set search_path = '' as $$
declare trip_start date; trip_end date;
begin
  if not public.is_trip_member(new.trip_id) then
    raise exception 'Sem acesso à viagem.' using errcode = '42501';
  end if;
  select start_date, end_date into trip_start, trip_end from public.trips
  where id = new.trip_id for share;
  if trip_start is null or new.day not between trip_start and trip_end then
    raise exception 'O passeio deve estar dentro do período da viagem.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger activity_period before insert or update on public.activities
for each row execute function public.validate_activity_period();

create function public.validate_trip_period()
returns trigger language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.activities where trip_id = new.id
    and day not between new.start_date and new.end_date) then
    raise exception 'Ajuste os passeios antes de reduzir o período da viagem.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trip_period before update on public.trips
for each row execute function public.validate_trip_period();

create function public.accept_trip_invite(invite_token uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_trip uuid; actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Entre na sua conta para aceitar o convite.' using errcode = '42501';
  end if;
  select trip_id into target_trip from public.trip_invites
  where token = invite_token and expires_at > now() for share;
  if target_trip is null then
    raise exception 'Convite inválido ou expirado.' using errcode = '22023';
  end if;
  insert into public.trip_members(trip_id, user_id, display_name)
  select target_trip, actor,
    left(coalesce(nullif(raw_user_meta_data->>'name', ''), 'Viajante'), 80)
  from auth.users where id = actor
  on conflict (trip_id, user_id) do nothing;
  return target_trip;
end;
$$;

revoke all on function public.accept_trip_invite(uuid) from public;
grant execute on function public.accept_trip_invite(uuid) to authenticated;
revoke all on function public.add_trip_owner(), public.validate_activity_period(), public.validate_trip_period() from public;

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.activities enable row level security;
alter table public.activity_votes enable row level security;
alter table public.trip_invites enable row level security;

grant select, insert, update, delete on public.trips, public.activities, public.trip_invites to authenticated;
grant select, delete on public.trip_members to authenticated;
grant select, insert, delete on public.activity_votes to authenticated;
revoke all on public.trips, public.trip_members, public.activities, public.activity_votes, public.trip_invites from anon;

create policy trips_read on public.trips for select to authenticated
using (owner_id = (select auth.uid()) or public.is_trip_member(id));
create policy trips_create on public.trips for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy trips_edit on public.trips for update to authenticated
using (public.is_trip_owner(id)) with check (owner_id = (select auth.uid()));
create policy trips_delete on public.trips for delete to authenticated
using (public.is_trip_owner(id));

create policy members_read on public.trip_members for select to authenticated
using (public.is_trip_member(trip_id));
create policy members_remove on public.trip_members for delete to authenticated
using ((public.is_trip_owner(trip_id) or user_id = (select auth.uid()))
  and user_id <> (select owner_id from public.trips where id = trip_id));

create policy activities_read on public.activities for select to authenticated
using (public.is_trip_member(trip_id));
create policy activities_create on public.activities for insert to authenticated
with check (public.is_trip_member(trip_id) and created_by = (select auth.uid())
  and (status = 'proposed' or public.is_trip_owner(trip_id)));
create policy activities_edit on public.activities for update to authenticated
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));
create policy activities_delete on public.activities for delete to authenticated
using (public.is_trip_owner(trip_id) or
  (public.is_trip_member(trip_id) and created_by = (select auth.uid()) and status = 'proposed'));

create policy votes_read on public.activity_votes for select to authenticated
using (exists (select 1 from public.activities a where a.id = activity_id and public.is_trip_member(a.trip_id)));
create policy votes_create on public.activity_votes for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.activities a where a.id = activity_id and a.status = 'proposed'
  and public.is_trip_member(a.trip_id)));
create policy votes_remove on public.activity_votes for delete to authenticated
using (user_id = (select auth.uid()) and exists (
  select 1 from public.activities a where a.id = activity_id and a.status = 'proposed'
  and public.is_trip_member(a.trip_id)));

create policy invites_manage on public.trip_invites for all to authenticated
using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));

create function public.remove_departed_votes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.activity_votes v using public.activities a
  where v.activity_id = a.id and a.trip_id = old.trip_id and v.user_id = old.user_id;
  return old;
end;
$$;
revoke all on function public.remove_departed_votes() from public;
create trigger departed_votes after delete on public.trip_members
for each row execute function public.remove_departed_votes();

