'use strict';

(() => {
  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gestor',
    warehouse: 'Almoxarifado',
    maintenance: 'Manutenção',
    employee: 'Colaborador',
    viewer: 'Visualizador',
  };

  const svg = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  const iconSet = {
    dashboard: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    employees: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    epis: svg('<path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'),
    courses: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>'),
    expenses: svg('<circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v12"/>'),
    forklifts: svg('<path d="M3 17h12"/><path d="M5 17V8h7l3 5v4"/><path d="M15 8v9"/><path d="M19 4v13h3"/><circle cx="7" cy="19" r="2"/><circle cx="16" cy="19" r="2"/>'),
    dds: svg('<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 8h8M8 12h5"/>'),
    reports: svg('<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/>'),
    notifications: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.38.28.72.62 1 1 .26.32.4.72.4 1.1V11h.2v4h-.09A1.7 1.7 0 0 0 19.4 15Z"/>'),
    users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M18 8v6M21 11h-6"/>'),
  };

  for (const item of navItems) {
    if (iconSet[item[0]]) item[1] = iconSet[item[0]];
  }

  let usersCache = [];
  let usersLoading = false;

  function isAdmin() {
    return state.profile?.role === 'admin';
  }

  function syncUsersNav() {
    const index = navItems.findIndex(item => item[0] === 'users');
    if (isAdmin() && index < 0) {
      const settingsIndex = navItems.findIndex(item => item[0] === 'settings');
      navItems.splice(settingsIndex >= 0 ? settingsIndex : navItems.length, 0, ['users', iconSet.users, 'Usuários']);
    } else if (!isAdmin() && index >= 0) {
      navItems.splice(index, 1);
    }
  }

  const originalSetupNav = setupNav;
  setupNav = function patchedSetupNav() {
    syncUsersNav();
    originalSetupNav();
  };

  const originalLoadData = loadData;
  loadData = async function patchedLoadData(...args) {
    const result = await originalLoadData(...args);
    setupNav();
    return result;
  };

  const originalRenderPage = renderPage;
  renderPage = function patchedRenderPage() {
    if (currentPage === 'users') {
      if (!isAdmin()) {
        currentPage = 'dashboard';
        setupNav();
        return originalRenderPage();
      }
      renderUsersPage();
      updateNotificationCount();
      return;
    }
    originalRenderPage();
  };

  async function adminRequest(payload) {
    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    if (sessionError || !sessionData.session) throw new Error('Sua sessão expirou. Entre novamente.');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a operação.');
    return result;
  }

  function formatDateTime(value) {
    if (!value) return 'Nunca';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('pt-BR');
  }

  function statusBadge(user) {
    return badge(user.is_active ? 'Ativo' : 'Inativo', user.is_active ? 'success' : 'danger');
  }

  async function loadUsers() {
    usersLoading = true;
    try {
      const result = await adminRequest({ action: 'list' });
      usersCache = result.users || [];
    } finally {
      usersLoading = false;
    }
  }

  async function renderUsersPage() {
    const content = $('#page-content');
    content.innerHTML = '<div class="user-admin-empty">Carregando usuários...</div>';
    try {
      await loadUsers();
      const total = usersCache.length;
      const active = usersCache.filter(user => user.is_active).length;
      const admins = usersCache.filter(user => user.role === 'admin' && user.is_active).length;
      const inactive = total - active;

      content.innerHTML = `
        <div class="toolbar">
          <div>
            <h3 style="margin:0">Administração de usuários</h3>
            <p class="muted" style="margin:5px 0 0">Crie contas, defina permissões, altere senhas e remova acessos.</p>
          </div>
          <div class="toolbar-right">
            <button class="btn" data-user-action="refresh">Atualizar</button>
            <button class="btn primary" data-user-action="new">+ Novo usuário</button>
          </div>
        </div>

        <div class="user-admin-summary">
          <article class="user-admin-card"><small>Total de contas</small><strong>${total}</strong></article>
          <article class="user-admin-card"><small>Contas ativas</small><strong>${active}</strong></article>
          <article class="user-admin-card"><small>Administradores ativos</small><strong>${admins}</strong></article>
          <article class="user-admin-card"><small>Contas desativadas</small><strong>${inactive}</strong></article>
        </div>

        <div class="table-card">
          <div class="table-wrap">
            <table style="min-width:1120px">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Empresa / setor</th>
                  <th>Matrícula</th>
                  <th>Último acesso</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${usersCache.map(user => `
                  <tr>
                    <td>
                      <div class="user-admin-person">
                        <div class="avatar">${initials(user.full_name)}</div>
                        <span>
                          <strong>${escapeHtml(user.full_name)}</strong>
                          <small>${escapeHtml(user.email || 'Sem e-mail')}</small>
                        </span>
                      </div>
                    </td>
                    <td><span class="user-role-chip">${escapeHtml(roleLabels[user.role] || user.role)}</span></td>
                    <td>
                      <strong>${escapeHtml(user.company || '—')}</strong><br>
                      <span class="muted">${escapeHtml(user.department || user.unit || '—')}</span>
                    </td>
                    <td>${escapeHtml(user.registration || '—')}</td>
                    <td>${formatDateTime(user.last_sign_in_at)}</td>
                    <td>${statusBadge(user)}${user.current_user ? '<br><span class="muted">Sua conta</span>' : ''}</td>
                    <td>
                      <div class="user-admin-actions">
                        <button class="btn small" data-user-action="edit" data-user-id="${user.id}">Editar</button>
                        <button class="btn small" data-user-action="password" data-user-id="${user.id}">Senha</button>
                        ${user.current_user ? '' : `<button class="btn small" data-user-action="toggle" data-user-id="${user.id}" data-active="${user.is_active ? 'false' : 'true'}">${user.is_active ? 'Desativar' : 'Ativar'}</button>`}
                        ${user.current_user ? '' : `<button class="btn small danger" data-user-action="delete" data-user-id="${user.id}">Excluir</button>`}
                      </div>
                    </td>
                  </tr>
                `).join('') || '<tr><td colspan="7"><div class="user-admin-empty">Nenhum usuário cadastrado.</div></td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (error) {
      console.error(error);
      content.innerHTML = `<div class="user-admin-empty">${escapeHtml(error.message || 'Erro ao carregar usuários.')}</div>`;
      toast(error.message || 'Erro ao carregar usuários.');
    }
  }

  function ensureModal() {
    let modal = document.querySelector('#user-admin-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'user-admin-modal';
    modal.className = 'user-admin-modal hidden';
    modal.innerHTML = `
      <div class="user-admin-modal-card">
        <div class="user-admin-modal-head">
          <div><p class="eyebrow">ADMINISTRAÇÃO</p><h3 id="user-admin-title">Usuário</h3></div>
          <button type="button" class="icon-btn" data-user-action="close">×</button>
        </div>
        <form id="user-admin-form" class="user-admin-form"></form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeUserModal();
    });
    modal.querySelector('#user-admin-form').addEventListener('submit', submitUserForm);
    return modal;
  }

  function roleOptions(selected = 'employee') {
    return Object.entries(roleLabels).map(([value, label]) =>
      `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`
    ).join('');
  }

  function openUserModal(user = null) {
    const modal = ensureModal();
    const form = modal.querySelector('#user-admin-form');
    const creating = !user;
    modal.querySelector('#user-admin-title').textContent = creating ? 'Cadastrar usuário' : 'Editar usuário';
    form.dataset.mode = creating ? 'create' : 'edit';
    form.dataset.userId = user?.id || '';
    form.innerHTML = `
      <label>Nome completo<input name="full_name" value="${escapeHtml(user?.full_name || '')}" required minlength="3"></label>
      <label>E-mail<input name="email" type="email" value="${escapeHtml(user?.email || '')}" required></label>
      ${creating ? '<label>Senha inicial<input name="password" type="password" minlength="8" required autocomplete="new-password"></label>' : ''}
      <label>Perfil de acesso<select name="role" required>${roleOptions(user?.role || 'employee')}</select></label>
      <label>Matrícula<input name="registration" value="${escapeHtml(user?.registration || '')}"></label>
      <label>Telefone<input name="phone" value="${escapeHtml(user?.phone || '')}"></label>
      <label>Empresa<input name="company" value="${escapeHtml(user?.company || state.settings.company || '')}"></label>
      <label>Setor / departamento<input name="department" value="${escapeHtml(user?.department || '')}"></label>
      <label class="span-2">Unidade / base<input name="unit" value="${escapeHtml(user?.unit || state.settings.unit || '')}"></label>
      ${creating ? `
        <label class="span-2">
          <span>Primeiro acesso</span>
          <select name="must_change_password">
            <option value="true" selected>Solicitar troca de senha</option>
            <option value="false">Manter senha definida</option>
          </select>
        </label>
      ` : ''}
      <p class="user-admin-help span-2">
        Administrador: acesso total. Gestor: gestão operacional. Almoxarifado: EPI e estoque.
        Manutenção: empilhadeiras e ordens. Colaborador: acesso básico. Visualizador: somente consulta.
      </p>
      <div class="form-actions">
        <button type="button" class="btn" data-user-action="close">Cancelar</button>
        <button type="submit" class="btn primary">${creating ? 'Criar usuário' : 'Salvar alterações'}</button>
      </div>
    `;
    modal.classList.remove('hidden');
  }

  function closeUserModal() {
    document.querySelector('#user-admin-modal')?.classList.add('hidden');
  }

  async function submitUserForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    button.disabled = true;
    try {
      const mode = form.dataset.mode;
      if (mode === 'create') {
        await adminRequest({
          action: 'create',
          ...data,
          must_change_password: data.must_change_password === 'true',
        });
        toast('Usuário criado com sucesso.');
      } else {
        await adminRequest({
          action: 'update',
          user_id: form.dataset.userId,
          ...data,
        });
        toast('Usuário atualizado.');
      }
      closeUserModal();
      await renderUsersPage();
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível salvar o usuário.');
    } finally {
      button.disabled = false;
    }
  }

  document.addEventListener('click', async event => {
    const element = event.target.closest('[data-user-action]');
    if (!element) return;
    const action = element.dataset.userAction;

    if (action === 'new') return openUserModal();
    if (action === 'close') return closeUserModal();
    if (action === 'refresh') return renderUsersPage();

    const user = usersCache.find(item => item.id === element.dataset.userId);
    if (!user) return;

    if (action === 'edit') return openUserModal(user);

    if (action === 'password') {
      const password = prompt(`Digite uma senha temporária para ${user.full_name}.\nMínimo de 8 caracteres:`);
      if (!password) return;
      try {
        await adminRequest({ action: 'set_password', user_id: user.id, password });
        toast('Senha temporária definida.');
      } catch (error) {
        toast(error.message || 'Não foi possível alterar a senha.');
      }
      return;
    }

    if (action === 'toggle') {
      const active = element.dataset.active === 'true';
      if (!confirm(`${active ? 'Ativar' : 'Desativar'} a conta de ${user.full_name}?`)) return;
      try {
        await adminRequest({ action: 'set_active', user_id: user.id, active });
        toast(active ? 'Conta ativada.' : 'Conta desativada.');
        await renderUsersPage();
      } catch (error) {
        toast(error.message || 'Não foi possível alterar o status.');
      }
      return;
    }

    if (action === 'delete') {
      const typed = prompt(`Esta ação exclui definitivamente a conta de ${user.full_name}.\nDigite EXCLUIR para confirmar:`);
      if (typed !== 'EXCLUIR') return;
      try {
        await adminRequest({ action: 'delete', user_id: user.id });
        toast('Usuário excluído definitivamente.');
        await renderUsersPage();
      } catch (error) {
        toast(error.message || 'Não foi possível excluir o usuário.');
      }
    }
  });
})();
