/* ============================================================
   REPROGRAFIA DO POVO — Configuração Central (Fase 4 Final)
   ============================================================ */

const CONFIG = {
  // ---------- SUPABASE ----------
  SUPABASE_URL: "https://fuyqclegbjiirjjnutnr.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_KrBAoVDtSGgTxegL6PWqAg_doOgMR3l",

  // ---------- LOJA ----------
  LOJA: {
    nome: "Reprografia do Povo",
    cidade: "Quelimane",
    whatsapp: "258871632577",
    email: "cleytoncasanova4@gmail.com",
    endereco: "Bairro Central, Quelimane, Zambézia",
    horario: "Seg–Dom · 07h30 – 21h00",
    taxaMaxPaginas: 500
  },

  // ---------- REDES SOCIAIS ----------
  REDES_SOCIAIS: {
    facebook:  "https://facebook.com/cleytoncasanova",
    instagram: "https://www.instagram.com/cleytoncasanova/profilecard/?igsh=Y2E0am1jMnk1ZmVq",
    tiktok:    "https://www.tiktok.com/@cleytoncasanova3?_r=1&_t=ZS-9BMfluFTb52",
    whatsapp:  "258871632577",
    email:     "cleytoncasanova4@gmail.com"
  },

  // ---------- PRODUTOS ----------
  PRODUTOS: [
    { id: "cpb1",  nome: "Cópia P&B (1 face)",              preco: 2,   categoria: "Cópias",    unidade: "pág", atalhos: [5, 10, 20, 50] },
    { id: "col1",  nome: "Impressão Colorida (1 face)",     preco: 35,  categoria: "Impressão", unidade: "pág", atalhos: [5, 10, 20, 50] },
    { id: "dig",   nome: "Digitação",                       preco: 20,  categoria: "Serviços",  unidade: "pág", atalhos: [1, 5, 10, 20] },
    { id: "enc",   nome: "Encadernação",                    preco: 35,  categoria: "Serviços",  unidade: "un",  atalhos: [1, 2, 5, 10] },
    { id: "tcCom", nome: "Trabalho Completo (com entrega)", preco: 250, categoria: "Pacotes",   unidade: "un",  atalhos: [1, 2, 3], requerTema: true, aplicaTaxaServico: true },
    { id: "tcSem", nome: "Trabalho Completo (sem entrega)", preco: 200, categoria: "Pacotes",   unidade: "un",  atalhos: [1, 2, 3], requerTema: true, aplicaTaxaServico: true }
  ],

  // ---------- ENTREGA ----------
  TAXAS_ENTREGA: {
    centro:    50,
    arredores: 30,
    bairros:   80,
    periferia: 120
  },

  // ---------- TAXA DE SERVIÇO ----------
  TAXA_SERVICO: 20,

   // ---------- ADMIN ----------
  // Login simples: só utilizador e senha.
  // Para mudar, edita aqui — nada mais.
  ADMIN: {
    utilizador: "repro",        
    senha:      "povo2026",     
    sessaoKey:  "repro_admin_logado",
    notifSom:   true
  },

  // ---------- UI ----------
  WHATSAPP_MSG_PREFIX: "Olá Reprografia do Povo! 👋\nQuero fazer um pedido:"
};

window.CONFIG = CONFIG;