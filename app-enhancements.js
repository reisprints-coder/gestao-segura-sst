'use strict';

(() => {
  const ICON_PATHS = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
    hardHat: '<path d="M2 18a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2z"/><path d="M6 16v-3a6 6 0 0 1 12 0v3"/><path d="M10 6V3h4v3"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="m9 13 2 2 4-4"/><path d="M9 8h6"/>',
    graduation: '<path d="m22 10-10-5L2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v6"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/><path d="M16 13h4"/>',
    forklift: '<path d="M3 4h6v11H3z"/><path d="M9 9h5l3 4v2H9"/><circle cx="6" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M19 4v11h3"/>',
    message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8"/><path d="M8 13h5"/>',
    report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2v5H8z"/><path d="M12 10h2v8h-2z"/><path d="M16 15h2v3h-2z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21H9.6v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.26.36.47.77.6 1 .1.33.16.67.16 1H21v4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    alert: '<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    refresh: '<path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5-5l2.3 2.3-3 3-2.3-2.3a4 4 0 0 0 5 5L20 17.6 17.6 20z"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 11h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'
  };

  function uiIcon(name, size = 18, extra = '') {
    const paths = ICON_PATHS[name] || ICON_PATHS.check;
    return `<svg class="ui-icon ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  const styles = `
    .ui-icon{display:inline-block;flex:0 0 auto;vertical-align:-.18em}
    .nav-icon{display:grid!important;place-items:center!important;width:22px!important;height:22px!important}
    .nav-icon .ui-icon{width:19px;height:19px}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px}
    .icon-btn .ui-icon{width:19px;height:19px}
    .sidebar-backdrop{display:none;position:fixed;inset:0;background:rgba(4,18,22,.55);z-index:19;backdrop-filter:blur(2px)}
    .sidebar-backdrop.show{display:block}
    .people-grid,.daily-checklist-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
    .person-card,.daily-check-card{border:1px solid var(--border);border-radius:18px;background:var(--surface);padding:18px;box-shadow:0 8px 24px rgba(24,47,54,.04);min-width:0}
    .person-head,.daily-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .person-main{display:flex;gap:12px;min-width:0}.person-main>div{min-width:0}.person-main h3,.daily-check-card h3{margin:0 0 5px}.person-main p,.daily-check-card p{margin:0}
    .person-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}.person-meta .spec{min-width:0}
    .card-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}
    .daily-status{display:flex;align-items:center;gap:10px;padding:12px;border-radius:13px;background:var(--surface-2);margin:16px 0}
    .daily-status.ok{color:var(--success)}.daily-status.fail{color:var(--danger)}.daily-status.pending{color:var(--warning)}
    .daily-status .status-icon{width:34px;height:34px;border-radius:10px;background:var(--surface);display:grid;place-items:center}
    .daily-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
    .summary-chip{border:1px solid var(--border);background:var(--surface);border-radius:15px;padding:15px;display:flex;align-items:center;gap:12px}
    .summary-chip .summary-icon{width:42px;height:42px;border-radius:12px;background:var(--surface-2);display:grid;place-items:center;color:var(--primary)}
    .summary-chip strong,.summary-chip small{display:block}.summary-chip strong{font-size:22px}.summary-chip small{color:var(--muted);margin-top:2px}
    .section-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:22px 0 12px}.section-heading h3{margin:0}
    .inventory-stock{font-size:22px;font-weight:900}.inventory-stock.low{color:var(--danger)}
    .stock-meter{height:8px;border-radius:999px;background:var(--surface-2);overflow:hidden;margin-top:8px}.stock-meter>span{display:block;height:100%;background:var(--primary)}.stock-meter.low>span{background:var(--danger)}
    .compact-actions{display:flex;gap:6px;flex-wrap:wrap;min-width:max-content}
    @media(max-width:1100px){.people-grid,.daily-checklist-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:820px){
      .sidebar-backdrop.show{display:block}.topbar{height:auto;min-height:72px}.topbar h2{font-size:19px}.top-actions{margin-left:auto}
      .people-grid,.daily-checklist-grid{grid-template-columns:1fr}.daily-summary{grid-template-columns:1fr 1fr}.toolbar{align-items:flex-start}.toolbar-right{width:100%;display:grid;grid-template-columns:1fr 1fr}.toolbar-right .input,.toolbar-right .select{width:100%}.toolbar-right .btn{width:100%}
      .table-card,.panel{border-radius:14px}.page-content{overflow-x:hidden}.table-wrap{-webkit-overflow-scrolling:touch}.actions{flex-wrap:wrap;min-width:max-content}
    }
    @media(max-width:560px){
      .daily-summary{grid-template-columns:1fr}.person-meta{grid-template-columns:1fr}.toolbar-right{grid-template-columns:1fr}.topbar{gap:10px}.topbar>div:nth-child(2){min-width:0}.topbar .eyebrow{display:none}.topbar h2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48vw}.page-content{padding:14px 10px}.person-card,.daily-check-card{padding:15px}.card-actions .btn{flex:1}.modal{padding:8px}.modal-card{max-height:96vh;border-radius:16px}
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'app-enhancements-style';
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const enhancedNav = [
    ['dashboard', uiIcon('dashboard'), 'Dashboard'],
    ['people', uiIcon('userPlus'), 'Cadastro de Pessoas'],
    ['epi-registration', uiIcon('hardHat'), 'Cadastro de EPI'],
    ['epi-inventory', uiIcon('package'), 'Inventário de EPI'],
    ['courses', uiIcon('graduation'), 'Cursos e documentos'],
    ['expenses', uiIcon('wallet'), 'Controle de gastos'],
    ['forklifts', uiIcon('forklift'), 'Empilhadeiras'],
    ['daily-checklist', uiIcon('clipboard'), 'Checklist Diário'],
    ['dds', uiIcon('message'), 'DDS'],
    ['reports', uiIcon('report'), 'Relatórios'],
    ['notifications', uiIcon('bell'), 'Notificações'],
    ['settings', uiIcon('settings'), 'Configurações'],
  ];
  navItems.splice(0, navItems.length, ...enhancedNav);

  const baseSetupNav = setupNav;
  const baseSetPage = setPage;
  const baseRenderPage = renderPage;
  const baseOpenForm = openForm;
  let inventoryMovements = [];
  let inventoryLoading = false;

  setupNav = function enhancedSetupNav() {
    baseSetupNav();
    document.querySelectorAll('.nav-item').forEach(button => button.setAttribute('title', button.textContent.trim()));
  };

  setPage = function enhancedSetPage(page) {
    if (page === 'employees') page = 'people';
    if (page === 'epis') page = 'epi-inventory';
    baseSetPage(page);
    document.getElementById('sidebar-backdrop')?.classList.remove('show');
    queueMicrotask(enhanceAllIcons);
  };

  renderPage = function enhancedRenderPage() {
    if (currentPage === 'people') renderPeople();
    else if (currentPage === 'epi-registration') renderEpiRegistration();
    else if (currentPage === 'epi-inventory') renderEpiInventory();
    else if (currentPage === 'daily-checklist') renderDailyChecklist();
    else baseRenderPage();
    updateNotificationCount();
    queueMicrotask(enhanceAllIcons);
  };

  openForm = function enhancedOpenForm(type, id = '') {
    if (type === 'inventory-entry') {
      openInventoryEntry(id);
      return;
    }
    baseOpenForm(type, id);
    queueMicrotask(enhanceAllIcons);
  };

  function canManage() {
    return ['admin', 'manager'].includes(state.profile?.role);
  }

  function customToolbar(title, subtitle, actionLabel, actionType, exportType, filters = '') {
    return `<div class="toolbar"><div><h3 style="margin:0">${escapeHtml(title)}</h3><p class="muted" style="margin:5px 0 0">${escapeHtml(subtitle)}</p></div><div class="toolbar-right"><input id="table-search" class="input" placeholder="Buscar..." value="${escapeHtml(tableSearch)}" />${filters}<button class="btn" data-action="export" data-export="${exportType}">Exportar CSV</button><button class="btn primary" data-action="open-form" data-form="${actionType}">+ ${escapeHtml(actionLabel)}</button></div></div>`;
  }

  function renderPeople() {
    const rows = state.employees.filter(x => [x.name, x.registration, x.role, x.sector, x.company, x.status].join(' ').toLowerCase().includes(tableSearch.toLowerCase()) && (tableFilter === 'Todos' || x.status === tableFilter));
    const filters = `<select id="table-filter" class="select"><option>Todos</option>${['Ativo','Férias','Afastado','Desligado'].map(x=>`<option ${tableFilter===x?'selected':''}>${x}</option>`).join('')}</select>`;
    $('#page-content').innerHTML = `${customToolbar('Cadastro de Pessoas','Cadastre funcionários, terceiros e responsáveis vinculados à operação.','Cadastrar pessoa','employee','employees',filters)}
      <div class="daily-summary">
        <div class="summary-chip"><span class="summary-icon">${uiIcon('users',22)}</span><span><strong>${state.employees.length}</strong><small>Pessoas cadastradas</small></span></div>
        <div class="summary-chip"><span class="summary-icon">${uiIcon('checkCircle',22)}</span><span><strong>${state.employees.filter(x=>x.status==='Ativo').length}</strong><small>Ativas</small></span></div>
        <div class="summary-chip"><span class="summary-icon">${uiIcon('calendar',22)}</span><span><strong>${state.employees.filter(x=>x.status==='Férias').length}</strong><small>Em férias</small></span></div>
      </div>
      <div class="people-grid">${rows.map(x=>`<article class="person-card"><div class="person-head"><div class="person-main"><span class="entity-avatar">${initials(x.name)}</span><div><h3>${escapeHtml(x.name)}</h3><p class="muted">${escapeHtml(x.registration)}</p></div></div>${badge(x.status)}</div><div class="person-meta"><div class="spec"><small>Cargo</small><strong>${escapeHtml(x.role)}</strong></div><div class="spec"><small>Setor</small><strong>${escapeHtml(x.sector)}</strong></div><div class="spec"><small>Empresa</small><strong>${escapeHtml(x.company)}</strong></div><div class="spec"><small>Admissão</small><strong>${dateBR(x.admission)}</strong></div></div><p class="muted">${escapeHtml(x.phone||'Sem telefone')}<br>${escapeHtml(x.email||'Sem e-mail')}</p><div class="card-actions"><button class="btn small" data-action="open-form" data-form="employee" data-id="${x.id}">Editar</button>${canManage()?`<button class="btn small danger" data-action="delete" data-collection="employees" data-id="${x.id}">Arquivar</button>`:''}</div></article>`).join('') || '<div class="empty">Nenhuma pessoa encontrada.</div>'}</div>`;
  }

  function renderEpiRegistration() {
    const rows = state.epis.filter(x => [x.code,x.name,x.category,x.ca,x.size,x.location,x.status].join(' ').toLowerCase().includes(tableSearch.toLowerCase()) && (tableFilter === 'Todos' || x.category === tableFilter));
    const categories = [...new Set(state.epis.map(x=>x.category))];
    const filters = `<select id="table-filter" class="select"><option>Todos</option>${categories.map(x=>`<option ${tableFilter===x?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select>`;
    $('#page-content').innerHTML = `${customToolbar('Cadastro de EPI','Catálogo de EPIs, CA, tamanhos, custos e locais de armazenamento.','Cadastrar EPI','epi','epis',filters)}
      <div class="table-card"><div class="table-wrap"><table><thead><tr><th>EPI</th><th>Categoria</th><th>CA / validade</th><th>Tamanho</th><th>Custo</th><th>Local</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="entity"><span class="entity-avatar">${uiIcon('hardHat',17)}</span><span><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.code)}</small></span></div></td><td>${escapeHtml(x.category)}</td><td><strong>CA ${escapeHtml(x.ca)}</strong><br><span class="muted">${dateBR(x.caExpiry)}</span></td><td>${escapeHtml(x.size)}</td><td>${currency(x.unitCost)}</td><td>${escapeHtml(x.location)}</td><td>${badge(x.status)}</td><td><div class="compact-actions"><button class="btn small" data-action="open-form" data-form="epi" data-id="${x.id}">Editar</button>${canManage()?`<button class="btn small danger" data-action="delete" data-collection="epis" data-id="${x.id}">Arquivar</button>`:''}</div></td></tr>`).join('') || '<tr><td colspan="8"><div class="empty">Nenhum EPI cadastrado.</div></td></tr>'}</tbody></table></div></div>`;
  }

  async function ensureInventoryHistory(force = false) {
    if (inventoryLoading || (inventoryMovements.length && !force)) return;
    inventoryLoading = true;
    const q = await db.from('epi_movements').select('*').order('movement_at',{ascending:false}).limit(80);
    if (!q.error) inventoryMovements = q.data || [];
    inventoryLoading = false;
    if (currentPage === 'epi-inventory') renderEpiInventory();
  }

  function renderEpiInventory() {
    const rows = state.epis.filter(x => [x.code,x.name,x.category,x.location].join(' ').toLowerCase().includes(tableSearch.toLowerCase()));
    const totalUnits = state.epis.reduce((s,x)=>s+Number(x.stock),0);
    const totalValue = state.epis.reduce((s,x)=>s+Number(x.stock)*Number(x.unitCost),0);
    const lowCount = state.epis.filter(x=>Number(x.stock)<=Number(x.minimum)).length;
    $('#page-content').innerHTML = `${customToolbar('Inventário de EPI','Saldos, entradas, entregas e rastreabilidade do estoque.','Cadastrar EPI','epi','epis')}
      <div class="daily-summary"><div class="summary-chip"><span class="summary-icon">${uiIcon('package',22)}</span><span><strong>${number(totalUnits)}</strong><small>Unidades em estoque</small></span></div><div class="summary-chip"><span class="summary-icon">${uiIcon('wallet',22)}</span><span><strong>${currency(totalValue)}</strong><small>Valor total</small></span></div><div class="summary-chip"><span class="summary-icon">${uiIcon('alert',22)}</span><span><strong>${lowCount}</strong><small>Itens abaixo do mínimo</small></span></div></div>
      <div class="table-card"><div class="table-wrap"><table><thead><tr><th>EPI</th><th>Local</th><th>Saldo</th><th>Mínimo</th><th>Valor</th><th>CA</th><th>Ações</th></tr></thead><tbody>${rows.map(x=>{const low=Number(x.stock)<=Number(x.minimum);const max=Math.max(Number(x.minimum)*2,Number(x.stock),1);const pct=Math.min(100,Math.round(Number(x.stock)/max*100));return `<tr><td><div class="entity"><span class="entity-avatar">${uiIcon('package',17)}</span><span><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.code)} • ${escapeHtml(x.category)}</small></span></div></td><td>${escapeHtml(x.location)}</td><td><div class="inventory-stock ${low?'low':''}">${number(x.stock)}</div><div class="stock-meter ${low?'low':''}"><span style="width:${pct}%"></span></div></td><td>${number(x.minimum)}</td><td>${currency(Number(x.stock)*Number(x.unitCost))}</td><td>${dateBR(x.caExpiry)}</td><td><div class="compact-actions"><button class="btn small" data-action="open-form" data-form="inventory-entry" data-id="${x.id}">Entrada</button><button class="btn small primary" data-action="open-form" data-form="delivery" data-id="${x.id}">Entregar</button><button class="btn small" data-action="open-form" data-form="epi" data-id="${x.id}">Editar</button></div></td></tr>`}).join('') || '<tr><td colspan="7"><div class="empty">Nenhum EPI no inventário.</div></td></tr>'}</tbody></table></div></div>
      <div class="section-heading"><div><p class="eyebrow">MOVIMENTAÇÕES</p><h3>Histórico recente</h3></div><button class="btn small" data-action="refresh-inventory">Atualizar</button></div>
      <section class="panel"><div class="table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>EPI</th><th>Quantidade</th><th>Funcionário / motivo</th></tr></thead><tbody>${inventoryMovements.length?inventoryMovements.map(m=>{const epi=state.epis.find(e=>e.id===m.epi_id);const employee=state.employees.find(e=>e.id===m.employee_id);const type=({entry:'Entrada',delivery:'Entrega',return:'Devolução',adjustment:'Ajuste'})[m.movement_type]||m.movement_type;return `<tr><td>${new Date(m.movement_at).toLocaleString('pt-BR')}</td><td>${badge(type,m.movement_type==='entry'?'success':m.movement_type==='delivery'?'info':'warning')}</td><td>${escapeHtml(epi?.name||'EPI')}</td><td><strong>${number(m.quantity)}</strong></td><td>${escapeHtml(employee?.name||m.reason||'—')}</td></tr>`}).join(''):`<tr><td colspan="5"><div class="empty">${inventoryLoading?'Carregando movimentações...':'Nenhuma movimentação encontrada.'}</div></td></tr>`}</tbody></table></div></section>`;
    if (!inventoryMovements.length && !inventoryLoading) ensureInventoryHistory();
  }

  function openInventoryEntry(epiId) {
    const epi = state.epis.find(x=>x.id===epiId);
    if (!epi) return toast('EPI não encontrado.');
    $('#modal-kicker').textContent = 'MOVIMENTAÇÃO DE ESTOQUE';
    $('#modal-title').textContent = `Entrada — ${epi.code}`;
    const form = $('#modal-form');
    form.dataset.type = 'inventory-entry';
    form.dataset.id = epiId;
    form.innerHTML = `<label>EPI<input value="${escapeHtml(epi.name)}" disabled></label><label>Saldo atual<input value="${number(epi.stock)}" disabled></label><label>Quantidade recebida<input type="number" min="0.01" step="0.01" name="quantity" required></label><label>Data do recebimento<input type="date" name="date" value="${todayISO()}" required></label><label>Número do lote<input name="batchNumber" placeholder="Ex.: LOTE-2026-001" required></label><label>Fornecedor<input name="supplier" required></label><label>Nota fiscal<input name="invoice"></label><label>Custo unitário (R$)<input type="number" min="0" step="0.01" name="unitCost" value="${Number(epi.unitCost||0)}"></label><label class="span-2">Observação<textarea name="reason" placeholder="Motivo da entrada ou observação"></textarea></label><div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Registrar entrada</button></div>`;
    $('#modal').classList.remove('hidden');
    queueMicrotask(enhanceAllIcons);
  }

  function renderDailyChecklist() {
    const today = todayISO();
    const todays = state.checklists.filter(c=>String(c.date).slice(0,10)===today);
    const completed = state.forklifts.filter(f=>todays.some(c=>c.forkliftId===f.id)).length;
    const withFailure = todays.filter(c=>Number(c.failed)>0).length;
    $('#page-content').innerHTML = `<div class="toolbar"><div><h3 style="margin:0">Checklist Diário das Empilhadeiras</h3><p class="muted" style="margin:5px 0 0">Inspeção pré-uso obrigatória por equipamento e por turno.</p></div><div class="toolbar-right"><button class="btn" data-action="export-checklists">Exportar histórico</button></div></div>
      <div class="daily-summary"><div class="summary-chip"><span class="summary-icon">${uiIcon('forklift',22)}</span><span><strong>${state.forklifts.length}</strong><small>Empilhadeiras cadastradas</small></span></div><div class="summary-chip"><span class="summary-icon">${uiIcon('checkCircle',22)}</span><span><strong>${completed}</strong><small>Checklist feito hoje</small></span></div><div class="summary-chip"><span class="summary-icon">${uiIcon('alert',22)}</span><span><strong>${withFailure}</strong><small>Com não conformidade</small></span></div></div>
      <div class="daily-checklist-grid">${state.forklifts.map(f=>{const checks=todays.filter(c=>c.forkliftId===f.id);const latest=checks[0];const status=!latest?'pending':Number(latest.failed)>0?'fail':'ok';const statusText=!latest?'Pendente hoje':Number(latest.failed)>0?`${latest.failed} não conformidade(s)`:'Checklist aprovado';const iconName=!latest?'clock':Number(latest.failed)>0?'alert':'checkCircle';return `<article class="daily-check-card"><div class="daily-card-head"><div><p class="eyebrow">${escapeHtml(f.asset||'SEM PATRIMÔNIO')}</p><h3>${escapeHtml(f.code)} • ${escapeHtml(f.manufacturer)}</h3><p class="muted">${escapeHtml(f.model)} — ${escapeHtml(f.location)}</p></div>${badge(f.status)}</div><div class="daily-status ${status}"><span class="status-icon">${uiIcon(iconName,19)}</span><span><strong>${statusText}</strong><small>${latest?`${escapeHtml(latest.shift)} • ${dateBR(latest.date)}`:'Realize antes de operar'}</small></span></div><div class="card-actions"><button class="btn small primary" data-action="open-form" data-form="checklist" data-id="${f.id}">${latest?'Refazer checklist':'Realizar checklist'}</button><button class="btn small" data-page="forklifts">Ver equipamento</button></div></article>`}).join('') || '<div class="empty">Cadastre uma empilhadeira para iniciar os checklists.</div>'}</div>
      <div class="section-heading"><div><p class="eyebrow">HISTÓRICO</p><h3>Checklists realizados</h3></div></div><div class="table-card"><div class="table-wrap"><table><thead><tr><th>Data</th><th>Empilhadeira</th><th>Turno</th><th>Resultado</th><th>Observações</th><th>Ações</th></tr></thead><tbody>${state.checklists.map(c=>`<tr><td>${dateBR(c.date)}</td><td><strong>${escapeHtml(c.forklift)}</strong></td><td>${escapeHtml(c.shift)}</td><td>${Number(c.failed)>0?badge(`${c.failed} não conforme`,'danger'):badge('Aprovado','success')}</td><td>${escapeHtml(c.notes||'—')}</td><td>${canManage()?`<button class="btn small danger" data-action="delete-checklist" data-id="${c.id}">Excluir</button>`:'—'}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Nenhum checklist realizado.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function enhanceAllIcons() {
    const fixed = [
      ['menu-btn','menu'],['theme-btn','moon'],['logout-btn','logout'],['modal-close','x']
    ];
    fixed.forEach(([id,name])=>{const el=document.getElementById(id);if(el && !el.dataset.iconized){el.innerHTML=uiIcon(name);el.dataset.iconized='1';}});
    const notificationButton = document.getElementById('notification-btn');
    if (notificationButton && !notificationButton.dataset.iconized) {
      const count = document.getElementById('notification-count')?.textContent || '0';
      notificationButton.innerHTML = `${uiIcon('bell')}<span id="notification-count">${count}</span>`;
      notificationButton.dataset.iconized='1';
    }
    document.querySelectorAll('.btn:not([data-iconized])').forEach(button=>{
      const text=button.textContent.trim().toLowerCase();
      let name='';
      if(text.startsWith('+')||text.includes('cadastrar')||text.includes('novo')||text.includes('nova')) name='plus';
      else if(text.includes('editar')) name='edit';
      else if(text.includes('arquivar')||text.includes('excluir')) name='trash';
      else if(text.includes('exportar')) name='download';
      else if(text.includes('salvar')||text.includes('registrar')) name='save';
      else if(text.includes('cancelar')) name='x';
      else if(text.includes('atualizar')||text.includes('refazer')) name='refresh';
      else if(text.includes('checklist')) name='clipboard';
      else if(text.includes('entregar')||text==='entrada') name='package';
      else if(text.includes('aprovar')||text.includes('concluir')) name='check';
      else if(text.includes('abrir os')) name='wrench';
      else if(text.includes('alerta')) name='bell';
      if(name){button.insertAdjacentHTML('afterbegin',uiIcon(name,16));button.dataset.iconized='1';}
    });
  }

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (form?.dataset?.type !== 'inventory-entry') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const epiId = form.dataset.id;
    const epi = state.epis.find(x=>x.id===epiId);
    const data = Object.fromEntries(new FormData(form));
    try {
      const quantity = Number(data.quantity);
      if (!quantity || quantity <= 0) throw new Error('Informe uma quantidade válida.');
      const batchId = crypto.randomUUID();
      const batch = await db.from('epi_batches').insert({id:batchId,epi_id:epiId,batch_number:data.batchNumber,supplier:data.supplier||null,invoice_number:data.invoice||null,received_at:data.date,initial_quantity:quantity,current_quantity:quantity,unit_cost:Number(data.unitCost||epi.unitCost||0),created_by:currentUser.id});
      if (batch.error) throw batch.error;
      const movement = await db.from('epi_movements').insert({epi_id:epiId,batch_id:batchId,movement_type:'entry',quantity,reason:data.reason||`Entrada de estoque - ${data.batchNumber}`,movement_at:`${data.date}T12:00:00Z`,created_by:currentUser.id});
      if (movement.error) throw movement.error;
      await db.from('audit_logs').insert({user_id:currentUser.id,action:`Entrada de ${quantity} unidade(s) em ${epi?.name||'EPI'}`,entity_type:'epi_catalog',entity_id:epiId});
      closeModal();
      inventoryMovements=[];
      await loadData();
      await ensureInventoryHistory(true);
      renderPage();
      toast('Entrada registrada e estoque atualizado.');
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível registrar a entrada.');
    }
  }, true);

  document.addEventListener('click', async event => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'delete-checklist') {
      if (!confirm('Confirma a exclusão deste checklist?')) return;
      const q = await db.from('forklift_checklists').delete().eq('id', actionEl.dataset.id);
      if (q.error) return toast(q.error.message);
      await db.from('audit_logs').insert({user_id:currentUser.id,action:'Checklist diário excluído',entity_type:'forklift_checklist',entity_id:actionEl.dataset.id});
      await loadData(); renderPage(); toast('Checklist excluído.');
    }
    if (action === 'export-checklists') downloadCSV('checklists-diarios-empilhadeiras.csv', state.checklists);
    if (action === 'refresh-inventory') { inventoryMovements=[]; await ensureInventoryHistory(true); toast('Inventário atualizado.'); }
  });

  function installSidebarBackdrop() {
    if (document.getElementById('sidebar-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'sidebar-backdrop';
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click',()=>{document.getElementById('sidebar')?.classList.remove('open');backdrop.classList.remove('show');});
    document.getElementById('menu-btn')?.addEventListener('click',()=>setTimeout(()=>backdrop.classList.toggle('show',document.getElementById('sidebar')?.classList.contains('open')),0));
  }

  const observer = new MutationObserver(()=>enhanceAllIcons());
  observer.observe(document.body,{childList:true,subtree:true});
  installSidebarBackdrop();
  setupNav();
  enhanceAllIcons();
})();
