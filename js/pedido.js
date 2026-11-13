/* ============================================================
   pedido.js — Fase 4 (corrigido: só Trabalhos Completos pedem tema)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const cfg = window.CONFIG;
  const lista = document.getElementById('produtosList');
  const totalEl = document.getElementById('totalValue');
  const barra = document.getElementById('barraTotal');
  const btnContinuar = document.getElementById('btnContinuar');

  const carrinho = {};
  const LIMITE = cfg.LOJA.taxaMaxPaginas || 500;
  const STORAGE_KEY = 'repro_carrinho_v2';   // ← versão nova (ignora carrinho antigo)

  // ---------- Disponibilidade via Supabase ----------
  let disponibilidade = {};
  try {
    const { createClient } = supabase;
    const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const { data } = await sb.from('repro_produtos').select('nome, disponivel');
    if (Array.isArray(data)) data.forEach(d => { disponibilidade[d.nome] = d.disponivel; });
  } catch (e) { console.warn('Supabase indisponível; usando config local.', e); }

  // ---------- Helper: devolve o produto SEMPRE do CONFIG (fonte da verdade) ----------
  function getProduto(id) {
    return cfg.PRODUTOS.find(p => p.id === id);
  }

  // ---------- Helper: este item precisa de tema? ----------
  // Regra: SEMPRE baseado no produto do CONFIG, nunca no localStorage.
  function precisaTema(id) {
    const p = getProduto(id);
    return !!(p && p.requerTema === true);
  }

  // ---------- Render ----------
  function render() {
    lista.innerHTML = cfg.PRODUTOS.map(p => {
      const disp = disponibilidade[p.nome] !== false;
      const qty = carrinho[p.id]?.qty || 0;
      const subtotal = qty * p.preco;
      const temTema = p.requerTema === true && qty > 0;

      return `
        <div class="produto-card ${disp ? '' : 'indisponivel'}" data-id="${p.id}">
          <div class="produto-top">
            <div class="produto-info">
              <h3>${p.nome}
                ${p.aplicaTaxaServico ? `<span class="taxa-badge">+ ${cfg.TAXA_SERVICO} MT taxa</span>` : ''}
              </h3>
              <span class="preco-un">${p.preco} MT / ${p.unidade}</span>
            </div>
            <div class="produto-subtotal">
              ${subtotal > 0 ? subtotal + ' MT' : '—'}
              <small>subtotal</small>
            </div>
          </div>

          <div class="qty-controls">
            <button class="qty-btn" data-action="dec" ${qty <= 0 || !disp ? 'disabled' : ''}>−</button>
            <input type="number" class="qty-input" value="${qty}" min="0" max="${LIMITE}" ${!disp ? 'disabled' : ''} />
            <button class="qty-btn" data-action="inc" ${qty >= LIMITE || !disp ? 'disabled' : ''}>+</button>
            <div class="qty-shortcuts">
              ${(p.atalhos || []).map(n => `
                <button class="qty-shortcut" data-action="set" data-n="${n}" ${!disp ? 'disabled' : ''}>+${n}</button>
              `).join('')}
            </div>
          </div>

          ${temTema ? `
            <div class="tema-extra">
              <div class="form-field">
                <label>Tema do trabalho *</label>
                <input type="text" class="tema-input" placeholder="Ex: A importância da educação"
                       value="${carrinho[p.id]?.tema || ''}" />
              </div>
              <div class="form-field">
                <label>Subtema *</label>
                <input type="text" class="subtema-input" placeholder="Ex: O papel das escolas primárias"
                       value="${carrinho[p.id]?.subtema || ''}" />
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    atualizarTotal();
  }

  // ---------- Total ----------
  function calcularTotal() {
    return Object.values(carrinho).reduce((s, it) => s + it.qty * it.produto.preco, 0);
  }
  function atualizarTotal() {
    const total = calcularTotal();
    totalEl.textContent = total.toLocaleString('pt-MZ') + ' MT';
    barra.classList.toggle('visible', total > 0);

    // ⚠️ Só valida tema para produtos que REALMENTE precisam
    const faltaTema = Object.keys(carrinho).some(id => {
      if (!precisaTema(id)) return false;                    // ignora cópia/impressão/encadernação
      const it = carrinho[id];
      return !it.tema?.trim() || !it.subtema?.trim();
    });

    btnContinuar.disabled = total <= 0 || faltaTema;
    btnContinuar.textContent = faltaTema ? 'Preenche o tema do trabalho' : 'Continuar →';
  }

  // ---------- Set qty ----------
  function setQty(id, qty) {
    const produto = getProduto(id);
    if (!produto) return;

    qty = Math.max(0, Math.min(LIMITE, parseInt(qty) || 0));

    if (qty === 0) {
      delete carrinho[id];
    } else {
      // Preserva tema/subtema se já existirem
      carrinho[id] = {
        produto,                               // ← sempre do CONFIG
        qty,
        tema: carrinho[id]?.tema || '',
        subtema: carrinho[id]?.subtema || ''
      };
    }
    salvarCarrinho();
    render();
  }

  // ---------- Eventos ----------
  lista.addEventListener('click', (e) => {
    const card = e.target.closest('.produto-card');
    if (!card) return;
    const id = card.dataset.id;
    const cur = carrinho[id]?.qty || 0;
    const act = e.target.dataset.action;

    if (act === 'inc') setQty(id, cur + 1);
    else if (act === 'dec') setQty(id, cur - 1);
    else if (act === 'set') setQty(id, cur + parseInt(e.target.dataset.n, 10));
  });

  lista.addEventListener('change', (e) => {
    if (!e.target.classList.contains('qty-input')) return;
    const card = e.target.closest('.produto-card');
    setQty(card.dataset.id, e.target.value);
  });

  lista.addEventListener('input', (e) => {
    const card = e.target.closest('.produto-card');
    if (!card) return;
    const id = card.dataset.id;
    if (!carrinho[id]) return;
    if (!precisaTema(id)) return;                            // ← bloqueia tema em produtos que não precisam

    if (e.target.classList.contains('tema-input')) carrinho[id].tema = e.target.value;
    else if (e.target.classList.contains('subtema-input')) carrinho[id].subtema = e.target.value;
    else return;

    salvarCarrinho();
    atualizarTotal();
  });

  // ---------- Persistência ----------
  function salvarCarrinho() {
    const simple = Object.entries(carrinho).map(([id, it]) => ({
      id,
      qty: it.qty,
      tema: precisaTema(id) ? (it.tema || '') : '',           // ← só guarda tema se fizer sentido
      subtema: precisaTema(id) ? (it.subtema || '') : ''
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(simple));
  }

  function carregarCarrinho() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      raw.forEach(({ id, qty, tema, subtema }) => {
        const produto = getProduto(id);                       // ← SEMPRE do CONFIG
        if (!produto || !qty || qty <= 0) return;
        carrinho[id] = {
          produto,
          qty: Math.min(qty, LIMITE),
          tema: produto.requerTema ? (tema || '') : '',       // ← só se o produto exigir
          subtema: produto.requerTema ? (subtema || '') : ''
        };
      });
    } catch (e) { console.warn('Erro ao carregar carrinho:', e); }
  }

  // ---------- Continuar ----------
  btnContinuar?.addEventListener('click', () => {
    if (btnContinuar.disabled) return;
    if (calcularTotal() <= 0) return;
    window.location.href = 'checkout.html';
  });

  // ---------- Init ----------
  carregarCarrinho();
  render();
});