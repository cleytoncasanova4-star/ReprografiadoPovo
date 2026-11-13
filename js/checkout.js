/* ============================================================
   checkout.js — Fase 4 (corrigido: valida tema só para Trabalhos Completos)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const cfg = window.CONFIG;
  const STORAGE_KEY = 'repro_carrinho_v2';

  // ---------- Helper: produto SEMPRE do CONFIG (fonte da verdade) ----------
  function getProduto(id) {
    return cfg.PRODUTOS.find(p => p.id === id);
  }
  function precisaTema(id) {
    const p = getProduto(id);
    return !!(p && p.requerTema === true);
  }

  // ---------- Carregar carrinho ----------
  const carrinho = {};
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    raw.forEach(({ id, qty, tema, subtema }) => {
      const produto = getProduto(id);
      if (!produto || !qty || qty <= 0) return;
      carrinho[id] = {
        produto,                                            // ← sempre do CONFIG
        qty,
        tema: produto.requerTema ? (tema || '') : '',
        subtema: produto.requerTema ? (subtema || '') : ''
      };
    });
  } catch (e) { console.warn(e); }

  if (Object.keys(carrinho).length === 0) {
    window.location.href = 'pedido.html';
    return;
  }

  // ---------- Estado ----------
  let modoEntrega = 'retirada';
  let zona = null;
  const trabalhoDetalhes = {};

  // Pré-preencher APENAS trabalhos completos
  Object.entries(carrinho).forEach(([id, it]) => {
    if (precisaTema(id)) {
      trabalhoDetalhes[id] = {
        tema: it.tema || '',
        subtema: it.subtema || '',
        observacoes: ''
      };
    }
  });

  const nomeEl = document.getElementById('nome');
  const telEl = document.getElementById('telefone');
  const modoOpts = document.querySelectorAll('.modo-opt');
  const zonaWrapper = document.getElementById('zonaWrapper');
  const zonasList = document.getElementById('zonasList');
  const resumoItens = document.getElementById('resumoItens');
  const resumoTotais = document.getElementById('resumoTotais');
  const btnEnviar = document.getElementById('btnEnviar');
  const btnEnviarTexto = document.getElementById('btnEnviarTexto');
  const trabalhoWrapper = document.getElementById('trabalhoWrapper');
  const trabalhoFields = document.getElementById('trabalhoFields');

  // ---------- Zonas ----------
  const ZONAS = [
    { id: 'centro',    label: 'Centro',    taxa: cfg.TAXAS_ENTREGA.centro },
    { id: 'arredores', label: 'Arredores', taxa: cfg.TAXAS_ENTREGA.arredores },
    { id: 'bairros',   label: 'Bairros',   taxa: cfg.TAXAS_ENTREGA.bairros },
    { id: 'periferia', label: 'Periferia', taxa: cfg.TAXAS_ENTREGA.periferia }
  ];
  zonasList.innerHTML = ZONAS.map(z => `
    <div class="zona-opt" data-zona="${z.id}">
      <strong>${z.label}</strong>
      <span>${z.taxa} MT</span>
    </div>
  `).join('');

  zonasList.querySelectorAll('.zona-opt').forEach(el => {
    el.addEventListener('click', () => {
      zonasList.querySelectorAll('.zona-opt').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      zona = el.dataset.zona;
      renderResumo();
    });
  });

  // ---------- Modo ----------
  modoOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      modoOpts.forEach(x => x.classList.remove('active'));
      opt.classList.add('active');
      modoEntrega = opt.dataset.modo;
      zonaWrapper.style.display = modoEntrega === 'entrega' ? 'block' : 'none';
      if (modoEntrega === 'retirada') zona = null;
      renderResumo();
    });
  });

  // ---------- Trabalho Completo: campos extra (SÓ para quem precisa) ----------
  function renderTrabalhoFields() {
    const trabalhos = Object.entries(carrinho).filter(([id]) => precisaTema(id));

    if (trabalhos.length === 0) {
      trabalhoWrapper.style.display = 'none';
      return;
    }
    trabalhoWrapper.style.display = 'block';

    trabalhoFields.innerHTML = trabalhos.map(([id, it]) => {
      const det = trabalhoDetalhes[id] || {};
      return `
        <div class="trabalho-bloco" data-id="${id}" style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px dashed var(--line);">
          <strong style="color:var(--gold);font-size:14px;display:block;margin-bottom:10px;">
            ${it.produto.nome} (×${it.qty})
          </strong>
          <div class="form-field">
            <label>Tema *</label>
            <input type="text" class="tema-c" placeholder="Ex: A importância da educação em Moçambique"
                   value="${det.tema || ''}" />
          </div>
          <div class="form-field">
            <label>Subtema *</label>
            <input type="text" class="subtema-c" placeholder="Ex: O papel das escolas primárias"
                   value="${det.subtema || ''}" />
          </div>
          <div class="form-field">
            <label>Observações (opcional)</label>
            <input type="text" class="obs-c" placeholder="Ex: 15 páginas, normas APA, capa dura"
                   value="${det.observacoes || ''}" />
          </div>
        </div>
      `;
    }).join('');

    trabalhoFields.querySelectorAll('.trabalho-bloco').forEach(bloco => {
      const id = bloco.dataset.id;
      bloco.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', () => {
          trabalhoDetalhes[id] = trabalhoDetalhes[id] || {};
          if (inp.classList.contains('tema-c')) trabalhoDetalhes[id].tema = inp.value;
          if (inp.classList.contains('subtema-c')) trabalhoDetalhes[id].subtema = inp.value;
          if (inp.classList.contains('obs-c')) trabalhoDetalhes[id].observacoes = inp.value;

          // sincroniza com carrinho
          if (carrinho[id]) {
            carrinho[id].tema = trabalhoDetalhes[id].tema;
            carrinho[id].subtema = trabalhoDetalhes[id].subtema;
          }
          renderResumo();
        });
      });
    });
  }

  // ---------- Cálculos ----------
  function subtotalProdutos() {
    return Object.values(carrinho).reduce((s, it) => s + it.qty * it.produto.preco, 0);
  }
  function taxaServico() {
    return Object.values(carrinho).some(it => it.produto.aplicaTaxaServico) ? cfg.TAXA_SERVICO : 0;
  }
  function taxaEntrega() {
    if (modoEntrega !== 'entrega' || !zona) return 0;
    const z = ZONAS.find(x => x.id === zona);
    return z ? z.taxa : 0;
  }
  function totalGeral() {
    return subtotalProdutos() + taxaServico() + taxaEntrega();
  }

  // ---------- Render resumo ----------
  function renderResumo() {
    resumoItens.innerHTML = Object.values(carrinho).map(({ produto, qty }) => `
      <div class="resumo-linha">
        <span class="rl-nome">${produto.nome} <br><small style="color:var(--muted);font-size:12px;">${qty} × ${produto.preco} MT</small></span>
        <span class="rl-valor">${(qty * produto.preco)} MT</span>
      </div>
    `).join('');

    const sub = subtotalProdutos();
    const srv = taxaServico();
    const ent = taxaEntrega();

    resumoTotais.innerHTML = `
      <div class="rt-linha"><span>Subtotal</span><span>${sub} MT</span></div>
      ${srv > 0 ? `<div class="rt-linha"><span>Taxa de serviço</span><span>${srv} MT</span></div>` : ''}
      <div class="rt-linha"><span>Taxa de entrega</span><span>${ent} MT</span></div>
      <div class="rt-final"><span>Total</span><span>${totalGeral()} MT</span></div>
    `;

    validar();
  }

  // ---------- Validação (só aplica tema a quem precisa) ----------
  function validar() {
    const problemas = [];

    if (!nomeEl.value.trim() || nomeEl.value.trim().length < 2) {
      problemas.push('nome');
      nomeEl.classList.add('error');
    } else nomeEl.classList.remove('error');

    const tel = telEl.value.replace(/\s+/g, '');
    if (!/^(\+?258)?\d{9}$/.test(tel)) {
      problemas.push('telefone');
      telEl.classList.add('error');
    } else telEl.classList.remove('error');

    if (modoEntrega === 'entrega' && !zona) problemas.push('zona');

    // ⚠️ Só percorre produtos que REALMENTE precisam de tema
    for (const id of Object.keys(carrinho)) {
      if (!precisaTema(id)) continue;
      const det = trabalhoDetalhes[id] || {};
      if (!det.tema?.trim()) problemas.push(`tema-${id}`);
      if (!det.subtema?.trim()) problemas.push(`subtema-${id}`);
    }

    if (problemas.length === 0) {
      btnEnviar.disabled = false;
      btnEnviarTexto.textContent = 'Enviar pedido pelo WhatsApp';
    } else {
      btnEnviar.disabled = true;
      const labels = { nome: 'o nome', telefone: 'o telefone', zona: 'a zona de entrega' };
      const faltas = [...new Set(problemas.map(p => {
        if (p.startsWith('tema-')) return 'o tema do trabalho';
        if (p.startsWith('subtema-')) return 'o subtema do trabalho';
        return labels[p] || p;
      }))];
      btnEnviarTexto.textContent = 'Falta preencher: ' + faltas.join(', ');
    }

    return problemas.length === 0;
  }

  nomeEl.addEventListener('input', validar);
  telEl.addEventListener('input', validar);

  // ---------- Mensagem WhatsApp ----------
  function construirMensagem() {
    const nome = nomeEl.value.trim();
    const tel = telEl.value.trim();

    const itens = Object.entries(carrinho).map(([id, it]) => {
      const { produto, qty } = it;
      let linha = `• ${produto.nome} — ${qty} × ${produto.preco} MT = *${qty * produto.preco} MT*`;

      // ⚠️ Só inclui tema/subtema se o produto exigir
      if (precisaTema(id)) {
        const info = trabalhoDetalhes[id] || {};
        if (info.tema) linha += `\n   📖 Tema: ${info.tema}`;
        if (info.subtema) linha += `\n   📑 Subtema: ${info.subtema}`;
        if (info.observacoes) linha += `\n   📝 Obs: ${info.observacoes}`;
      }
      return linha;
    }).join('\n');

    const srv = taxaServico();
    const ent = taxaEntrega();
    const entregaTexto = modoEntrega === 'entrega'
      ? `🛵 *Entrega* (${ZONAS.find(z => z.id === zona).label}) — ${ent} MT`
      : `🏪 *Retirada na loja* — 0 MT`;

    return `${cfg.WHATSAPP_MSG_PREFIX}

👤 *Cliente:* ${nome}
📞 *Telefone:* ${tel}

🛒 *Itens:*
${itens}

${entregaTexto}
${srv > 0 ? `⚙️ *Taxa de serviço:* ${srv} MT\n` : ''}
💰 *TOTAL: ${totalGeral()} MT*

Aguardo confirmação. Obrigado!`;
  }

  // ---------- Enviar ----------
  btnEnviar.addEventListener('click', async () => {
    if (!validar()) return;

    const nome = nomeEl.value.trim();
    const tel = telEl.value.trim();
    const itensTexto = Object.values(carrinho)
      .map(({ produto, qty }) => `${produto.nome} x${qty}`)
      .join('; ');

    // Primeiro trabalho que precisa de tema (se existir)
    const primeiroTrabalhoId = Object.keys(carrinho).find(id => precisaTema(id));
    const det = primeiroTrabalhoId ? (trabalhoDetalhes[primeiroTrabalhoId] || {}) : {};

    try {
      const { createClient } = supabase;
      const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      await sb.from('repro_pedidos').insert([{
        cliente: nome,
        telefone: tel,
        itens_texto: itensTexto,
        total: totalGeral(),
        modo_entrega: modoEntrega,
        zona: modoEntrega === 'entrega' ? zona : null,
        taxa_entrega: taxaEntrega(),
        taxa_servico: taxaServico(),
        tema: det.tema || null,
        subtema: det.subtema || null,
        observacoes: det.observacoes || null,
        status: 'pendente'
      }]);
    } catch (e) { console.warn('Supabase indisponível:', e); }

    const msg = encodeURIComponent(construirMensagem());
    window.open(`https://wa.me/${cfg.LOJA.whatsapp}?text=${msg}`, '_blank');

    localStorage.removeItem(STORAGE_KEY);
    setTimeout(() => {
      alert('Pedido enviado com sucesso! ✅\nA Reprografia do Povo entrará em contacto pelo WhatsApp.');
      window.location.href = 'index.html';
    }, 400);
  });

  // ---------- Init ----------
  renderTrabalhoFields();
  renderResumo();
});