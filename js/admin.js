/* ============================================================
   admin.js — Painel (Fase 4 Final)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const cfg = window.CONFIG;
  const { createClient } = supabase;
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  // ---------- Auth ----------
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  document.getElementById('btnLogout').addEventListener('click', async () => {
    await sb.auth.signOut();
    sessionStorage.removeItem(cfg.ADMIN.sessaoKey);
    window.location.href = 'login.html';
  });

  // ---------- Som ----------
  function tocarSom() {
    if (cfg.ADMIN.notifSom === false) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      [880, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.4);
      });
      setTimeout(() => ctx.close(), 1000);
    } catch (e) { console.warn('Áudio indisponível:', e); }
  }
  document.getElementById('btnTestarSom')?.addEventListener('click', tocarSom);

  // ---------- Estado ----------
  let pedidos = [];
  let produtos = [];
  let ultimoTotalPendentes = null;

  const fmt = (n) => Number(n).toLocaleString('pt-MZ') + ' MT';
  const fmtData = (d) => new Date(d).toLocaleString('pt-MZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const hoje = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

  async function carregarPedidos() {
    const { data, error } = await sb.from('repro_pedidos').select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    pedidos = data || [];
  }
  async function carregarProdutos() {
    const { data } = await sb.from('repro_produtos').select('id, nome, disponivel');
    const dispMap = {};
    (data || []).forEach(d => { dispMap[d.nome] = d.disponivel; });
    produtos = cfg.PRODUTOS.map(p => ({
      ...p, disponivel: dispMap[p.nome] !== false
    }));
  }

  function renderDashboard() {
    const inicioDia = hoje().getTime();
    const pedidosHoje = pedidos.filter(p => new Date(p.created_at).getTime() >= inicioDia);
    const pendentes = pedidos.filter(p => p.status === 'pendente');
    const faturado = pedidosHoje
      .filter(p => p.status === 'entregue' || p.status === 'pendente')
      .reduce((s, p) => s + Number(p.total || 0), 0);

    document.getElementById('statHoje').textContent = pedidosHoje.length;
    document.getElementById('statPendentes').textContent = pendentes.length;
    document.getElementById('statFaturado').textContent = fmt(faturado);

    if (ultimoTotalPendentes !== null && pendentes.length > ultimoTotalPendentes) tocarSom();
    ultimoTotalPendentes = pendentes.length;
  }

  function renderSwitches() {
    const grid = document.getElementById('switchGrid');
    grid.innerHTML = produtos.map(p => `
      <div class="switch-item">
        <div>
          <span class="sw-nome">${p.nome}</span>
          <span class="sw-preco">${p.preco} MT / ${p.unidade}</span>
        </div>
        <label class="switch">
          <input type="checkbox" data-nome="${p.nome}" ${p.disponivel ? 'checked' : ''}>
          <span class="switch-track"></span>
        </label>
      </div>
    `).join('');

    grid.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', async () => {
        const nome = cb.dataset.nome;
        const novo = cb.checked;
        const { data: existing } = await sb.from('repro_produtos')
          .select('id').eq('nome', nome).maybeSingle();

        if (existing?.id) {
          await sb.from('repro_produtos').update({ disponivel: novo }).eq('id', existing.id);
        } else {
          const prod = cfg.PRODUTOS.find(x => x.nome === nome);
          await sb.from('repro_produtos').insert([{
            nome, preco: prod.preco, categoria: prod.categoria, disponivel: novo
          }]);
        }
        const p = produtos.find(x => x.nome === nome);
        if (p) p.disponivel = novo;
      });
    });
  }

  function renderPendentes() {
    const lista = document.getElementById('pendentesList');
    const pend = pedidos.filter(p => p.status === 'pendente');

    if (pend.length === 0) {
      lista.innerHTML = `<div class="empty-state">✨ Nenhum pedido pendente.</div>`;
      return;
    }

    lista.innerHTML = pend.map(p => {
      const entregaTxt = p.modo_entrega === 'entrega'
        ? `🛵 Entrega (${p.zona || '—'}) · taxa ${p.taxa_entrega || 0} MT`
        : `🏪 Retirada na loja`;
      const temaTxt = p.tema
        ? `<br>📖 <strong>Tema:</strong> ${p.tema}${p.subtema ? `<br>📑 <strong>Subtema:</strong> ${p.subtema}` : ''}${p.observacoes ? `<br>📝 <strong>Obs:</strong> ${p.observacoes}` : ''}`
        : '';
      return `
        <div class="pedido-item" data-id="${p.id}">
          <div class="pi-head">
            <div>
              <div class="pi-cliente">${p.cliente}</div>
              <div class="pi-tel">📞 ${p.telefone}</div>
            </div>
            <div class="pi-total">${fmt(p.total)}</div>
          </div>
          <div class="pi-body">
            <strong>Itens:</strong> ${p.itens_texto}${temaTxt}<br>
            ${entregaTxt}${p.taxa_servico > 0 ? ` · ⚙️ taxa serviço ${p.taxa_servico} MT` : ''} · <em>${fmtData(p.created_at)}</em>
          </div>
          <div class="pi-actions">
            <button class="btn-deliver" data-action="entregue" data-id="${p.id}">✅ Entregue</button>
            <button class="btn-cancel" data-action="cancelado" data-id="${p.id}">❌ Cancelado</button>
          </div>
        </div>
      `;
    }).join('');

    lista.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => acaoPedido(btn.dataset.id, btn.dataset.action));
    });
  }

  async function acaoPedido(id, acao) {
    if (acao === 'cancelado') {
      if (!confirm('Cancelar e apagar este pedido?')) return;
      const { error } = await sb.from('repro_pedidos').delete().eq('id', id);
      if (error) { alert('Erro: ' + error.message); return; }
    } else if (acao === 'entregue') {
      const { error } = await sb.from('repro_pedidos').update({ status: 'entregue' }).eq('id', id);
      if (error) { alert('Erro: ' + error.message); return; }
    }
    await refresh();
  }

  function renderHistorico() {
    const body = document.getElementById('histBody');
    const hist = pedidos.filter(p => p.status === 'entregue' || p.status === 'cancelado');
    if (hist.length === 0) {
      body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;">Sem registos no histórico.</td></tr>`;
      return;
    }
    body.innerHTML = hist.map(p => `
      <tr>
        <td>#${p.id.slice(0, 6)}</td>
        <td>${p.cliente}</td>
        <td style="color:var(--gold);font-weight:700;">${fmt(p.total)}</td>
        <td><span class="badge-status ${p.status === 'entregue' ? 'badge-entregue' : 'badge-cancelado'}">${p.status}</span></td>
        <td>${fmtData(p.created_at)}</td>
      </tr>
    `).join('');
  }

  function gerarPDF(hist, titulo = 'Relatório de Pedidos') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-MZ');
    const horaStr = agora.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });

    doc.setFillColor(10, 23, 48);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(245, 197, 24);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPROGRAFIA DO POVO', 14, 14);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Quelimane · Zambézia', 14, 20);
    doc.text(`Emitido: ${dataStr} às ${horaStr}`, 14, 26);

    doc.setTextColor(10, 23, 48);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, 14, 46);

    const body = hist.map(p => [
      '#' + p.id.slice(0, 6),
      p.cliente,
      p.telefone || '—',
      fmt(p.total),
      p.status.toUpperCase(),
      fmtData(p.created_at)
    ]);

    doc.autoTable({
      startY: 52,
      head: [['ID', 'Cliente', 'Telefone', 'Total', 'Status', 'Data']],
      body, theme: 'grid',
      headStyles: { fillColor: [225, 29, 46], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      styles: { cellPadding: 3, lineColor: [220, 224, 232], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 20 }, 1: { cellWidth: 45 }, 2: { cellWidth: 32 },
        3: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 25, halign: 'center' }, 5: { cellWidth: 'auto' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    const totalEntregues = hist.filter(p => p.status === 'entregue')
      .reduce((s, p) => s + Number(p.total), 0);
    const totalCancelados = hist.filter(p => p.status === 'cancelado').length;
    const totalEntreguesCount = hist.filter(p => p.status === 'entregue').length;

    doc.setFontSize(10);
    doc.setTextColor(10, 23, 48);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total de registos: ${hist.length}`, 14, finalY + 6);
    doc.text(`Entregues: ${totalEntreguesCount} (${fmt(totalEntregues)})`, 14, finalY + 11);
    doc.text(`Cancelados: ${totalCancelados}`, 14, finalY + 16);

    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 224, 232);
    doc.line(14, pageH - 15, 196, pageH - 15);
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text('Reprografia do Povo · Documento gerado automaticamente', 14, pageH - 9);

    return doc;
  }

  document.getElementById('btnImprimirRelatorio').addEventListener('click', () => {
    const hist = pedidos.filter(p => p.status === 'entregue' || p.status === 'cancelado');
    if (hist.length === 0) { alert('Sem registos para imprimir.'); return; }
    const doc = gerarPDF(hist);
    const win = window.open(doc.output('bloburl'), '_blank');
    if (!win) alert('Permite pop-ups para imprimir o PDF.');
  });

  document.getElementById('btnFecharDia').addEventListener('click', async () => {
    const hist = pedidos.filter(p => p.status === 'entregue' || p.status === 'cancelado');
    if (hist.length === 0) { alert('Nada para fechar hoje.'); return; }
    if (!confirm(`Fechar o dia?\n\n• ${hist.length} registos no histórico\n• PDF descarregado + aberto para impressão\n• Histórico limpo do painel\n\nContinuar?`)) return;

    const doc = gerarPDF(hist, 'Fecho de Caixa do Dia');
    doc.save(`Fecho_${new Date().toISOString().slice(0,10)}.pdf`);
    setTimeout(() => {
      const win = window.open(doc.output('bloburl'), '_blank');
      if (win) win.focus();
    }, 400);

    const ids = hist.map(p => p.id);
    const { error } = await sb.from('repro_pedidos').delete().in('id', ids);
    if (error) { alert('Erro ao limpar: ' + error.message); return; }
    alert('✅ Dia fechado. PDF gerado e histórico limpo.');
    await refresh();
  });

  async function refresh() {
    await Promise.all([carregarPedidos(), carregarProdutos()]);
    renderDashboard();
    renderPendentes();
    renderHistorico();
    renderSwitches();
  }

  setInterval(async () => {
    await carregarPedidos();
    renderDashboard();
    renderPendentes();
    renderHistorico();
  }, 20000);

  try {
    sb.channel('pedidos-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'repro_pedidos' },
        async () => {
          await carregarPedidos();
          renderDashboard();
          renderPendentes();
          renderHistorico();
        })
      .subscribe();
  } catch (e) { console.warn('Realtime não disponível:', e); }

  await refresh();
});