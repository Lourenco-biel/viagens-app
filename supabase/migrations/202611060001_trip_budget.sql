alter table public.trips
  add column budget_per_person numeric,
  add constraint trips_budget_per_person_check check (
    budget_per_person is null or (
      budget_per_person not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)
      and budget_per_person >= 0
      and scale(budget_per_person) <= 2
    )
  );
