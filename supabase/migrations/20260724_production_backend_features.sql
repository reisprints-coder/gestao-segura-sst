-- Recursos adicionados ao ambiente de produção em 24/07/2026.
-- O projeto remoto já recebeu esta migração.

create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  company text not null default 'BR Soluções',
  unit text not null default 'Porto do Açu — LMP',
  monthly_budget numeric(14,2) not null default 50000,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.dds_sessions
  add column if not exists participant_count integer not null default 0
  check (participant_count >= 0);

alter table public.app_settings enable row level security;

drop policy if exists app_settings_read on public.app_settings;
drop policy if exists app_settings_manage on public.app_settings;
create policy app_settings_read on public.app_settings
  for select to authenticated using (true);
create policy app_settings_manage on public.app_settings
  for all to authenticated
  using (public.has_role(array['admin','manager']::public.app_role[]))
  with check (public.has_role(array['admin','manager']::public.app_role[]));

insert into public.app_settings(id, company, unit, monthly_budget)
values (1, 'BR Soluções', 'Porto do Açu — LMP', 50000)
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  if not exists (select 1 from public.profiles) then
    v_role := 'admin';
  else
    v_role := 'employee';
  end if;

  insert into public.profiles(id, full_name, role, must_change_password)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role,
    false
  )
  on conflict(id) do nothing;

  return new;
end;
$$;

create or replace function public.register_epi_delivery(
  p_epi_id uuid,
  p_employee_id uuid,
  p_quantity numeric,
  p_reason text,
  p_movement_date date,
  p_signed boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.epi_batches%rowtype;
  v_movement_id uuid;
begin
  if not public.has_role(array['admin','manager','warehouse']::public.app_role[]) then
    raise exception 'Sem permissão';
  end if;
  if p_quantity <= 0 then raise exception 'Quantidade inválida'; end if;

  select * into v_batch
  from public.epi_batches
  where epi_id = p_epi_id and current_quantity >= p_quantity
  order by expires_at nulls last, received_at
  for update
  limit 1;

  if v_batch.id is null then raise exception 'Estoque insuficiente'; end if;

  update public.epi_batches
  set current_quantity = current_quantity - p_quantity
  where id = v_batch.id;

  insert into public.epi_movements(
    epi_id, batch_id, employee_id, movement_type, quantity,
    reason, movement_at, signed_at, created_by
  ) values (
    p_epi_id, v_batch.id, p_employee_id, 'delivery', p_quantity,
    p_reason, p_movement_date::timestamptz,
    case when p_signed then now() else null end,
    auth.uid()
  ) returning id into v_movement_id;

  return v_movement_id;
end;
$$;

revoke execute on function public.register_epi_delivery(uuid,uuid,numeric,text,date,boolean) from public, anon;
grant execute on function public.register_epi_delivery(uuid,uuid,numeric,text,date,boolean) to authenticated;
