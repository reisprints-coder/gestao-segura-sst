create or replace function public.register_epi_inventory_entry(
  p_epi_id uuid,
  p_quantity numeric,
  p_received_at date,
  p_batch_number text default null,
  p_supplier text default null,
  p_invoice_number text default null,
  p_unit_cost numeric default 0,
  p_notes text default null
)
returns table(batch_id uuid, movement_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
  v_movement_id uuid;
  v_batch_number text;
  v_reason text;
begin
  if (select auth.uid()) is null then
    raise exception 'Usuário não autenticado';
  end if;

  if not public.has_role(array['admin','manager','warehouse']::public.app_role[]) then
    raise exception 'Sem permissão para registrar entrada de EPI';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  if p_received_at is null then
    raise exception 'Data de recebimento obrigatória';
  end if;

  if p_unit_cost is null or p_unit_cost < 0 then
    raise exception 'Custo unitário inválido';
  end if;

  if not exists (
    select 1
    from public.epi_catalog
    where id = p_epi_id and status <> 'archived'
  ) then
    raise exception 'EPI não encontrado ou arquivado';
  end if;

  v_batch_number := coalesce(
    nullif(trim(p_batch_number), ''),
    'ENT-' || to_char(p_received_at, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8))
  );

  insert into public.epi_batches (
    epi_id,
    batch_number,
    supplier,
    invoice_number,
    received_at,
    initial_quantity,
    current_quantity,
    unit_cost,
    created_by
  ) values (
    p_epi_id,
    v_batch_number,
    nullif(trim(p_supplier), ''),
    nullif(trim(p_invoice_number), ''),
    p_received_at,
    p_quantity,
    p_quantity,
    p_unit_cost,
    (select auth.uid())
  ) returning id into v_batch_id;

  v_reason := concat_ws(
    ' • ',
    'Lote ' || v_batch_number,
    case when nullif(trim(p_invoice_number), '') is not null then 'Documento ' || trim(p_invoice_number) end,
    nullif(trim(p_notes), '')
  );

  insert into public.epi_movements (
    epi_id,
    batch_id,
    movement_type,
    quantity,
    reason,
    movement_at,
    created_by
  ) values (
    p_epi_id,
    v_batch_id,
    'entry',
    p_quantity,
    v_reason,
    p_received_at::timestamptz,
    (select auth.uid())
  ) returning id into v_movement_id;

  update public.epi_catalog
  set unit_cost = p_unit_cost,
      updated_by = (select auth.uid())
  where id = p_epi_id;

  insert into public.audit_logs(user_id, action, entity_type, entity_id, new_data)
  values(
    (select auth.uid()),
    'Entrada de EPI registrada',
    'epi_movement',
    v_movement_id,
    jsonb_build_object(
      'epi_id', p_epi_id,
      'batch_id', v_batch_id,
      'batch_number', v_batch_number,
      'quantity', p_quantity,
      'unit_cost', p_unit_cost
    )
  );

  return query select v_batch_id, v_movement_id;
end;
$$;

revoke execute on function public.register_epi_inventory_entry(uuid,numeric,date,text,text,text,numeric,text) from public, anon;
grant execute on function public.register_epi_inventory_entry(uuid,numeric,date,text,text,text,numeric,text) to authenticated;

