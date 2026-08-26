'use strict';

(() => {
  const catalogNav = navItems.find(item => item[0] === 'epis');
  if (catalogNav) catalogNav[2] = 'Cadastro de EPI';

  if (!navItems.some(item => item[0] === 'epi-inventory')) {
    const catalogIndex = navItems.findIndex(item => item[0] === 'epis');
    navItems.splice(catalogIndex + 1, 0, ['epi-inventory', '▥', 'Inventário de EPI']);
  }

  const canArchiveEpi = () => ['admin', 'manager', 'warehouse'].includes(state.profile?.role);
  const canDeleteGeneral = () => ['admin', 'manager'].includes(state.profile?.role);

  const originalRenderPage = renderPage;
  const originalOpenForm = openForm;

  function epiStatus(epi) {
    if (Number(epi.stock) <= 0) return ['Sem estoque', 'danger'];
    if (Number(epi.stock) <= Number(epi.minimum)) return ['Estoque baixo', 'warning'];
    return ['Estoque regular', 'success'];
  }

  function inventoryToolbar() {
    const categories = [...new Set(state.epis.map(item => item.category).filter(Boolean))];
    return `<div class="toolbar">
      <div>
        <h3 style="margin:0">Inventário de EPI</h3>
        <p class="muted" style="margin:5px 0 0">Saldo atual, entradas, entregas e necessidade de reposição.</p>
      </div>
      <div class="toolbar-right">
        <input id="table-search" class="input" placeholder="Buscar EPI..." value="${escapeHtml(tableSearch)}" />
        <select id="table-filter" class="select">
          <option>Todos</option>
          <option ${tableFilter === 'Estoque baixo' ? 'selected' : ''}>Estoque baixo</option>
          <option ${tableFilter === 'Sem estoque' ? 'selected' : ''}>Sem estoque</option>
          ${categories.map(item => `<option ${tableFilter === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
        </select>
        <button class="btn" data-action="export" data-export="epis">Exportar inventário</button>
        <button class="btn primary" data-action="open-form" data-form="inventory-entry">+ Registrar entrada</button>
      </div>
    </div>`;
  }

  renderEpis = function renderEpiCatalog() {
    const rows = state.epis.filter(item => {
      const matchesSearch = [item.code, item.name, item.category, item.ca, item.size, item.location, item.status]
        .join(' ').toLowerCase().includes(tableSearch.toLowerCase());
      return matchesSearch && (tableFilter === 'Todos' || item.category === tableFilter || item.status === tableFilter);
    });
    const categories = [...new Set(state.epis.map(item => item.category).filter(Boolean))];
    const active = state.epis.filter(item => item.status === 'Ativo').length;
    const expiring = state.epis.filter(item => daysUntil(item.caExpiry) <= 90).length;

    $('#page-content').innerHTML = `${toolbar(
      'Cadastro de EPI',
      'Catálogo mestre com CA, categoria, tamanho, custo e localização.',
      'Cadastrar EPI',
      'epi',
      `<select id="table-filter" class="select"><option>Todos</option>${categories.map(item => `<option ${tableFilter === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}</select>`
    )}
      <div class="metrics" style="margin-bottom:16px">
        ${metric('EPIs cadastrados', state.epis.length, '⬡', `${active} ativos`)}
        ${metric('Categorias', categories.length, '▦', 'Catálogo organizado')}
        ${metric('CAs em até 90 dias', expiring, '⌛', expiring ? 'Revisar validade' : 'Tudo regular', !expiring)}
        ${metric('Valor unitário médio', currency(state.epis.reduce((sum, item) => sum + Number(item.unitCost), 0) / Math.max(1, state.epis.length)), 'R$', 'Média do catálogo')}
      </div>
      <div class="table-card"><div class="table-wrap"><table>
        <thead><tr><th>EPI</th><th>Categoria</th><th>CA / validade</th><th>Tamanho</th><th>Custo</th><th>Localização</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>${rows.map(item => `<tr>
          <td><div class="entity"><span class="entity-avatar">⬡</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.code)}</small></span></div></td>
          <td>${escapeHtml(item.category)}</td>
          <td><strong>CA ${escapeHtml(item.ca)}</strong><br><span class="muted">${dateBR(item.caExpiry)}</span></td>
          <td>${escapeHtml(item.size)}</td>
          <td>${currency(item.unitCost)}</td>
          <td>${escapeHtml(item.location)}</td>
          <td>${badge(item.status)}</td>
          <td><div class="actions">
            <button class="btn small" data-action="open-form" data-form="epi" data-id="${item.id}">Editar</button>
            <button class="btn small primary" data-page="epi-inventory">Estoque</button>
            ${canArchiveEpi() ? `<button class="btn small danger" data-action="delete" data-collection="epis" data-id="${item.id}">Arquivar</button>` : ''}
          </div></td>
        </tr>`).join('') || '<tr><td colspan="8"><div class="empty">Nenhum EPI cadastrado.</div></td></tr>'}</tbody>
      </table></div></div>`;
  };

  function renderInventoryMovementHistory() {
    const target = $('#inventory-movement-body');
    if (!target) return;
    target.innerHTML = '<tr><td colspan="6"><div class="empty">Carregando movimentações...</div></td></tr>';

    db.from('epi_movements').select('*').order('movement_at', { ascending: false }).limit(40).then(({ data, error }) => {
      if (currentPage !== 'epi-inventory' || !$('#inventory-movement-body')) return;
      if (error) {
        $('#inventory-movement-body').innerHTML = `<tr><td colspan="6"><div class="empty">${escapeHtml(error.message)}</div></td></tr>`;
        return;
      }
      const movementLabels = {
        entry: 'Entrada', delivery: 'Entrega', return: 'Devolução', exchange: 'Troca',
        loss: 'Perda', damage: 'Dano', disposal: 'Descarte', adjustment: 'Ajuste'
      };
      $('#inventory-movement-body').innerHTML = (data || []).map(move => {
        const epi = state.epis.find(item => item.id === move.epi_id);
        const employee = state.employees.find(item => item.id === move.employee_id);
        return `<tr>
          <td>${new Date(move.movement_at).toLocaleString('pt-BR')}</td>
          <td><strong>${escapeHtml(epi?.name || 'EPI')}</strong><br><span class="muted">${escapeHtml(epi?.code || '')}</span></td>
          <td>${badge(movementLabels[move.movement_type] || move.movement_type)}</td>
          <td><strong>${number(move.quantity)}</strong></td>
          <td>${escapeHtml(employee?.name || '—')}</td>
          <td>${escapeHtml(move.reason || '—')}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="6"><div class="empty">Nenhuma movimentação registrada.</div></td></tr>';
    });
  }

  function renderEpiInventory() {
    const rows = state.epis.filter(item => {
      const status = epiStatus(item)[0];
      const matchesSearch = [item.code, item.name, item.category, item.size, item.location]
        .join(' ').toLowerCase().includes(tableSearch.toLowerCase());
      const matchesFilter = tableFilter === 'Todos' || tableFilter === item.category || tableFilter === status;
      return matchesSearch && matchesFilter;
    });
    const totalUnits = state.epis.reduce((sum, item) => sum + Number(item.stock), 0);
    const lowStock = state.epis.filter(item => Number(item.stock) <= Number(item.minimum)).length;
    const stockValue = state.epis.reduce((sum, item) => sum + Number(item.stock) * Number(item.unitCost), 0);

    $('#page-content').innerHTML = `${inventoryToolbar()}
      <div class="metrics" style="margin-bottom:16px">
        ${metric('Itens no inventário', state.epis.length, '▥', `${totalUnits} unidades`)}
        ${metric('Estoque baixo', lowStock, '!', lowStock ? 'Reposição necessária' : 'Estoque regular', !lowStock)}
        ${metric('Valor em estoque', currency(stockValue), 'R$', 'Patrimônio atual')}
        ${metric('Entregas registradas', state.epiDeliveries.length, '↗', 'Histórico rastreável')}
      </div>
      <div class="inventory-grid">
        ${rows.map(item => {
          const status = epiStatus(item);
          const percentage = Math.min(100, Math.round(Number(item.stock) / Math.max(1, Number(item.minimum)) * 100));
          return `<article class="inventory-card">
            <div class="inventory-card-head">
              <div><p class="eyebrow">${escapeHtml(item.code)} • ${escapeHtml(item.category)}</p><h3>${escapeHtml(item.name)}</h3><span class="muted">${escapeHtml(item.size)} • ${escapeHtml(item.location)}</span></div>
              ${badge(status[0], status[1])}
            </div>
            <div class="inventory-numbers"><div><small>Saldo atual</small><strong>${number(item.stock)}</strong></div><div><small>Estoque mínimo</small><strong>${number(item.minimum)}</strong></div><div><small>Valor em estoque</small><strong>${currency(Number(item.stock) * Number(item.unitCost))}</strong></div></div>
            <div class="progress inventory-progress"><span style="width:${percentage}%"></span></div>
            <div class="actions inventory-actions">
              <button class="btn small primary" data-action="open-form" data-form="inventory-entry" data-id="${item.id}">Entrada</button>
              <button class="btn small" data-action="open-form" data-form="delivery" data-id="${item.id}" ${Number(item.stock) <= 0 ? 'disabled' : ''}>Entregar</button>
              <button class="btn small" data-action="open-form" data-form="epi" data-id="${item.id}">Editar cadastro</button>
            </div>
          </article>`;
        }).join('') || '<div class="empty inventory-empty">Nenhum item encontrado no inventário.</div>'}
      </div>
      <section class="panel inventory-history" style="margin-top:16px">
        <div class="panel-header"><div><p class="eyebrow">RASTREABILIDADE</p><h3>Movimentações recentes</h3></div></div>
        <div class="table-wrap"><table><thead><tr><th>Data / hora</th><th>EPI</th><th>Movimento</th><th>Quantidade</th><th>Funcionário</th><th>Motivo</th></tr></thead><tbody id="inventory-movement-body"></tbody></table></div>
      </section>`;

    renderInventoryMovementHistory();
  }

  renderPage = function enhancedRenderPage() {
    if (currentPage === 'epi-inventory') {
      renderEpiInventory();
      updateNotificationCount();
    } else {
      originalRenderPage();
    }
    queueMicrotask(addMissingDeleteButtons);
  };

  function openInventoryEntry(epiId = '') {
    const modal = $('#modal');
    const form = $('#modal-form');
    const selected = state.epis.find(item => item.id === epiId);
    $('#modal-kicker').textContent = 'MOVIMENTAÇÃO DE ESTOQUE';
    $('#modal-title').textContent = selected ? `Entrada — ${selected.code}` : 'Registrar entrada de EPI';
    form.dataset.type = 'inventory-entry';
    form.dataset.id = epiId;
    form.innerHTML = `
      <label>EPI<select name="epiId" required>${state.epis.map(item => `<option value="${item.id}" ${item.id === epiId ? 'selected' : ''}>${escapeHtml(item.code)} — ${escapeHtml(item.name)}</option>`).join('')}</select></label>
      <label>Quantidade recebida<input name="quantity" type="number" min="0.01" step="0.01" required /></label>
      <label>Data de recebimento<input name="receivedAt" type="date" value="${todayISO()}" required /></label>
      <label>Lote / referência<input name="batchReference" type="text" placeholder="Ex.: LOTE-2026-015" /></label>
      <label>Fornecedor<input name="supplier" type="text" /></label>
      <label>Nota fiscal / documento<input name="invoiceNumber" type="text" /></label>
      <label>Custo unitário (R$)<input name="unitCost" type="number" min="0" step="0.01" value="${selected?.unitCost ?? 0}" /></label>
      <label class="span-2">Observação<textarea name="notes" placeholder="Informações adicionais da entrada"></textarea></label>
      <div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Registrar entrada</button></div>`;
    modal.classList.remove('hidden');
  }

  openForm = function enhancedOpenForm(type, id = '') {
    if (type === 'inventory-entry') return openInventoryEntry(id);
    return originalOpenForm(type, id);
  };

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (form.id !== 'modal-form' || form.dataset.type !== 'inventory-entry') return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      const epi = state.epis.find(item => item.id === data.epiId);
      const quantity = Number(data.quantity);
      if (!epi || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Informe um EPI e uma quantidade válida.');

      const unitCost = Number(data.unitCost || 0);
      if (!Number.isFinite(unitCost) || unitCost < 0) throw new Error('Informe um custo unitário válido.');

      const entry = await db.rpc('register_epi_inventory_entry', {
        p_epi_id: epi.id,
        p_quantity: quantity,
        p_received_at: data.receivedAt,
        p_batch_number: data.batchReference || null,
        p_supplier: data.supplier || null,
        p_invoice_number: data.invoiceNumber || null,
        p_unit_cost: unitCost,
        p_notes: data.notes || null
      });
      if (entry.error) throw entry.error;

      await loadData();
      closeModal();
      renderPage();
      toast('Entrada registrada e saldo atualizado.');
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível registrar a entrada.');
    } finally {
      submitButton.disabled = false;
    }
  }, true);

  function addMissingDeleteButtons() {
    const configs = {
      expenses: ['expense', 'expenses', 'Excluir'],
      forklifts: ['forklift', 'forklifts', 'Arquivar'],
      dds: ['dds', 'dds', 'Excluir']
    };
    const config = configs[currentPage];
    if (!config || !canDeleteGeneral()) return;
    const [formType, collection, label] = config;
    $$(`[data-action="open-form"][data-form="${formType}"][data-id]`).forEach(editButton => {
      const actions = editButton.closest('.actions');
      if (!actions || actions.querySelector(`[data-action="delete"][data-id="${editButton.dataset.id}"]`)) return;
      actions.insertAdjacentHTML('beforeend', `<button class="btn small danger" data-action="delete" data-collection="${collection}" data-id="${editButton.dataset.id}">${label}</button>`);
    });
  }

  if (!$('#app').classList.contains('hidden')) {
    setupNav();
    renderPage();
  }
})();
