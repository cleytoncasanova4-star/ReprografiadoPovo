/* ============================================================
   app.js — Lógica do index (Fase 4 Final)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const cfg = window.CONFIG || {};

  // ---------- Ano ----------
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---------- Navbar scroll ----------
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 30);
  });

  // ---------- Mobile menu ----------
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  navToggle?.addEventListener('click', () => mobileMenu?.classList.toggle('open'));
  mobileMenu?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => mobileMenu.classList.remove('open'))
  );

  // ---------- Render serviços ----------
  const grid = document.getElementById('servicesGrid');
  if (grid && Array.isArray(cfg.PRODUTOS)) {
    grid.innerHTML = cfg.PRODUTOS.map(p => `
      <div class="service-card fade-in">
        <span class="sc-cat">${p.categoria}</span>
        <h3 class="sc-name">${p.nome}</h3>
        <div class="sc-price">${p.preco} <span>MT</span></div>
        <div class="sc-un">por ${p.unidade}</div>
        ${p.aplicaTaxaServico ? `<div class="sc-un" style="color:var(--gold);font-size:12px;">+ ${cfg.TAXA_SERVICO} MT taxa de serviço</div>` : ''}
        <a href="pedido.html?p=${p.id}" class="sc-link">Pedir agora →</a>
      </div>
    `).join('');
  }

  // ---------- Redes sociais no footer ----------
  const social = document.getElementById('footerSocial');
  if (social && cfg.REDES_SOCIAIS) {
    const r = cfg.REDES_SOCIAIS;
    const icons = {
      facebook: `<svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>`,
      instagram:`<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.8.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.2.4-.3 1-.4 2.1-.1 1.3-.1 1.7-.1 4.8s0 3.5.1 4.8c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.3.1 1.7.1 4.8.1s3.5 0 4.8-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.3.1-1.7.1-4.8s0-3.5-.1-4.8c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4-1.3-.1-1.7-.1-4.8-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.3-8.3a1.2 1.2 0 1 1-2.3 0 1.2 1.2 0 0 1 2.3 0z"/></svg>`,
      tiktok:   `<svg viewBox="0 0 24 24"><path d="M19.6 6.3a4.9 4.9 0 0 1-3.6-1.7v8.7a6.3 6.3 0 1 1-5.3-6.2v3.1a3.2 3.2 0 1 0 2.2 3v-11h2.9a4.9 4.9 0 0 0 3.8 4.1v3z"/></svg>`,
      whatsapp: `<svg viewBox="0 0 24 24"><path d="M17.6 6.3A9.9 9.9 0 0 0 2 12a9.9 9.9 0 0 0 1.5 5.3L2 22l4.8-1.5A9.9 9.9 0 0 0 12 22a9.9 9.9 0 0 0 9.9-9.9c0-2.6-1-5.1-2.9-7zM12 20.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1 1 20.2 12 8.2 8.2 0 0 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1s-.6.8-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.3.1-.2 0-.4 0-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>`,
      email:    `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`
    };

    const link = (rede, href, label) => href ? `
      <a data-rede="${rede}" href="${href}" target="_blank" rel="noopener" aria-label="${label}">
        ${icons[rede]}
      </a>` : '';

    social.innerHTML = [
      link('facebook',  r.facebook,  'Facebook'),
      link('instagram', r.instagram, 'Instagram'),
      link('tiktok',    r.tiktok,    'TikTok'),
      link('whatsapp',  r.whatsapp ? `https://wa.me/${r.whatsapp}` : '', 'WhatsApp'),
      link('email',     r.email ? `mailto:${r.email}` : '', 'Email')
    ].join('');
  }

  // ---------- Fade-in ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));

  // ---------- Lightbox ----------
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      if (lightboxImg) lightboxImg.src = item.dataset.img;
      lightbox?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  const closeLb = () => { lightbox?.classList.remove('open'); document.body.style.overflow = ''; };
  closeBtn?.addEventListener('click', closeLb);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });

  // ---------- WhatsApp flutuante ----------
  const wpp = document.getElementById('whatsappFloat');
  if (wpp && cfg.LOJA?.whatsapp) {
    const msg = encodeURIComponent(cfg.WHATSAPP_MSG_PREFIX || 'Olá! Quero fazer um pedido.');
    wpp.href = `https://wa.me/${cfg.LOJA.whatsapp}?text=${msg}`;
    wpp.target = '_blank';
    wpp.rel = 'noopener';
  }
});