'use strict';

(() => {
  const wf = {
    privateData: new Map(),
    archivedEmployees: [],
    epiMovements: [],
    overtime: [],
    absences: [],
    schemaReady: true,
    schemaMessage: '',
    consumptionEmployee: '',
    consumptionMonth: '',
    overtimeEmployee: '',
    overtimeMonth: '',
    absenceEmployee: '',
    absenceMonth: '',
    courseEmployee: '',
    courseStatus: 'Todos',
    maintenanceForklift: '',
    maintenanceStatus: 'Todos',
  };

  const icon = (paths, size=18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const icons = {
    consume: icon('<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><path d="m17 15 2 2 3-4"/>'),
    clock: icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    absent: icon('<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h5"/><path d="m16 16 5 5M21 16l-5 5"/>'),
    maintenance: icon('<path d="M14.7 6.3a4 4 0 0 0-5-5l2.3 2.3-3 3-2.3-2.3a4 4 0 0 0 5 5L20 17.6 17.6 20z"/>'),
    print: icon('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
  };

  function canHR(){ return ['admin','manager'].includes(state.profile?.role); }
  function canEpi(){ return ['admin','manager','warehouse'].includes(state.profile?.role); }
  function canMaintenance(){ return ['admin','manager','maintenance'].includes(state.profile?.role); }

  function insertNavItem(afterId, item) {
    if (navItems.some(x => x[0] === item[0])) return;
    const index = navItems.findIndex(x => x[0] === afterId);
    navItems.splice(index >= 0 ? index + 1 : navItems.length, 0, item);
  }

  function syncWorkforceNav(){
    const managed = ['epi-consumption','maintenance-history','overtime','absences'];
    managed.forEach(id=>{ const idx=navItems.findIndex(x=>x[0]===id); if(idx>=0) navItems.splice(idx,1); });
    if (canEpi()) insertNavItem('epi-inventory',['epi-consumption',icons.consume,'Consumo de EPI']);
    if (canMaintenance()) insertNavItem('daily-checklist',['maintenance-history',icons.maintenance,'Histórico de Manutenção']);
    if (canHR()) {
      insertNavItem('courses',['overtime',icons.clock,'Horas Extras']);
      insertNavItem('overtime',['absences',icons.absent,'Faltas e Ausências']);
    }
  }

  if (formSchemas?.employee && !formSchemas.employee.fields.some(field=>field[0]==='cpf')) {
    const fields = formSchemas.employee.fields;
    const registrationIndex = fields.findIndex(field=>field[0]==='registration');
    fields.splice(registrationIndex + 1, 0, ['cpf','CPF','text',true]);
  }

  const previousSetupNav = setupNav;
  setupNav = function workforceSetupNav(){ syncWorkforceNav(); previousSetupNav(); };

  const previousLoadData = loadData;
  loadData = async function workforceLoadData(...args){
    const result = await previousLoadData(...args);
    await loadWorkforceData();
    setupNav();
    return result;
  };

  const previousRenderPage = renderPage;
  renderPage = function workforceRenderPage(){
    if (currentPage === 'people') return renderPeopleEnhanced();
    if (currentPage === 'epi-consumption') return renderEpiConsumption();
    if (currentPage === 'maintenance-history') return renderMaintenanceHistory();
    if (currentPage === 'overtime') return renderOvertime();
    if (currentPage === 'absences') return renderAbsences();
    if (currentPage === 'courses') return renderCoursesEnhanced();
    return previousRenderPage();
  };

  async function loadWorkforceData(){
    const queries = [];
    queries.push(db.from('employee_private_data').select('*'));
    queries.push(db.from('employees').select('id,full_name,registration,job_title,department,company,admission_date,phone,email,status,archived_at').not('archived_at','is',null));
    queries.push(db.from('epi_movements').select('*').not('employee_id','is',null).order('movement_at',{ascending:false}));
    if (canHR()) {
      queries.push(db.from('employee_overtime').select('*').order('work_date',{ascending:false}));
      queries.push(db.from('employee_absences').select('*').order('absence_date',{ascending:false}));
    }
    const results = await Promise.all(queries);
    let cursor = 0;
    const privateQ = results[cursor++];
    const archivedQ = results[cursor++];
    const movementsQ = results[cursor++];
    if (!privateQ.error) wf.privateData = new Map((privateQ.data||[]).map(row=>[row.employee_id,row]));
    if (!archivedQ.error) wf.archivedEmployees = archivedQ.data || [];
    if (!movementsQ.error) wf.epiMovements = movementsQ.data || [];
    for (const employee of state.employees) employee.cpf = wf.privateData.get(employee.id)?.cpf || '';
    if (canHR()) {
      const overtimeQ = results[cursor++];
      const absenceQ = results[cursor++];
      wf.schemaReady = !(overtimeQ.error || absenceQ.error || privateQ.error);
      wf.schemaMessage = overtimeQ.error?.message || absenceQ.error?.message || privateQ.error?.message || '';
      if (!overtimeQ.error) wf.overtime = overtimeQ.data || [];
      if (!absenceQ.error) wf.absences = absenceQ.data || [];
    } else {
      wf.schemaReady = !privateQ.error;
      wf.schemaMessage = privateQ.error?.message || '';
    }
  }

  function allEmployeesById(){
    const map = new Map(state.employees.map(e=>[e.id,e]));
    wf.archivedEmployees.forEach(row=>{
      if (!map.has(row.id)) map.set(row.id,{id:row.id,name:row.full_name,registration:row.registration||'',role:row.job_title||'',sector:row.department||'',company:row.company||'',admission:row.admission_date,phone:row.phone||'',email:row.email||'',status:'Excluído',cpf:wf.privateData.get(row.id)?.cpf||'',archived:true});
    });
    return map;
  }

  function employeeById(id){ return allEmployeesById().get(id); }
  function formatCpf(value=''){
    const digits = String(value).replace(/\D/g,'').slice(0,11);
    if (digits.length !== 11) return digits || '—';
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  }
  function cpfValid(value=''){
    const cpf=String(value).replace(/\D/g,'');
    if(!/^\d{11}$/.test(cpf)||/^(\d)\1{10}$/.test(cpf)) return false;
    const calc=(len)=>{let sum=0;for(let i=0;i<len;i++)sum+=Number(cpf[i])*(len+1-i);const r=(sum*10)%11;return r===10?0:r;};
    return calc(9)===Number(cpf[9])&&calc(10)===Number(cpf[10]);
  }
  function monthMatch(date, month){ return !month || String(date||'').slice(0,7)===month; }
  function fmtDateTime(value){ if(!value)return '—'; const d=new Date(value); return Number.isNaN(d.getTime())?'—':d.toLocaleString('pt-BR'); }
  function schemaWarning(){ return wf.schemaReady ? '' : `<div class="workforce-warning"><strong>Atualização do banco pendente.</strong><br>Execute o arquivo <code>supabase/migrations/20260813_workforce_controls.sql</code> no SQL Editor do Supabase. Detalhe: ${escapeHtml(wf.schemaMessage||'tabelas ainda não encontradas')}</div>`; }

  function renderPeopleEnhanced(){
    const rows = state.employees.filter(x=>[x.name,x.registration,x.cpf,x.role,x.sector,x.company,x.status].join(' ').toLowerCase().includes(tableSearch.toLowerCase())&&(tableFilter==='Todos'||x.status===tableFilter));
    const filters=`<select id="table-filter" class="select"><option>Todos</option>${['Ativo','Férias','Afastado','Desligado'].map(x=>`<option ${tableFilter===x?'selected':''}>${x}</option>`).join('')}</select>`;
    $('#page-content').innerHTML=`<div class="toolbar"><div><h3 style="margin:0">Cadastro de Pessoas</h3><p class="muted" style="margin:5px 0 0">Funcionários, CPF, situação e acesso aos históricos individuais.</p></div><div class="toolbar-right"><input id="table-search" class="input" placeholder="Buscar nome, matrícula ou CPF" value="${escapeHtml(tableSearch)}">${filters}<button class="btn primary" data-action="open-form" data-form="employee">+ Cadastrar pessoa</button></div></div>
    <div class="workforce-summary"><article class="workforce-card"><small>Pessoas ativas</small><strong>${state.employees.filter(x=>x.status==='Ativo').length}</strong></article><article class="workforce-card"><small>Com ficha de EPI</small><strong>${state.employees.filter(e=>wf.epiMovements.some(m=>m.employee_id===e.id&&m.movement_type==='delivery')).length}</strong></article><article class="workforce-card"><small>Com cursos cadastrados</small><strong>${state.employees.filter(e=>state.courses.some(c=>c.employeeId===e.id)).length}</strong></article><article class="workforce-card"><small>Cadastros exibidos</small><strong>${rows.length}</strong></article></div>
    <div class="people-grid">${rows.map(x=>`<article class="person-card"><div class="person-head"><div class="person-main"><span class="entity-avatar">${initials(x.name)}</span><div><h3>${escapeHtml(x.name)}</h3><p class="muted">${escapeHtml(x.registration)} • CPF ${escapeHtml(formatCpf(x.cpf))}</p></div></div>${badge(x.status)}</div><div class="person-meta"><div class="spec"><small>Cargo</small><strong>${escapeHtml(x.role)}</strong></div><div class="spec"><small>Setor</small><strong>${escapeHtml(x.sector)}</strong></div><div class="spec"><small>Empresa</small><strong>${escapeHtml(x.company)}</strong></div><div class="spec"><small>Admissão</small><strong>${dateBR(x.admission)}</strong></div></div><p class="muted">${escapeHtml(x.phone||'Sem telefone')}<br>${escapeHtml(x.email||'Sem e-mail')}</p><div class="card-actions"><button class="btn small" data-action="open-form" data-form="employee" data-id="${x.id}">Editar</button><button class="btn small" data-workforce-action="print-epi-sheet" data-id="${x.id}">Ficha EPI</button><button class="btn small" data-workforce-action="employee-courses" data-id="${x.id}">Cursos</button>${canEpi()?`<button class="btn small" data-workforce-action="employee-consumption" data-id="${x.id}">Consumo</button>`:''}${canHR()?`<button class="btn small danger" data-workforce-action="delete-employee" data-id="${x.id}">Excluir</button>`:''}</div></article>`).join('')||'<div class="workforce-empty">Nenhum funcionário encontrado.</div>'}</div>`;
  }

  function consumptionRows(employeeId='', month=''){
    return wf.epiMovements.filter(m=>['delivery','return'].includes(m.movement_type)&&(!employeeId||m.employee_id===employeeId)&&monthMatch(m.movement_at,month));
  }

  function consumptionSummary(employeeId, month=''){
    const rows=consumptionRows(employeeId,month);
    let qty=0,deliveries=0,last='';
    rows.forEach(m=>{const sign=m.movement_type==='return'?-1:1;qty+=sign*Number(m.quantity||0);if(m.movement_type==='delivery')deliveries++;if(!last||String(m.movement_at)>last)last=String(m.movement_at);});
    return {qty,deliveries,last};
  }

  function renderEpiConsumption(){
    if(!canEpi()) return setPage('dashboard');
    const month=wf.consumptionMonth;
    const employees=[...allEmployeesById().values()].filter(e=>!e.archived||consumptionRows(e.id,month).length);
    const filtered=employees.filter(e=>(!wf.consumptionEmployee||e.id===wf.consumptionEmployee));
    const totals=filtered.reduce((a,e)=>{const s=consumptionSummary(e.id,month);a.qty+=s.qty;a.deliveries+=s.deliveries;return a;},{qty:0,deliveries:0});
    $('#page-content').innerHTML=`<div class="toolbar"><div><h3 style="margin:0">Consumo de EPI por Funcionário</h3><p class="muted" style="margin:5px 0 0">Consolidação das entregas menos devoluções registradas no período.</p></div><div class="workforce-filters"><select class="select" id="wf-consumption-employee"><option value="">Todos os funcionários</option>${employees.map(e=>`<option value="${e.id}" ${wf.consumptionEmployee===e.id?'selected':''}>${escapeHtml(e.name)}</option>`).join('')}</select><input class="input" type="month" id="wf-consumption-month" value="${escapeHtml(month)}"><button class="btn" data-workforce-action="export-consumption">Exportar CSV</button></div></div>
    <div class="workforce-summary"><article class="workforce-card"><small>Quantidade líquida entregue</small><strong>${number(totals.qty)}</strong></article><article class="workforce-card"><small>Entregas registradas</small><strong>${number(totals.deliveries)}</strong></article><article class="workforce-card"><small>Funcionários no relatório</small><strong>${filtered.filter(e=>consumptionRows(e.id,month).length).length}</strong></article></div>
    <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>CPF</th><th>Entregas</th><th>Qtd. líquida</th><th>Última movimentação</th><th>Ações</th></tr></thead><tbody>${filtered.map(e=>{const s=consumptionSummary(e.id,month);if(!s.deliveries&&!s.qty)return '';return `<tr><td><div class="workforce-person-row"><span class="avatar">${initials(e.name)}</span><span><strong>${escapeHtml(e.name)}</strong><small>${escapeHtml(e.registration||'')}</small></span></div></td><td>${escapeHtml(formatCpf(e.cpf))}</td><td>${s.deliveries}</td><td><strong>${number(s.qty)}</strong></td><td>${fmtDateTime(s.last)}</td><td><div class="workforce-actions"><button class="btn small" data-workforce-action="view-consumption" data-id="${e.id}">Histórico</button><button class="btn small primary" data-workforce-action="print-epi-sheet" data-id="${e.id}">Ficha EPI</button></div></td></tr>`}).join('')||'<tr><td colspan="6"><div class="workforce-empty">Nenhum consumo registrado para o filtro.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function renderMaintenanceHistory(){
    if(!canMaintenance()) return setPage('dashboard');
    const rows=state.maintenances.filter(m=>(!wf.maintenanceForklift||m.forkliftId===wf.maintenanceForklift)&&(wf.maintenanceStatus==='Todos'||m.status===wf.maintenanceStatus));
    const preventative=rows.filter(x=>x.type==='Preventiva').length;
    const corrective=rows.filter(x=>x.type==='Corretiva').length;
    $('#page-content').innerHTML=`<div class="toolbar"><div><h3 style="margin:0">Histórico de Manutenção das Empilhadeiras</h3><p class="muted" style="margin:5px 0 0">Ordens de serviço, tipo de manutenção e situação por equipamento.</p></div><div class="workforce-filters"><select id="wf-maintenance-forklift" class="select"><option value="">Todas as empilhadeiras</option>${state.forklifts.map(f=>`<option value="${f.id}" ${wf.maintenanceForklift===f.id?'selected':''}>${escapeHtml(f.code)} • ${escapeHtml(f.asset||'')}</option>`).join('')}</select><select id="wf-maintenance-status" class="select"><option>Todos</option>${['Aberta','Em andamento','Aguardando peça','Concluída'].map(s=>`<option ${wf.maintenanceStatus===s?'selected':''}>${s}</option>`).join('')}</select><button class="btn" data-workforce-action="print-maintenance">Imprimir</button></div></div>
    <div class="workforce-summary"><article class="workforce-card"><small>Ordens no filtro</small><strong>${rows.length}</strong></article><article class="workforce-card"><small>Preventivas</small><strong>${preventative}</strong></article><article class="workforce-card"><small>Corretivas</small><strong>${corrective}</strong></article></div>
    <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Empilhadeira</th><th>Tipo</th><th>Prioridade</th><th>Abertura</th><th>Descrição</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${escapeHtml(x.forklift)}</strong></td><td>${escapeHtml(x.type)}</td><td>${badge(x.priority)}</td><td>${dateBR(x.openedAt)}</td><td>${escapeHtml(x.description)}</td><td>${badge(x.status)}</td></tr>`).join('')||'<tr><td colspan="6"><div class="workforce-empty">Nenhuma manutenção encontrada.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function overtimeRows(){ return wf.overtime.filter(r=>(!wf.overtimeEmployee||r.employee_id===wf.overtimeEmployee)&&monthMatch(r.work_date,wf.overtimeMonth)); }
  function renderOvertime(){
    if(!canHR()) return setPage('dashboard');
    const rows=overtimeRows();
    const total=rows.reduce((s,r)=>s+Number(r.hours||0),0);
    const h50=rows.filter(r=>Number(r.additional_percent)===50).reduce((s,r)=>s+Number(r.hours||0),0);
    const h100=rows.filter(r=>Number(r.additional_percent)===100).reduce((s,r)=>s+Number(r.hours||0),0);
    $('#page-content').innerHTML=`${schemaWarning()}<div class="toolbar"><div><h3 style="margin:0">Controle de Horas Extras</h3><p class="muted" style="margin:5px 0 0">Lançamentos por funcionário, data e percentual de adicional.</p></div><div class="workforce-filters"><select id="wf-overtime-employee" class="select"><option value="">Todos os funcionários</option>${state.employees.map(e=>`<option value="${e.id}" ${wf.overtimeEmployee===e.id?'selected':''}>${escapeHtml(e.name)}</option>`).join('')}</select><input id="wf-overtime-month" class="input" type="month" value="${escapeHtml(wf.overtimeMonth)}"><button class="btn" data-workforce-action="export-overtime">Exportar</button><button class="btn primary" data-workforce-action="new-overtime">+ Lançar HE</button></div></div>
    <div class="workforce-summary"><article class="workforce-card"><small>Total de HE</small><strong>${total.toLocaleString('pt-BR',{maximumFractionDigits:2})} h</strong></article><article class="workforce-card"><small>HE 50%</small><strong>${h50.toLocaleString('pt-BR',{maximumFractionDigits:2})} h</strong></article><article class="workforce-card"><small>HE 100%</small><strong>${h100.toLocaleString('pt-BR',{maximumFractionDigits:2})} h</strong></article><article class="workforce-card"><small>Lançamentos</small><strong>${rows.length}</strong></article></div>
    <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Data</th><th>Funcionário</th><th>Horas</th><th>Adicional</th><th>Tipo</th><th>Motivo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(r=>{const e=employeeById(r.employee_id);return `<tr><td>${dateBR(r.work_date)}</td><td><strong>${escapeHtml(e?.name||'Funcionário')}</strong><br><span class="muted">${escapeHtml(e?.registration||'')}</span></td><td><strong>${Number(r.hours).toLocaleString('pt-BR')} h</strong></td><td>${Number(r.additional_percent).toLocaleString('pt-BR')}%</td><td>${escapeHtml(r.overtime_type||'Hora extra')}</td><td>${escapeHtml(r.reason||'—')}</td><td>${badge(statusLabel(r.status))}</td><td><div class="workforce-actions"><button class="btn small" data-workforce-action="edit-overtime" data-id="${r.id}">Editar</button><button class="btn small danger" data-workforce-action="delete-overtime" data-id="${r.id}">Excluir</button></div></td></tr>`}).join('')||'<tr><td colspan="8"><div class="workforce-empty">Nenhuma hora extra lançada.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function absenceRows(){ return wf.absences.filter(r=>(!wf.absenceEmployee||r.employee_id===wf.absenceEmployee)&&monthMatch(r.absence_date,wf.absenceMonth)); }
  function renderAbsences(){
    if(!canHR()) return setPage('dashboard');
    const rows=absenceRows();
    const totalDays=rows.reduce((s,r)=>s+Number(r.days_lost||0),0);
    const totalHours=rows.reduce((s,r)=>s+Number(r.hours_lost||0),0);
    const justified=rows.filter(r=>r.justified).length;
    $('#page-content').innerHTML=`${schemaWarning()}<div class="toolbar"><div><h3 style="margin:0">Controle de Faltas e Ausências</h3><p class="muted" style="margin:5px 0 0">Faltas, atestados, atrasos e demais ocorrências por funcionário.</p></div><div class="workforce-filters"><select id="wf-absence-employee" class="select"><option value="">Todos os funcionários</option>${state.employees.map(e=>`<option value="${e.id}" ${wf.absenceEmployee===e.id?'selected':''}>${escapeHtml(e.name)}</option>`).join('')}</select><input id="wf-absence-month" class="input" type="month" value="${escapeHtml(wf.absenceMonth)}"><button class="btn" data-workforce-action="export-absences">Exportar</button><button class="btn primary" data-workforce-action="new-absence">+ Registrar ausência</button></div></div>
    <div class="workforce-summary"><article class="workforce-card"><small>Ocorrências</small><strong>${rows.length}</strong></article><article class="workforce-card"><small>Dias perdidos</small><strong>${totalDays.toLocaleString('pt-BR',{maximumFractionDigits:2})}</strong></article><article class="workforce-card"><small>Horas perdidas</small><strong>${totalHours.toLocaleString('pt-BR',{maximumFractionDigits:2})} h</strong></article><article class="workforce-card"><small>Justificadas</small><strong>${justified}</strong></article></div>
    <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Data</th><th>Funcionário</th><th>Tipo</th><th>Dias</th><th>Horas</th><th>Justificada</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(r=>{const e=employeeById(r.employee_id);return `<tr><td>${dateBR(r.absence_date)}</td><td><strong>${escapeHtml(e?.name||'Funcionário')}</strong><br><span class="muted">${escapeHtml(e?.registration||'')}</span></td><td>${escapeHtml(r.absence_type||'Falta')}</td><td>${Number(r.days_lost||0).toLocaleString('pt-BR')}</td><td>${Number(r.hours_lost||0).toLocaleString('pt-BR')} h</td><td>${badge(r.justified?'Sim':'Não',r.justified?'success':'warning')}</td><td>${badge(absenceStatusLabel(r.status))}</td><td><div class="workforce-actions"><button class="btn small" data-workforce-action="edit-absence" data-id="${r.id}">Editar</button><button class="btn small danger" data-workforce-action="delete-absence" data-id="${r.id}">Excluir</button></div></td></tr>`}).join('')||'<tr><td colspan="8"><div class="workforce-empty">Nenhuma ausência registrada.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function renderCoursesEnhanced(){
    const rows=state.courses.filter(c=>!wf.courseEmployee||c.employeeId===wf.courseEmployee);
    $('#page-content').innerHTML=`<div class="toolbar"><div><h3 style="margin:0">Controle de Cursos dos Funcionários</h3><p class="muted" style="margin:5px 0 0">Matriz individual de treinamentos e certificados.</p></div><div class="workforce-filters"><select id="wf-course-employee" class="select"><option value="">Todos os funcionários</option>${state.employees.map(e=>`<option value="${e.id}" ${wf.courseEmployee===e.id?'selected':''}>${escapeHtml(e.name)}</option>`).join('')}</select><button class="btn" data-workforce-action="print-course-matrix">Imprimir matriz</button><button class="btn primary" data-action="open-form" data-form="course">+ Registrar curso</button></div></div>
    <div class="workforce-summary"><article class="workforce-card"><small>Cursos registrados</small><strong>${rows.length}</strong></article><article class="workforce-card"><small>Certificados anexados</small><strong>${rows.filter(c=>c.certificate).length}</strong></article></div>
    <div class="table-card"><div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>Curso</th><th>Instituição</th><th>Realização</th><th>Carga horária</th><th>Ações</th></tr></thead><tbody>${rows.map(c=>`<tr><td><strong>${escapeHtml(c.employee)}</strong><br><span class="muted">${escapeHtml(c.employeeRegistration)}</span></td><td><strong>${escapeHtml(c.course)}</strong><br><span class="muted">${escapeHtml(c.certificate||'Sem certificado')}</span></td><td>${escapeHtml(c.institution)}</td><td>${dateBR(c.completedAt)}</td><td>${Number(c.hours||0)}h</td><td><div class="workforce-actions"><button class="btn small" data-action="open-form" data-form="course" data-id="${c.id}">Editar</button><button class="btn small" data-workforce-action="print-employee-courses" data-id="${c.employeeId}">Imprimir</button>${canHR()?`<button class="btn small danger" data-action="delete" data-collection="courses" data-id="${c.id}">Excluir</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6"><div class="workforce-empty">Nenhum curso encontrado.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function statusLabel(value){ return ({pending:'Pendente',approved:'Aprovada',paid:'Paga',compensated:'Compensada',cancelled:'Cancelada'})[value]||value||'Pendente'; }
  function absenceStatusLabel(value){ return ({registered:'Registrada',validated:'Validada',discounted:'Descontada',cancelled:'Cancelada'})[value]||value||'Registrada'; }

  function openOvertimeForm(row=null){
    const form=$('#modal-form'); $('#modal-kicker').textContent='CONTROLE DE PONTO'; $('#modal-title').textContent=row?'Editar hora extra':'Lançar hora extra'; form.dataset.type='workforce-overtime'; form.dataset.id=row?.id||'';
    form.innerHTML=`<label>Funcionário<select name="employee_id" required><option value="">Selecione</option>${state.employees.filter(e=>e.status==='Ativo').map(e=>`<option value="${e.id}" ${row?.employee_id===e.id?'selected':''}>${escapeHtml(e.name)} • ${escapeHtml(e.registration)}</option>`).join('')}</select></label><label>Data<input type="date" name="work_date" value="${escapeHtml(row?.work_date||todayISO())}" required></label><label>Quantidade de horas<input type="number" name="hours" min="0.01" step="0.01" value="${escapeHtml(row?.hours||'')}" required></label><label>Adicional (%)<input type="number" name="additional_percent" min="0" step="1" value="${escapeHtml(row?.additional_percent??50)}" required></label><label>Tipo<select name="overtime_type"><option ${row?.overtime_type==='Hora extra'?'selected':''}>Hora extra</option><option ${row?.overtime_type==='Sobreaviso'?'selected':''}>Sobreaviso</option><option ${row?.overtime_type==='Plantão'?'selected':''}>Plantão</option><option ${row?.overtime_type==='Outro'?'selected':''}>Outro</option></select></label><label>Status<select name="status"><option value="pending" ${row?.status==='pending'?'selected':''}>Pendente</option><option value="approved" ${row?.status==='approved'?'selected':''}>Aprovada</option><option value="paid" ${row?.status==='paid'?'selected':''}>Paga</option><option value="compensated" ${row?.status==='compensated'?'selected':''}>Compensada</option><option value="cancelled" ${row?.status==='cancelled'?'selected':''}>Cancelada</option></select></label><label class="span-2">Motivo<input name="reason" value="${escapeHtml(row?.reason||'')}"></label><label class="span-2">Observação<textarea name="notes">${escapeHtml(row?.notes||'')}</textarea></label><label class="span-2">Anexo<input type="file" name="attachmentFile" accept=".pdf,.jpg,.jpeg,.png"></label><p class="workforce-form-note">O percentual é informado em cada lançamento para permitir regras diferentes de 50%, 60%, 100% ou outro adicional.</p><div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div>`;
    $('#modal').classList.remove('hidden');
  }

  function openAbsenceForm(row=null){
    const form=$('#modal-form'); $('#modal-kicker').textContent='FREQUÊNCIA'; $('#modal-title').textContent=row?'Editar ausência':'Registrar falta ou ausência'; form.dataset.type='workforce-absence'; form.dataset.id=row?.id||'';
    form.innerHTML=`<label>Funcionário<select name="employee_id" required><option value="">Selecione</option>${state.employees.filter(e=>e.status==='Ativo').map(e=>`<option value="${e.id}" ${row?.employee_id===e.id?'selected':''}>${escapeHtml(e.name)} • ${escapeHtml(e.registration)}</option>`).join('')}</select></label><label>Data<input type="date" name="absence_date" value="${escapeHtml(row?.absence_date||todayISO())}" required></label><label>Tipo<select name="absence_type" required>${['Falta integral','Atraso','Saída antecipada','Atestado','Licença','Suspensão','Outro'].map(t=>`<option ${row?.absence_type===t?'selected':''}>${t}</option>`).join('')}</select></label><label>Justificada?<select name="justified"><option value="true" ${row?.justified?'selected':''}>Sim</option><option value="false" ${!row?.justified?'selected':''}>Não</option></select></label><label>Dias perdidos<input type="number" name="days_lost" min="0" step="0.5" value="${escapeHtml(row?.days_lost??1)}"></label><label>Horas perdidas<input type="number" name="hours_lost" min="0" step="0.25" value="${escapeHtml(row?.hours_lost??0)}"></label><label>Status<select name="status"><option value="registered" ${row?.status==='registered'?'selected':''}>Registrada</option><option value="validated" ${row?.status==='validated'?'selected':''}>Validada</option><option value="discounted" ${row?.status==='discounted'?'selected':''}>Descontada</option><option value="cancelled" ${row?.status==='cancelled'?'selected':''}>Cancelada</option></select></label><label>Documento / referência<input name="document_reference" value="${escapeHtml(row?.document_reference||'')}"></label><label class="span-2">Justificativa / observação<textarea name="justification">${escapeHtml(row?.justification||'')}</textarea></label><label class="span-2">Anexo<input type="file" name="attachmentFile" accept=".pdf,.jpg,.jpeg,.png"></label><div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div>`;
    $('#modal').classList.remove('hidden');
  }

  async function uploadHrFile(form){
    const file=form.elements.attachmentFile?.files?.[0]; if(!file)return '';
    const safe=file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');
    const path=`${currentUser.id}/${Date.now()}-${safe}`;
    const q=await db.storage.from('hr-documents').upload(path,file,{upsert:false}); if(q.error)throw q.error; return path;
  }

  async function saveEmployeeForm(form){
    const data=Object.fromEntries(new FormData(form)); const cpf=String(data.cpf||'').replace(/\D/g,'');
    if(!cpfValid(cpf)) throw new Error('CPF inválido. Confira os 11 dígitos.');
    const id=form.dataset.id||crypto.randomUUID(); const uid=currentUser.id;
    const employeePayload={id,full_name:data.name,registration:data.registration,job_title:data.role,department:data.sector,company:data.company,admission_date:data.admission||null,phone:data.phone||null,email:data.email||null,status:employeeStatusDb[data.status]||'active',updated_by:uid,created_by:uid,archived_at:null};
    const employeeQ=await db.from('employees').upsert(employeePayload,{onConflict:'id'}); if(employeeQ.error)throw employeeQ.error;
    const privateQ=await db.from('employee_private_data').upsert({employee_id:id,cpf,updated_by:uid},{onConflict:'employee_id'}); if(privateQ.error)throw privateQ.error;
    await db.from('audit_logs').insert({user_id:uid,action:`Funcionário salvo: ${data.name}`,entity_type:'employee',entity_id:id});
    closeModal(); await loadData(); renderPage(); toast('Funcionário salvo com CPF.');
  }

  document.addEventListener('submit',async event=>{
    const form=event.target; const type=form?.dataset?.type;
    if(!['employee','workforce-overtime','workforce-absence'].includes(type))return;
    event.preventDefault(); event.stopImmediatePropagation();
    try{
      if(type==='employee') return await saveEmployeeForm(form);
      if(!wf.schemaReady) throw new Error('Atualize o banco antes de usar este módulo.');
      const data=Object.fromEntries(new FormData(form)); const id=form.dataset.id||crypto.randomUUID(); const attachment=await uploadHrFile(form);
      if(type==='workforce-overtime'){
        const old=wf.overtime.find(r=>r.id===id); const payload={id,employee_id:data.employee_id,work_date:data.work_date,hours:Number(data.hours),additional_percent:Number(data.additional_percent),overtime_type:data.overtime_type,reason:data.reason||null,status:data.status,notes:data.notes||null,attachment_path:attachment||old?.attachment_path||null,created_by:currentUser.id,updated_at:new Date().toISOString()};
        const q=await db.from('employee_overtime').upsert(payload,{onConflict:'id'}); if(q.error)throw q.error;
        await db.from('audit_logs').insert({user_id:currentUser.id,action:'Hora extra registrada',entity_type:'employee_overtime',entity_id:id});
      } else {
        const old=wf.absences.find(r=>r.id===id); const payload={id,employee_id:data.employee_id,absence_date:data.absence_date,absence_type:data.absence_type,days_lost:Number(data.days_lost||0),hours_lost:Number(data.hours_lost||0),justified:data.justified==='true',status:data.status,document_reference:data.document_reference||null,justification:data.justification||null,attachment_path:attachment||old?.attachment_path||null,created_by:currentUser.id,updated_at:new Date().toISOString()};
        const q=await db.from('employee_absences').upsert(payload,{onConflict:'id'}); if(q.error)throw q.error;
        await db.from('audit_logs').insert({user_id:currentUser.id,action:'Falta/ausência registrada',entity_type:'employee_absence',entity_id:id});
      }
      closeModal(); await loadWorkforceData(); renderPage(); toast('Registro salvo.');
    }catch(error){console.error(error);toast(error.message||'Não foi possível salvar.');}
  },true);

  async function deleteEmployee(id){
    const employee=state.employees.find(e=>e.id===id); if(!employee)return;
    const ok=confirm(`Excluir ${employee.name} do cadastro ativo?\n\nO histórico de EPI, cursos, horas extras e faltas será preservado.`); if(!ok)return;
    const q=await db.from('employees').update({archived_at:new Date().toISOString(),status:'terminated',updated_by:currentUser.id}).eq('id',id); if(q.error)throw q.error;
    await db.from('audit_logs').insert({user_id:currentUser.id,action:`Funcionário excluído do cadastro ativo: ${employee.name}`,entity_type:'employee',entity_id:id});
    await loadData(); renderPage(); toast('Funcionário excluído do cadastro ativo. Histórico preservado.');
  }

  async function deleteSimple(table,id,label){ const ok=confirm(`Excluir este registro de ${label}?`);if(!ok)return;const q=await db.from(table).delete().eq('id',id);if(q.error)throw q.error;await loadWorkforceData();renderPage();toast('Registro excluído.'); }

  document.addEventListener('input',event=>{ if(event.target.name==='cpf'){const digits=event.target.value.replace(/\D/g,'').slice(0,11);event.target.value=digits.length>9?`${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`:digits.length>6?`${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`:digits.length>3?`${digits.slice(0,3)}.${digits.slice(3)}`:digits;} });

  document.addEventListener('change',event=>{
    if(event.target.id==='wf-consumption-employee'){wf.consumptionEmployee=event.target.value;renderPage();}
    if(event.target.id==='wf-consumption-month'){wf.consumptionMonth=event.target.value;renderPage();}
    if(event.target.id==='wf-maintenance-forklift'){wf.maintenanceForklift=event.target.value;renderPage();}
    if(event.target.id==='wf-maintenance-status'){wf.maintenanceStatus=event.target.value;renderPage();}
    if(event.target.id==='wf-overtime-employee'){wf.overtimeEmployee=event.target.value;renderPage();}
    if(event.target.id==='wf-overtime-month'){wf.overtimeMonth=event.target.value;renderPage();}
    if(event.target.id==='wf-absence-employee'){wf.absenceEmployee=event.target.value;renderPage();}
    if(event.target.id==='wf-absence-month'){wf.absenceMonth=event.target.value;renderPage();}
    if(event.target.id==='wf-course-employee'){wf.courseEmployee=event.target.value;renderPage();}
    if(event.target.id==='wf-course-status'){wf.courseStatus=event.target.value;renderPage();}
  });

  document.addEventListener('click',async event=>{
    const b=event.target.closest('[data-workforce-action]'); if(!b)return; const action=b.dataset.workforceAction; const id=b.dataset.id;
    try{
      if(action==='delete-employee')return await deleteEmployee(id);
      if(action==='employee-consumption'){wf.consumptionEmployee=id;setPage('epi-consumption');return;}
      if(action==='employee-courses'){wf.courseEmployee=id;setPage('courses');return;}
      if(action==='print-epi-sheet')return await printEpiSheet(id);
      if(action==='view-consumption')return openConsumptionHistory(id);
      if(action==='export-consumption')return exportConsumption();
      if(action==='print-maintenance')return printMaintenance();
      if(action==='new-overtime')return openOvertimeForm();
      if(action==='edit-overtime')return openOvertimeForm(wf.overtime.find(r=>r.id===id));
      if(action==='delete-overtime')return await deleteSimple('employee_overtime',id,'hora extra');
      if(action==='export-overtime')return downloadCSV('horas-extras.csv',overtimeRows().map(r=>({...r,employee:employeeById(r.employee_id)?.name||''})));
      if(action==='new-absence')return openAbsenceForm();
      if(action==='edit-absence')return openAbsenceForm(wf.absences.find(r=>r.id===id));
      if(action==='delete-absence')return await deleteSimple('employee_absences',id,'falta/ausência');
      if(action==='export-absences')return downloadCSV('faltas-ausencias.csv',absenceRows().map(r=>({...r,employee:employeeById(r.employee_id)?.name||''})));
      if(action==='print-course-matrix')return printCourseMatrix();
      if(action==='print-employee-courses')return printEmployeeCourses(id);
    }catch(error){console.error(error);toast(error.message||'Não foi possível concluir a ação.');}
  });

  function openConsumptionHistory(employeeId){
    const employee=employeeById(employeeId); const rows=consumptionRows(employeeId,wf.consumptionMonth);
    $('#modal-kicker').textContent='CONSUMO DE EPI'; $('#modal-title').textContent=employee?.name||'Funcionário'; const form=$('#modal-form'); form.dataset.type='workforce-readonly'; form.dataset.id=employeeId;
    form.innerHTML=`<div class="span-2 workforce-term-box"><strong>${escapeHtml(employee?.name||'')}</strong><br>Matrícula: ${escapeHtml(employee?.registration||'—')} • CPF: ${escapeHtml(formatCpf(employee?.cpf))}</div><div class="span-2 table-wrap"><table><thead><tr><th>Data</th><th>Movimento</th><th>EPI</th><th>Qtd.</th><th>Motivo</th><th>Assinatura</th></tr></thead><tbody>${rows.map(m=>{const epi=state.epis.find(e=>e.id===m.epi_id);return `<tr><td>${fmtDateTime(m.movement_at)}</td><td>${m.movement_type==='return'?'Devolução':'Entrega'}</td><td>${escapeHtml(epi?.name||'EPI')}</td><td>${number(m.quantity)}</td><td>${escapeHtml(m.reason||'—')}</td><td>${m.signed_at?badge('Assinado','success'):'—'}</td></tr>`}).join('')||'<tr><td colspan="6">Sem movimentações.</td></tr>'}</tbody></table></div><div class="form-actions"><button type="button" class="btn" data-action="close-modal">Fechar</button><button type="button" class="btn primary" data-workforce-action="print-epi-sheet" data-id="${employeeId}">Imprimir ficha EPI</button></div>`;
    $('#modal').classList.remove('hidden');
  }

  function printWindow(title,body){
    const w=window.open('','_blank'); if(!w)throw new Error('Permita pop-ups para imprimir.');
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px;font-size:12px}h1{font-size:18px;text-align:center;margin:0 0 4px}h2{font-size:14px;margin:22px 0 8px}p{line-height:1.45}.meta{display:grid;grid-template-columns:1fr 1fr;gap:5px 20px;border:1px solid #bbb;padding:12px;margin:14px 0}.meta strong{display:inline}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #999;padding:6px;text-align:left;vertical-align:top}th{background:#eee;font-size:10px}.term{border:1px solid #999;padding:12px;margin-top:18px;text-align:justify}.sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:55px}.line{border-top:1px solid #222;padding-top:5px;text-align:center}.foot{font-size:9px;color:#555;margin-top:22px;text-align:center}@media print{button{display:none}body{margin:10mm}}</style></head><body>${body}<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`); w.document.close(); return w;
  }

  async function printEpiSheet(employeeId){
    const employee=employeeById(employeeId); if(!employee)throw new Error('Funcionário não encontrado.');
    const rows=consumptionRows(employeeId,'').filter(m=>m.movement_type==='delivery');
    const tableRows=rows.map(m=>{const epi=state.epis.find(e=>e.id===m.epi_id);return `<tr><td>${new Date(m.movement_at).toLocaleDateString('pt-BR')}</td><td>${escapeHtml(epi?.name||'EPI')}</td><td>${escapeHtml(epi?.ca||'—')}</td><td>${escapeHtml(epi?.size||'—')}</td><td>${number(m.quantity)}</td><td>${escapeHtml(m.reason||'Entrega')}</td><td>${m.signed_at?'Sim':'Não'}</td><td>${escapeHtml(m.receipt_code||'—')}</td></tr>`}).join('');
    const body=`<h1>FICHA INDIVIDUAL DE ENTREGA E CONTROLE DE EPI</h1><p style="text-align:center">${escapeHtml(state.settings.company||'Empresa')} • ${escapeHtml(state.settings.unit||'Unidade')}</p><div class="meta"><div><strong>Funcionário:</strong> ${escapeHtml(employee.name)}</div><div><strong>Matrícula:</strong> ${escapeHtml(employee.registration||'—')}</div><div><strong>CPF:</strong> ${escapeHtml(formatCpf(employee.cpf))}</div><div><strong>Cargo:</strong> ${escapeHtml(employee.role||'—')}</div><div><strong>Setor:</strong> ${escapeHtml(employee.sector||'—')}</div><div><strong>Empresa:</strong> ${escapeHtml(employee.company||'—')}</div></div><h2>Histórico de entregas</h2><table><thead><tr><th>Data</th><th>EPI</th><th>CA</th><th>Tam.</th><th>Qtd.</th><th>Motivo</th><th>Assinado</th><th>Comprovante</th></tr></thead><tbody>${tableRows||'<tr><td colspan="8">Nenhuma entrega registrada.</td></tr>'}</tbody></table><div class="term"><strong>TERMO DE RECEBIMENTO, CIÊNCIA E RECONHECIMENTO DA FICHA DE EPI</strong><p>Declaro que reconheço os registros apresentados nesta ficha como correspondentes às entregas de equipamentos de proteção individual realizadas em meu nome. Declaro ainda ter recebido orientação sobre uso adequado, guarda, conservação, higienização, substituição e comunicação de perda ou dano dos EPIs recebidos. Os registros eletrônicos de entrega e suas assinaturas individuais, quando existentes, permanecem vinculados ao sistema e constituem o histórico desta ficha.</p><p>Esta impressão consolida os registros existentes no Gestão Segura SST na data de emissão e deve ser conferida pelo responsável antes do arquivamento.</p></div><div class="sign"><div class="line">${escapeHtml(employee.name)}<br>Funcionário</div><div class="line">${escapeHtml(state.profile?.full_name||currentUser.email)}<br>Responsável pela emissão</div></div><div class="foot">Emitido em ${new Date().toLocaleString('pt-BR')} • Gestão Segura SST</div>`;
    printWindow(`Ficha EPI - ${employee.name}`,body);
  }

  function exportConsumption(){
    const employees=[...allEmployeesById().values()]; const rows=employees.map(e=>{const s=consumptionSummary(e.id,wf.consumptionMonth);return {funcionario:e.name,matricula:e.registration,cpf:formatCpf(e.cpf),entregas:s.deliveries,quantidade_liquida:s.qty,ultima_movimentacao:s.last};}).filter(r=>r.entregas||r.quantidade_liquida); downloadCSV('consumo-epi-por-funcionario.csv',rows);
  }

  function printMaintenance(){
    const rows=state.maintenances.filter(m=>(!wf.maintenanceForklift||m.forkliftId===wf.maintenanceForklift)&&(wf.maintenanceStatus==='Todos'||m.status===wf.maintenanceStatus)); const titleFork=wf.maintenanceForklift?state.forklifts.find(f=>f.id===wf.maintenanceForklift)?.code:'Todas';
    const body=`<h1>HISTÓRICO DE MANUTENÇÃO DE EMPILHADEIRAS</h1><p style="text-align:center">Equipamento: ${escapeHtml(titleFork||'Todas')} • Emitido em ${new Date().toLocaleString('pt-BR')}</p><table><thead><tr><th>Equipamento</th><th>Tipo</th><th>Prioridade</th><th>Abertura</th><th>Descrição</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${escapeHtml(x.forklift)}</td><td>${escapeHtml(x.type)}</td><td>${escapeHtml(x.priority)}</td><td>${dateBR(x.openedAt)}</td><td>${escapeHtml(x.description)}</td><td>${escapeHtml(x.status)}</td></tr>`).join('')||'<tr><td colspan="6">Sem registros.</td></tr>'}</tbody></table><div class="foot">Gestão Segura SST</div>`; printWindow('Histórico de Manutenção',body);
  }

  function printCourseMatrix(){
    const rows=state.courses.filter(c=>!wf.courseEmployee||c.employeeId===wf.courseEmployee);
    const body=`<h1>MATRIZ DE CURSOS E TREINAMENTOS</h1><p style="text-align:center">${escapeHtml(state.settings.company||'Empresa')} • Emitido em ${new Date().toLocaleString('pt-BR')}</p><table><thead><tr><th>Funcionário</th><th>Matrícula</th><th>Curso</th><th>Instituição</th><th>Realização</th><th>C.H.</th></tr></thead><tbody>${rows.map(c=>`<tr><td>${escapeHtml(c.employee)}</td><td>${escapeHtml(c.employeeRegistration)}</td><td>${escapeHtml(c.course)}</td><td>${escapeHtml(c.institution)}</td><td>${dateBR(c.completedAt)}</td><td>${Number(c.hours||0)}h</td></tr>`).join('')||'<tr><td colspan="6">Sem registros.</td></tr>'}</tbody></table><div class="foot">Gestão Segura SST</div>`; printWindow('Matriz de Cursos',body);
  }

  function printEmployeeCourses(employeeId){ const prev=wf.courseEmployee; wf.courseEmployee=employeeId; try{return printCourseMatrix();}finally{wf.courseEmployee=prev;} }

  queueMicrotask(()=>{ setupNav(); loadWorkforceData().then(()=>{ if(currentUser) renderPage(); }).catch(()=>{}); });
})();
