'use strict';

const SUPABASE_URL = window.APP_CONFIG?.supabaseUrl;
const SUPABASE_KEY = window.APP_CONFIG?.supabasePublishableKey;
if (!SUPABASE_URL || !SUPABASE_KEY || !window.supabase) {
  document.body.innerHTML = '<main style="font-family:Arial;padding:32px"><h1>Configuração incompleta</h1><p>As credenciais públicas do Supabase não foram carregadas.</p></main>';
  throw new Error('Supabase não configurado');
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const navItems = [
  ['dashboard', '▦', 'Dashboard'],
  ['employees', '◎', 'Funcionários'],
  ['epis', '⬡', 'Controle de EPI'],
  ['courses', '▤', 'Cursos e documentos'],
  ['expenses', 'R$', 'Controle de gastos'],
  ['forklifts', '▰', 'Empilhadeiras'],
  ['dds', '◉', 'DDS'],
  ['reports', '▥', 'Relatórios'],
  ['notifications', '♢', 'Notificações'],
  ['settings', '⚙', 'Configurações'],
];

const emptyState = {
  employees: [], epis: [], epiDeliveries: [], courses: [], expenses: [],
  forklifts: [], maintenances: [], checklists: [], dds: [], audit: [],
  settings: { company: 'BR Soluções', unit: 'Porto do Açu — LMP', monthlyBudget: 50000, theme: localStorage.getItem('gst-theme') || 'light' },
  profile: null,
};

const employeeStatus = { active:'Ativo', vacation:'Férias', leave:'Afastado', terminated:'Desligado' };
const employeeStatusDb = Object.fromEntries(Object.entries(employeeStatus).map(([k,v])=>[v,k]));
const expenseStatus = { planned:'Previsto', requested:'Solicitado', pending_approval:'Aguardando aprovação', approved:'Aprovado', paid:'Pago', cancelled:'Cancelado' };
const expenseStatusDb = Object.fromEntries(Object.entries(expenseStatus).map(([k,v])=>[v,k]));
const forkliftStatus = { available:'Disponível', operating:'Operando', stopped:'Parada', scheduled_maintenance:'Manutenção programada', corrective_maintenance:'Manutenção corretiva', interdicted:'Interditada', retired:'Baixada' };
const forkliftStatusDb = Object.fromEntries(Object.entries(forkliftStatus).map(([k,v])=>[v,k]));
const maintenanceType = { preventive:'Preventiva', corrective:'Corretiva', inspection:'Inspeção' };
const maintenanceTypeDb = Object.fromEntries(Object.entries(maintenanceType).map(([k,v])=>[v,k]));
const priorityMap = { low:'Baixa', medium:'Média', high:'Alta', critical:'Crítica' };
const priorityDb = Object.fromEntries(Object.entries(priorityMap).map(([k,v])=>[v,k]));
const ddsStatus = { scheduled:'Programado', completed:'Concluído', cancelled:'Cancelado' };
const ddsStatusDb = Object.fromEntries(Object.entries(ddsStatus).map(([k,v])=>[v,k]));

let state = structuredClone(emptyState);
let lookups = { categories: [], costCenters: [], trainingCatalog: [], batches: [], plans: [] };
let currentUser = null;
let currentPage = 'dashboard';
let tableSearch = '';
let tableFilter = 'Todos';
let authMode = 'login';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const currency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const number = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));
const dateBR = (value) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${String(value).slice(0,10)}T12:00:00Z`)) : '—';
const todayISO = () => new Date().toISOString().slice(0, 10);
const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(v => v[0]).join('').toUpperCase() || 'US';
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

function must(data, label) {
  if (data.error) throw new Error(`${label}: ${data.error.message}`);
  return data.data || [];
}

async function loadData() {
  const queries = await Promise.all([
    db.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
    db.from('employees').select('*').is('archived_at', null).order('full_name'),
    db.from('epi_catalog').select('*').neq('status', 'archived').order('description'),
    db.from('epi_batches').select('*').order('received_at'),
    db.from('epi_movements').select('*').eq('movement_type','delivery').order('movement_at',{ascending:false}),
    db.from('training_catalog').select('*').order('name'),
    db.from('employee_trainings').select('*').order('expires_at'),
    db.from('expense_categories').select('*').order('name'),
    db.from('cost_centers').select('*').order('code'),
    db.from('expenses').select('*').is('archived_at', null).order('expense_date',{ascending:false}),
    db.from('forklifts').select('*').is('archived_at', null).order('code'),
    db.from('maintenance_plans').select('*'),
    db.from('maintenance_orders').select('*').order('opened_at',{ascending:false}),
    db.from('forklift_checklists').select('*').order('inspection_date',{ascending:false}),
    db.from('dds_sessions').select('*').order('session_date',{ascending:false}),
    db.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(50),
    db.from('app_settings').select('*').eq('id',1).maybeSingle(),
  ]);
  const [profileQ, employeesQ, episQ, batchesQ, movementsQ, catalogQ, trainingsQ, categoriesQ, centersQ, expensesQ, forkliftsQ, plansQ, maintenanceQ, checksQ, ddsQ, auditQ, settingsQ] = queries;
  if (profileQ.error) throw profileQ.error;
  state.profile = profileQ.data;
  const employees = must(employeesQ,'Funcionários');
  const epis = must(episQ,'EPIs');
  const batches = must(batchesQ,'Lotes');
  const movements = must(movementsQ,'Movimentações');
  const catalog = must(catalogQ,'Catálogo de cursos');
  const trainings = must(trainingsQ,'Cursos');
  const categories = must(categoriesQ,'Categorias');
  const centers = must(centersQ,'Centros de custo');
  const expenses = must(expensesQ,'Gastos');
  const forklifts = must(forkliftsQ,'Empilhadeiras');
  const plans = must(plansQ,'Planos de manutenção');
  const maintenance = must(maintenanceQ,'Ordens de manutenção');
  const checks = must(checksQ,'Checklists');
  const dds = must(ddsQ,'DDS');
  const audit = must(auditQ,'Auditoria');
  lookups = { categories, costCenters: centers, trainingCatalog: catalog, batches, plans };

  state.employees = employees.map(x=>({ id:x.id, name:x.full_name, registration:x.registration, role:x.job_title, sector:x.department, company:x.company, admission:x.admission_date, phone:x.phone||'', email:x.email||'', status:employeeStatus[x.status]||x.status }));
  state.epis = epis.map(x=>{ const bs=batches.filter(b=>b.epi_id===x.id); return { id:x.id, batchId:bs[0]?.id||'', code:x.internal_code, name:x.description, category:x.category, ca:x.ca_number, caExpiry:x.ca_expiry, size:x.size||'', stock:bs.reduce((s,b)=>s+Number(b.current_quantity),0), minimum:Number(x.minimum_stock), unitCost:Number(x.unit_cost), location:x.storage_location||'', status:x.status==='active'?'Ativo':'Inativo' }; });
  state.epiDeliveries = movements.map(x=>({ id:x.id, epiId:x.epi_id, employeeId:x.employee_id, batchId:x.batch_id, epi:state.epis.find(e=>e.id===x.epi_id)?.name||'EPI', employee:state.employees.find(e=>e.id===x.employee_id)?.name||'Funcionário', quantity:Number(x.quantity), date:String(x.movement_at).slice(0,10), reason:x.reason||'', signed:Boolean(x.signed_at) }));
  state.courses = trainings.map(x=>{ const e=state.employees.find(v=>v.id===x.employee_id); const c=catalog.find(v=>v.id===x.training_id); return { id:x.id, employeeId:x.employee_id, trainingId:x.training_id, employee:e?.name||'Funcionário', employeeRegistration:e?.registration||'', course:c?.name||'Curso', institution:x.institution||c?.institution||'', completedAt:x.completed_at, expiresAt:x.expires_at, hours:Number(c?.workload_hours||0), certificate:x.certificate_path||'' }; });
  state.expenses = expenses.map(x=>({ id:x.id, date:x.expense_date, description:x.description, category:categories.find(c=>c.id===x.category_id)?.name||'Outros', costCenter:centers.find(c=>c.id===x.cost_center_id)?.code||'', supplier:x.supplier||'', value:Number(x.amount), status:expenseStatus[x.status]||x.status, document:x.document_number||'', attachment:x.attachment_path||'' }));
  state.forklifts = forklifts.map(x=>{ const p=plans.find(v=>v.forklift_id===x.id && v.active) || {}; return { id:x.id, planId:p.id||'', code:x.code, asset:x.asset_number||'', manufacturer:x.manufacturer||'', model:x.model||'', capacity:x.capacity_tons?`${Number(x.capacity_tons).toLocaleString('pt-BR')} t`:'', year:x.manufacture_year||'', hourMeter:Number(x.hour_meter), location:x.location||'', status:forkliftStatus[x.status]||x.status, nextMaintenance:p.next_due_date||'', maintenanceHour:Number(p.next_due_hour||0) }; });
  state.maintenances = maintenance.map(x=>({ id:x.id, forkliftId:x.forklift_id, forklift:state.forklifts.find(f=>f.id===x.forklift_id)?.code||'', type:maintenanceType[x.maintenance_type]||x.maintenance_type, priority:priorityMap[x.priority]||x.priority, openedAt:String(x.opened_at).slice(0,10), description:x.failure_description, status:({open:'Aberta',in_progress:'Em andamento',waiting_parts:'Aguardando peça',completed:'Concluída'})[x.status]||x.status, cost:Number(x.labor_cost)+Number(x.parts_cost), attachment:x.attachment_path||'' }));
  state.checklists = checks.map(x=>({ id:x.id, forkliftId:x.forklift_id, forklift:state.forklifts.find(f=>f.id===x.forklift_id)?.code||'', date:x.inspection_date, shift:x.shift, failed:Array.isArray(x.items)?x.items.filter(i=>i.status==='Não conforme').length:(x.has_critical_failure?1:0), notes:x.notes||'' }));
  state.dds = dds.map(x=>({ id:x.id, date:x.session_date, time:String(x.session_time).slice(0,5), theme:x.custom_topic||'DDS', sector:x.department||'', leaderId:x.responsible_id, leader:state.employees.find(e=>e.id===x.responsible_id)?.name||'', participants:Number(x.participant_count||0), status:ddsStatus[x.status]||x.status, duration:Number(x.duration_minutes||0) }));
  state.audit = audit.map(x=>({ id:x.id, date:x.created_at, user:'Sistema', action:x.action }));
  if (settingsQ.error) throw settingsQ.error;
  if (settingsQ.data) state.settings = { ...state.settings, company:settingsQ.data.company, unit:settingsQ.data.unit, monthlyBudget:Number(settingsQ.data.monthly_budget) };
  updateUserUI();
}

async function ensureCategory(name) {
  let item=lookups.categories.find(x=>x.name===name); if(item) return item.id;
  const q=await db.from('expense_categories').insert({name,status:'active'}).select().single(); if(q.error) throw q.error; lookups.categories.push(q.data); return q.data.id;
}
async function ensureCostCenter(code) {
  let item=lookups.costCenters.find(x=>x.code===code); if(item) return item.id;
  const q=await db.from('cost_centers').insert({code,name:code,monthly_budget:0,annual_budget:0,status:'active'}).select().single(); if(q.error) throw q.error; lookups.costCenters.push(q.data); return q.data.id;
}
async function ensureTraining(name,hours,institution) {
  let item=lookups.trainingCatalog.find(x=>x.name===name); if(item) return item.id;
  const q=await db.from('training_catalog').insert({name,training_type:'Interno',workload_hours:Number(hours||0),institution,status:'active'}).select().single(); if(q.error) throw q.error; lookups.trainingCatalog.push(q.data); return q.data.id;
}

async function syncState(action='') {
  const uid=currentUser.id;
  for (const x of state.employees) {
    const q=await db.from('employees').upsert({id:x.id,full_name:x.name,registration:x.registration,job_title:x.role,department:x.sector,company:x.company,admission_date:x.admission||null,phone:x.phone||null,email:x.email||null,status:employeeStatusDb[x.status]||'active',updated_by:uid,created_by:uid},{onConflict:'id'}); if(q.error) throw q.error;
  }
  for (const x of state.epis) {
    const q=await db.from('epi_catalog').upsert({id:x.id,internal_code:x.code,description:x.name,category:x.category,ca_number:x.ca,ca_expiry:x.caExpiry||null,size:x.size||null,minimum_stock:Number(x.minimum||0),unit_cost:Number(x.unitCost||0),storage_location:x.location||null,status:x.status==='Inativo'?'inactive':'active',created_by:uid,updated_by:uid},{onConflict:'id'}); if(q.error) throw q.error;
    if(!x.batchId) x.batchId=crypto.randomUUID();
    const b=await db.from('epi_batches').upsert({id:x.batchId,epi_id:x.id,batch_number:`APP-${x.code}`,supplier:'Cadastro do sistema',received_at:todayISO(),initial_quantity:Number(x.stock||0),current_quantity:Number(x.stock||0),unit_cost:Number(x.unitCost||0),created_by:uid},{onConflict:'id'}); if(b.error) throw b.error;
  }
  for (const x of state.courses) {
    const employee=state.employees.find(e=>e.name===x.employee)||state.employees.find(e=>e.registration===x.employeeRegistration); if(!employee) continue;
    const trainingId=await ensureTraining(x.course,x.hours,x.institution); x.employeeId=employee.id; x.trainingId=trainingId;
    const q=await db.from('employee_trainings').upsert({id:x.id,employee_id:employee.id,training_id:trainingId,completed_at:x.completedAt||null,expires_at:x.expiresAt||null,institution:x.institution||null,certificate_path:x.certificate||null,created_by:uid,updated_by:uid},{onConflict:'id'}); if(q.error) throw q.error;
  }
  for (const x of state.expenses) {
    const categoryId=await ensureCategory(x.category); const centerId=await ensureCostCenter(x.costCenter);
    const q=await db.from('expenses').upsert({id:x.id,expense_date:x.date,competence:`${String(x.date).slice(0,7)}-01`,description:x.description,category_id:categoryId,cost_center_id:centerId,supplier:x.supplier||null,document_number:x.document||null,amount:Number(x.value||0),status:expenseStatusDb[x.status]||'requested',attachment_path:x.attachment||null,requested_by:uid,approved_by:['Aprovado','Pago'].includes(x.status)?uid:null,approved_at:['Aprovado','Pago'].includes(x.status)?new Date().toISOString():null},{onConflict:'id'}); if(q.error) throw q.error;
  }
  for (const x of state.forklifts) {
    const cap=Number(String(x.capacity||'').replace(',','.').replace(/[^0-9.]/g,''))||null;
    const q=await db.from('forklifts').upsert({id:x.id,code:x.code,asset_number:x.asset||null,manufacturer:x.manufacturer||null,model:x.model||null,capacity_tons:cap,manufacture_year:Number(x.year)||null,hour_meter:Number(x.hourMeter||0),location:x.location||null,status:forkliftStatusDb[x.status]||'available'},{onConflict:'id'}); if(q.error) throw q.error;
    if(!x.planId) x.planId=crypto.randomUUID();
    const p=await db.from('maintenance_plans').upsert({id:x.planId,forklift_id:x.id,name:'Manutenção preventiva',interval_days:180,interval_hours:500,next_due_date:x.nextMaintenance||null,next_due_hour:Number(x.maintenanceHour||0),active:true},{onConflict:'id'}); if(p.error) throw p.error;
  }
  for (const x of state.maintenances) {
    const forklift=state.forklifts.find(f=>f.code===x.forklift)||state.forklifts.find(f=>f.id===x.forkliftId); if(!forklift) continue;
    const q=await db.from('maintenance_orders').upsert({id:x.id,forklift_id:forklift.id,maintenance_type:maintenanceTypeDb[x.type]||'inspection',priority:priorityDb[x.priority]||'medium',failure_description:x.description,labor_cost:Number(x.cost||0),parts_cost:0,opened_at:`${x.openedAt}T12:00:00Z`,status:({'Aberta':'open','Em andamento':'in_progress','Aguardando peça':'waiting_parts','Concluída':'completed'})[x.status]||'open',attachment_path:x.attachment||null,opened_by:uid},{onConflict:'id'}); if(q.error) throw q.error;
  }
  for (const x of state.dds) {
    const leader=state.employees.find(e=>e.name===x.leader)||state.employees.find(e=>e.id===x.leaderId);
    const q=await db.from('dds_sessions').upsert({id:x.id,session_date:x.date,session_time:x.time,custom_topic:x.theme,department:x.sector,unit:state.settings.unit,responsible_id:leader?.id||null,duration_minutes:Number(x.duration||0),participant_count:Number(x.participants||0),status:ddsStatusDb[x.status]||'scheduled',created_by:uid},{onConflict:'id'}); if(q.error) throw q.error;
  }
  const settingsQ=await db.from('app_settings').upsert({id:1,company:state.settings.company,unit:state.settings.unit,monthly_budget:Number(state.settings.monthlyBudget||0),updated_by:uid},{onConflict:'id'}); if(settingsQ.error) throw settingsQ.error;
  if(action){ const a=await db.from('audit_logs').insert({user_id:uid,action,entity_type:'application'}); if(a.error) console.warn(a.error); }
  localStorage.setItem('gst-theme',state.settings.theme||'light');
  await loadData();
  updateNotificationCount();
}

async function uploadFromForm(form,inputName,bucket) {
  const file=form.elements[inputName]?.files?.[0]; if(!file) return '';
  const safe=file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');
  const path=`${currentUser.id}/${Date.now()}-${safe}`;
  const result=await db.storage.from(bucket).upload(path,file,{upsert:false}); if(result.error) throw result.error; return path;
}

function updateUserUI(){
  const name=state.profile?.full_name||currentUser?.email||'Usuário';
  const role=({admin:'Administrador',manager:'Gestor',warehouse:'Almoxarifado',maintenance:'Manutenção',employee:'Colaborador',viewer:'Visualizador'})[state.profile?.role]||'Usuário';
  const mini=document.querySelector('.user-mini'); if(mini) mini.innerHTML=`<div class="avatar">${initials(name)}</div><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(role)}</small></div>`;
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function daysUntil(date) {
  const now = new Date(); now.setHours(0,0,0,0);
  const end = new Date(`${date}T00:00:00`);
  return Math.ceil((end - now) / 86400000);
}

function courseStatus(course) {
  const days = daysUntil(course.expiresAt);
  if (days < 0) return ['Vencido', 'danger'];
  if (days <= 30) return [`Vence em ${days} dias`, 'danger'];
  if (days <= 60) return [`Vence em ${days} dias`, 'warning'];
  if (days <= 90) return [`Vence em ${days} dias`, 'info'];
  return ['Válido', 'success'];
}

function statusClass(status = '') {
  const s = status.toLowerCase();
  if (s.includes('venc') || s.includes('interdit') || s.includes('crítica') || s.includes('cancel') || s.includes('baixo')) return 'danger';
  if (s.includes('aguard') || s.includes('program') || s.includes('férias') || s.includes('andamento')) return 'warning';
  if (s.includes('ativo') || s.includes('válido') || s.includes('pago') || s.includes('concluído') || s.includes('operando') || s.includes('disponível')) return 'success';
  return 'info';
}

function badge(status, forcedClass = '') {
  return `<span class="badge ${forcedClass || statusClass(status)}">${escapeHtml(status)}</span>`;
}

function getNotifications() {
  const notifications = [];
  state.epis.forEach(epi => {
    if (Number(epi.stock) <= Number(epi.minimum)) notifications.push({ type: 'EPI', severity: 'danger', title: 'Estoque mínimo atingido', detail: `${epi.name}: ${epi.stock} em estoque`, page: 'epis' });
    const days = daysUntil(epi.caExpiry);
    if (days <= 90) notifications.push({ type: 'EPI', severity: days < 0 ? 'danger' : 'warning', title: days < 0 ? 'CA vencido' : 'CA próximo do vencimento', detail: `${epi.name} — ${days < 0 ? Math.abs(days) + ' dias vencido' : days + ' dias'}`, page: 'epis' });
  });
  state.courses.forEach(course => {
    const days = daysUntil(course.expiresAt);
    if (days <= 90) notifications.push({ type: 'Curso', severity: days < 0 ? 'danger' : 'warning', title: days < 0 ? 'Curso vencido' : 'Curso próximo do vencimento', detail: `${course.employee} — ${course.course}`, page: 'courses' });
  });
  state.forklifts.forEach(forklift => {
    const days = daysUntil(forklift.nextMaintenance);
    if (days <= 30 || Number(forklift.hourMeter) >= Number(forklift.maintenanceHour)) notifications.push({ type: 'Empilhadeira', severity: days < 0 ? 'danger' : 'warning', title: 'Manutenção necessária', detail: `${forklift.code} — ${forklift.status}`, page: 'forklifts' });
    if (forklift.status === 'Interditada') notifications.push({ type: 'Empilhadeira', severity: 'danger', title: 'Equipamento interditado', detail: `${forklift.code} está bloqueada para operação`, page: 'forklifts' });
  });
  state.expenses.filter(x => x.status === 'Aguardando aprovação').forEach(expense => notifications.push({ type: 'Gasto', severity: 'warning', title: 'Aprovação pendente', detail: `${expense.description} — ${currency(expense.value)}`, page: 'expenses' }));
  state.dds.filter(x => x.status === 'Programado').forEach(item => notifications.push({ type: 'DDS', severity: 'info', title: 'DDS programado', detail: `${dateBR(item.date)} — ${item.theme}`, page: 'dds' }));
  return notifications;
}

function updateNotificationCount() {
  const el = $('#notification-count');
  if (el) el.textContent = getNotifications().length;
}

function setupNav() {
  $('#nav').innerHTML = navItems.map(([id, icon, label]) => `<button class="nav-item ${id === currentPage ? 'active' : ''}" data-page="${id}"><span class="nav-icon">${icon}</span>${label}</button>`).join('');
}

function setPage(page) {
  currentPage = page;
  tableSearch = '';
  tableFilter = 'Todos';
  const info = navItems.find(item => item[0] === page);
  $('#page-title').textContent = info?.[2] || 'Gestão Segura';
  $('#breadcrumb').textContent = page === 'dashboard' ? 'VISÃO GERAL' : 'GESTÃO SEGURA • SST';
  setupNav();
  $('#sidebar').classList.remove('open');
  renderPage();
}

function renderPage() {
  const renderers = { dashboard: renderDashboard, employees: renderEmployees, epis: renderEpis, courses: renderCourses, expenses: renderExpenses, forklifts: renderForklifts, dds: renderDDS, reports: renderReports, notifications: renderNotifications, settings: renderSettings };
  (renderers[currentPage] || renderDashboard)();
  updateNotificationCount();
}

function metric(label, value, icon, delta, good = true) {
  return `<article class="metric-card"><div class="metric-top"><span class="metric-icon">${icon}</span><span class="delta ${good ? 'good' : 'bad'}">${delta}</span></div><div class="metric-value">${value}</div><div class="metric-label">${label}</div></article>`;
}

function renderDashboard() {
  const activeEmployees = state.employees.filter(x => x.status === 'Ativo').length;
  const lowStock = state.epis.filter(x => Number(x.stock) <= Number(x.minimum)).length;
  const expiredCourses = state.courses.filter(x => daysUntil(x.expiresAt) < 0).length;
  const monthExpenses = state.expenses.filter(x => x.date.slice(0,7) === todayISO().slice(0,7)).reduce((sum,x) => sum + Number(x.value), 0);
  const availableForklifts = state.forklifts.filter(x => ['Operando','Disponível'].includes(x.status)).length;
  const ddsMonth = state.dds.filter(x => x.date.slice(0,7) === todayISO().slice(0,7) && x.status === 'Concluído').length;
  const notifications = getNotifications().slice(0, 6);
  const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: monthFormatter.format(date).replace('.', '').replace(/^./, char => char.toUpperCase())
    };
  });
  const monthlyData = monthKeys.map(month => state.expenses
    .filter(expense => String(expense.date || '').slice(0, 7) === month.key)
    .reduce((sum, expense) => sum + Number(expense.value || 0), 0));
  const maxMonthlyExpense = Math.max(...monthlyData, 1);
  const userName = state.profile?.full_name || currentUser?.email?.split('@')[0] || 'Usuário';
  const firstName = userName.trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const budget = Number(state.settings.monthlyBudget || 0);
  const budgetPercentage = budget > 0 ? Math.round(monthExpenses / budget * 100) : 0;

  $('#page-content').innerHTML = `
    <div class="toolbar"><div><h3 style="margin:0">${greeting}, ${escapeHtml(firstName)}</h3><p class="muted" style="margin:5px 0 0">Acompanhe os indicadores críticos da operação.</p></div><div class="toolbar-right"><button class="btn" data-action="export" data-export="dashboard">Exportar resumo</button><button class="btn primary" data-page="notifications">Ver alertas</button></div></div>
    <div class="metrics">
      ${metric('Funcionários ativos', activeEmployees, '◎', `${state.employees.length} cadastrados`)}
      ${metric('EPIs com estoque baixo', lowStock, '⬡', lowStock ? 'Ação necessária' : 'Estoque regular', !lowStock)}
      ${metric('Cursos vencidos', expiredCourses, '▤', expiredCourses ? 'Regularizar' : 'Conformidade total', !expiredCourses)}
      ${metric('Gastos no mês', currency(monthExpenses), 'R$', budget > 0 ? `${budgetPercentage}% do orçamento` : 'Orçamento não definido', budget === 0 || monthExpenses <= budget)}
      ${metric('Empilhadeiras operacionais', `${availableForklifts}/${state.forklifts.length}`, '▰', `${state.forklifts.filter(x=>x.status==='Interditada').length} interditada(s)`, availableForklifts === state.forklifts.length)}
      ${metric('DDS realizados no mês', ddsMonth, '◉', `${state.dds.reduce((s,x)=>s+Number(x.participants),0)} participações`)}
      ${metric('Ordens de manutenção', state.maintenances.length, '⚒', `${state.maintenances.filter(x=>x.status!=='Concluída').length} abertas`, false)}
      ${metric('Alertas ativos', getNotifications().length, '♢', 'Central de notificações', getNotifications().length === 0)}
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-header"><div><p class="eyebrow">FINANCEIRO</p><h3>Evolução de gastos mensais</h3></div><strong>${currency(monthExpenses)}</strong></div><div class="bars">${monthlyData.map((value,i)=>`<div class="bar-wrap"><div class="bar" title="${currency(value)}" style="height:${value > 0 ? Math.max(8, value / maxMonthlyExpense * 100) : 2}%"></div><small>${monthKeys[i].label}</small></div>`).join('')}</div></section>
      <section class="panel"><div class="panel-header"><div><p class="eyebrow">ATENÇÃO</p><h3>Alertas prioritários</h3></div><button class="btn small" data-page="notifications">Todos</button></div><div class="alert-list">${notifications.length ? notifications.map(n=>`<button class="alert-item" data-page="${n.page}" style="border:0;text-align:left;color:inherit"><span class="alert-dot">${n.severity === 'danger' ? '!' : '•'}</span><span><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(n.detail)}</small></span>${badge(n.type, n.severity)}</button>`).join('') : '<div class="empty">Nenhum alerta ativo.</div>'}</div></section>
    </div>`;
}

function toolbar(title, subtitle, actionLabel, actionType, filters = '') {
  return `<div class="toolbar"><div><h3 style="margin:0">${title}</h3><p class="muted" style="margin:5px 0 0">${subtitle}</p></div><div class="toolbar-right"><input id="table-search" class="input" placeholder="Buscar..." value="${escapeHtml(tableSearch)}" />${filters}<button class="btn" data-action="export" data-export="${currentPage}">Exportar CSV</button><button class="btn primary" data-action="open-form" data-form="${actionType}">+ ${actionLabel}</button></div></div>`;
}

function renderEmployees() {
  const rows = state.employees.filter(x => [x.name,x.registration,x.role,x.sector,x.company,x.status].join(' ').toLowerCase().includes(tableSearch.toLowerCase()) && (tableFilter === 'Todos' || x.status === tableFilter));
  $('#page-content').innerHTML = `${toolbar('Funcionários', 'Cadastros, situação, documentos e histórico individual.', 'Novo funcionário', 'employee', `<select id="table-filter" class="select"><option>Todos</option>${['Ativo','Férias','Afastado','Desligado'].map(x=>`<option ${tableFilter===x?'selected':''}>${x}</option>`).join('')}</select>`)}
  <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>Cargo / setor</th><th>Empresa</th><th>Admissão</th><th>Contato</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="entity"><span class="entity-avatar">${initials(x.name)}</span><span><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.registration)}</small></span></div></td><td><strong>${escapeHtml(x.role)}</strong><br><span class="muted">${escapeHtml(x.sector)}</span></td><td>${escapeHtml(x.company)}</td><td>${dateBR(x.admission)}</td><td>${escapeHtml(x.phone)}<br><span class="muted">${escapeHtml(x.email)}</span></td><td>${badge(x.status)}</td><td><div class="actions"><button class="btn small" data-action="open-form" data-form="employee" data-id="${x.id}">Editar</button><button class="btn small danger" data-action="delete" data-collection="employees" data-id="${x.id}">Arquivar</button></div></td></tr>`).join('') || `<tr><td colspan="7"><div class="empty">Nenhum funcionário encontrado.</div></td></tr>`}</tbody></table></div></div>`;
}

function renderEpis() {
  const rows = state.epis.filter(x => [x.code,x.name,x.category,x.ca,x.size,x.location,x.status].join(' ').toLowerCase().includes(tableSearch.toLowerCase()) && (tableFilter === 'Todos' || x.category === tableFilter));
  const categories = [...new Set(state.epis.map(x=>x.category))];
  $('#page-content').innerHTML = `${toolbar('Controle de EPI', 'Estoque por item, CA, tamanho, entregas e movimentações.', 'Novo EPI', 'epi', `<select id="table-filter" class="select"><option>Todos</option>${categories.map(x=>`<option ${tableFilter===x?'selected':''}>${x}</option>`).join('')}</select>`)}
  <div class="metrics" style="margin-bottom:16px">${metric('Valor em estoque', currency(state.epis.reduce((s,x)=>s+Number(x.stock)*Number(x.unitCost),0)), 'R$', `${state.epis.length} itens`)}${metric('Estoque baixo', state.epis.filter(x=>Number(x.stock)<=Number(x.minimum)).length, '!', 'Reposição necessária', false)}${metric('Entregas registradas', state.epiDeliveries.length, '↗', 'Histórico rastreável')}${metric('CAs em até 90 dias', state.epis.filter(x=>daysUntil(x.caExpiry)<=90).length, '⌛', 'Verificar validade', false)}</div>
  <div class="table-card"><div class="table-wrap"><table><thead><tr><th>EPI</th><th>Categoria / CA</th><th>Tamanho</th><th>Estoque</th><th>Custo unitário</th><th>Validade CA</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="entity"><span class="entity-avatar">⬡</span><span><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.code)} • ${escapeHtml(x.location)}</small></span></div></td><td>${escapeHtml(x.category)}<br><span class="muted">CA ${escapeHtml(x.ca)}</span></td><td>${escapeHtml(x.size)}</td><td><strong>${number(x.stock)}</strong> / mín. ${number(x.minimum)}</td><td>${currency(x.unitCost)}</td><td>${dateBR(x.caExpiry)}</td><td>${badge(Number(x.stock)<=Number(x.minimum)?'Estoque baixo':x.status)}</td><td><div class="actions"><button class="btn small primary" data-action="open-form" data-form="delivery" data-id="${x.id}">Entregar</button><button class="btn small" data-action="open-form" data-form="epi" data-id="${x.id}">Editar</button></div></td></tr>`).join('') || `<tr><td colspan="8"><div class="empty">Nenhum EPI encontrado.</div></td></tr>`}</tbody></table></div></div>
  ${state.epiDeliveries.length ? `<section class="panel" style="margin-top:16px"><div class="panel-header"><h3>Últimas entregas</h3></div><div class="table-wrap"><table><thead><tr><th>Data</th><th>Funcionário</th><th>EPI</th><th>Qtd.</th><th>Motivo</th><th>Assinatura</th></tr></thead><tbody>${state.epiDeliveries.slice(0,8).map(x=>`<tr><td>${dateBR(x.date)}</td><td>${escapeHtml(x.employee)}</td><td>${escapeHtml(x.epi)}</td><td>${x.quantity}</td><td>${escapeHtml(x.reason)}</td><td>${badge(x.signed?'Assinado':'Pendente')}</td></tr>`).join('')}</tbody></table></div></section>`:''}`;
}

function renderCourses() {
  const rows = state.courses.filter(x => [x.employee,x.employeeRegistration,x.course,x.institution].join(' ').toLowerCase().includes(tableSearch.toLowerCase()) && (tableFilter === 'Todos' || courseStatus(x)[0].startsWith(tableFilter)));
  $('#page-content').innerHTML = `${toolbar('Cursos e documentos', 'Matriz de treinamentos, certificados e vencimentos.', 'Registrar curso', 'course', `<select id="table-filter" class="select"><option>Todos</option>${['Válido','Vence','Vencido'].map(x=>`<option ${tableFilter===x?'selected':''}>${x}</option>`).join('')}</select>`)}
  <div class="metrics" style="margin-bottom:16px">${metric('Registros válidos', state.courses.filter(x=>daysUntil(x.expiresAt)>90).length, '✓', 'Conformidade')}${metric('Vencem em até 90 dias', state.courses.filter(x=>{const d=daysUntil(x.expiresAt);return d>=0&&d<=90}).length, '⌛', 'Programar reciclagem', false)}${metric('Cursos vencidos', state.courses.filter(x=>daysUntil(x.expiresAt)<0).length, '!', 'Bloqueio operacional', false)}${metric('Certificados anexados', state.courses.filter(x=>x.certificate).length, '▤', 'Documentação digital')}</div>
  <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>Curso</th><th>Instituição</th><th>Realização</th><th>Validade</th><th>Carga horária</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(x=>{const st=courseStatus(x); return `<tr><td><strong>${escapeHtml(x.employee)}</strong><br><span class="muted">${escapeHtml(x.employeeRegistration)}</span></td><td><strong>${escapeHtml(x.course)}</strong><br><span class="muted">${escapeHtml(x.certificate || 'Sem anexo')}</span></td><td>${escapeHtml(x.institution)}</td><td>${dateBR(x.completedAt)}</td><td>${dateBR(x.expiresAt)}</td><td>${x.hours}h</td><td>${badge(st[0],st[1])}</td><td><div class="actions"><button class="btn small" data-action="open-form" data-form="course" data-id="${x.id}">Editar</button><button class="btn small danger" data-action="delete" data-collection="courses" data-id="${x.id}">Excluir</button></div></td></tr>`}).join('') || `<tr><td colspan="8"><div class="empty">Nenhum curso encontrado.</div></td></tr>`}</tbody></table></div></div>`;
}

function renderExpenses() {
  const rows = state.expenses.filter(x => [x.description,x.category,x.costCenter,x.supplier,x.status,x.document].join(' ').toLowerCase().includes(tableSearch.toLowerCase()) && (tableFilter === 'Todos' || x.status === tableFilter));
  const total = state.expenses.reduce((s,x)=>s+Number(x.value),0);
  const approved = state.expenses.filter(x=>['Aprovado','Pago'].includes(x.status)).reduce((s,x)=>s+Number(x.value),0);
  const pending = state.expenses.filter(x=>x.status==='Aguardando aprovação').reduce((s,x)=>s+Number(x.value),0);
  $('#page-content').innerHTML = `${toolbar('Controle de gastos', 'Orçamento, solicitações, aprovações e documentos fiscais.', 'Novo gasto', 'expense', `<select id="table-filter" class="select"><option>Todos</option>${['Previsto','Solicitado','Aguardando aprovação','Aprovado','Pago','Cancelado'].map(x=>`<option ${tableFilter===x?'selected':''}>${x}</option>`).join('')}</select>`)}
  <div class="metrics" style="margin-bottom:16px">${metric('Total registrado', currency(total), 'R$', `${state.expenses.length} lançamentos`)}${metric('Aprovado / pago', currency(approved), '✓', `${Math.round(approved/total*100)||0}% do total`)}${metric('Aguardando aprovação', currency(pending), '⌛', 'Ação do gestor', false)}${metric('Orçamento mensal', currency(state.settings.monthlyBudget), '▥', `${Math.round(total/state.settings.monthlyBudget*100)}% utilizado`, total<=state.settings.monthlyBudget)}</div>
  <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Centro de custo</th><th>Fornecedor</th><th>Documento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${dateBR(x.date)}</td><td><strong>${escapeHtml(x.description)}</strong></td><td>${escapeHtml(x.category)}</td><td>${escapeHtml(x.costCenter)}</td><td>${escapeHtml(x.supplier)}</td><td>${escapeHtml(x.document)}</td><td><strong>${currency(x.value)}</strong></td><td>${badge(x.status)}</td><td><div class="actions">${x.status==='Aguardando aprovação'?`<button class="btn small primary" data-action="approve-expense" data-id="${x.id}">Aprovar</button>`:''}<button class="btn small" data-action="open-form" data-form="expense" data-id="${x.id}">Editar</button></div></td></tr>`).join('') || `<tr><td colspan="9"><div class="empty">Nenhum gasto encontrado.</div></td></tr>`}</tbody></table></div></div>`;
}

function renderForklifts() {
  const items = state.forklifts.filter(x => [x.code,x.asset,x.manufacturer,x.model,x.location,x.status].join(' ').toLowerCase().includes(tableSearch.toLowerCase()) && (tableFilter === 'Todos' || x.status === tableFilter));
  $('#page-content').innerHTML = `${toolbar('Empilhadeiras', 'Disponibilidade, checklists, manutenção e custos por equipamento.', 'Nova empilhadeira', 'forklift', `<select id="table-filter" class="select"><option>Todos</option>${['Operando','Disponível','Manutenção programada','Manutenção corretiva','Interditada','Baixada'].map(x=>`<option ${tableFilter===x?'selected':''}>${x}</option>`).join('')}</select>`)}
  <div class="cards-grid">${items.map(x=>{const progress=Math.min(100,Math.round(Number(x.hourMeter)/Number(x.maintenanceHour)*100));return `<article class="asset-card"><div class="asset-head"><div><p class="eyebrow">${escapeHtml(x.asset)}</p><h3>${escapeHtml(x.code)} • ${escapeHtml(x.manufacturer)}</h3><span class="muted">${escapeHtml(x.model)} — ${escapeHtml(x.capacity)}</span></div>${badge(x.status)}</div><div class="specs"><div class="spec"><small>Horímetro</small><strong>${number(x.hourMeter)} h</strong></div><div class="spec"><small>Localização</small><strong>${escapeHtml(x.location)}</strong></div><div class="spec"><small>Próxima preventiva</small><strong>${dateBR(x.nextMaintenance)}</strong></div><div class="spec"><small>Meta de horas</small><strong>${number(x.maintenanceHour)} h</strong></div></div><div class="progress" title="${progress}% da meta"><span style="width:${progress}%"></span></div><div class="actions" style="margin-top:16px"><button class="btn small primary" data-action="open-form" data-form="checklist" data-id="${x.id}">Checklist</button><button class="btn small" data-action="open-form" data-form="maintenance" data-id="${x.id}">Abrir OS</button><button class="btn small" data-action="open-form" data-form="forklift" data-id="${x.id}">Editar</button></div></article>`}).join('') || `<div class="empty">Nenhuma empilhadeira encontrada.</div>`}</div>
  <section class="panel" style="margin-top:16px"><div class="panel-header"><div><p class="eyebrow">MANUTENÇÃO</p><h3>Ordens de serviço</h3></div></div><div class="table-wrap"><table><thead><tr><th>Equipamento</th><th>Tipo</th><th>Prioridade</th><th>Abertura</th><th>Descrição</th><th>Custo</th><th>Status</th></tr></thead><tbody>${state.maintenances.map(x=>`<tr><td><strong>${escapeHtml(x.forklift)}</strong></td><td>${escapeHtml(x.type)}</td><td>${badge(x.priority)}</td><td>${dateBR(x.openedAt)}</td><td>${escapeHtml(x.description)}</td><td>${currency(x.cost)}</td><td>${badge(x.status)}</td></tr>`).join('') || `<tr><td colspan="7"><div class="empty">Nenhuma ordem aberta.</div></td></tr>`}</tbody></table></div></section>`;
}

function renderDDS() {
  const rows = state.dds.filter(x => [x.theme,x.sector,x.leader,x.status].join(' ').toLowerCase().includes(tableSearch.toLowerCase()) && (tableFilter === 'Todos' || x.status === tableFilter));
  $('#page-content').innerHTML = `${toolbar('DDS', 'Programação, temas, participação e lista de presença.', 'Novo DDS', 'dds', `<select id="table-filter" class="select"><option>Todos</option>${['Programado','Concluído','Cancelado'].map(x=>`<option ${tableFilter===x?'selected':''}>${x}</option>`).join('')}</select>`)}
  <div class="metrics" style="margin-bottom:16px">${metric('DDS realizados', state.dds.filter(x=>x.status==='Concluído').length, '◉', 'Histórico completo')}${metric('Programados', state.dds.filter(x=>x.status==='Programado').length, '⌚', 'Agenda futura')}${metric('Participações', state.dds.reduce((s,x)=>s+Number(x.participants),0), '◎', 'Presenças registradas')}${metric('Média de participantes', Math.round(state.dds.reduce((s,x)=>s+Number(x.participants),0)/Math.max(1,state.dds.filter(x=>x.status==='Concluído').length)), '▤', 'Por DDS concluído')}</div>
  <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Data / horário</th><th>Tema</th><th>Setor</th><th>Responsável</th><th>Duração</th><th>Participantes</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${dateBR(x.date)}</strong><br><span class="muted">${escapeHtml(x.time)}</span></td><td><strong>${escapeHtml(x.theme)}</strong></td><td>${escapeHtml(x.sector)}</td><td>${escapeHtml(x.leader)}</td><td>${x.duration} min</td><td>${x.participants}</td><td>${badge(x.status)}</td><td><div class="actions">${x.status==='Programado'?`<button class="btn small primary" data-action="complete-dds" data-id="${x.id}">Concluir</button>`:''}<button class="btn small" data-action="open-form" data-form="dds" data-id="${x.id}">Editar</button></div></td></tr>`).join('') || `<tr><td colspan="8"><div class="empty">Nenhum DDS encontrado.</div></td></tr>`}</tbody></table></div></div>`;
}

function renderNotifications() {
  const items = getNotifications();
  $('#page-content').innerHTML = `<div class="toolbar"><div><h3 style="margin:0">Central de notificações</h3><p class="muted" style="margin:5px 0 0">Alertas gerados automaticamente pelos registros do sistema.</p></div><button class="btn" data-action="export" data-export="notifications">Exportar alertas</button></div><section class="panel"><div class="alert-list">${items.length ? items.map((n,i)=>`<button class="alert-item" data-page="${n.page}" style="border:0;text-align:left;color:inherit"><span class="alert-dot">${n.severity==='danger'?'!':'•'}</span><span><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(n.detail)}</small></span>${badge(n.type,n.severity)}</button>`).join('') : '<div class="empty">Tudo em dia. Nenhum alerta ativo.</div>'}</div></section>`;
}

function renderReports() {
  const epiValue = state.epis.reduce((s,x)=>s+Number(x.stock)*Number(x.unitCost),0);
  const maintenanceCost = state.maintenances.reduce((s,x)=>s+Number(x.cost),0);
  const expenseByCategory = Object.entries(state.expenses.reduce((acc,x)=>{acc[x.category]=(acc[x.category]||0)+Number(x.value);return acc;},{})).sort((a,b)=>b[1]-a[1]);
  $('#page-content').innerHTML = `<div class="toolbar"><div><h3 style="margin:0">Relatórios gerenciais</h3><p class="muted" style="margin:5px 0 0">Indicadores consolidados e exportação dos dados.</p></div><div class="toolbar-right"><button class="btn primary" data-action="export" data-export="all">Exportar base completa</button></div></div>
  <div class="metrics">${metric('Patrimônio em EPI', currency(epiValue), '⬡', `${state.epis.reduce((s,x)=>s+Number(x.stock),0)} unidades`)}${metric('Custo de manutenção', currency(maintenanceCost), '⚒', `${state.maintenances.length} ordens`)}${metric('Conformidade de cursos', `${Math.round(state.courses.filter(x=>daysUntil(x.expiresAt)>=0).length/Math.max(1,state.courses.length)*100)}%`, '▤', 'Base cadastrada')}${metric('Disponibilidade de frota', `${Math.round(state.forklifts.filter(x=>['Operando','Disponível'].includes(x.status)).length/Math.max(1,state.forklifts.length)*100)}%`, '▰', 'Situação atual')}</div>
  <div class="dashboard-grid"><section class="panel"><div class="panel-header"><h3>Gastos por categoria</h3></div><div class="alert-list">${expenseByCategory.map(([category,value])=>`<div class="alert-item"><span class="alert-dot">R$</span><span><strong>${escapeHtml(category)}</strong><small>${Math.round(value/state.expenses.reduce((s,x)=>s+Number(x.value),0)*100)}% dos gastos</small></span><strong>${currency(value)}</strong></div>`).join('')}</div></section><section class="panel"><div class="panel-header"><h3>Últimas alterações</h3></div><div class="alert-list">${state.audit.slice(0,8).map(x=>`<div class="alert-item"><span class="alert-dot">↺</span><span><strong>${escapeHtml(x.action)}</strong><small>${new Date(x.date).toLocaleString('pt-BR')} • ${escapeHtml(x.user)}</small></span></div>`).join('')}</div></section></div>`;
}

function renderSettings() {
  $('#page-content').innerHTML = `<div class="toolbar"><div><h3 style="margin:0">Configurações</h3><p class="muted" style="margin:5px 0 0">Dados da unidade, orçamento e armazenamento.</p></div></div><section class="panel"><form id="settings-form" class="form-grid" style="padding:0"><label>Empresa<input name="company" value="${escapeHtml(state.settings.company)}" /></label><label>Unidade / base<input name="unit" value="${escapeHtml(state.settings.unit)}" /></label><label>Orçamento mensal (R$)<input type="number" min="0" step="0.01" name="monthlyBudget" value="${state.settings.monthlyBudget}" /></label><label>Tema<select name="theme"><option value="light" ${state.settings.theme==='light'?'selected':''}>Claro</option><option value="dark" ${state.settings.theme==='dark'?'selected':''}>Escuro</option></select></label><div class="form-actions"><button type="button" class="btn" data-action="refresh-data">Atualizar dados</button><button type="submit" class="btn primary">Salvar configurações</button></div></form></section><section class="panel" style="margin-top:16px"><div class="panel-header"><div><p class="eyebrow">ARQUITETURA</p><h3>Status da integração</h3></div>${badge('Supabase conectado','success')}</div><p class="muted">Banco, autenticação, auditoria e armazenamento de documentos estão conectados ao Supabase. Todas as alterações são persistidas na nuvem.</p></section>`;
}

const formSchemas = {
  employee: {
    title: 'Funcionário', collection: 'employees', fields: [
      ['name','Nome completo','text',true], ['registration','Matrícula','text',true], ['role','Cargo','text',true], ['sector','Setor','text',true], ['company','Empresa','text',true], ['admission','Admissão','date',true], ['phone','Telefone','text',false], ['email','E-mail','email',false], ['status','Situação','select',true,['Ativo','Férias','Afastado','Desligado']]
    ]
  },
  epi: {
    title: 'EPI', collection: 'epis', fields: [
      ['code','Código interno','text',true], ['name','Descrição do EPI','text',true], ['category','Categoria','text',true], ['ca','Certificado de Aprovação (CA)','text',true], ['caExpiry','Validade do CA','date',true], ['size','Tamanho','text',true], ['stock','Estoque atual','number',true], ['minimum','Estoque mínimo','number',true], ['unitCost','Custo unitário','number',true], ['location','Localização','text',true], ['status','Status','select',true,['Ativo','Inativo','Estoque baixo']]
    ]
  },
  course: {
    title: 'Curso / certificado', collection: 'courses', fields: [
      ['employee','Funcionário','select',true,()=>state.employees.map(x=>x.name)], ['employeeRegistration','Matrícula','text',true], ['course','Curso / treinamento','text',true], ['institution','Instituição','text',true], ['completedAt','Data de realização','date',true], ['expiresAt','Validade','date',true], ['hours','Carga horária','number',true], ['certificate','Arquivo atual','text',false], ['certificateFile','Enviar certificado','file',false]
    ]
  },
  expense: {
    title: 'Lançamento de gasto', collection: 'expenses', fields: [
      ['date','Data','date',true], ['description','Descrição','text',true], ['category','Categoria','select',true,['EPI','Manutenção','Treinamentos','Combustível','Serviços','Outros']], ['costCenter','Centro de custo','text',true], ['supplier','Fornecedor','text',true], ['document','Nota / documento','text',false], ['value','Valor (R$)','number',true], ['attachmentFile','Anexar comprovante','file',false], ['status','Status','select',true,['Previsto','Solicitado','Aguardando aprovação','Aprovado','Pago','Cancelado']]
    ]
  },
  forklift: {
    title: 'Empilhadeira', collection: 'forklifts', fields: [
      ['code','Código','text',true], ['asset','Patrimônio','text',true], ['manufacturer','Fabricante','text',true], ['model','Modelo','text',true], ['capacity','Capacidade','text',true], ['year','Ano','number',true], ['hourMeter','Horímetro atual','number',true], ['location','Localização','text',true], ['status','Status','select',true,['Disponível','Operando','Parada','Manutenção programada','Manutenção corretiva','Interditada','Baixada']], ['nextMaintenance','Próxima manutenção','date',true], ['maintenanceHour','Próxima manutenção por hora','number',true]
    ]
  },
  dds: {
    title: 'DDS', collection: 'dds', fields: [
      ['date','Data','date',true], ['time','Horário','time',true], ['theme','Tema','text',true], ['sector','Setor','text',true], ['leader','Responsável','select',true,()=>state.employees.map(x=>x.name)], ['participants','Participantes','number',true], ['duration','Duração (min)','number',true], ['status','Status','select',true,['Programado','Concluído','Cancelado']]
    ]
  },
};

function formField([name,label,type,required,options], value = '') {
  if (type === 'select') {
    const items = typeof options === 'function' ? options() : options;
    return `<label>${label}<select name="${name}" ${required?'required':''}><option value="">Selecione</option>${items.map(item=>`<option value="${escapeHtml(item)}" ${String(value)===String(item)?'selected':''}>${escapeHtml(item)}</option>`).join('')}</select></label>`;
  }
  if (type === 'file') return `<label>${label}<input name="${name}" type="file" accept=".pdf,.jpg,.jpeg,.png" ${required?'required':''} /></label>`;
  return `<label>${label}<input name="${name}" type="${type}" ${type==='number'?'step="0.01"':''} value="${escapeHtml(value)}" ${required?'required':''} /></label>`;
}

function openForm(type, id = '') {
  const modal = $('#modal');
  const form = $('#modal-form');
  const schema = formSchemas[type];
  if (schema) {
    const record = id ? state[schema.collection].find(x=>x.id===id) : {};
    $('#modal-kicker').textContent = id ? 'EDITAR REGISTRO' : 'NOVO REGISTRO';
    $('#modal-title').textContent = schema.title;
    form.dataset.type = type;
    form.dataset.id = id;
    form.innerHTML = schema.fields.map(field=>formField(field, record?.[field[0]] ?? (field[0]==='date' ? todayISO() : ''))).join('') + `<div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div>`;
  } else if (type === 'delivery') {
    const epi = state.epis.find(x=>x.id===id);
    $('#modal-kicker').textContent = 'MOVIMENTAÇÃO DE ESTOQUE'; $('#modal-title').textContent = 'Entrega de EPI';
    form.dataset.type = type; form.dataset.id = id;
    form.innerHTML = `<label>EPI<input value="${escapeHtml(epi.name)}" disabled /></label><label>Estoque disponível<input value="${epi.stock}" disabled /></label>${formField(['employee','Funcionário','select',true,()=>state.employees.filter(x=>x.status==='Ativo').map(x=>x.name)])}${formField(['quantity','Quantidade','number',true],1)}${formField(['date','Data da entrega','date',true],todayISO())}${formField(['reason','Motivo','select',true,['Admissão','Troca periódica','Dano','Perda','Desgaste','Outro']])}${formField(['signed','Assinatura confirmada','select',true,['Sim','Não']])}<div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Registrar entrega</button></div>`;
  } else if (type === 'maintenance') {
    const forklift = state.forklifts.find(x=>x.id===id);
    $('#modal-kicker').textContent = 'ORDEM DE SERVIÇO'; $('#modal-title').textContent = `Manutenção — ${forklift.code}`;
    form.dataset.type = type; form.dataset.id = id;
    form.innerHTML = `${formField(['type','Tipo','select',true,['Preventiva','Corretiva','Inspeção']])}${formField(['priority','Prioridade','select',true,['Baixa','Média','Alta','Crítica']])}${formField(['openedAt','Data de abertura','date',true],todayISO())}<label>Status<select name="status" required><option>Aberta</option><option>Em andamento</option><option>Aguardando peça</option><option>Concluída</option></select></label><label class="span-2">Descrição<textarea name="description" required></textarea></label>${formField(['cost','Custo previsto','number',true],0)}${formField(['attachmentFile','Anexar documento','file',false])}<div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Abrir ordem</button></div>`;
  } else if (type === 'checklist') {
    const forklift = state.forklifts.find(x=>x.id===id);
    const items = ['Pneus e rodas','Garfos e trava','Correntes e mastro','Freios','Buzina','Luzes e sinalização','Vazamentos','Cinto de segurança','Extintor','Bateria / combustível'];
    $('#modal-kicker').textContent = 'INSPEÇÃO PRÉ-USO'; $('#modal-title').textContent = `Checklist — ${forklift.code}`;
    form.dataset.type = type; form.dataset.id = id;
    form.innerHTML = `${formField(['date','Data','date',true],todayISO())}${formField(['shift','Turno','select',true,['Dia','Noite','Administrativo']])}${items.map((item,i)=>`<label>${item}<select name="item_${i}" required><option value="Conforme">Conforme</option><option value="Não conforme">Não conforme</option><option value="Não aplicável">Não aplicável</option></select></label>`).join('')}<label class="span-2">Observações<textarea name="notes"></textarea></label><div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Concluir checklist</button></div>`;
  }
  modal.classList.remove('hidden');
}

function closeModal() { $('#modal').classList.add('hidden'); }

async function handleFormSubmit(event) {
  event.preventDefault();
  const form=event.target; const data=Object.fromEntries(new FormData(form)); const type=form.dataset.type; const id=form.dataset.id; const schema=formSchemas[type];
  try {
    const numeric=['stock','minimum','unitCost','hours','value','year','hourMeter','maintenanceHour','participants','duration']; numeric.forEach(k=>{if(k in data)data[k]=Number(data[k]);});
    if(type==='course') { const employee=state.employees.find(x=>x.name===data.employee); if(employee)data.employeeRegistration=employee.registration; const path=await uploadFromForm(form,'certificateFile','certificates'); if(path)data.certificate=path; delete data.certificateFile; }
    if(type==='expense') { const path=await uploadFromForm(form,'attachmentFile','expenses'); if(path)data.attachment=path; delete data.attachmentFile; }
    if(schema){ if(id){ const idx=state[schema.collection].findIndex(x=>x.id===id); state[schema.collection][idx]={...state[schema.collection][idx],...data}; } else state[schema.collection].unshift({id:crypto.randomUUID(),...data}); await syncState(`${schema.title} salvo: ${data.name||data.description||data.course||data.code||data.theme}`); toast('Registro salvo com sucesso.'); }
    else if(type==='delivery'){
      const epi=state.epis.find(x=>x.id===id); const employee=state.employees.find(x=>x.name===data.employee); const qty=Number(data.quantity); if(!employee) throw new Error('Funcionário não encontrado');
      const q=await db.rpc('register_epi_delivery',{p_epi_id:epi.id,p_employee_id:employee.id,p_quantity:qty,p_reason:data.reason,p_movement_date:data.date,p_signed:data.signed==='Sim'}); if(q.error) throw q.error; await loadData(); toast('Entrega registrada e estoque atualizado.');
    } else if(type==='maintenance'){
      const forklift=state.forklifts.find(x=>x.id===id); const path=await uploadFromForm(form,'attachmentFile','maintenance'); state.maintenances.unshift({id:crypto.randomUUID(),forkliftId:forklift.id,forklift:forklift.code,type:data.type,priority:data.priority,openedAt:data.openedAt,description:data.description,status:data.status,cost:Number(data.cost),attachment:path}); forklift.status=data.type==='Corretiva'?'Manutenção corretiva':'Manutenção programada'; await syncState(`Ordem de serviço aberta para ${forklift.code}`); toast('Ordem de serviço aberta.');
    } else if(type==='checklist'){
      const forklift=state.forklifts.find(x=>x.id===id); const items=Object.entries(data).filter(([k])=>k.startsWith('item_')).map(([k,v],i)=>({item:i+1,status:v})); const failed=items.filter(i=>i.status==='Não conforme').length;
      const q=await db.from('forklift_checklists').insert({forklift_id:forklift.id,inspection_date:data.date,shift:data.shift,hour_meter:Number(forklift.hourMeter),items,has_critical_failure:failed>0,notes:data.notes||null,inspected_by:currentUser.id}); if(q.error) throw q.error;
      if(failed>0){ const u=await db.from('forklifts').update({status:'interdicted'}).eq('id',forklift.id); if(u.error) throw u.error; }
      await db.from('audit_logs').insert({user_id:currentUser.id,action:`Checklist realizado em ${forklift.code}`,entity_type:'forklift',entity_id:forklift.id}); await loadData(); toast(failed?'Checklist salvo. Equipamento interditado.':'Checklist aprovado.');
    }
    closeModal(); renderPage();
  } catch(error){ console.error(error); toast(error.message||'Não foi possível salvar.'); }
}

async function deleteRecord(collection,id){
  if(!confirm('Confirma o arquivamento deste registro?')) return;
  try{
    let q;
    if(collection==='employees') q=await db.from('employees').update({archived_at:new Date().toISOString(),status:'terminated'}).eq('id',id);
    else if(collection==='epis') q=await db.from('epi_catalog').update({status:'archived'}).eq('id',id);
    else if(collection==='courses') q=await db.from('employee_trainings').delete().eq('id',id);
    else if(collection==='expenses') q=await db.from('expenses').update({archived_at:new Date().toISOString()}).eq('id',id);
    else if(collection==='forklifts') q=await db.from('forklifts').update({archived_at:new Date().toISOString(),status:'retired'}).eq('id',id);
    else if(collection==='dds') q=await db.from('dds_sessions').delete().eq('id',id);
    if(q?.error) throw q.error; await db.from('audit_logs').insert({user_id:currentUser.id,action:`Registro arquivado em ${collection}`,entity_type:collection,entity_id:id}); await loadData(); renderPage(); toast('Registro arquivado.');
  }catch(error){console.error(error);toast(error.message||'Não foi possível arquivar.');}
}

function csvEscape(value) { return `"${String(value ?? '').replaceAll('"','""')}"`; }
function downloadCSV(filename, rows) {
  if (!rows.length) return toast('Não há dados para exportar.');
  const headers = [...new Set(rows.flatMap(row=>Object.keys(row)))];
  const csv = '\ufeff' + [headers.map(csvEscape).join(';'), ...rows.map(row=>headers.map(h=>csvEscape(row[h])).join(';'))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function exportData(type) {
  const map = { employees: state.employees, epis: state.epis, courses: state.courses, expenses: state.expenses, forklifts: state.forklifts, dds: state.dds, notifications: getNotifications() };
  if (type === 'dashboard') return downloadCSV('resumo-dashboard.csv', [{ indicador: 'Funcionários ativos', valor: state.employees.filter(x=>x.status==='Ativo').length }, { indicador: 'Alertas ativos', valor: getNotifications().length }, { indicador: 'Gastos totais', valor: state.expenses.reduce((s,x)=>s+Number(x.value),0) }]);
  if (type === 'all') return downloadCSV('gestao-segura-base-completa.csv', Object.entries(map).flatMap(([module,rows])=>rows.map(row=>({ modulo: module, ...row }))));
  downloadCSV(`${type}.csv`, map[type] || []);
}

function bindEvents() {
  document.addEventListener('click', async (event) => {
    const pageEl=event.target.closest('[data-page]'); if(pageEl)return setPage(pageEl.dataset.page);
    const actionEl=event.target.closest('[data-action]'); if(!actionEl)return; const action=actionEl.dataset.action;
    if(action==='open-form')openForm(actionEl.dataset.form,actionEl.dataset.id||'');
    if(action==='close-modal')closeModal();
    if(action==='delete')await deleteRecord(actionEl.dataset.collection,actionEl.dataset.id);
    if(action==='export')exportData(actionEl.dataset.export);
    if(action==='approve-expense')try{const item=state.expenses.find(x=>x.id===actionEl.dataset.id);item.status='Aprovado';await syncState(`Gasto aprovado: ${item.description}`);toast('Gasto aprovado.');renderPage();}catch(e){toast(e.message);}
    if(action==='complete-dds')try{const item=state.dds.find(x=>x.id===actionEl.dataset.id);const count=Number(prompt('Quantidade de participantes:','10'));if(!Number.isFinite(count))return;item.participants=count;item.status='Concluído';await syncState(`DDS concluído: ${item.theme}`);toast('DDS concluído.');renderPage();}catch(e){toast(e.message);}
    if(action==='refresh-data'){try{await loadData();renderPage();toast('Dados atualizados.');}catch(e){toast(e.message);}}
  });
  document.addEventListener('input',event=>{if(event.target.id==='table-search'){tableSearch=event.target.value;renderPage();setTimeout(()=>$('#table-search')?.focus(),0);}});
  document.addEventListener('change',event=>{if(event.target.id==='table-filter'){tableFilter=event.target.value;renderPage();}});
  $('#modal-form').addEventListener('submit',handleFormSubmit); $('#modal-close').addEventListener('click',closeModal); $('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
  $('#menu-btn').addEventListener('click',()=>$('#sidebar').classList.toggle('open')); $('#notification-btn').addEventListener('click',()=>setPage('notifications'));
  $('#theme-btn').addEventListener('click',()=>{state.settings.theme=state.settings.theme==='dark'?'light':'dark';localStorage.setItem('gst-theme',state.settings.theme);applyTheme();});
  $('#logout-btn').addEventListener('click',logout); $('#global-search').addEventListener('keydown',e=>{if(e.key==='Enter'){tableSearch=e.target.value;setPage('employees');}});
  document.addEventListener('submit',async event=>{if(event.target.id==='settings-form'){event.preventDefault();try{const data=Object.fromEntries(new FormData(event.target));state.settings={...state.settings,...data,monthlyBudget:Number(data.monthlyBudget)};await syncState('Configurações atualizadas');applyTheme();toast('Configurações salvas.');renderPage();}catch(e){toast(e.message);}}});
}

function applyTheme(){document.documentElement.dataset.theme=state.settings.theme||'light';}
function setAuthMode(mode){authMode=mode;const signup=mode==='signup';$('#login-name').classList.toggle('hidden',!signup);$('#login-submit').textContent=signup?'Criar administrador':'Entrar';$('#signup-toggle').textContent=signup?'Já tenho uma conta':'Primeiro acesso: criar administrador';$('#auth-help').textContent=signup?'O primeiro usuário cadastrado recebe perfil de administrador.':'Entre com sua conta do Gestão Segura.';}

async function login(event){
  event?.preventDefault(); const email=$('#login-email').value.trim(); const password=$('#login-password').value; const button=$('#login-submit'); button.disabled=true;
  try{
    if(authMode==='signup'){
      const name=$('#login-name-input').value.trim(); if(!name)throw new Error('Informe seu nome completo.');
      const response=await fetch(`${SUPABASE_URL}/functions/v1/bootstrap-admin`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify({fullName:name,email,password})});
      const payload=await response.json().catch(()=>({})); if(!response.ok)throw new Error(payload.error||'Não foi possível criar o administrador.');
      const result=await db.auth.signInWithPassword({email,password}); if(result.error)throw result.error;
    }else{const result=await db.auth.signInWithPassword({email,password});if(result.error)throw result.error;}
  }catch(error){console.error(error);toast(error.message||'Falha na autenticação.');}finally{button.disabled=false;}
}
async function logout(){await db.auth.signOut();$('#app').classList.add('hidden');$('#login-screen').classList.remove('hidden');state=structuredClone(emptyState);}
async function showApp(session){currentUser=session.user;$('#login-screen').classList.add('hidden');$('#app').classList.remove('hidden');applyTheme();setupNav();$('#page-content').innerHTML='<div class="empty">Carregando dados...</div>';try{await loadData();renderPage();}catch(error){console.error(error);toast(error.message||'Erro ao carregar dados.');}}
async function recoverPassword(){const email=$('#login-email').value.trim();if(!email)return toast('Informe seu e-mail.');const result=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});toast(result.error?result.error.message:'E-mail de recuperação enviado.');}

$('#login-form').addEventListener('submit',login); $('#signup-toggle').addEventListener('click',()=>setAuthMode(authMode==='login'?'signup':'login')); $('#forgot-password').addEventListener('click',recoverPassword);
bindEvents(); setAuthMode('login');
db.auth.onAuthStateChange(async(event,session)=>{if(event==='PASSWORD_RECOVERY'){const password=prompt('Digite sua nova senha (mínimo 8 caracteres):');if(password){const r=await db.auth.updateUser({password});toast(r.error?r.error.message:'Senha atualizada.');}} if(session)await showApp(session);else{$('#app').classList.add('hidden');$('#login-screen').classList.remove('hidden');}});
db.auth.getSession().then(({data})=>{if(data.session)showApp(data.session);});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
