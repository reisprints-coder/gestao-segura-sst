'use strict';

(() => {
  const SIGNATURE_BUCKET = 'epi-terms';
  const pads = new WeakMap();
  let signedReceipts = null;
  let receiptsLoading = false;

  const signatureStyles = `
    .signature-section{grid-column:1/-1;border:1px solid var(--border);border-radius:16px;background:var(--surface-2);padding:16px}
    .signature-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
    .signature-section h4{margin:0 0 4px;font-size:15px}.signature-section p{margin:0;color:var(--muted);font-size:12px;line-height:1.5}
    .signature-device-status{display:inline-flex;align-items:center;gap:7px;min-height:28px;padding:0 10px;border-radius:999px;background:var(--surface);font-size:11px;font-weight:800;color:var(--muted);white-space:nowrap}
    .signature-device-status.detected{color:var(--success)}
    .signature-canvas-wrap{position:relative;border:2px dashed var(--border);border-radius:14px;background:#fff;overflow:hidden;touch-action:none}
    .signature-canvas{display:block;width:100%;height:220px;cursor:crosshair;touch-action:none}
    .signature-placeholder{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;color:#8a989c;font-size:13px;text-align:center;padding:24px}
    .signature-placeholder.hidden{display:none}
    .signature-line{position:absolute;left:7%;right:7%;bottom:38px;height:1px;background:#c7d0d2;pointer-events:none}
    .signature-caption{position:absolute;left:0;right:0;bottom:12px;text-align:center;color:#66777b;font-size:11px;pointer-events:none}
    .signature-controls{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px}
    .signature-controls-left,.signature-controls-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .signature-quality{font-size:12px;color:var(--muted)}.signature-quality.ok{color:var(--success);font-weight:800}
    .signature-consent{grid-column:1/-1;display:flex!important;grid-template-columns:none!important;align-items:flex-start;gap:10px!important;padding:13px 14px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}
    .signature-consent input{width:18px!important;min-height:18px!important;height:18px!important;margin:1px 0 0;flex:0 0 auto}
    .signature-consent span{font-size:12px;line-height:1.5;font-weight:600;color:var(--text)}
    .receipt-panel{margin-top:16px}.receipt-actions{display:flex;gap:6px;flex-wrap:wrap;min-width:max-content}
    .receipt-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:800}
    .signature-saving{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--surface) 82%,transparent);backdrop-filter:blur(4px);font-weight:900}
    @media(max-width:560px){.signature-section{padding:12px}.signature-section-head{display:block}.signature-device-status{margin-top:8px}.signature-canvas{height:180px}.signature-controls{align-items:stretch}.signature-controls-left,.signature-controls-right{width:100%}.signature-controls .btn{flex:1}.receipt-actions{min-width:0}.receipt-actions .btn{flex:1}}
  `;

  const style = document.createElement('style');
  style.id = 'epi-signature-styles';
  style.textContent = signatureStyles;
  document.head.appendChild(style);

  const baseOpenForm = openForm;
  openForm = function signedOpenForm(type, id = '') {
    baseOpenForm(type, id);
    if (type === 'delivery') requestAnimationFrame(() => installSignaturePad(id));
  };

  const baseRenderPage = renderPage;
  renderPage = function signedRenderPage() {
    baseRenderPage();
    if (['epi-inventory', 'epis'].includes(currentPage)) queueMicrotask(renderReceiptPanel);
  };

  function installSignaturePad(epiId) {
    const form = document.getElementById('modal-form');
    if (!form || form.dataset.id !== epiId) return;
    const epi = state.epis.find(item => item.id === epiId);
    if (!epi) return toast('EPI não encontrado.');

    form.dataset.type = 'signed-delivery';
    form.querySelector('[name="signed"]')?.closest('label')?.remove();
    form.querySelector('.signature-section')?.remove();
    form.querySelector('.signature-consent')?.remove();

    const actions = form.querySelector('.form-actions');
    const signatureSection = document.createElement('section');
    signatureSection.className = 'signature-section';
    signatureSection.innerHTML = `
      <div class="signature-section-head">
        <div><h4>Assinatura do funcionário</h4><p>Use a mesa digitalizadora, caneta, tela sensível ao toque ou mouse. A entrega só será concluída após uma assinatura válida.</p></div>
        <span class="signature-device-status" data-signature-device>Dispositivo aguardando assinatura</span>
      </div>
      <div class="signature-canvas-wrap">
        <canvas class="signature-canvas" aria-label="Área para assinatura manuscrita"></canvas>
        <div class="signature-placeholder">Assine dentro desta área</div>
        <div class="signature-line"></div><div class="signature-caption">Assinatura do funcionário</div>
      </div>
      <div class="signature-controls">
        <div class="signature-controls-left"><button type="button" class="btn small" data-signature-clear>Limpar assinatura</button><span class="signature-quality">Nenhuma assinatura capturada</span></div>
        <div class="signature-controls-right"><span class="muted" style="font-size:11px">Compatível com Wacom, Huion, XP-Pen, mouse e toque</span></div>
      </div>`;

    const consent = document.createElement('label');
    consent.className = 'signature-consent';
    consent.innerHTML = `<input type="checkbox" name="signatureConsent" required><span>Declaro que recebi gratuitamente o EPI descrito acima, em condições adequadas, e fui orientado sobre uso, conservação, guarda, higienização, substituição e devolução. Confirmo que esta assinatura foi realizada por mim no momento da entrega.</span>`;

    form.insertBefore(signatureSection, actions);
    form.insertBefore(consent, actions);

    const submit = actions?.querySelector('button[type="submit"]');
    if (submit) {
      submit.textContent = 'Confirmar entrega assinada';
      submit.disabled = true;
    }

    const canvas = signatureSection.querySelector('canvas');
    const placeholder = signatureSection.querySelector('.signature-placeholder');
    const quality = signatureSection.querySelector('.signature-quality');
    const deviceStatus = signatureSection.querySelector('[data-signature-device]');
    const clearButton = signatureSection.querySelector('[data-signature-clear]');
    const consentInput = consent.querySelector('input');
    const pad = createPad(canvas, { placeholder, quality, deviceStatus, onChange: () => updateSubmitState(form) });
    pads.set(form, pad);
    clearButton.addEventListener('click', () => pad.clear());
    consentInput.addEventListener('change', () => updateSubmitState(form));
    updateSubmitState(form);
  }

  function createPad(canvas, ui) {
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    const pointerTypes = new Set();
    let activePointer = null;
    let last = null;
    let strokes = 0;
    let distance = 0;

    function fit() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      canvas.width = Math.max(600, Math.round(rect.width * dpr));
      canvas.height = Math.max(300, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#11181a';
    }

    function point(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, pressure: event.pressure > 0 ? event.pressure : 0.45 };
    }

    function update() {
      const hasInk = strokes > 0 && distance > 35;
      ui.placeholder.classList.toggle('hidden', hasInk);
      ui.quality.textContent = hasInk ? 'Assinatura capturada' : strokes ? 'Continue assinando' : 'Nenhuma assinatura capturada';
      ui.quality.classList.toggle('ok', hasInk);
      const types = [...pointerTypes];
      const label = types.includes('pen') ? 'Caneta digital detectada' : types.includes('touch') ? 'Toque detectado' : types.includes('mouse') ? 'Mouse detectado' : 'Dispositivo aguardando assinatura';
      ui.deviceStatus.textContent = label;
      ui.deviceStatus.classList.toggle('detected', types.length > 0);
      ui.onChange?.();
    }

    function start(event) {
      if (activePointer !== null) return;
      event.preventDefault();
      activePointer = event.pointerId;
      pointerTypes.add(event.pointerType || 'mouse');
      canvas.setPointerCapture?.(event.pointerId);
      last = point(event);
      strokes += 1;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      update();
    }

    function move(event) {
      if (event.pointerId !== activePointer || !last) return;
      event.preventDefault();
      const current = point(event);
      const dx = current.x - last.x;
      const dy = current.y - last.y;
      distance += Math.hypot(dx, dy);
      ctx.lineWidth = 1.35 + Math.min(1, current.pressure) * 2.8;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
      last = current;
      update();
    }

    function end(event) {
      if (event.pointerId !== activePointer) return;
      event.preventDefault();
      activePointer = null;
      last = null;
      update();
    }

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    fit();
    update();

    return {
      canvas,
      get hasInk() { return strokes > 0 && distance > 35; },
      get pointerTypes() { return [...pointerTypes]; },
      clear() {
        activePointer = null; last = null; strokes = 0; distance = 0; pointerTypes.clear();
        fit(); update();
      },
      dataUrl() { return canvas.toDataURL('image/png', 1); },
      blob() { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível gerar a imagem da assinatura.')), 'image/png', 1)); }
    };
  }

  function updateSubmitState(form) {
    const pad = pads.get(form);
    const consent = form.querySelector('[name="signatureConsent"]')?.checked;
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = !(pad?.hasInk && consent);
  }

  function receiptCode() {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `EPI-${ymd}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
  }

  async function sha256(blob) {
    const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function generateTermPdf({ code, employee, epi, quantity, reason, movementDate, signedAt, signatureDataUrl, signatureHash }) {
    const JsPDF = window.jspdf?.jsPDF;
    if (!JsPDF) throw new Error('O gerador de PDF não foi carregado. Atualize a página e tente novamente.');
    const doc = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
    const left = 20;
    const width = 170;
    let y = 18;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text('TERMO DE ENTREGA E RESPONSABILIDADE DE EPI', 105, y, { align: 'center' });
    y += 8; doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Comprovante: ${code}`, 105, y, { align: 'center' });
    y += 10;
    doc.setDrawColor(180); doc.roundedRect(left, y, width, 54, 2, 2);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('FUNCIONÁRIO', left + 4, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`Nome: ${employee.name}`, left + 4, y + 14);
    doc.text(`Matrícula: ${employee.registration || '—'}`, left + 4, y + 20);
    doc.text(`CPF: ${employee.cpf ? String(employee.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'}`, left + 4, y + 26);
    doc.text(`Cargo: ${employee.role || '—'}`, left + 4, y + 32);
    doc.text(`Setor: ${employee.sector || '—'}`, left + 4, y + 38);
    doc.text(`Empresa: ${employee.company || '—'}`, left + 4, y + 44);
    y += 60;
    doc.roundedRect(left, y, width, 48, 2, 2);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL', left + 4, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`EPI: ${epi.name}`, left + 4, y + 14);
    doc.text(`Código: ${epi.code}   |   CA: ${epi.ca || '—'}   |   Tamanho: ${epi.size || '—'}`, left + 4, y + 20);
    doc.text(`Quantidade: ${quantity}   |   Data da entrega: ${movementDate}`, left + 4, y + 26);
    doc.text(`Motivo: ${reason || 'Entrega de EPI'}`, left + 4, y + 32);
    doc.text(`Responsável pela entrega: ${state.profile?.full_name || currentUser.email}`, left + 4, y + 38);
    y += 55;
    doc.setFont('helvetica', 'bold'); doc.text('DECLARAÇÃO', left, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const declaration = 'Declaro que recebi gratuitamente o equipamento de proteção individual descrito neste termo, em condições adequadas de uso. Fui orientado quanto à finalidade, uso correto, conservação, guarda, higienização, substituição e devolução, comprometendo-me a utilizá-lo durante as atividades aplicáveis e a comunicar imediatamente qualquer dano, perda ou necessidade de troca.';
    const lines = doc.splitTextToSize(declaration, width);
    doc.text(lines, left, y, { lineHeightFactor: 1.45 });
    y += lines.length * 5 + 6;
    doc.setFontSize(8); doc.setTextColor(90);
    doc.text(`Assinado eletronicamente em ${signedAt.toLocaleString('pt-BR')}. Integridade SHA-256: ${signatureHash}`, left, y, { maxWidth: width });
    doc.setTextColor(0); y += 12;
    doc.addImage(signatureDataUrl, 'PNG', 55, y, 100, 32, undefined, 'FAST');
    y += 36; doc.setDrawColor(100); doc.line(55, y, 155, y);
    y += 5; doc.setFontSize(9); doc.text(employee.name, 105, y, { align: 'center' });
    y += 5; doc.text(`Matrícula: ${employee.registration || '—'}`, 105, y, { align: 'center' });
    y += 14; doc.setFontSize(7.5); doc.setTextColor(100);
    doc.text('Documento gerado pelo Gestão Segura SST. A imagem da assinatura e este termo são armazenados em área privada e vinculados ao registro da entrega.', 105, y, { align: 'center', maxWidth: 170 });
    return doc.output('blob');
  }

  async function uploadPrivate(path, blob, contentType) {
    const result = await db.storage.from(SIGNATURE_BUCKET).upload(path, blob, { contentType, upsert: false, cacheControl: '3600' });
    if (result.error) throw result.error;
    return result.data.path;
  }

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (form?.dataset?.type !== 'signed-delivery') return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const pad = pads.get(form);
    const data = Object.fromEntries(new FormData(form));
    const epi = state.epis.find(item => item.id === form.dataset.id);
    const employee = state.employees.find(item => item.name === data.employee);
    const quantity = Number(data.quantity);
    const submit = form.querySelector('button[type="submit"]');
    let uploaded = [];

    try {
      if (!epi) throw new Error('EPI não encontrado.');
      if (!employee) throw new Error('Selecione o funcionário.');
      if (!quantity || quantity <= 0) throw new Error('Informe uma quantidade válida.');
      if (quantity > Number(epi.stock)) throw new Error('Estoque insuficiente para esta entrega.');
      if (!pad?.hasInk) throw new Error('A assinatura do funcionário é obrigatória.');
      if (!data.signatureConsent) throw new Error('Confirme a declaração de recebimento.');

      submit.disabled = true;
      const overlay = document.createElement('div');
      overlay.className = 'signature-saving'; overlay.textContent = 'Salvando assinatura e gerando comprovante...';
      form.closest('.modal-card')?.appendChild(overlay);

      const signedAt = new Date();
      const code = receiptCode();
      const folder = `${currentUser.id}/${signedAt.getFullYear()}/${String(signedAt.getMonth() + 1).padStart(2, '0')}`;
      const signatureBlob = await pad.blob();
      const signatureHash = await sha256(signatureBlob);
      const signatureDataUrl = pad.dataUrl();
      const signaturePath = `${folder}/${code}-assinatura.png`;
      const termPath = `${folder}/${code}-termo.pdf`;
      await uploadPrivate(signaturePath, signatureBlob, 'image/png'); uploaded.push(signaturePath);
      const pdfBlob = generateTermPdf({ code, employee, epi, quantity, reason: data.reason, movementDate: data.date, signedAt, signatureDataUrl, signatureHash });
      await uploadPrivate(termPath, pdfBlob, 'application/pdf'); uploaded.push(termPath);

      const deviceInfo = {
        pointerTypes: pad.pointerTypes,
        userAgent: navigator.userAgent,
        platform: navigator.userAgentData?.platform || navigator.platform || '',
        maxTouchPoints: navigator.maxTouchPoints || 0,
        screen: `${screen.width}x${screen.height}`,
        capturedAt: signedAt.toISOString()
      };

      const rpc = await db.rpc('register_signed_epi_delivery', {
        p_epi_id: epi.id,
        p_employee_id: employee.id,
        p_quantity: quantity,
        p_reason: data.reason || 'Entrega de EPI assinada',
        p_movement_date: data.date,
        p_signature_path: signaturePath,
        p_signature_hash: signatureHash,
        p_signature_method: pad.pointerTypes.includes('pen') ? 'digital_pen_canvas' : pad.pointerTypes.includes('touch') ? 'touch_canvas' : 'pointer_canvas',
        p_device_info: deviceInfo,
        p_receipt_code: code,
        p_term_file_path: termPath
      });
      if (rpc.error) throw rpc.error;

      closeModal();
      signedReceipts = null;
      await loadData();
      renderPage();
      downloadBlob(pdfBlob, `${code}-termo-entrega-epi.pdf`);
      toast(`Entrega registrada com assinatura. Comprovante ${code}.`);
    } catch (error) {
      console.error(error);
      if (uploaded.length) await db.storage.from(SIGNATURE_BUCKET).remove(uploaded).catch(() => {});
      toast(error.message || 'Não foi possível concluir a entrega assinada.');
      submit.disabled = !(pad?.hasInk && form.querySelector('[name="signatureConsent"]')?.checked);
    } finally {
      form.closest('.modal-card')?.querySelector('.signature-saving')?.remove();
    }
  }, true);

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function loadSignedReceipts() {
    if (receiptsLoading || signedReceipts) return;
    receiptsLoading = true;
    const query = await db.from('epi_movements')
      .select('id,epi_id,employee_id,quantity,reason,movement_at,signed_at,signature_data,term_file_path,receipt_code,signer_name,signer_registration')
      .eq('movement_type', 'delivery')
      .not('signature_data', 'is', null)
      .order('movement_at', { ascending: false })
      .limit(60);
    signedReceipts = query.error ? [] : (query.data || []);
    receiptsLoading = false;
    if (['epi-inventory', 'epis'].includes(currentPage)) renderReceiptPanel();
  }

  function renderReceiptPanel() {
    const content = document.getElementById('page-content');
    if (!content) return;
    content.querySelector('#signed-receipts-panel')?.remove();
    const panel = document.createElement('section');
    panel.id = 'signed-receipts-panel';
    panel.className = 'panel receipt-panel';
    const rows = signedReceipts || [];
    panel.innerHTML = `<div class="panel-header"><div><p class="eyebrow">ASSINATURAS E TERMOS</p><h3>Comprovantes de entrega de EPI</h3></div><button class="btn small" data-action="refresh-signed-receipts">Atualizar</button></div>
      <div class="table-wrap"><table><thead><tr><th>Comprovante</th><th>Data</th><th>Funcionário</th><th>EPI</th><th>Qtd.</th><th>Motivo</th><th>Arquivos</th></tr></thead><tbody>${signedReceipts === null ? '<tr><td colspan="7"><div class="empty">Carregando comprovantes...</div></td></tr>' : rows.length ? rows.map(row => { const epi = state.epis.find(item => item.id === row.epi_id); const employee = state.employees.find(item => item.id === row.employee_id); return `<tr><td><span class="receipt-code">${escapeHtml(row.receipt_code || 'SEM-CÓDIGO')}</span></td><td>${new Date(row.signed_at || row.movement_at).toLocaleString('pt-BR')}</td><td><strong>${escapeHtml(row.signer_name || employee?.name || 'Funcionário')}</strong><br><span class="muted">${escapeHtml(row.signer_registration || employee?.registration || '')}</span></td><td>${escapeHtml(epi?.name || 'EPI')}</td><td>${number(row.quantity)}</td><td>${escapeHtml(row.reason || '—')}</td><td><div class="receipt-actions">${row.term_file_path ? `<button class="btn small primary" data-action="download-private-file" data-path="${escapeHtml(row.term_file_path)}" data-filename="${escapeHtml(row.receipt_code || 'termo-epi')}.pdf">Baixar termo</button>` : ''}${row.signature_data ? `<button class="btn small" data-action="view-private-file" data-path="${escapeHtml(row.signature_data)}">Ver assinatura</button>` : ''}</div></td></tr>`; }).join('') : '<tr><td colspan="7"><div class="empty">Nenhuma entrega assinada registrada.</div></td></tr>'}</tbody></table></div>`;
    content.appendChild(panel);
    if (signedReceipts === null) loadSignedReceipts();
  }

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'refresh-signed-receipts') {
      signedReceipts = null;
      renderReceiptPanel();
      return;
    }
    if (action === 'download-private-file') {
      button.disabled = true;
      try {
        const result = await db.storage.from(SIGNATURE_BUCKET).download(button.dataset.path);
        if (result.error) throw result.error;
        downloadBlob(result.data, button.dataset.filename || 'termo-epi.pdf');
      } catch (error) { toast(error.message || 'Não foi possível baixar o arquivo.'); }
      finally { button.disabled = false; }
    }
    if (action === 'view-private-file') {
      button.disabled = true;
      try {
        const result = await db.storage.from(SIGNATURE_BUCKET).createSignedUrl(button.dataset.path, 120);
        if (result.error) throw result.error;
        window.open(result.data.signedUrl, '_blank', 'noopener,noreferrer');
      } catch (error) { toast(error.message || 'Não foi possível abrir a assinatura.'); }
      finally { button.disabled = false; }
    }
  });
})();
