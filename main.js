// main.js - Lingocat v3 completo

let estat = {
  monedes: parseInt(localStorage.getItem('cat_monedes')) || 0,
  compres: JSON.parse(localStorage.getItem('cat_compres')) || [],
  introVist: JSON.parse(localStorage.getItem('cat_intro')) || false,
  progres: {
    nivellActualMapa: parseInt(localStorage.getItem('cat_nivell')) || 1,
    encerts: parseInt(localStorage.getItem('cat_encerts')) || 0
  },
  energia: parseInt(localStorage.getItem('cat_energia')) || 100,
  ultimaRecargaEnergia: parseInt(localStorage.getItem('cat_ultimaEnergia')) || Date.now()
};

const PACK_INICIAL = ["😀","😊","😂","👨","👩","🐶","🐱","🏠","🍎","🚗","⚽","📱","💻","🎵","❤️"];

let EMOJIS_BASE = [];
let PACKS_BOTIGA = [];
let FRASES_MINIJOC = [];
let TOTS_EMOJIS = [];
let CATEGORIES_TOTS = {};
let CATEGORIES_DESBLOQUEJADES = {};
let FRASE_ACTUAL = null;
let EMOJIS_TRIATS = [];

const MAP_CATEGORIES = {
  persona: 'persona', animal: 'animal', menjar: 'menjar', lloc: 'lloc',
  transport: 'transport', esport: 'esport', musica: 'musica', professio: 'professio',
  roba: 'roba', emocio: 'emocio', objecte: 'objecte', natura: 'natura', clima: 'natura'
};

// ===== BANCO VOCAB LECTURA =====
const BANCO_VOCAB = {...pega aquí tu BANCO_VOCAB completo...};

// ===== BANCO TIPS =====
const totsElsTips = [
  {truc: "El per masculí singular, La per femení singular", exemple: "El gat, La gata", nivell: "a1"},
  {truc: "Els per masculí plural, Les per femení plural", exemple: "Els gats, Les gates", nivell: "a1"},
  {truc: "Un/Una per indefinits singulars", exemple: "Un llibre, Una taula", nivell: "a1"},
  {truc: "Bon dia per saludar al matí", exemple: "Bon dia! Com estàs?", nivell: "a1"},
  {truc: "Bona nit per acomiadar-se", exemple: "Bona nit!", nivell: "a1"},
  {truc: "NY es pronuncia com ñ d'espanyol", exemple: "Any = Añ, Seny = Señ", nivell: "a2"},
  {truc: "Futur pròxim: anar a + infinitiu", exemple: "Vaig a estudiar", nivell: "a2"},
  {truc: "Negació: no + verb", exemple: "No parlo", nivell: "a2"},
  {truc: "Apòstrof L' D' N' S' davant vocal", exemple: "L'home, D'aigua", nivell: "b1"},
  {truc: "Subjuntiu present: que + verb", exemple: "Vull que vinguis", nivell: "b1"},
  {truc: "Per = causa/motiu, Per a = finalitat", exemple: "Ho faig per tu / És per a tu", nivell: "b1"},
  {truc: "Em, et, el/la, ens, us, els/les", exemple: "Em veig, Et veig", nivell: "a2"}
];

let tipsUsats = [];

const LANG = {
  no_prou_monedes: "No tens prou monedes!",
  energy_low: "No tens prou energia!",
  comprat: "Comprat",
  tips_titol: "Tip del dia",
  tips_btn: "Següent Tip"
};

// ===== INTRO SLIDES =====
const INTRO_SLIDES = [
  {emoji: "👋", titol: "Benvingut a Cat Lingo Emoji", text: "Aprèn català jugant amb emojis"},
  {emoji: "🎯", titol: "Missió diària", text: "Completa 25 frases per pujar de nivell"},
  {emoji: "📖", titol: "Lectura intel·ligent", text: "Genera textos segons el teu nivell A1-B1"},
  {emoji: "🎁", titol: "Desbloqueja emojis", text: "Compra packs a la botiga i amplia vocabulari"},
  {emoji: "🚀", titol: "Comencem!", text: "Prem Saltar per jugar"}
];

let slideActual = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await carregarDades();
  actualitzarUI();
  mostrarTab('mapa');
  setTimeout(mostrarIntro, 500);
});

// ===== NAVEGACIÓ TABS =====
function mostrarTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`.nav-btn[onclick="mostrarTab('${tab}')"]`).classList.add('active');

  if (tab === 'mapa') renderMapa();
  if (tab === 'missio') renderMissio();
  if (tab === 'gremi') mostrarSubTab('biblioteca');
  if (tab === 'lectura') generarLectura();
  if (tab === 'tips') carregarTips();
  if (tab === 'botiga') renderBotiga();
}

// ===== CARREGAR DADES =====
async function carregarDades() {
  try {
    const res = await fetch('./data/biblioteca_emojis.json');
    EMOJIS_BASE = await res.json();
  } catch(e) { console.error('Error biblioteca:', e); }

  try {
    const res = await fetch('./data/botiga_emojis.json');
    PACKS_BOTIGA = await res.json();
  } catch(e) { console.error('Error botiga:', e); }

  try {
    const res = await fetch('./data/minijoc_frases.json');
    const data = await res.json();
    FRASES_MINIJOC = data.frases || [];
  } catch(e) { console.error('Error frases:', e); }

  TOTS_EMOJIS = [...EMOJIS_BASE];
  PACKS_BOTIGA.forEach(pack => TOTS_EMOJIS.push(...pack.emojis));
  TOTS_EMOJIS = TOTS_EMOJIS.filter((v,i,a) =>
    a.findIndex(t => quitarSkinTone(t.emoji) === quitarSkinTone(v.emoji)) === i
  );
  construirCategories();
}

function quitarSkinTone(emoji) {
  return emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/u, '');
}

function construirCategories() {
  CATEGORIES_TOTS = {};
  CATEGORIES_DESBLOQUEJADES = {};
  TOTS_EMOJIS.forEach(e => {
    const cat = e.categoria;
    if (!CATEGORIES_TOTS[cat]) CATEGORIES_TOTS[cat] = [];
    if (!CATEGORIES_TOTS[cat].find(x => quitarSkinTone(x.emoji) === quitarSkinTone(e.emoji))) {
      CATEGORIES_TOTS[cat].push(e);
    }
  });
  const emojisDesbloquejats = [...PACK_INICIAL];
  estat.compres.forEach(idPack => {
    const pack = PACKS_BOTIGA.find(p => p.id === idPack);
    if (pack) pack.emojis.forEach(e => emojisDesbloquejats.push(e.emoji));
  });
  TOTS_EMOJIS.forEach(e => {
    const cat = e.categoria;
    if (!CATEGORIES_DESBLOQUEJADES[cat]) CATEGORIES_DESBLOQUEJADES[cat] = [];
    if (emojisDesbloquejats.includes(e.emoji)) {
      CATEGORIES_DESBLOQUEJADES[cat].push(e.emoji);
    }
  });
}

// ===== MAPA =====
function renderMapa() {
  const cont = document.getElementById('mapa-contenidor');
  let html = `<h3 style="text-align:center; margin-bottom:20px;">Mapa de Nivells</h3><div class="nivells-grid">`;
  for (let i = 1; i <= 100; i++) {
    const desbloquejat = i <= estat.progres.nivellActualMapa;
    const opacitat = desbloquejat? '1' : '0.3';
    const cursor = desbloquejat? 'pointer' : 'not-allowed';
    html += `<div class="nivell-card" style="opacity:${opacitat}; cursor:${cursor};" onclick="${desbloquejat? `jugarNivell(${i})` : ''}">${i}</div>`;
  }
  html += `</div>`;
  cont.innerHTML = html;
}

function jugarNivell(n) {
  alert(`Nivell ${n} - Aquí anirà el joc de nivells`);
}

function mapaNivellALletra(n) {
  if (n <= 25) return 'A1';
  if (n <= 50) return 'A2';
  if (n <= 75) return 'B1';
  return 'B1';
}

// ===== MISSIÓ =====
function renderMissio() {
  const cont = document.getElementById('missio-contenidor');
  cont.innerHTML = `
    <h3 style="text-align:center; margin-bottom:20px;">Missions</h3>
    <div class="missio-item">✅ Juga al Minijoc 5 vegades</div>
    <div class="missio-item">🔒 Desbloqueja 1 pack a la Botiga</div>
    <div class="missio-item">🔒 Arriba al nivell 10</div>
  `;
}

// ===== GREMI =====
function mostrarSubTab(sub) {
  document.querySelectorAll('.sub-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('gremi-' + sub).style.display = 'block';
  document.querySelector(`.sub-tab-btn[onclick="mostrarSubTab('${sub}')"]`).classList.add('active');
  if (sub === 'biblioteca') renderDiccionari();
  if (sub === 'minijoc') novaFrase();
}

// MINIJOC
function novaFrase() { /* tu función anterior */ }
function mostrarFrase() { /*... */ }
function generarOpcions() { /*... */ }
function triarEmoji(emoji) { /*... */ }
function comprovarMinijoc() { /*... */ }

// DICCIONARI
function renderDiccionari() { /* tu función anterior */ }




// ===== LECTURA =====
function tickEnergia() {
  const ara = Date.now();
  const diffMin = Math.floor((ara - estat.ultimaRecargaEnergia) / 60000);
  if (diffMin > 0) {
    estat.energia = Math.min(100, estat.energia + diffMin);
    estat.ultimaRecargaEnergia = ara;
    guardarEstat();
  }
}

function recargarConMonedes() {
  if (estat.monedes < 50) {
    mostrarModal(LANG.no_prou_monedes);
    return;
  }
  vibrar();
  estat.monedes -= 50;
  estat.energia = 100;
  estat.ultimaRecargaEnergia = Date.now();
  guardarEstat();
  actualitzarUI();
  generarLectura();
}

function generarLectura() {
  tickEnergia();
  const cont = document.getElementById('lectura-contenidor');
  if(!cont) return;

  const num = estat.progres.nivellActualMapa;
  const nivell = mapaNivellALletra(num).toLowerCase();
  const dadesNivell = BANCO_VOCAB[nivell];
  if (!dadesNivell) {
    cont.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.6;">Encara no hi ha lectures d’aquest nivell.</div>`;
    return;
  }

  const blocs = Object.keys(dadesNivell).filter(k => k!== "plantillas");
  if (blocs.length === 0) {
    cont.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.6;">No hi ha temes disponibles per aquest nivell.</div>`;
    return;
  }

  const temaKey = blocs[Math.floor(Math.random() * blocs.length)];
  const minutsPerSeguent = estat.energia >= 100? 0 : 5 - Math.floor((Date.now() - estat.ultimaRecargaEnergia) / 60000) % 5;
  const COST_LECTURA = 10;

  cont.innerHTML = `
    <div style="text-align:center; padding:20px; opacity:0.9;">
      <div style="font-size:48px; margin-bottom:10px;">📖</div>
      <div style="font-size:16px; margin-bottom:10px;">Nivell ${nivell.toUpperCase()} - ${temaKey.replace(/_/g, ' ').replace(/^la |^el /, '')}</div>
      <div style="font-size:14px; opacity:0.7; margin-bottom:10px;">Energia: ${estat.energia}/100</div>
      ${estat.energia < 100? `<div style="font-size:12px; opacity:0.6; margin-bottom:10px;">Següent punt en ${minutsPerSeguent} min</div>` : ''}
      <div style="font-size:14px; opacity:0.7; margin:15px 0;">Generar Lectura costa ${COST_LECTURA} energia</div>
      <button class="btn btn-prim" onclick="mostrarLectura()" ${estat.energia < COST_LECTURA? 'disabled' : ''} style="width:100%; margin:10px 0;">
        ${estat.energia >= COST_LECTURA? 'Generar Lectura' : 'No tens prou energia'}
      </button>
      ${estat.energia < 100 && estat.monedes >= 50? `<button class="btn btn-sec" onclick="recargarConMonedes()" style="width:100%; margin-top:10px;">⚡ Recarregar a 100 per 50 🪙</button>` : ''}
    </div>
  `;
}

function mostrarLectura() {
  if (estat.energia < 10) {
    mostrarModal(LANG.energy_low);
    return;
  }
  vibrar();
  estat.energia -= 10;

  const nivell = mapaNivellALletra(estat.progres.nivellActualMapa).toLowerCase();
  const dadesNivell = BANCO_VOCAB[nivell];
  if (!dadesNivell) {
    mostrarModal("Error: no hi ha dades d'aquest nivell");
    return;
  }

  const blocs = Object.keys(dadesNivell).filter(k => k!== "plantillas");
  const temaKey = blocs[Math.floor(Math.random() * blocs.length)];
  const h = dadesNivell[temaKey];
  const get = arr => arr && arr.length? arr[Math.floor(Math.random() * arr.length)] : "";
  const plantilla = get(dadesNivell.plantillas);
  if (!plantilla ||!plantilla.seq ||!plantilla.pregunta) {
    mostrarModal("Error generant lectura");
    return;
  }

  const ctx = {};
  ctx.protagonista = get(h.persones);
  ctx.tema = temaKey.replace(/_/g, " ").replace(/^la |^el /, "");

  for (let key in h) {
    if (key!== "persones" && key!== "plantillas") {
      ctx[key] = get(h[key]);
    }
  }

  let compilar = str => str.replace(/\$\{(\w+)\}/g, (_, k) => ctx[k] || "");
  let texto = compilar(plantilla.seq.join(" "));
  texto = texto.charAt(0).toUpperCase() + texto.slice(1);
  let pregunta = compilar(plantilla.pregunta);

  let vocabUsado = [ctx.lloc, ctx.cosa1, ctx.cosa2, ctx.menjar, ctx.beguda, ctx.accio_prota].filter(Boolean);
  vocabUsado = [...new Set(vocabUsado)].slice(0, 8);

  vocabUsado.forEach(v => {
    const esc = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${esc}\\b`, 'gi');
    texto = texto.replace(regex, `<span style="color:#4ade80; font-weight:600;">${v}</span>`);
  });

  let htmlVocab = `
    <div style="background:#1a1a1a; padding:15px; border-radius:8px; margin:20px 0;">
      <div style="color:#4ade80; font-weight:bold; margin-bottom:12px;">Vocabulari del tema: ${ctx.tema}</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:15px;">
  `;
  vocabUsado.forEach(v => {
    htmlVocab += `<div style="color:#4ade80;">${v}</div><div style="text-align:right;">${v}</div>`;
  });
  htmlVocab += `</div></div>`;

  let htmlNota = `
    <div style="background:#0f2a1f; border-left:3px solid #4ade80; padding:12px; border-radius:6px; margin-bottom:15px; font-size:14px;">
      Nota: En català posem l'article abans del nom: <i>la casa, el llibre</i>
    </div>
  `;

  document.getElementById('lectura-contenidor').innerHTML = `
    <div style="padding:20px; text-align:left;">
      <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">Nivell ${nivell.toUpperCase()} - ${temaKey.replace(/_/g, " ").replace(/^la |^el /, "")}</div>
      <div style="font-size:16px; line-height:1.7; margin-bottom:20px;">${texto}</div>
      ${htmlVocab}
      ${htmlNota}
      <div style="background:#1a1a1a; padding:15px; border-radius:8px; margin-bottom:15px;">
        <div style="font-weight:bold; margin-bottom:8px;">Pregunta:</div>
        <div>${pregunta}</div>
      </div>
      <button class="btn btn-prim" onclick="mostrarLectura()" style="width:100%; margin-bottom:10px;">Generar Lectura Nova</button>
      <button class="btn btn-sec" onclick="generarLectura()" style="width:100%;">Tornar</button>
    </div>
  `;

  guardarEstat();
  actualitzarUI();
}

// ===== TIPS =====
function carregarTips() {
  const cont = document.getElementById('tips-contenidor');
  if(!cont) return;

  if(tipsUsats.length === totsElsTips.length) {
    tipsUsats = []; // Reset quan s'acaben
  }

  let tipsDisponibles = totsElsTips.filter(t =>!tipsUsats.includes(t.truc));
  const tip = tipsDisponibles[Math.floor(Math.random() * tipsDisponibles.length)];
  tipsUsats.push(tip.truc);

  cont.innerHTML = `
    <div style="text-align:center; padding:30px;">
      <h3 style="margin-bottom:20px;">${LANG.tips_titol}</h3>
      <div style="background:linear-gradient(135deg, #4ade80, #22c55e); padding:25px; border-radius:15px; margin-bottom:20px;">
        <div style="font-size:18px; font-weight:bold; margin-bottom:15px;">💡 ${tip.truc}</div>
        <div style="font-size:14px; opacity:0.9;">Ex: ${tip.exemple}</div>
        <div style="font-size:12px; opacity:0.7; margin-top:10px;">Nivell: ${tip.nivell.toUpperCase()}</div>
      </div>
      <button class="btn" onclick="carregarTips()">${LANG.tips_btn}</button>
    </div>
  `;
}

// ===== BOTIGA =====
function renderBotiga() { /* tu función anterior */ }
function comprarPack(id, preu) { /* tu función anterior */ }

// ===== INTRO + SERVICE WORKER =====
function mostrarIntro() {
  if(estat.introVist) {
    document.getElementById('intro').classList.add('hidden');
    return;
  }
  document.getElementById('intro').classList.remove('hidden');
  pintarSlide();
}

function pintarSlide() {
  const slide = INTRO_SLIDES[slideActual];
  document.getElementById('intro-emoji').textContent = slide.emoji;
  document.getElementById('intro-titol').textContent = slide.titol;
  document.getElementById('intro-text').textContent = slide.text;
  document.getElementById('intro-dots').innerHTML = INTRO_SLIDES.map((_, i) =>
    `<span style="opacity:${i===slideActual?1:0.3}">●</span>`
  ).join(' ');
  document.getElementById('intro-btn').textContent = slideActual === INTRO_SLIDES.length - 1? 'Començar' : 'Següent';
}

function seguentSlide() {
  vibrar();
  if(slideActual < INTRO_SLIDES.length - 1) {
    slideActual++;
    pintarSlide();
  } else {
    tancarIntro();
  }
}

function tancarIntro() {
  estat.introVist = true;
  guardarEstat();
  document.getElementById('intro').classList.add('hidden');
}

// Service Worker per PWA
if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  });
}

// ===== UI + UTILS =====
function actualitzarUI() {
  document.getElementById('monedes').textContent = estat.monedes;
  document.getElementById('nivell').textContent = estat.progres.nivellActualMapa;
  document.getElementById('energia').textContent = estat.energia;
}

function guardarEstat() {
  localStorage.setItem('cat_monedes', estat.monedes);
  localStorage.setItem('cat_compres', JSON.stringify(estat.compres));
  localStorage.setItem('cat_nivell', estat.progres.nivellActualMapa);
  localStorage.setItem('cat_encerts', estat.progres.encerts);
  localStorage.setItem('cat_energia', estat.energia);
  localStorage.setItem('cat_ultimaEnergia', estat.ultimaRecargaEnergia);
}

function vibrar() {
  if (navigator.vibrate) navigator.vibrate(50);
}

function mostrarModal(msg) {
  alert(msg);
}