'use strict';

const STORAGE_KEY = 'gestao-segura-sst-v1';
const SESSION_KEY = 'gestao-segura-session';

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

const seedState = {
  employees: [
    { id: crypto.randomUUID(), name: 'João Victor Santos', registration: 'LMP-001', role: 'Líder de Equipe', sector: 'Operações', company: 'BR Soluções', admission: '2023-01-10', phone: '(22) 99999-1001', email: 'joao@empresa.com', status: 'Ativo' },
    { id: crypto.randomUUID(), name: 'Carlos Henrique Lima', registration: 'LMP-014', role: 'Operador de Planta', sector: 'Fluidos', company: 'BR Soluções', admission: '2024-03-11', phone: '(22) 99999-1014', email: 'carlos@empresa.com', status: 'Ativo' },
    { id: crypto.randomUUID(), name: 'Marcos Vinícius Alves', registration: 'LMP-021', role: 'Operador de Empilhadeira', sector: 'Logística', company: 'BR Soluções', admission: '2024-08-05', phone: '(22) 99999-1021', email: 'marcos@empresa.com', status: 'Férias' },
    { id: crypto.randomUUID(), name: 'Ana Paula Ribeiro', registration: 'ADM-007', role: 'Assistente Administrativo', sector: 'Administrativo', company: 'BR Soluções', admission: '2025-02-03', phone: '(22) 99999-2007', email: 'ana@empresa.com', status: 'Ativo' },
    { id: crypto.randomUUID(), name: 'Felipe Souza Braga', registration: 'MNT-009', role: 'Mecânico', sector: 'Manutenção', company: 'BR Soluções', admission: '2025-05-12', phone: '(22) 99999-3009', email: 'felipe@empresa.com', status: 'Ativo' },
  ],
  epis: [
    { id: crypto.randomUUID(), code: 'EPI-001', name: 'Capacete de segurança com jugular', category: 'Proteção da cabeça', ca: '49822', caExpiry: '2027-08-01', size: 'Único', stock: 18, minimum: 10, unitCost: 74.90, location: 'Almoxarifado A', status: 'Ativo' },
    { id: crypto.randomUUID(), code: 'EPI-002', name: 'Óculos de proteção incolor', category: 'Proteção ocular', ca: '11268', caExpiry: '2027-02-18', size: 'Único', stock: 7, minimum: 15, unitCost: 18.50, location: 'Almoxarifado A', status: 'Estoque baixo' },
    { id: crypto.randomUUID(), code: 'EPI-003', name: 'Luva nitrílica química', category: 'Proteção das mãos', ca: '38955', caExpiry: '2026-09-15', size: 'G', stock: 42, minimum: 20, unitCost: 29.80, location: 'Almoxarifado B', status: 'Ativo' },
    { id: crypto.randomUUID(), code: 'EPI-004', name: 'Protetor auricular tipo plug', category: 'Proteção auditiva', ca: '5745', caExpiry: '2028-01-10', size: 'Único', stock: 95, minimum: 30, unitCost: 4.90, location: 'Almoxarifado A', status: 'Ativo' },
    { id: crypto.randomUUID(), code: 'EPI-005', name: 'Macacão RF laranja', category: 'Vestimenta', ca: '42310', caExpiry: '2026-08-28', size: 'GG', stock: 4, minimum: 8, unitCost: 485.00, location: 'Vestiário', status: 'Estoque baixo' },
  ],
  epiDeliveries: [],
  courses: [
    { id: crypto.randomUUID(), employee: 'João Victor Santos', employeeRegistration: 'LMP-001', course: 'NR 35 — Trabalho em Altura', institution: 'Wegas Treinamentos', completedAt: '2025-09-12', expiresAt: '2027-09-12', hours: 8, certificate: 'NR35_Joao.pdf' },
    { id: crypto.randomUUID(), employee: 'Carlos Henrique Lima', employeeRegistration: 'LMP-014', course: 'NR 33 — Espaço Confinado', institution: 'Treina Brasil', completedAt: '2025-08-10', expiresAt: '2026-08-10', hours: 16, certificate: 'NR33_Carlos.pdf' },
    { id: crypto.randomUUID(), employee: 'Marcos Vinícius Alves', employeeRegistration: 'LMP-021', course: 'Operador de Empilhadeira', institution: 'Wegas Treinamentos', completedAt: '2025-07-20', expiresAt: '2026-07-20', hours: 16, certificate: 'Empilhadeira_Marcos.pdf' },
    { id: crypto.randomUUID(), employee: 'Felipe Souza Braga', employeeRegistration: 'MNT-009', course: 'NR 12 — Segurança em Máquinas', institution: 'SENAI', completedAt: '2026-04-02', expiresAt: '2028-04-02', hours: 8, certificate: 'NR12_Felipe.pdf' },
  ],
  expenses: [
    { id: crypto.randomUUID(), date: '2026-07-02', description: 'Aquisição de luvas nitrílicas', category: 'EPI', costCenter: 'CC-SEG-001', supplier: 'Protege Mais', value: 2980, status: 'Pago', document: 'NF 48291' },
    { id: crypto.randomUUID(), date: '2026-07-08', description: 'Manutenção preventiva empilhadeira EMP-02', category: 'Manutenção', costCenter: 'CC-MNT-002', supplier: 'TecFork', value: 4250, status: 'Aprovado', document: 'OS 2026-071' },
    { id: crypto.randomUUID(), date: '2026-07-16', description: 'Treinamento NR 33 — turma operacional', category: 'Treinamentos', costCenter: 'CC-RH-003', supplier: 'Treina Brasil', value: 6800, status: 'Aguardando aprovação', document: 'ORC 9912' },
    { id: crypto.randomUUID(), date: '2026-07-19', description: 'Reposição de extintor da empilhadeira', category: 'Manutenção', costCenter: 'CC-MNT-002', supplier: 'FireSafe', value: 440, status: 'Pago', document: 'NF 10829' },
  ],
  budgets: { EPI: 15000, Manutenção: 18000, Treinamentos: 12000, Outros: 5000 },
  forklifts: [
    { id: crypto.randomUUID(), code: 'EMP-01', asset: 'PAT-00125', manufacturer: 'Toyota', model: '8FG25', capacity: '2,5 t', year: 2022, hourMeter: 1842, location: 'Galpão 1', status: 'Operando', nextMaintenance: '2026-08-15', maintenanceHour: 2000 },
    { id: crypto.randomUUID(), code: 'EMP-02', asset: 'PAT-00131', manufacturer: 'Hyster', model: 'H2.5FT', capacity: '2,5 t', year: 2021, hourMeter: 2965, location: 'Área externa', status: 'Manutenção programada', nextMaintenance: '2026-07-28', maintenanceHour: 3000 },
    { id: crypto.randomUUID(), code: 'EMP-03', asset: 'PAT-00148', manufacturer: 'Yale', model: 'GDP30VX', capacity: '3,0 t', year: 2020, hourMeter: 5120, location: 'Galpão 2', status: 'Interditada', nextMaintenance: '2026-07-20', maintenanceHour: 5100 },
  ],
  maintenances: [
    { id: crypto.randomUUID(), forklift: 'EMP-02', type: 'Preventiva', priority: 'Média', openedAt: '2026-07-22', description: 'Revisão de 3.000 horas', status: 'Em andamento', cost: 4250 },
    { id: crypto.randomUUID(), forklift: 'EMP-03', type: 'Corretiva', priority: 'Crítica', openedAt: '2026-07-20', description: 'Vazamento hidráulico no mastro', status: 'Aguardando peça', cost: 7800 },
  ],
  checklists: [],
  dds: [
    { id: crypto.randomUUID(), date: '2026-07-23', time: '07:00', theme: 'Movimentação segura de cargas', sector: 'Operações', leader: 'João Victor Santos', participants: 14, status: 'Concluído', duration: 20 },
    { id: crypto.randomUUID(), date: '2026-07-24', time: '07:00', theme: 'Uso correto de EPI', sector: 'Fluidos', leader: 'Carlos Henrique Lima', participants: 12, status: 'Concluído', duration: 15 },
    { id: crypto.randomUUID(), date: '2026-07-25', time: '07:00', theme: 'Prevenção de prensamento de mãos', sector: 'Logística', leader: 'João Victor Santos', participants: 0, status: 'Programado', duration: 20 },
  ],
  audit: [
    { id: crypto.randomUUID(), date: new Date().toISOString(), user: 'Sistema', action: 'Base demonstrativa inicial criada' },
  ],
  settings: { company: 'BR Soluções', unit: 'Porto do Açu — LMP', monthlyBudget: 50000, theme: 'light' },
};

let state = loadState();
let currentPage = 'dashboard';
let tableSearch = '';
let tableFilter = 'Todos';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const currency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const number = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));
const dateBR = (value) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)) : '—';
const todayISO = () => new Date().toISOString().slice(0, 10);
const initials = (name) => name.split(' ').slice(0, 2).map(v => v[0]).join('').toUpperCase();
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...structuredClone(seedState), ...JSON.parse(saved) } : structuredClone(seedState);
  } catch {
    return structuredClone(seedState);
  }
}

function saveState(action = '') {
  if (action) state.audit.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), user: 'João Victor', action });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateNotificationCount();
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
  const monthlyData = [18.2, 21.5, 16.8, 24.1, 19.7, Math.max(monthExpenses / 1000, 1)];
  const labels = ['Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];

  $('#page-content').innerHTML = `
    <div class="toolbar"><div><h3 style="margin:0">Bom dia, João Victor</h3><p class="muted" style="margin:5px 0 0">Acompanhe os indicadores críticos da operação.</p></div><div class="toolbar-right"><button class="btn" data-action="export" data-export="dashboard">Exportar resumo</button><button class="btn primary" data-page="notifications">Ver alertas</button></div></div>
    <div class="metrics">
      ${metric('Funcionários ativos', activeEmployees, '◎', `${state.employees.length} cadastrados`)}
      ${metric('EPIs com estoque baixo', lowStock, '⬡', lowStock ? 'Ação necessária' : 'Estoque regular', !lowStock)}
      ${metric('Cursos vencidos', expiredCourses, '▤', expiredCourses ? 'Regularizar' : 'Conformidade total', !expiredCourses)}
      ${metric('Gastos no mês', currency(monthExpenses), 'R$', `${Math.round(monthExpenses / state.settings.monthlyBudget * 100)}% do orçamento`, monthExpenses <= state.settings.monthlyBudget)}
      ${metric('Empilhadeiras operacionais', `${availableForklifts}/${state.forklifts.length}`, '▰', `${state.forklifts.filter(x=>x.status==='Interditada').length} interditada(s)`, availableForklifts === state.forklifts.length)}
      ${metric('DDS realizados no mês', ddsMonth, '◉', `${state.dds.reduce((s,x)=>s+Number(x.participants),0)} participações`)}
      ${metric('Ordens de manutenção', state.maintenances.length, '⚒', `${state.maintenances.filter(x=>x.status!=='Concluída').length} abertas`, false)}
      ${metric('Alertas ativos', getNotifications().length, '♢', 'Central de notificações', getNotifications().length === 0)}
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-header"><div><p class="eyebrow">FINANCEIRO</p><h3>Evolução de gastos mensais</h3></div><strong>${currency(monthExpenses)}</strong></div><div class="bars">${monthlyData.map((value,i)=>`<div class="bar-wrap"><div class="bar" title="${currency(value*1000)}" style="height:${Math.max(8, Math.min(100, value/30*100))}%"></div><small>${labels[i]}</small></div>`).join('')}</div></section>
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
  $('#page-content').innerHTML = `<div class="toolbar"><div><h3 style="margin:0">Configurações</h3><p class="muted" style="margin:5px 0 0">Dados da unidade, orçamento e armazenamento.</p></div></div><section class="panel"><form id="settings-form" class="form-grid" style="padding:0"><label>Empresa<input name="company" value="${escapeHtml(state.settings.company)}" /></label><label>Unidade / base<input name="unit" value="${escapeHtml(state.settings.unit)}" /></label><label>Orçamento mensal (R$)<input type="number" min="0" step="0.01" name="monthlyBudget" value="${state.settings.monthlyBudget}" /></label><label>Tema<select name="theme"><option value="light" ${state.settings.theme==='light'?'selected':''}>Claro</option><option value="dark" ${state.settings.theme==='dark'?'selected':''}>Escuro</option></select></label><div class="form-actions"><button type="button" class="btn danger" data-action="reset-demo">Restaurar demonstração</button><button type="submit" class="btn primary">Salvar configurações</button></div></form></section><section class="panel" style="margin-top:16px"><div class="panel-header"><div><p class="eyebrow">ARQUITETURA</p><h3>Status da integração</h3></div>${badge('Modo local','info')}</div><p class="muted">Esta primeira versão funciona com armazenamento local no navegador. O repositório inclui o esquema SQL completo para ativar o Supabase com autenticação, RLS e armazenamento de documentos.</p></section>`;
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
      ['employee','Funcionário','select',true,()=>state.employees.map(x=>x.name)], ['employeeRegistration','Matrícula','text',true], ['course','Curso / treinamento','text',true], ['institution','Instituição','text',true], ['completedAt','Data de realização','date',true], ['expiresAt','Validade','date',true], ['hours','Carga horária','number',true], ['certificate','Nome do certificado','text',false]
    ]
  },
  expense: {
    title: 'Lançamento de gasto', collection: 'expenses', fields: [
      ['date','Data','date',true], ['description','Descrição','text',true], ['category','Categoria','select',true,['EPI','Manutenção','Treinamentos','Combustível','Serviços','Outros']], ['costCenter','Centro de custo','text',true], ['supplier','Fornecedor','text',true], ['document','Nota / documento','text',false], ['value','Valor (R$)','number',true], ['status','Status','select',true,['Previsto','Solicitado','Aguardando aprovação','Aprovado','Pago','Cancelado']]
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
    form.innerHTML = `${formField(['type','Tipo','select',true,['Preventiva','Corretiva','Inspeção']])}${formField(['priority','Prioridade','select',true,['Baixa','Média','Alta','Crítica']])}${formField(['openedAt','Data de abertura','date',true],todayISO())}<label>Status<select name="status" required><option>Aberta</option><option>Em andamento</option><option>Aguardando peça</option><option>Concluída</option></select></label><label class="span-2">Descrição<textarea name="description" required></textarea></label>${formField(['cost','Custo previsto','number',true],0)}<div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Abrir ordem</button></div>`;
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

function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  const type = form.dataset.type;
  const id = form.dataset.id;
  const schema = formSchemas[type];
  if (schema) {
    const numeric = ['stock','minimum','unitCost','hours','value','year','hourMeter','maintenanceHour','participants','duration'];
    numeric.forEach(key => { if (key in data) data[key] = Number(data[key]); });
    if (type === 'course') {
      const employee = state.employees.find(x=>x.name===data.employee);
      if (employee) data.employeeRegistration = employee.registration;
    }
    if (id) {
      const idx = state[schema.collection].findIndex(x=>x.id===id);
      state[schema.collection][idx] = { ...state[schema.collection][idx], ...data };
      saveState(`${schema.title} atualizado: ${data.name || data.description || data.course || data.code || data.theme}`);
    } else {
      state[schema.collection].unshift({ id: crypto.randomUUID(), ...data });
      saveState(`${schema.title} cadastrado: ${data.name || data.description || data.course || data.code || data.theme}`);
    }
    toast('Registro salvo com sucesso.');
  } else if (type === 'delivery') {
    const epi = state.epis.find(x=>x.id===id);
    const qty = Number(data.quantity);
    if (qty <= 0 || qty > Number(epi.stock)) return toast('Quantidade inválida ou acima do estoque.');
    epi.stock = Number(epi.stock) - qty;
    state.epiDeliveries.unshift({ id: crypto.randomUUID(), epiId: epi.id, epi: epi.name, employee: data.employee, quantity: qty, date: data.date, reason: data.reason, signed: data.signed === 'Sim' });
    saveState(`EPI entregue: ${epi.name} para ${data.employee}`);
    toast('Entrega registrada e estoque atualizado.');
  } else if (type === 'maintenance') {
    const forklift = state.forklifts.find(x=>x.id===id);
    state.maintenances.unshift({ id: crypto.randomUUID(), forklift: forklift.code, type: data.type, priority: data.priority, openedAt: data.openedAt, description: data.description, status: data.status, cost: Number(data.cost) });
    forklift.status = data.type === 'Corretiva' ? 'Manutenção corretiva' : 'Manutenção programada';
    saveState(`Ordem de serviço aberta para ${forklift.code}`);
    toast('Ordem de serviço aberta.');
  } else if (type === 'checklist') {
    const forklift = state.forklifts.find(x=>x.id===id);
    const failed = Object.entries(data).filter(([key,value])=>key.startsWith('item_') && value === 'Não conforme').length;
    state.checklists.unshift({ id: crypto.randomUUID(), forklift: forklift.code, date: data.date, shift: data.shift, failed, notes: data.notes });
    if (failed > 0) forklift.status = 'Interditada';
    saveState(`Checklist realizado em ${forklift.code}${failed ? ` com ${failed} não conformidade(s)` : ''}`);
    toast(failed ? 'Checklist salvo. Equipamento interditado por não conformidade.' : 'Checklist aprovado.');
  }
  closeModal();
  renderPage();
}

function deleteRecord(collection, id) {
  const record = state[collection].find(x=>x.id===id);
  if (!record || !confirm('Confirma a remoção deste registro?')) return;
  state[collection] = state[collection].filter(x=>x.id!==id);
  saveState(`Registro removido de ${collection}`);
  toast('Registro removido.');
  renderPage();
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
  document.addEventListener('click', (event) => {
    const pageEl = event.target.closest('[data-page]');
    if (pageEl) return setPage(pageEl.dataset.page);
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'open-form') openForm(actionEl.dataset.form, actionEl.dataset.id || '');
    if (action === 'close-modal') closeModal();
    if (action === 'delete') deleteRecord(actionEl.dataset.collection, actionEl.dataset.id);
    if (action === 'export') exportData(actionEl.dataset.export);
    if (action === 'approve-expense') {
      const item = state.expenses.find(x=>x.id===actionEl.dataset.id); item.status = 'Aprovado'; saveState(`Gasto aprovado: ${item.description}`); toast('Gasto aprovado.'); renderPage();
    }
    if (action === 'complete-dds') {
      const item = state.dds.find(x=>x.id===actionEl.dataset.id); const count = Number(prompt('Quantidade de participantes:', '10')); if (!Number.isFinite(count)) return; item.participants = count; item.status = 'Concluído'; saveState(`DDS concluído: ${item.theme}`); toast('DDS concluído.'); renderPage();
    }
    if (action === 'reset-demo' && confirm('Restaurar todos os dados de demonstração?')) { state = structuredClone(seedState); saveState('Base demonstrativa restaurada'); applyTheme(); renderPage(); toast('Demonstração restaurada.'); }
  });
  document.addEventListener('input', (event) => {
    if (event.target.id === 'table-search') { tableSearch = event.target.value; renderPage(); setTimeout(()=>$('#table-search')?.focus(),0); }
  });
  document.addEventListener('change', (event) => {
    if (event.target.id === 'table-filter') { tableFilter = event.target.value; renderPage(); }
  });
  $('#modal-form').addEventListener('submit', handleFormSubmit);
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#notification-btn').addEventListener('click', () => setPage('notifications'));
  $('#theme-btn').addEventListener('click', () => { state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; saveState('Tema alterado'); applyTheme(); });
  $('#logout-btn').addEventListener('click', logout);
  $('#global-search').addEventListener('keydown', e => { if (e.key === 'Enter') { tableSearch = e.target.value; setPage('employees'); } });
  document.addEventListener('submit', event => {
    if (event.target.id === 'settings-form') {
      event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); state.settings = { ...state.settings, ...data, monthlyBudget: Number(data.monthlyBudget) }; saveState('Configurações atualizadas'); applyTheme(); toast('Configurações salvas.'); renderPage();
    }
  });
}

function applyTheme() { document.documentElement.dataset.theme = state.settings.theme || 'light'; }

function login(event) {
  event?.preventDefault();
  const email = $('#login-email').value;
  const password = $('#login-password').value;
  if (email !== 'admin@gestaosegura.local' || password !== 'admin123') return toast('E-mail ou senha inválidos.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name: 'João Victor', role: 'Administrador' }));
  showApp();
}
function logout() { localStorage.removeItem(SESSION_KEY); $('#app').classList.add('hidden'); $('#login-screen').classList.remove('hidden'); }
function showApp() { $('#login-screen').classList.add('hidden'); $('#app').classList.remove('hidden'); applyTheme(); setupNav(); renderPage(); }

$('#login-form').addEventListener('submit', login);
$('#demo-login').addEventListener('click', () => { $('#login-email').value='admin@gestaosegura.local'; $('#login-password').value='admin123'; login(); });
bindEvents();
if (localStorage.getItem(SESSION_KEY)) showApp();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
