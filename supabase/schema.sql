-- Gestão Segura SST — esquema inicial
-- PostgreSQL / Supabase

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin','manager','warehouse','maintenance','employee','viewer');
create type public.employee_status as enum ('active','vacation','leave','terminated');
create type public.expense_status as enum ('planned','requested','pending_approval','approved','paid','cancelled');
create type public.forklift_status as enum ('available','operating','stopped','scheduled_maintenance','corrective_maintenance','interdicted','retired');
create type public.record_status as enum ('active','inactive','archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  registration text,
  role public.app_role not null default 'employee',
  company text,
  department text,
  unit text,
  phone text,
  avatar_url text,
  must_change_password boolean not null default true,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  registration text not null unique,
  cpf_encrypted text,
  job_title text not null,
  department text not null,
  company text not null,
  unit text,
  leader_id uuid references public.employees(id) on delete set null,
  admission_date date,
  work_schedule text,
  phone text,
  email text,
  photo_url text,
  status public.employee_status not null default 'active',
  notes text,
  archived_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.epi_catalog (
  id uuid primary key default gen_random_uuid(),
  internal_code text not null unique,
  description text not null,
  category text not null,
  manufacturer text,
  ca_number text not null,
  ca_expiry date,
  size text,
  unit text not null default 'un',
  minimum_stock numeric(12,3) not null default 0,
  unit_cost numeric(14,2) not null default 0,
  storage_location text,
  replacement_days integer,
  photo_url text,
  status public.record_status not null default 'active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.epi_batches (
  id uuid primary key default gen_random_uuid(),
  epi_id uuid not null references public.epi_catalog(id) on delete restrict,
  batch_number text not null,
  supplier text,
  invoice_number text,
  received_at date not null default current_date,
  expires_at date,
  initial_quantity numeric(12,3) not null check (initial_quantity >= 0),
  current_quantity numeric(12,3) not null check (current_quantity >= 0),
  unit_cost numeric(14,2),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(epi_id, batch_number)
);

create table public.epi_movements (
  id uuid primary key default gen_random_uuid(),
  epi_id uuid not null references public.epi_catalog(id) on delete restrict,
  batch_id uuid references public.epi_batches(id) on delete restrict,
  employee_id uuid references public.employees(id) on delete restrict,
  movement_type text not null check (movement_type in ('entry','delivery','return','exchange','loss','damage','disposal','adjustment')),
  quantity numeric(12,3) not null check (quantity > 0),
  reason text,
  movement_at timestamptz not null default now(),
  expected_replacement_date date,
  signed_at timestamptz,
  signature_data text,
  term_file_path text,
  approved_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.training_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  training_type text,
  workload_hours numeric(8,2),
  validity_months integer,
  institution text,
  description text,
  mandatory_jobs text[] not null default '{}',
  mandatory_departments text[] not null default '{}',
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_trainings (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  training_id uuid not null references public.training_catalog(id) on delete restrict,
  completed_at date,
  expires_at date,
  grade numeric(6,2),
  institution text,
  certificate_path text,
  notes text,
  status text generated always as (
    case
      when expires_at is null then 'pending'
      when expires_at < current_date then 'expired'
      when expires_at <= current_date + 30 then 'expires_30'
      when expires_at <= current_date + 60 then 'expires_60'
      when expires_at <= current_date + 90 then 'expires_90'
      else 'valid'
    end
  ) stored,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, training_id, completed_at)
);

create table public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  department text,
  monthly_budget numeric(14,2) not null default 0,
  annual_budget numeric(14,2) not null default 0,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status public.record_status not null default 'active'
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  competence date,
  description text not null,
  category_id uuid references public.expense_categories(id),
  cost_center_id uuid references public.cost_centers(id),
  department text,
  supplier text,
  document_number text,
  amount numeric(14,2) not null check (amount >= 0),
  payment_method text,
  project_activity text,
  status public.expense_status not null default 'requested',
  attachment_path text,
  notes text,
  is_recurring boolean not null default false,
  requested_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forklifts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  asset_number text unique,
  manufacturer text,
  model text,
  serial_number text,
  capacity_tons numeric(8,2),
  energy_type text,
  manufacture_year integer,
  hour_meter numeric(12,1) not null default 0,
  location text,
  responsible_employee_id uuid references public.employees(id),
  photo_url text,
  status public.forklift_status not null default 'available',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  forklift_id uuid not null references public.forklifts(id) on delete cascade,
  name text not null,
  interval_days integer,
  interval_hours numeric(12,1),
  next_due_date date,
  next_due_hour numeric(12,1),
  checklist jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.maintenance_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  forklift_id uuid not null references public.forklifts(id) on delete restrict,
  maintenance_type text not null check (maintenance_type in ('preventive','corrective','inspection')),
  priority text not null check (priority in ('low','medium','high','critical')),
  failure_description text not null,
  diagnosis text,
  service_description text,
  parts jsonb not null default '[]'::jsonb,
  labor_cost numeric(14,2) not null default 0,
  parts_cost numeric(14,2) not null default 0,
  supplier text,
  opened_at timestamptz not null default now(),
  expected_at timestamptz,
  completed_at timestamptz,
  downtime_hours numeric(12,2),
  status text not null default 'open',
  attachment_path text,
  opened_by uuid references auth.users(id),
  responsible_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forklift_checklists (
  id uuid primary key default gen_random_uuid(),
  forklift_id uuid not null references public.forklifts(id) on delete restrict,
  inspection_date date not null default current_date,
  shift text not null,
  hour_meter numeric(12,1),
  items jsonb not null,
  has_critical_failure boolean not null default false,
  notes text,
  inspected_by uuid not null references auth.users(id),
  released_by uuid references auth.users(id),
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.dds_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text,
  related_risk text,
  material_path text,
  status public.record_status not null default 'active'
);

create table public.dds_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  session_time time not null,
  topic_id uuid references public.dds_topics(id),
  custom_topic text,
  description text,
  department text,
  unit text,
  responsible_id uuid references public.employees(id),
  duration_minutes integer,
  related_risk text,
  material_path text,
  photo_paths text[] not null default '{}',
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dds_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.dds_sessions(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  attendance_status text not null default 'present' check (attendance_status in ('present','absent','justified')),
  signed_at timestamptz,
  signature_data text,
  justification text,
  unique(session_id, employee_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index employees_status_idx on public.employees(status);
create index employees_department_idx on public.employees(department);
create index epi_batches_epi_idx on public.epi_batches(epi_id);
create index epi_movements_employee_idx on public.epi_movements(employee_id);
create index employee_trainings_expiry_idx on public.employee_trainings(expires_at);
create index expenses_date_idx on public.expenses(expense_date);
create index expenses_status_idx on public.expenses(status);
create index forklifts_status_idx on public.forklifts(status);
create index maintenance_orders_forklift_idx on public.maintenance_orders(forklift_id);
create index dds_sessions_date_idx on public.dds_sessions(session_date);

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger employees_touch before update on public.employees for each row execute function public.touch_updated_at();
create trigger epi_catalog_touch before update on public.epi_catalog for each row execute function public.touch_updated_at();
create trigger training_catalog_touch before update on public.training_catalog for each row execute function public.touch_updated_at();
create trigger employee_trainings_touch before update on public.employee_trainings for each row execute function public.touch_updated_at();
create trigger expenses_touch before update on public.expenses for each row execute function public.touch_updated_at();
create trigger forklifts_touch before update on public.forklifts for each row execute function public.touch_updated_at();
create trigger maintenance_orders_touch before update on public.maintenance_orders for each row execute function public.touch_updated_at();
create trigger dds_sessions_touch before update on public.dds_sessions for each row execute function public.touch_updated_at();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.has_role(allowed public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = any(allowed), false);
$$;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.epi_catalog enable row level security;
alter table public.epi_batches enable row level security;
alter table public.epi_movements enable row level security;
alter table public.training_catalog enable row level security;
alter table public.employee_trainings enable row level security;
alter table public.cost_centers enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.forklifts enable row level security;
alter table public.maintenance_plans enable row level security;
alter table public.maintenance_orders enable row level security;
alter table public.forklift_checklists enable row level security;
alter table public.dds_topics enable row level security;
alter table public.dds_sessions enable row level security;
alter table public.dds_participants enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(array['admin','manager']::public.app_role[]));
create policy profiles_admin_manage on public.profiles for all to authenticated using (public.has_role(array['admin']::public.app_role[])) with check (public.has_role(array['admin']::public.app_role[]));

create policy employees_authenticated_read on public.employees for select to authenticated using (true);
create policy employees_manage on public.employees for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));

create policy epi_read on public.epi_catalog for select to authenticated using (true);
create policy epi_manage on public.epi_catalog for all to authenticated using (public.has_role(array['admin','manager','warehouse']::public.app_role[])) with check (public.has_role(array['admin','manager','warehouse']::public.app_role[]));
create policy epi_batches_read on public.epi_batches for select to authenticated using (true);
create policy epi_batches_manage on public.epi_batches for all to authenticated using (public.has_role(array['admin','manager','warehouse']::public.app_role[])) with check (public.has_role(array['admin','manager','warehouse']::public.app_role[]));
create policy epi_movements_read on public.epi_movements for select to authenticated using (true);
create policy epi_movements_manage on public.epi_movements for all to authenticated using (public.has_role(array['admin','manager','warehouse']::public.app_role[])) with check (public.has_role(array['admin','manager','warehouse']::public.app_role[]));

create policy training_catalog_read on public.training_catalog for select to authenticated using (true);
create policy training_catalog_manage on public.training_catalog for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));
create policy employee_trainings_read on public.employee_trainings for select to authenticated using (true);
create policy employee_trainings_manage on public.employee_trainings for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));

create policy finance_read on public.expenses for select to authenticated using (public.has_role(array['admin','manager','viewer']::public.app_role[]));
create policy finance_manage on public.expenses for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));
create policy cost_centers_read on public.cost_centers for select to authenticated using (true);
create policy cost_centers_manage on public.cost_centers for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));
create policy expense_categories_read on public.expense_categories for select to authenticated using (true);
create policy expense_categories_manage on public.expense_categories for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));

create policy forklifts_read on public.forklifts for select to authenticated using (true);
create policy forklifts_manage on public.forklifts for all to authenticated using (public.has_role(array['admin','manager','maintenance']::public.app_role[])) with check (public.has_role(array['admin','manager','maintenance']::public.app_role[]));
create policy maintenance_plans_read on public.maintenance_plans for select to authenticated using (true);
create policy maintenance_plans_manage on public.maintenance_plans for all to authenticated using (public.has_role(array['admin','manager','maintenance']::public.app_role[])) with check (public.has_role(array['admin','manager','maintenance']::public.app_role[]));
create policy maintenance_orders_read on public.maintenance_orders for select to authenticated using (true);
create policy maintenance_orders_manage on public.maintenance_orders for all to authenticated using (public.has_role(array['admin','manager','maintenance']::public.app_role[])) with check (public.has_role(array['admin','manager','maintenance']::public.app_role[]));
create policy forklift_checklists_read on public.forklift_checklists for select to authenticated using (true);
create policy forklift_checklists_insert on public.forklift_checklists for insert to authenticated with check (true);
create policy forklift_checklists_update on public.forklift_checklists for update to authenticated using (public.has_role(array['admin','manager','maintenance']::public.app_role[])) with check (public.has_role(array['admin','manager','maintenance']::public.app_role[]));

create policy dds_topics_read on public.dds_topics for select to authenticated using (true);
create policy dds_topics_manage on public.dds_topics for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));
create policy dds_sessions_read on public.dds_sessions for select to authenticated using (true);
create policy dds_sessions_manage on public.dds_sessions for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));
create policy dds_participants_read on public.dds_participants for select to authenticated using (true);
create policy dds_participants_manage on public.dds_participants for all to authenticated using (public.has_role(array['admin','manager']::public.app_role[])) with check (public.has_role(array['admin','manager']::public.app_role[]));

create policy notifications_self on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_self_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_system_insert on public.notifications for insert to authenticated with check (true);

create policy audit_admin_read on public.audit_logs for select to authenticated using (public.has_role(array['admin','manager']::public.app_role[]));
create policy audit_authenticated_insert on public.audit_logs for insert to authenticated with check (user_id = auth.uid());

insert into public.expense_categories(name) values ('EPI'),('Manutenção'),('Treinamentos'),('Combustível'),('Serviços'),('Outros') on conflict do nothing;
insert into public.cost_centers(code,name,department,monthly_budget,annual_budget) values
  ('CC-SEG-001','Segurança do Trabalho','SST',15000,180000),
  ('CC-MNT-002','Manutenção de Equipamentos','Manutenção',18000,216000),
  ('CC-RH-003','Treinamentos e Desenvolvimento','RH',12000,144000)
on conflict do nothing;
