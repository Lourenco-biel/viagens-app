alter table public.activities add column version integer not null default 1 check (version > 0);

revoke update on public.activities from authenticated;
grant update (status) on public.activities to authenticated;
revoke insert on public.activities from authenticated;
grant insert (trip_id, created_by, title, day, start_time, location, estimated_cost, status)
  on public.activities to authenticated;

create function public.guard_activity_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare changed boolean;
begin
  if row(new.id, new.trip_id, new.created_by, new.created_at)
    is distinct from row(old.id, old.trip_id, old.created_by, old.created_at) then
    raise exception 'Os dados de autoria do passeio não podem ser alterados.' using errcode = '42501';
  end if;
  new.title := btrim(new.title);
  new.location := btrim(new.location);
  changed := row(new.title, new.day, new.start_time, new.location, new.estimated_cost)
    is distinct from row(old.title, old.day, old.start_time, old.location, old.estimated_cost);
  if changed then
    new.status := 'proposed';
    delete from public.activity_votes where activity_id = old.id;
  end if;
  new.version := old.version + case when changed or new.status <> old.status then 1 else 0 end;
  return new;
end;
$$;

create trigger activity_update_guard before update on public.activities
for each row execute function public.guard_activity_update();
revoke all on function public.guard_activity_update() from public;

create function public.update_activity(
  target_activity uuid, expected_version integer, new_title text, new_day date,
  new_start_time time, new_location text, new_estimated_cost numeric
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  activity public.activities;
  target_trip uuid;
  trip_owner uuid;
  actor uuid := auth.uid();
begin
  select trip_id into target_trip from public.activities where id = target_activity;
  if actor is null or target_trip is null or not public.is_trip_member(target_trip) then
    raise exception 'Passeio não encontrado ou sem acesso.' using errcode = 'P0002';
  end if;
  select owner_id into trip_owner from public.trips where id = target_trip for share;
  perform 1 from public.trip_members where trip_id = target_trip and user_id = actor for share;
  if not found then
    raise exception 'Passeio não encontrado ou sem acesso.' using errcode = 'P0002';
  end if;
  select * into activity from public.activities where id = target_activity for update;
  if not found then
    raise exception 'Passeio não encontrado ou sem acesso.' using errcode = 'P0002';
  end if;
  if trip_owner <> actor and activity.created_by <> actor then
    raise exception 'Você não pode editar este passeio.' using errcode = '42501';
  end if;
  if expected_version is null or expected_version < 1 then
    raise exception 'Versão inválida.' using errcode = '22023';
  end if;
  if activity.version <> expected_version then
    raise exception 'Este passeio mudou. Carregue a versão atual antes de salvar.' using errcode = '40001';
  end if;
  if trip_owner <> actor and activity.status <> 'proposed' then
    raise exception 'Somente o organizador pode editar um passeio confirmado.' using errcode = '42501';
  end if;
  if new_estimated_cost is null or new_estimated_cost <> round(new_estimated_cost, 2) then
    raise exception 'Informe um custo com até duas casas decimais.' using errcode = '22023';
  end if;
  if new_start_time is not null and (
    new_start_time >= time '24:00' or extract(second from new_start_time) <> 0
  ) then
    raise exception 'Informe um horário válido.' using errcode = '22023';
  end if;
  update public.activities set
    title = new_title, day = new_day, start_time = new_start_time,
    location = new_location, estimated_cost = new_estimated_cost
  where id = target_activity;
  return target_trip;
end;
$$;

revoke all on function public.update_activity(uuid, integer, text, date, time, text, numeric) from public;
grant execute on function public.update_activity(uuid, integer, text, date, time, text, numeric) to authenticated;

create function public.lock_activity_vote()
returns trigger language plpgsql security definer set search_path = '' as $$
declare activity public.activities;
begin
  select * into activity from public.activities where id = new.activity_id for share;
  if not found or new.user_id <> auth.uid() or auth.uid() is null
    or not public.is_trip_member(activity.trip_id) or activity.status <> 'proposed' then
    raise exception 'Não é possível votar neste passeio.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger activity_vote_lock before insert on public.activity_votes
for each row execute function public.lock_activity_vote();
revoke all on function public.lock_activity_vote() from public;
