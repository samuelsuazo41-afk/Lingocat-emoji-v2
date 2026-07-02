// main.js - Lingocat Emoji v3 REPARADO
// Estructura Cròniques + Mapa 100 nivells + 25 frases per nivell

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.createElement('button');
  btn.textContent = '📱 Instal·la l\'App';
  btn.className = 'btn btn-sec';
  btn.style.position = 'fixed';
  btn.style.bottom = '80px';
  btn.style.right = '20px';
  btn.style.zIndex = '999';
  btn.onclick = () => {
    deferredPrompt.prompt();
    btn.remove();
  };
  document.body.appendChild(btn);
});

// ===== ESTADO GLOBAL =====
const DEBUG_NO_ENERGIA = true;

let estat = {
  progres: {
    nivellActualMapa: parseInt(localStorage.getItem('cat_nivell')) || 1,
    encerts: parseInt(localStorage.getItem('cat_encerts')) || 0,
    frasesDesDeUltimNivell: parseInt(localStorage.getItem('cat_frasesContador')) || 0,
    energia: (() => {
      const saved = localStorage.getItem('cat_energia');
      return saved === null ? 100 : parseInt(saved); // 100 solo primera vez
    })(),
    xp: parseInt(localStorage.getItem('cat_xp')) || 0
  },
  monedes: parseInt(localStorage.getItem('cat_monedes')) || 0,
  compres: JSON.parse(localStorage.getItem('cat_compres')) || [],
  introVist: JSON.parse(localStorage.getItem('cat_intro')) || false,
  personatgeTriat: localStorage.getItem('cat_personatge') || 'joven',
  ultimaRecargaEnergia: (() => {
    const saved = localStorage.getItem('cat_ultimaEnergia');
    return saved === null ? Date.now() : parseInt(saved);
  })(),
  desbloquejats: JSON.parse(localStorage.getItem('cat_desbloquejats')) || {}
};

const PACK_INICIAL = ["😀","😊","😂","👨","👩","🐶","🐱","🏠","🍎","🚗","⚽","📱","💻","🎵","❤️"];

// ===== PERSONATGES JUGADOR - 6 BASE =====
const PERSONATGES_JUGADOR = [
  {id: 'joven', emoji: '👨', nom: 'Joven'},
  {id: 'jova', emoji: '👩', nom: 'Jova'},
  {id: 'noi', emoji: '👦', nom: 'Noi'},
  {id: 'noia', emoji: '👧', nom: 'Noia'},
  {id: 'home', emoji: '👨‍🦰', nom: 'Home'},
  {id: 'dona', emoji: '👩‍🦰', nom: 'Dona'}
];

// ===== NOM DEL PROTAGONISTA A LES LECTURES =====
let nomPersonatge = 'Joven';

// ===== DATOS =====
let CATEGORIES_TOTS = {};
let BIBLIOTECA_PLA = [];
let BIBLIOTECA_POR_CAT = {};
let PACKS_BOTIGA = [];
let FRASES_MINIJOC = [];
let DETERMINANTS = {};
let TOTS_EMOJIS = [];
let CATEGORIES_DESBLOQUEJADES = {};
let BANCO_VOCAB = {};
let dadesTips = {};

// ===== LECTURA STATE =====
let lecturaActualText = '';
let lecturaActualVocab = [];
let lecturaActualPreguntes = [];

// ===== MINIJOC =====
let NIVELL_MINIJOC = {minEmojis: 2, maxEmojis: 5, nivelActual: parseInt(localStorage.getItem('cat_nivell_minijoc')) || 1};
let minijoc = {fraseObjectiu: null, emojisTriats: [], emojisDisponibles: []};
let minijocInicialitzat = false;

// ===== TIPS =====
let totsElsTips = [];
let tipsUsats = [];

// ===== INTRO =====
let slideActual = 0;
const INTRO_SLIDES = [
  {emoji: "🙀", titol: "Benvingut a Cat Lingo", text: "Aprèn català en 5 minuts al dia. Tria personatge i comencem."},
  {emoji: "⛷️", titol: "Vocabulari visual", text: "Toca emojis i aprèn paraules. Desbloqueja packs a la Botiga."},
  {emoji: "📝", titol: "Gramàtica fàcil", text: "Explicacions curtes amb exemples de les teves lectures."},
  {emoji: "📚", titol: "Lectures adaptades", text: "Textos al teu nivell A1, A2 o B1. Guanya XP i puja."},
  {emoji: "🚀", titol: "A jugar!", text: "Prem Saltar o toca la pantalla per començar"}
];

// ===== UTILS =====
function quitarSkinTone(emoji) {
  return emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
}

function vibrar() {
  if (navigator.vibrate) navigator.vibrate(50);
}

function mostrarMissatge(text) {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#22c55e; color:#000; padding:12px 20px; border-radius:8px; font-weight:700; z-index:10000;';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

function actualitzarUI() {
  const monedesEl = document.getElementById('monedes');
  const nivellEl = document.getElementById('nivell');
  const energiaEl = document.getElementById('energia');
  const barraEl = document.getElementById('barra-progres');
  const headerPersonatge = document.getElementById('header-personatge');
  if (monedesEl) monedesEl.textContent = estat.monedes;
  if (nivellEl) nivellEl.textContent = estat.progres.nivellActualMapa;
  if (energiaEl) energiaEl.textContent = estat.progres.energia;
  if (barraEl) barraEl.style.width = ((estat.progres.frasesDesDeUltimNivell / 25) * 100) + '%';
  const personatge = PERSONATGES_JUGADOR.find(p => p.id === estat.personatgeTriat);
  if (headerPersonatge && personatge) headerPersonatge.textContent = personatge.emoji;
}

function regenerarEnergia() {
  const ara = Date.now();
  const diffMinuts = Math.floor((ara - estat.ultimaRecargaEnergia) / 60000);
  if (diffMinuts >= 5 && estat.progres.energia < 100) {
    const blocs = Math.floor(diffMinuts / 5);
    const energiaRecuperada = blocs * 30;
    estat.progres.energia = Math.min(100, estat.progres.energia + energiaRecuperada);
    estat.ultimaRecargaEnergia = ara - ((diffMinuts % 5) * 60000);
    guardarEstat();
    actualitzarUI();
  }
}

function iniciarRegeneracioAutomatica() {
  setInterval(() => {
    if (estat.progres.energia < 100) {
      estat.progres.energia = Math.min(100, estat.progres.energia + 30);
      guardarEstat();
      actualitzarUI();
      if (document.getElementById('tab-missio').classList.contains('active')) {
        renderMissio();
      }
    }
  }, 5 * 60 * 1000);
}

function guardarEstat() {
  localStorage.setItem('cat_monedes', estat.monedes);
  localStorage.setItem('cat_compres', JSON.stringify(estat.compres));
  localStorage.setItem('cat_nivell', estat.progres.nivellActualMapa);
  localStorage.setItem('cat_encerts', estat.progres.encerts);
  localStorage.setItem('cat_frasesContador', estat.progres.frasesDesDeUltimNivell);
  localStorage.setItem('cat_energia', estat.progres.energia);
  localStorage.setItem('cat_ultimaEnergia', estat.ultimaRecargaEnergia);
  localStorage.setItem('cat_intro', JSON.stringify(estat.introVist));
  localStorage.setItem('cat_desbloquejats', JSON.stringify(estat.desbloquejats));
  localStorage.setItem('cat_nivell_minijoc', NIVELL_MINIJOC.nivelActual);
  localStorage.setItem('cat_personatge', estat.personatgeTriat);
  localStorage.setItem('cat_xp', estat.progres.xp);
}

// ===== CARGA DE DATOS MINIJOC =====
async function carregarDadesMinijoc() {
  try {
    const [frasesRes, detRes] = await Promise.all([
      fetch('./data/minijoc_frases.json'),
      fetch('./data/minijoc_determinants.json')
    ]);
    if (!frasesRes.ok ||!detRes.ok) {
      throw new Error(`HTTP ${frasesRes.status} ${detRes.status}`);
    }
    const frasesData = await frasesRes.json();
    FRASES_MINIJOC = Array.isArray(frasesData)? frasesData : (frasesData.frases || []);
    DETERMINANTS = await detRes.json();
    console.log('Minijoc carregat:', FRASES_MINIJOC.length, 'frases');
    minijocInicialitzat = true;
  } catch (e) {
    console.error('Error cargant minijoc:', e);
  }
}

// ===== INICIALITZACIÓ =====
document.addEventListener('DOMContentLoaded', async () => {
  regenerarEnergia();
  iniciarRegeneracioAutomatica();
  mostrarIntro();
  await carregarDades();
  await carregarDadesMinijoc();
  actualitzarUI();
  canviarTab('mapa', null);
  // Auto-generar primera lectura si toca
  setTimeout(() => {
    if (document.getElementById('lectura-texto') &&!lecturaActualText) {
      generarLectura();
    }
  }, 200);
});

// ===== NAVEGACIÓ =====
function canviarTab(tab, e) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  if(e && e.target) e.target.closest('.nav-item').classList.add('active');
  if(tab === 'mapa') renderMapa();
  if(tab === 'missio') renderMissio();
  if(tab === 'gremi') mostrarSubTab('biblioteca');
  if(tab === 'lectura') generarLectura();
  if(tab === 'tips') carregarTips();
  if(tab === 'botiga') renderBotiga();
}

function mostrarSubTab(sub) {
  document.querySelectorAll('.sub-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('gremi-' + sub).style.display = 'block';
  const btn = document.querySelector(`.sub-tab-btn[onclick="mostrarSubTab('${sub}')"]`);
  if(btn) btn.classList.add('active');
  if (sub === 'personatges') mostrarGremiPersonatges();
  if (sub === 'biblioteca') renderDiccionari();
  if (sub === 'minijoc') setTimeout(() => novaFraseMinijoc(), 50);
    if (sub === 'gramatica') setTimeout(() => generarGramatica(), 0);
}

// ===== CARREGAR DADES =====
async function carregarDades() {
  try {
    const [catRes, bibRes, botRes, lecturaRes, tipsRes] = await Promise.all([
      fetch('./data/categories_emoji.json'),
      fetch('./data/biblioteca_emoji.json'),
      fetch('./data/botiga_emoji.json'),
      fetch('./data/banco_lectura.json'),
      fetch('./data/tips.json')
    ]);
    CATEGORIES_TOTS = await catRes.json();
    BIBLIOTECA_PLA = await bibRes.json();
    PACKS_BOTIGA = await botRes.json();
    BANCO_VOCAB = await lecturaRes.json();
    dadesTips = await tipsRes.json();
  } catch(e) {
    console.error('Error carregant dades:', e);
    mostrarMissatge('Error carregant dades. Revisa que els fitxers /data/ existeixin');
  }
  agruparBibliotecaPorCategoria();
  construirCategories();
  construirTotsEmojis();
}

function agruparBibliotecaPorCategoria() {
  BIBLIOTECA_POR_CAT = {};
  BIBLIOTECA_PLA.forEach(e => {
    if (!BIBLIOTECA_POR_CAT[e.categoria]) BIBLIOTECA_POR_CAT[e.categoria] = [];
    BIBLIOTECA_POR_CAT[e.categoria].push(e);
  });
}

function construirCategories() {
  const desbloquejats = new Set(PACK_INICIAL.map(e => quitarSkinTone(e)));
  estat.compres.forEach(idPack => {
    const packId = idPack.includes('_p')? idPack.split('_p')[0] : idPack;
    const pack = PACKS_BOTIGA.find(p => p.id === packId);
    if (pack && pack.emojis) pack.emojis.forEach(e => desbloquejats.add(quitarSkinTone(e.emoji)));
  });
  CATEGORIES_DESBLOQUEJADES = {};
  Object.keys(CATEGORIES_TOTS).forEach(cat => {
    CATEGORIES_DESBLOQUEJADES[cat] = CATEGORIES_TOTS[cat].filter(e => desbloquejats.has(quitarSkinTone(e)));
  });
  estat.desbloquejats = CATEGORIES_DESBLOQUEJADES;
}

function construirTotsEmojis() {
  TOTS_EMOJIS = BIBLIOTECA_PLA.map(e => ({...e}));
}

// ===== INTRO =====
function mostrarIntro() {
  const introEl = document.getElementById('intro');
  if (!introEl) return;
  introEl.style.display = 'flex';
  slideActual = 0;
  pintarSlide();
  introEl.onclick = () => seguentSlide();
}

function pintarSlide() {
  const slide = INTRO_SLIDES[slideActual];
  document.getElementById('intro-emoji').textContent = slide.emoji;
  document.getElementById('intro-titol').textContent = slide.titol;
  document.getElementById('intro-text').textContent = slide.text;
  document.getElementById('intro-dots').innerHTML = INTRO_SLIDES.map((_, i) => `<span style="opacity:${i===slideActual?1:0.3}">●</span>`).join(' ');

  const btn = document.getElementById('intro-btn');
  btn.textContent = slideActual === INTRO_SLIDES.length - 1? 'Començar' : 'Següent';
  btn.onclick = (e) => {
    e.stopPropagation();
    seguentSlide();
  };
0
  const saltarBtn = document.querySelector('#intro button:last-child');
  if (saltarBtn) {
    saltarBtn.onclick = (e) => {
      e.stopPropagation();
      saltarIntro();
    };
  }
}

function seguentSlide() {
  vibrar();
  if (slideActual < INTRO_SLIDES.length - 1) {
    slideActual++;
    pintarSlide();
  } else {
    saltarIntro();
  }
}

function saltarIntro() {
  estat.introVist = true;
  guardarEstat();
  document.getElementById('intro').style.display = 'none';
}0

// ===== MAPA - 100 NIVELLS, 25 FRASES PER NIVELL =====
function renderMapa() {
  const cont = document.getElementById('mapa-contenidor');
  if (!cont) return;
  if (!CATEGORIES_TOTS || Object.keys(CATEGORIES_TOTS).length === 0) {
    let html = '<h3 style="text-align:center; margin-bottom:20px;">Carregant mapa...</h3><div class="nivells-grid">';
    for (let i = 1; i <= 100; i++) html += `<div class="nivell-card" style="background:#222; border-color:#333; color:#555; opacity:0.5">${i}</div>`;
    cont.innerHTML = html + '</div>';
    return;
  }
  let html = '<h3 style="text-align:center; margin-bottom:20px;">Mapa de Nivells</h3><div class="nivells-grid">';
  for (let i = 1; i <= 100; i++) {
    const desbloquejat = i <= estat.progres.nivellActualMapa;
    const opacitat = desbloquejat? '1' : '0.4';
    const cursor = desbloquejat? 'pointer' : 'not-allowed';
    const color = desbloquejat? '#22c55e' : '#333';
    const onclick = desbloquejat? `jugarNivell(${i})` : '';
    const tooltip = desbloquejat? '' : ` title="Falten ${25 - estat.progres.frasesDesDeUltimNivell} frases per desbloquejar"`;
    html += `<div class="nivell-card" style="border-color:${color}; opacity:${opacitat}; cursor:${cursor}" onclick="${onclick}"${tooltip}>${i}</div>`;
  }
  html += '</div>';
  cont.innerHTML = html;
}

function jugarNivell(n) {
  if (n > estat.progres.nivellActualMapa) return;
  canviarTab('gremi', null);
  mostrarSubTab('minijoc');
}

// ===== MISSIONS CLICABLES =====
function renderMissio() {
  const cont = document.getElementById('missio-contenidor');
  if (!cont) return;
  const nivell = estat.progres.nivellActualMapa || 1;
  const xp = estat.progres.xp || 0;
  const xpPerNivell = nivell * 100;
  const xpFaltant = xpPerNivell - xp;
  const nivellB1 = 25;
  const progresoB1 = Math.min(100, Math.max(0, (nivell / nivellB1) * 100));
  const nivellsPerB1 = Math.max(0, nivellB1 - nivell);
  const missio1 = xpFaltant > 0? '🎯' : '✅';
  const missio2 = estat.compres && estat.compres.length > 0? '✅' : '📦';
  const missio3 = '📚';
  const missio5 = nivellsPerB1 === 0? '✅' : '🏆';
  cont.innerHTML = `
    <h3 style="text-align:center; margin-bottom:20px;">Missions</h3>
    <div class="missio-item" onclick="canviarTab('gremi', null); mostrarSubTab('minijoc');" style="cursor:pointer;">
      ${missio1} Et falten ${xpFaltant} acerts per pujar de nivell
    </div>
    <div class="missio-item" onclick="canviarTab('botiga', null);" style="cursor:pointer;">
      ${missio2} Desbloqueja tota la biblioteca. Compra packs d'emojis amb monedes
    </div>
    <div class="missio-item" onclick="canviarTab('lectura', null); setTimeout(() => mostrarSubTab('gramatica'), 100);" style="cursor:pointer;">
      ${missio3} Aprèn gramàtica com un pro
    </div>
    <div class="missio-item" onclick="recarregarEnergia()" style="cursor:pointer;">
      ⚡ Recarrega la teva energia. Gasta 50 monedes per tornar a 100
    </div>
    <div class="missio-item" style="cursor:default;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
        <span style="font-size:32px;">${missio5}</span>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:16px; margin-bottom:4px;">Arriba al nivell B1</div>
          <div style="font-size:13px; color:#aaa;">Nivell ${nivell} de ${nivellB1} - Et falten ${nivellsPerB1} nivells</div>
        </div>
      </div>
      <div style="width:100%; height:8px; background:var(--border); border-radius:4px; overflow:hidden;">
        <div style="width:${progresoB1}%; height:100%; background:var(--accent); transition:width 0.4s ease;"></div>
      </div>
    </div>
  `;
}

function recarregarEnergia() {
  if (estat.progres.energia >= 100) {
    mostrarMissatge('Ja tens l\'energia al màxim!');
    return;
  }
  if (estat.monedes < 50) {
    mostrarMissatge('No tens prou monedes. Necessites 50.');
    return;
  }
  estat.monedes -= 50;
  estat.progres.energia = 100;
  estat.ultimaRecargaEnergia = Date.now();
  guardarEstat();
  actualitzarUI();
  renderMissio();
  vibrar();
  mostrarMissatge('Energia recarregada a 100!');
}

// ===== GREMI - PERSONATGES =====
function mostrarGremiPersonatges() {
  const cont = document.getElementById('gremi-personatges');
  if (!cont) return;
  const nomsDisponibles = new Set();
  ['a1', 'a2', 'b1'].forEach(niv => {
    const data = BANCO_VOCAB[niv];
    if (data?.personatges) {
      data.personatges.forEach(nom => nomsDisponibles.add(nom));
    }
  });
  if (nomsDisponibles.size === 0) {
    ['Ana', 'Pau', 'Sofia', 'Marc', 'Laia', 'Jordi'].forEach(n => nomsDisponibles.add(n));
  }
  const personatge = PERSONATGES_JUGADOR.find(p => p.id === estat.personatgeTriat);
  let html = `<div style="text-align:center; padding:20px;">`;
  html += `<div style="font-size:80px; margin-bottom:10px;">${personatge.emoji}</div>`;
  html += `<h3>${personatge.nom}</h3>`;
  html += `<p style="color:#888; margin-bottom:10px;">Avatar actual</p>`;
  html += `<p style="color:#22c55e; margin-bottom:30px;">Nom a les lectures: <b>${nomPersonatge}</b></p>`;
  html += `<button class="btn btn-sec" onclick="mostrarSelectorNom()" style="margin-bottom:30px;">Canviar nom de lectura</button>`;
  html += `<div style="padding-top:20px; border-top:1px solid #333;"><h4 style="text-align:center; margin-bottom:15px;">Canvia d'avatar</h4><div class="emoji-grid">`;
  PERSONATGES_JUGADOR.forEach(p => {
    const seleccionat = p.id === estat.personatgeTriat;
    html += `<div class="emoji-item" style="border:${seleccionat? '2px solid #22c55e' : '1px solid #333'}; cursor:pointer;" onclick="triarPersonatge('${p.id}')">
      <div class="emoji-large">${p.emoji}</div>
      <div class="emoji-name">${p.nom}</div>
    </div>`;
  });
  html += `</div></div>`;
  html += `<div id="selector-nom" style="display:none; margin-top:30px; padding-top:20px; border-top:1px solid #333;">
    <h4 style="text-align:center; margin-bottom:15px;">Tria nom per les lectures:</h4>
    <div class="emoji-grid">`;
  [...nomsDisponibles].sort().forEach(nom => {
    const seleccionat = nom === nomPersonatge;
    html += `<div class="emoji-item" style="border:${seleccionat? '2px solid #22c55e' : '1px solid #333'}; cursor:pointer;" onclick="setNomPersonatge('${nom}')">
      <div class="emoji-name">${nom}</div>
    </div>`;
  });
  html += `</div></div></div>`;
  cont.innerHTML = html;
}

function mostrarSelectorNom() {
  const el = document.getElementById('selector-nom');
  el.style.display = el.style.display === 'none'? 'block' : 'none';
}

function setNomPersonatge(nom) {
  nomPersonatge = nom;
  mostrarGremiPersonatges();
  vibrar();
  if (document.getElementById('tab-lectura').classList.contains('active')) {
    generarLectura();
  }
}

function triarPersonatge(id) {
  estat.personatgeTriat = id;
  guardarEstat();
  actualitzarUI();
  mostrarGremiPersonatges();
  vibrar();
}

// ===== BIBLIOTECA =====
function renderDiccionari() {
  const cont = document.getElementById('gremi-biblioteca');
  if (!cont) return;
  let html = `<h3 style="text-align:center; margin-bottom:10px;">Biblioteca</h3>`;
  html += `<p style="text-align:center; color:#888; margin-bottom:20px; font-size:14px;">Tots els emojis disponibles. Compra packs a la Botiga per desbloquejar-los.</p>`;
  const BASE_INICIAL = PACK_INICIAL.map(e => quitarSkinTone(e));
  for (const [cat, emojis] of Object.entries(BIBLIOTECA_POR_CAT)) {
    html += `<h4 style="margin:20px 0 8px; color:#4CAF50; text-transform:capitalize;">${cat}</h4><div class="emoji-grid">`;
    emojis.forEach(e => {
      const emojiNet = quitarSkinTone(e.emoji);
      const esBase = BASE_INICIAL.includes(emojiNet);
      const desbloquejatPerPack = estat.compres.some(idPack => {
        const packId = idPack.includes('_p')? idPack.split('_p')[0] : idPack;
        const pack = PACKS_BOTIGA.find(p => p.id === packId);
        return pack && pack.emojis.some(pe => quitarSkinTone(pe.emoji) === emojiNet);
      });
      const desbloquejat = esBase || desbloquejatPerPack;
      const opacitat = desbloquejat? '1' : '0.12';
      const filtre = desbloquejat? '' : 'grayscale(1) brightness(0.4)';
      const cursor = desbloquejat? 'pointer' : 'not-allowed';
      const colorTexto = desbloquejat? '#fff' : '#444';
      html += `<div class="emoji-item" style="opacity:${opacitat}; filter:${filtre}; cursor:${cursor};">
        <div class="emoji-large">${e.emoji}</div>
        <div class="emoji-name" style="color:${colorTexto}; font-weight:600;">${e.nom_cat}</div>
        ${e.para_frases? `<div style="font-size:10px; color:#aaa; margin-top:4px;">${e.para_frases.slice(0,3).join(', ')}</div>` : ''}
      </div>`;
    });
    html += `</div>`;
  }
  cont.innerHTML = html;
}

// ===== MINIJOC =====
function obtenirArticle(emoji) {
  const emojiData = BIBLIOTECA_PLA.find(e => quitarSkinTone(e.emoji) === quitarSkinTone(emoji));
  if (!emojiData ||!emojiData.nom_cat) return emoji;
  const nom = emojiData.nom_cat.toLowerCase();
  let det = DETERMINANTS[nom] || (emojiData.genere === 'f'? 'La' : 'El');
  if (det === "L'" &&!'aeiouàèéíòóúh'.includes(nom[0])) {
    det = "El";
  }
  return `${det} ${emojiData.nom_cat}`;
}

function generarFraseDinamica(plantilla, emojisJugador) {
  let text = plantilla.text;
  let solucio = [];
  let esPrimer = true;
  for (const cat of plantilla.categories) {
    const emojisDisponibles = CATEGORIES_TOTS[cat]?.filter(eBase => emojisJugador.some(eJug => quitarSkinTone(eJug) === quitarSkinTone(eBase)) ) || [];
    if (!emojisDisponibles.length) {
      return generarFraseDinamica(FRASES_MINIJOC[Math.floor(Math.random() * FRASES_MINIJOC.length)], emojisJugador);
    }
    const emojiElegit = emojisDisponibles[Math.floor(Math.random() * emojisDisponibles.length)];
    let reemplazo = obtenirArticle(emojiElegit);
    if (esPrimer) {
      const emojiData = BIBLIOTECA_PLA.find(e => quitarSkinTone(e.emoji) === quitarSkinTone(emojiElegit));
      const nom = emojiData?.nom_cat?.toLowerCase() || '';
      const detCorrecte = DETERMINANTS[nom] || (emojiData.genere === 'f'? 'La' : 'El');
      const detIncorrecte = detCorrecte === 'La'? 'El' : 'La';
      const detAmbBarra = detCorrecte === "L'" &&!'aeiouàèéíòóúh'.includes(nom[0])? `El/${detIncorrecte}` : `${detCorrecte}/${detIncorrecte}`;
      reemplazo = `${detAmbBarra} ${emojiData.nom_cat}`;
      esPrimer = false;
    }
    text = text.replace(new RegExp(`\\s*(La |El |L'|La/|El/|l'|el |l'/la )?\\{${cat}\\}`, 'gi'), ` ${reemplazo}`);
    solucio.push(emojiElegit);
  }
  return { text, solucio };
}

function novaFraseMinijoc() {
  if (!FRASES_MINIJOC || FRASES_MINIJOC.length === 0 ||!minijocInicialitzat) return;
  const emojisJugador = BIBLIOTECA_PLA
   .filter(e => {
      const emojiNet = quitarSkinTone(e.emoji);
      const esBase = PACK_INICIAL.map(e => quitarSkinTone(e)).includes(emojiNet);
      const desbloquejatPerPack = estat.compres.some(idPack => {
        const packId = idPack.includes('_p')? idPack.split('_p')[0] : idPack;
        const pack = PACKS_BOTIGA.find(p => p.id === packId);
        return pack && pack.emojis.some(pe => quitarSkinTone(pe.emoji) === emojiNet);
      });
      return esBase || desbloquejatPerPack;
    })
   .map(e => e.emoji);
  if (emojisJugador.length < 2) {
    document.getElementById('minijoc-frase').textContent = "Puja de nivell per desbloquejar més emojis!";
    document.getElementById('minijoc-emojis').innerHTML = '';
    return;
  }
  const plantilla = FRASES_MINIJOC[Math.floor(Math.random() * FRASES_MINIJOC.length)];
  const { text, solucio } = generarFraseDinamica(plantilla, emojisJugador);
  minijoc.fraseObjectiu = { text, solucio };
  minijoc.emojisTriats = [];
  document.getElementById('minijoc-frase').textContent = text;
  document.getElementById('minijoc-triats').textContent = '';
  document.getElementById('minijoc-feedback').innerHTML = '';
  document.getElementById('minijoc-nivell').textContent = `Nivell ${estat.progres.nivellActualMapa} - ${solucio.length} emojis`;
  generarOpcionsMinijoc(solucio);
}

function generarOpcionsMinijoc(solucio) {
  const grid = document.getElementById('minijoc-emojis');
  if (!grid) return;
  const numOpcions = solucio.length <= 3? 16 : 20;
  const numFalsos = numOpcions - solucio.length;
  const emojisJugador = BIBLIOTECA_PLA
   .filter(e => {
      const emojiNet = quitarSkinTone(e.emoji);
      const esBase = PACK_INICIAL.map(e => quitarSkinTone(e)).includes(emojiNet);
      const desbloquejatPerPack = estat.compres.some(idPack => {
        const packId = idPack.includes('_p')? idPack.split('_p')[0] : idPack;
        const pack = PACKS_BOTIGA.find(p => p.id === packId);
        return pack && pack.emojis.some(pe => quitarSkinTone(pe.emoji) === emojiNet);
      });
      return esBase || desbloquejatPerPack;
    })
   .map(e => e.emoji);
  const falsos = emojisJugador.filter(e =>!solucio.some(eSol => quitarSkinTone(e) === quitarSkinTone(eSol)))
   .sort(() => 0.5 - Math.random()).slice(0, numFalsos);
  const opcions = [...solucio,...falsos].sort(() => 0.5 - Math.random());
  minijoc.emojisDisponibles = opcions;
  grid.innerHTML = '';
  opcions.forEach((emoji, i) => {
    const emojiData = BIBLIOTECA_PLA.find(e => quitarSkinTone(e.emoji) === quitarSkinTone(emoji));
    const div = document.createElement('div');
    div.className = 'emoji-item';
    div.innerHTML = `<div class="emoji-large">${emoji}</div><div class="emoji-name">${emojiData?.nom_cat || ''}</div>`;
    div.onclick = () => triarEmojiMinijoc(i);
    grid.appendChild(div);
  });
}

function triarEmojiMinijoc(index) {
  vibrar();
  const emoji = minijoc.emojisDisponibles[index];
  const maxEmojis = minijoc.fraseObjectiu.solucio.length;
  if (minijoc.emojisTriats.length < maxEmojis) {
    minijoc.emojisTriats.push(emoji);
    document.getElementById('minijoc-triats').textContent = minijoc.emojisTriats.join(' ');
    if (minijoc.emojisTriats.length === maxEmojis) setTimeout(comprovarMinijoc, 300);
  }
}

function comprovarMinijoc() {
  const feedback = document.getElementById('minijoc-feedback');
  if (!feedback ||!minijoc.fraseObjectiu) return;
  const solucioCorrecta = minijoc.fraseObjectiu.solucio.map(quitarSkinTone).join('');
  const triatsCorrecte = minijoc.emojisTriats.map(quitarSkinTone).join('');
  const esCorrecte = solucioCorrecta === triatsCorrecte;
  if (esCorrecte) {
    feedback.innerHTML = `<p style="color:#4CAF50; font-weight:bold;">Correcte! +5 🪙</p>`;
    estat.monedes += 5;
    estat.progres.encerts++;
    estat.progres.frasesDesDeUltimNivell++;
    if (estat.progres.frasesDesDeUltimNivell >= 25 && estat.progres.nivellActualMapa < 100) {
      estat.progres.nivellActualMapa++;
      estat.progres.frasesDesDeUltimNivell = 0;
      mostrarMissatge(`🔓 Nivell ${estat.progres.nivellActualMapa} desbloquejat!`);
    }
    NIVELL_MINIJOC.nivelActual = Math.min(NIVELL_MINIJOC.nivelActual + 1, NIVELL_MINIJOC.maxEmojis);
    guardarEstat();
    actualitzarUI();
    setTimeout(() => novaFraseMinijoc(), 1500);
  } else {
    feedback.innerHTML = `<p style="color:#f44336;">No és així. Era: ${minijoc.fraseObjectiu.solucio.join(' ')}</p>`;
    setTimeout(() => novaFraseMinijoc(), 2000);
  }
}


// ===== LECTURA V1.2-clean - MOTOR JSON COMPLET - DEPLOY SAFE =====
let BANCO_LECTURA = null;
let lecturaActualVocab = [];
let lecturaActualText = '';
let lecturaActualPreguntes = [];
let lecturaContext = {};

async function cargarBancoLectura() {
  if (BANCO_LECTURA) return BANCO_LECTURA;
  const res = await fetch('./data/banco_lectura.json');
  BANCO_LECTURA = await res.json();
  return BANCO_LECTURA;
}

function getCurrentLevel() {
  if (estat.progres.nivellActualMapa <= 33) return 'a1';
  if (estat.progres.nivellActualMapa <= 66) return 'a2';
  return 'b1';
}

function gastarEnergia(cantidad) {
  if (window.DEBUG_NO_ENERGIA) return true;
  if (estat.progres.energia < cantidad) return false;
  estat.progres.energia -= cantidad;
  guardarEstat();
  actualitzarUI();
  return true;
}

async function generarLectura() {
  if (!gastarEnergia(30)) {
    alert('No tens energia suficient');
    return;
  }

  const banco = await cargarBancoLectura();
  const nivell = getCurrentLevel();
  const dataNivell = banco[nivell];
  const regles = banco.regles_globals;

  if (!dataNivell ||!dataNivell.plantillas) {
    document.getElementById('lectura-texto').innerHTML = '<p>No hi ha lectures per aquest nivell</p>';
    return;
  }

  lecturaActualVocab = [];
  lecturaContext = {};

  const plantillas = dataNivell.plantillas;
  const plantilla = plantillas[Math.floor(Math.random() * plantillas.length)];
  const temes = ['la_familia', 'la_casa', 'l_escola', 'la_ciutat', 'la_natura', 'el_temps_lliure'];
  const tema = temes[Math.floor(Math.random() * temes.length)];
  lecturaContext.tema_text = tema.replace(/_/g, ' ');
  const vocab = dataNivell[tema];

  const personatge = window.nomPersonatge || 'Joven';
  let genere = 'f';
  if (personatge!== 'Joven') {
    const fems = ['Ana','Sofia','Laia','Marta','Clara','Berta','Emma','Núria','Aina','Claudia','Laura','Maria'];
    genere = personatge.startsWith('La ') || fems.includes(personatge)? 'f' : 'm';
  }

  // FIX 1: pick con contexto congelado
  function pick(key, arr) {
    if (!arr ||!arr.length) return key;
    if (lecturaContext[key]) return lecturaContext[key];
    const val = arr[Math.floor(Math.random() * arr.length)];
    if (!lecturaActualVocab.includes(val)) lecturaActualVocab.push(val);
    lecturaContext[key] = val;
    return val;
  }

  function reemplaçar(text, congelar = false) {
    return text.replace(/\$\{(\w+)\}/g, (match, key) => {
      if (key === 'personatge') return personatge;
      if (key === 'tema') return lecturaContext.tema_text || key;
      if (congelar && lecturaContext[key]) return lecturaContext[key];
      return pick(key, vocab[key]) || key;
    });
  }

  // FIX 2: concordar con \b para evitar tranquil·la·la
  function concordarGenere(text) {
    let resultat = text;
    Object.keys(regles.generes_paraules).forEach(paraula => {
      const formes = regles.generes_paraules[paraula];
      const regex = new RegExp(`\\b${paraula}\\b`, 'gi');
      resultat = resultat.replace(regex, formes[genere]);
    });
    return resultat;
  }

  // FIX 3: apostrofación catalana real
  function aplicarApostrofacio(text) {
    return text
     .replace(/\ba el\b/gi, 'al')
     .replace(/\bde el\b/gi, 'del')
     .replace(/\ba l ([aeiouàèéíòóúh])/gi, "a l'$1")
     .replace(/\bde l ([aeiouàèéíòóúh])/gi, "de l'$1")
     .replace(/tranquil·la·la/g, 'tranquil·la');
  }

  const titol_raw = reemplaçar(plantilla.titol, false);
  let textBase = plantilla.seq.map(l => reemplaçar(l, false)).join(' ');
  textBase = concordarGenere(textBase);
  textBase = aplicarApostrofacio(textBase);

  const finalsAlternatius = [
    'és el meu lloc preferit!',
    "m'encanta passar temps aquí!",
    'vull tornar aviat!',
    'ha estat un dia genial!'
  ];
  const finalRandom = finalsAlternatius[Math.floor(Math.random() * finalsAlternatius.length)];
  lecturaActualText = textBase.replace(/és el meu lloc preferit!.*$/i, finalRandom);

  // FIX 1 cont: preguntas congeladas al contexto de la lectura
  lecturaActualPreguntes = plantilla.preguntes.map(p => ({
    q: concordarGenere(aplicarApostrofacio(reemplaçar(p.q, true))),
    opcions: p.opcions.map(o => concordarGenere(aplicarApostrofacio(reemplaçar(o, true)))),
    correcta: p.correcta
  }));

  const titol = aplicarApostrofacio(concordarGenere(titol_raw))
   .replace(/\s+/g, ' ').trim();

  document.getElementById('lectura-texto').innerHTML = `
    <div class="lectura-card">
      <h3>${titol}</h3>
      <p class="lectura-text">${lecturaActualText}</p>
      <div class="lectura-preguntes">
        ${lecturaActualPreguntes.map((p, i) => `
          <div style="margin-bottom:15px;">
            <p><strong>${i+1}. ${p.q}</strong></p>
            ${p.opcions.map((op, j) => `
              <button class="btn-sec" style="display:block; width:100%; margin:5px 0; text-align:left;" onclick="comprovarPregunta(${i}, ${j})">${op}</button>
            `).join('')}
            <div id="feedback-${i}" class="feedback"></div>
          </div>
        `).join('')}
      </div>
      <button class="btn-primari" onclick="generarLectura().catch(e => console.error(e))" style="margin-top:15px;">Nova lectura (-30 energia)</button>
    </div>
  `;
  renderVocabLectura();

  // FIX 4b: no repintar gramática si estás en Guia
  if (typeof gramaticaMode!== 'undefined' && gramaticaMode === 'contextual') {
    await generarGramatica();
  }
}

function renderVocabLectura() {
  const cont = document.getElementById('lectura-vocab');
  if (!cont) return;
  if (lecturaActualVocab.length === 0) {
    cont.innerHTML = '<div class="empty-state"><p>Genera una lectura per veure el vocabulari</p></div>';
    return;
  }
  cont.innerHTML = `
    <div class="vocab-grid">
      ${lecturaActualVocab.map(w => `
        <div class="vocab-card">
          <div class="vocab-word">${w}</div>
          <div class="vocab-pron">/${w}/</div>
        </div>
      `).join('')}
    </div>
  `;
}

function comprovarPregunta(idx, resp) {
  const p = lecturaActualPreguntes[idx];
  const fb = document.getElementById(`feedback-${idx}`);
  if (resp === p.correcta) {
    fb.innerHTML = '<span style="color:#4CAF50">Correcte! +0.5 XP</span>';
    estat.progres.encerts += 0.5;
    guardarEstat();
    actualitzarUI();
  } else {
    fb.innerHTML = `<span style="color:#f44336">No. Era: ${p.opcions[p.correcta]}</span>`;
  }
}

// ===== GRAMÀTICA V1.2-clean =====
let gramaticaMode = 'guia';
let gramaticaTemaSeleccionat = null;

// FIX 4: slug seguro para keys con acentos/espacios
function slugGramatica(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
   .toLowerCase().replace(/[^a-z0-9]+/g,'_');
}

async function generarGramatica() {
  const container = document.getElementById('lectura-gramatica');
  if (!container) return;

  const banco = await cargarBancoLectura();

  if (!banco ||!banco.gramatica ||!banco.gramatica.guia) {
    container.innerHTML = `<div class="empty-state"><p>No trobo "gramatica.guia" al banco_lectura.json</p></div>`;
    return;
  }

  const GRAMATICA_BANCO = banco.gramatica.guia;
  const keys = Object.keys(GRAMATICA_BANCO);
  const mapa = {};
  keys.forEach(k => mapa[slugGramatica(k)] = k);

  let html = `
    <div style="display:flex; gap:8px; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:12px;">
      <button class="btn ${gramaticaMode==='contextual'?'btn-primari':'btn-sec'}" onclick="setGramaticaMode('contextual')" style="padding:8px 16px; font-size:14px;">Contextual</button>
      <button class="btn ${gramaticaMode==='guia'?'btn-primari':'btn-sec'}" onclick="setGramaticaMode('guia')" style="padding:8px 16px; font-size:14px;">Guia</button>
    </div>
  `;

  if (gramaticaMode === 'contextual') {
    if (!lecturaActualText || lecturaActualVocab.length === 0) {
      container.innerHTML = html + `<div class="empty-state"><div class="empty-state-icon">📚</div><p>Genera primer una lectura</p></div>`;
      return;
    }
    const nivell = getCurrentLevel();
    const grammarPoint = detectarPuntGramatica(lecturaActualText, nivell, GRAMATICA_BANCO);
    html += `
      <div class="grammar-card">
        <div class="grammar-title">${grammarPoint.titol}</div>
        <div class="grammar-explanation">${grammarPoint.explicacio}</div>
        <div class="grammar-examples">
          <div class="grammar-examples-title">Exemples de la lectura:</div>
          ${grammarPoint.exemples?.length > 0? grammarPoint.exemples.map(ex => `<div class="grammar-example">• ${ex}</div>`).join('') : '<div class="grammar-example">• No s\'han trobat exemples</div>'}
        </div>
        <div class="grammar-exercise">
          <div class="grammar-exercise-title">Practica:</div>
          ${grammarPoint.exercici?.map((frase, i) => `<div class="grammar-exercise-item">${i+1}. ${frase}</div>`).join('') || ''}
        </div>
        ${grammarPoint.tip? `<div class="grammar-tip">💡 <strong>Tip:</strong> ${grammarPoint.tip}</div>` : ''}
      </div>
    `;
  } else {
    if (!gramaticaTemaSeleccionat) {
      html += `<div class="emoji-grid">`;
      keys.forEach(keyReal => {
        const tema = GRAMATICA_BANCO[keyReal];
        const slug = slugGramatica(keyReal);
        html += `
          <div class="emoji-item" onclick="seleccionarTemaGramatica('${slug}')" style="cursor:pointer;">
            <div class="emoji-large">${tema.emoji || '📚'}</div>
            <div class="emoji-name" style="font-size:14px; font-weight:600;">${tema.titol}</div>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      const keyReal = mapa[gramaticaTemaSeleccionat] || gramaticaTemaSeleccionat;
      const tema = GRAMATICA_BANCO[keyReal];
      if (!tema) { gramaticaTemaSeleccionat = null; return generarGramatica(); }
      html += `
        <button class="btn btn-sec" onclick="tornarAGuia()" style="margin-bottom:15px;">← Tornar a la Guia</button>
        <div class="grammar-card">
          <div class="grammar-title">${tema.titol}</div>
          <div class="grammar-explanation">${tema.explicacio}</div>
          <div style="background:#1a1a1a; padding:12px; border-radius:8px; margin:12px 0; font-family:monospace; color:#4CAF50; font-size:14px;">
            Estructura: ${tema.estructura}
          </div>
          <div class="grammar-examples">
            <div class="grammar-examples-title">Exemples:</div>
            ${tema.exemples?.map(ex => `<div class="grammar-example">• ${ex}</div>`).join('') || ''}
          </div>
          <div class="grammar-exercise">
            <div class="grammar-exercise-title">Practica:</div>
            ${tema.exercici?.map((frase, i) => `<div class="grammar-exercise-item">${i+1}. ${frase}</div>`).join('') || ''}
          </div>
          ${tema.tip? `<div class="grammar-tip">💡 <strong>Tip:</strong> ${tema.tip}</div>` : ''}
        </div>
      `;
    }
  }
  container.innerHTML = html;
}

function detectarPuntGramatica(texto, nivell, GRAMATICA_BANCO) {
  if ((texto.includes('va ') || texto.includes('vam ') || texto.includes('van ')) && GRAMATICA_BANCO.preterit_perifrastic) {
    const data = {...GRAMATICA_BANCO.preterit_perifrastic};
    data.exemples = extraerFrasesCon(texto, 'va ');
    return data;
  }
  if ((texto.includes('estava') || texto.includes('està') || texto.includes('estic')) && GRAMATICA_BANCO.estar_adjectiu) {
    const data = {...GRAMATICA_BANCO.estar_adjectiu};
    data.exemples = extraerFrasesCon(texto, 'estav');
    return data;
  }
  return GRAMATICA_BANCO.articles || GRAMATICA_BANCO[Object.keys(GRAMATICA_BANCO)[0]] || {
    titol: 'Gramàtica',
    explicacio: 'Genera una lectura nova',
    estructura: '',
    exemples: [],
    exercici: [],
    tip: ''
  };
}

function setGramaticaMode(mode) {
  gramaticaMode = mode;
  gramaticaTemaSeleccionat = null;
  generarGramatica();
}

function seleccionarTemaGramatica(slug) {
  gramaticaTemaSeleccionat = slug;
  generarGramatica();
}

function tornarAGuia() {
  gramaticaTemaSeleccionat = null;
  generarGramatica();
}

function extraerFrasesCon(texto, palabra) {
  const frases = texto.split('.');
  return frases.filter(f => f.toLowerCase().includes(palabra.toLowerCase())).slice(0,3).map(f => f.trim() + '.');
}

// Exporta para el onclick del HTML
window.setGramaticaMode = setGramaticaMode;
window.seleccionarTemaGramatica = seleccionarTemaGramatica;
window.tornarAGuia = tornarAGuia;
window.generarGramatica = generarGramatica; 

// ===== TIPS =====
function carregarTips() {
  const nivell = getCurrentLevel();
  if (totsElsTips.length === 0) totsElsTips = dadesTips[nivell] || [];
  if (tipsUsats.length === 0 && totsElsTips!== dadesTips[nivell]) totsElsTips = dadesTips[nivell] || [];
  mostrarTipRandom();
}

function mostrarTipRandom() {
  if (!totsElsTips || totsElsTips.length === 0) {
    document.getElementById('tip-text').textContent = 'No hi ha tips per aquest nivell';
    return;
  }
  if (tipsUsats.length === totsElsTips.length) tipsUsats = [];
  let idx;
  do {
    idx = Math.floor(Math.random() * totsElsTips.length);
  } while (tipsUsats.includes(idx));
  tipsUsats.push(idx);
  const tip = totsElsTips[idx];
  document.getElementById('tip-text').textContent = tip.truc;
  document.getElementById('tip-exemple').textContent = tip.exemple || '';
}

// ===== BOTIGA =====
function renderBotiga() {
  const cont = document.getElementById('botiga-contenidor');
  if (!cont) return;
  if (!PACKS_BOTIGA || PACKS_BOTIGA.length === 0) {
    cont.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.6;">Encara no hi ha packs a la botiga.</div>`;
    return;
  }
  cont.innerHTML = '';
  PACKS_BOTIGA.forEach(pack => {
    let subPacks = [];
    if (pack.emojis.length > 6) {
      for (let i = 0; i < pack.emojis.length; i += 6) {
        const chunk = pack.emojis.slice(i, i + 6);
        const numPart = Math.floor(i / 6) + 1;
        const totalParts = Math.ceil(pack.emojis.length / 6);
        const preuPart = Math.ceil(pack.preu / totalParts);
        subPacks.push({
          id: `${pack.id}_p${numPart}`,
          nom: `${pack.nom} ${numPart}/${totalParts}`,
          descripcio: pack.descripcio,
          preu: preuPart,
          emojis: chunk
        });
      }
   } else {
  subPacks = [];
}
    subPacks.forEach(sp => {
      const comprat = estat.compres.includes(sp.id);
      const card = document.createElement('div');
      card.className = 'capitol-card';
      card.innerHTML = `<div class="capitol-icona">🎁</div><h3>${sp.nom}</h3><p style="color:#aaa; margin:8px 0;">${sp.descripcio}</p><p style="font-size:24px;">${sp.emojis.map(e => e.emoji).join(' ')}</p><button class="btn ${comprat? 'btn-sec' : ''}" onclick="comprarPack('${sp.id}', ${sp.preu})" ${comprat? 'disabled' : ''}>${comprat? 'Desbloquejat' : `🪙 ${sp.preu}`}</button>`;
      cont.appendChild(card);
    });
  });
}

function comprarPack(id, preu) {
  if (estat.monedes < preu) {
    mostrarMissatge('No tens prou monedes');
    return;
  }
  estat.monedes -= preu;
  estat.compres.push(id);
  NIVELL_MINIJOC.nivelActual = Math.min(NIVELL_MINIJOC.nivelActual + 1, NIVELL_MINIJOC.maxEmojis);
  guardarEstat();
  actualitzarUI();
  construirCategories();
  renderBotiga();
  renderDiccionari();
  mostrarMissatge('Pack desbloquejat a la biblioteca!');
}

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  });
}
