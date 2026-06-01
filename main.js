// main.js - Lingocat-emoji-v2 UNIFICADO

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

let BIBLIOTECA_EMOJIS_BASE = [];
let FRASES_MINIJOC = [];
let CATEGORIES_EMOJI = {};
let EMOJIS_JUGABLES = [];

// Starter pack mínim
const EMOJIS_STARTER = [
  {emoji: "😀", nom_cat: "Somriure", categoria: "emocio", para_frases: ["riu", "content"], genere: "m"},
  {emoji: "😊", nom_cat: "Feliç", categoria: "emocio", para_frases: ["feliç", "content"], genere: "m"},
  {emoji: "😂", nom_cat: "Riure", categoria: "emocio", para_frases: ["riure", "riure"], genere: "m"},
  {emoji: "👨", nom_cat: "Home", categoria: "persona", para_frases: ["home", "pare"], genere: "m"},
  {emoji: "👩", nom_cat: "Dona", categoria: "persona", para_frases: ["dona", "mare"], genere: "f"},
  {emoji: "🐶", nom_cat: "Gos", categoria: "animal", para_frases: ["gos", "gosset"], genere: "m"},
  {emoji: "🏠", nom_cat: "Casa", categoria: "lloc", para_frases: ["casa", "casa meva"], genere: "f"},
  {emoji: "🍎", nom_cat: "Poma", categoria: "menjar", para_frases: ["poma", "fruita"], genere: "f"},
  {emoji: "🚗", nom_cat: "Cotxe", categoria: "transport", para_frases: ["cotxe", "anar"], genere: "m"},
  {emoji: "⚽", nom_cat: "Futbol", categoria: "esport", para_frases: ["futbol", "jugar"], genere: "m"}
];

let estat = {
  monedes: parseInt(localStorage.getItem('cat_monedes')) || 0,
  compres: JSON.parse(localStorage.getItem('cat_compres')) || [],
  emojisDesbloquejats: JSON.parse(localStorage.getItem('cat_emojis')) || ['😀','😊','😂','👨','👩','🐶','🏠','🍎','🚗','⚽'],
  progres: JSON.parse(localStorage.getItem('cat_progres')) || {respostesCorrectes: 0, nivellActualMapa: 1},
  energia: parseInt(localStorage.getItem('cat_energia')) || 100,
  ultimaRecargaEnergia: parseInt(localStorage.getItem('cat_ultima_energia')) || Date.now(),
  minijoc: {fraseObjectiu: null, emojisTriats: [], emojisDisponibles: []},
  packs_botiga: [],
  introVist: JSON.parse(localStorage.getItem('cat_intro')) || false
};

const LANGS = {
  ca: {
    app_titol: "Cat lingo emoji", monedes: "Monedes", tab_mapa: "Món", tab_missio: "Missió",
    tab_gremi: "Gremi", tab_lectura: "Lectura", tab_tips: "Tips", tab_botiga: "Botiga",
    biblioteca: "Biblioteca", biblioteca_desc: "Tots els emojis disponibles",
    biblioteca_cta: "💡 Compra packs d'emoji a la botiga i desbloqueja tota la biblioteca!",
    minijoc_titol: "Arma la frase", minijoc_desc: "Tria els emojis per formar la frase",
    comprovar: "Comprovar", correcte: "Correcte!", incorrecte: "No és així. Era:",
    no_prou_monedes: "No tens prou monedes!", comprat: "Comprat",
    lectura_titol: "Lectura", lectura_btn: "Generar Lectura",
    tips_titol: "Tips", tips_btn: "Nou Tip",
    nivell: "Nivell", desbloquejat: "Desbloquejat!", et_falten: "Et falten", frases: "frases",
    energy_low: "No tens prou energia! Espera o completa una missió."
  }
};

let idioma = localStorage.getItem('cat_idioma') || 'ca';
let LANG = LANGS[idioma];

function vibrar() { if (navigator.vibrate) navigator.vibrate(20); }
function quitarSkinTone(emoji) { return emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/u, ''); }
function mostrarModal(text) {
  document.getElementById('modalText').textContent = text;
  document.getElementById('modal').classList.remove('hidden');
}
function tancarModal() {
  document.getElementById('modal').classList.add('hidden');
}

function mapaNivellALletra(num) {
  if (num <= 3) return 'a1';
  if (num <= 6) return 'a2';
  return 'b1';
}

function actualitzarStats() {
  guardarEstat();
}

// ===== INICIALITZACIÓ =====
document.addEventListener('DOMContentLoaded', async () => {
  aplicarIdioma();
  await carregarDades();
  actualitzarUI();
  carregarMapa();
  carregarBotiga();
  carregarTips();
  cargarLectura();
  mostrarBibliotecaTab('diccionari', null);
  setTimeout(mostrarIntro, 500);
});

function aplicarIdioma() {
  document.getElementById('app-titol').textContent = LANG.app_titol;
  document.getElementById('tab-mapa-txt').textContent = LANG.tab_mapa;
  document.getElementById('tab-missio-txt').textContent = LANG.tab_missio;
  document.getElementById('tab-gremi-txt').textContent = LANG.tab_gremi;
  document.getElementById('tab-lectura-txt').textContent = LANG.tab_lectura;
  document.getElementById('tab-tips-txt').textContent = LANG.tab_tips;
  document.getElementById('tab-botiga-txt').textContent = LANG.tab_botiga;
  document.getElementById('btn-lectura').textContent = LANG.lectura_btn;
}

function actualitzarUI() {
  document.getElementById('monedes').textContent = estat.monedes;
  document.getElementById('energia-display').textContent = estat.energia;
  actualitzarBarraProgres();
}

function actualitzarBarraProgres() {
  const respostesActuals = estat.progres.respostesCorrectes % 25;
  const percentatge = (respostesActuals / 25) * 100;
  const barra = document.getElementById('progres-barra');
  if (barra) barra.style.width = percentatge + '%';
}

function canviarTab(tab, e) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const tabEl = document.getElementById('tab-'+tab);
  if(!tabEl) return;
  tabEl.classList.add('active');
  if(e) e.target.closest('.nav-item').classList.add('active');

  if(tab === 'mapa') carregarMapa();
  if(tab === 'missio') carregarMissioTab();
  if(tab === 'gremi') mostrarBibliotecaTab('diccionari', null);
  if(tab === 'lectura') cargarLectura();
  if(tab === 'tips') carregarTips();
  if(tab === 'botiga') carregarBotiga();
}

function guardarEstat() {
  localStorage.setItem('cat_monedes', estat.monedes);
  localStorage.setItem('cat_compres', JSON.stringify(estat.compres));
  localStorage.setItem('cat_emojis', JSON.stringify(estat.emojisDesbloquejats));
  localStorage.setItem('cat_progres', JSON.stringify(estat.progres));
  localStorage.setItem('cat_energia', estat.energia);
  localStorage.setItem('cat_ultima_energia', estat.ultimaRecargaEnergia);
  localStorage.setItem('cat_intro', estat.introVist);
}

// ===== CARREGAR DADES =====
async function carregarDades() {
  try {
    const res = await fetch('./data/biblioteca_emojis.json');
    if(res.ok) BIBLIOTECA_EMOJIS_BASE = await res.json();
  } catch(err) { BIBLIOTECA_EMOJIS_BASE = []; }

  let packsComprats = [];
  try {
    const resBotiga = await fetch('./data/botiga_emojis.json');
    if(resBotiga.ok) {
      const dataBotiga = await resBotiga.json();
      estat.packs_botiga = dataBotiga;
      packsComprats = dataBotiga.filter(p => estat.compres.includes(p.id));
    }
  } catch(err) { estat.packs_botiga = []; packsComprats = []; }

  EMOJIS_JUGABLES = [...EMOJIS_STARTER,...BIBLIOTECA_EMOJIS_BASE];
  packsComprats.forEach(pack => {
    if(pack.emojis) EMOJIS_JUGABLES = EMOJIS_JUGABLES.concat(pack.emojis);
  });
  EMOJIS_JUGABLES = EMOJIS_JUGABLES.filter((v,i,a)=>a.findIndex(t=>(t.emoji===v.emoji))===i);

  construirCategorias();

  try {
    const res = await fetch('./data/minijoc_frases.json');
    if(res.ok) {
      const data = await res.json();
      FRASES_MINIJOC = data.frases || [];
    }
  } catch(err) { FRASES_MINIJOC = []; }
}

function construirCategorias() {
  CATEGORIES_EMOJI = {};
  EMOJIS_JUGABLES.forEach(e => {
    const cat = e.categoria || 'altres';
    if (!CATEGORIES_EMOJI[cat]) CATEGORIES_EMOJI[cat] = [];
    if (!CATEGORIES_EMOJI[cat].includes(e.emoji)) {
      CATEGORIES_EMOJI[cat].push(e.emoji);
    }
  });
}

// ===== MAPA =====
function carregarMapa() {
  const mapaDiv = document.getElementById('mapa');
  if(!mapaDiv) return;
  mapaDiv.innerHTML = '';

  let html = `<h3 style="text-align:center; margin-bottom:15px;">${LANG.nivell} ${estat.progres.nivellActualMapa}</h3>`;
  html += `<p style="text-align:center; color:#888; margin-bottom:20px;">${estat.progres.respostesCorrectes % 25}/25 ${LANG.frases} per pujar</p>`;
  html += `<div class="capitol-grid">`;

  for(let i=1; i<=100; i++) {
    const desbloquejat = i <= estat.progres.nivellActualMapa;
    const actual = i === estat.progres.nivellActualMapa;
    html += `<div class="capitol-card ${!desbloquejat? 'locked' : ''}" onclick="${desbloquejat? `jugarNivellMapa(${i})` : ''}">
      <div class="capitol-icona">${desbloquejat? '✅' : '🔒'}</div>
      <h3>${LANG.nivell} ${i}</h3>
      <p>${desbloquejat? (actual? 'Jugar' : 'Completat') : `${LANG.et_falten} ${25 - (estat.progres.respostesCorrectes % 25)} ${LANG.frases}`}</p>
    </div>`;
  }
  html += `</div>`;
  mapaDiv.innerHTML = html;
}

function jugarNivellMapa(n) {
  if(n!== estat.progres.nivellActualMapa) {
    mostrarModal(`Juga al ${LANG.nivell} ${estat.progres.nivellActualMapa} primer`);
    return;
  }
  mostrarModal(`Entra al minijoc i completa 25 frases per desbloquejar el ${LANG.nivell} ${n + 1}`);
  canviarTab('gremi', null);
  setTimeout(() => mostrarBibliotecaTab('minijocs', null), 100);
}

// ===== MISSIÓ =====
function carregarMissioTab() {
  const cont = document.getElementById('missio-contenidor');
  if(!cont) return;

  const respostesActuals = estat.progres.respostesCorrectes % 25;
  const falten = 25 - respostesActuals;
  const percentatge = (respostesActuals / 25) * 100;

  const teEnergia = estat.energia >= 70;
  const teMonedesLectura = estat.monedes >= 20;
  const PREU_PACK_EMOJI = 250;
  const teMonedesEmoji = estat.monedes >= PREU_PACK_EMOJI;

  cont.innerHTML = `
    <div class="gremi-item" style="text-align:center; margin-bottom:14px;">
      <h3>🎯 ${LANG.nivell} ${estat.progres.nivellActualMapa}</h3>
      <p style="color:#888; margin:15px 0;">${LANG.et_falten} ${falten} ${LANG.frases} per desbloquejar el ${LANG.nivell} ${estat.progres.nivellActualMapa + 1}</p>
      <div style="background:#222; border-radius:10px; height:20px; overflow:hidden; margin:20px 0;">
        <div style="background:linear-gradient(90deg, var(--accent), var(--accent2)); height:100%; width:${percentatge}%;"></div>
      </div>
      <p style="font-size:14px; color:#aaa;">Progrés: ${respostesActuals}/25</p>
      <button class="btn" onclick="canviarTab('gremi', null); setTimeout(()=>mostrarBibliotecaTab('minijocs', null), 100);" style="margin-top:15px;">Anar a Minijoc</button>
    </div>
    <div class="gremi-item" style="text-align:center; margin-bottom:14px;">
      <h3>📖 Generar Lectura</h3>
      <p style="color:#888; margin:15px 0;">Cost: 70 ⚡ Energia</p>
      <button class="btn" onclick="canviarTab('lectura', null)" ${!teEnergia? 'disabled' : ''} style="margin-top:10px;">
        ${teEnergia? 'Ja pots!' : 'No tens prou'}
      </button>
    </div>
    <div class="gremi-item" style="text-align:center; margin-bottom:14px;">
      <h3>🎯 Desbloquejar Lectura Extra</h3>
      <p style="color:#888; margin:15px 0;">Cost: 20 🪙 Monedes</p>
      <button class="btn" onclick="canviarTab('lectura', null)" ${!teMonedesLectura? 'disabled' : ''} style="margin-top:10px;">
        ${teMonedesLectura? 'Ja pots!' : 'No tens prou'}
      </button>
    </div>
    <div class="gremi-item" style="text-align:center; margin-bottom:14px;">
      <h3>🛍️ Desbloquejar Pack Emoji</h3>
      <p style="color:#888; margin:15px 0;">Cost: ${PREU_PACK_EMOJI} 🪙 Monedes</p>
      <button class="btn" onclick="canviarTab('botiga', null)" ${!teMonedesEmoji? 'disabled' : ''} style="margin-top:10px;">
        ${teMonedesEmoji? 'Ja pots!' : 'No tens prou'}
      </button>
    </div>
  `;
}

// ===== GREMI = BIBLIOTECA =====
function mostrarBibliotecaTab(tab, e) {
  document.querySelectorAll('#tab-gremi.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
  if(e) e.target.classList.add('active');
  const cont = document.getElementById('gremi-contenidor');
  if(!cont) return;

  if(tab === 'diccionari') {
    renderDiccionario();
  }

  if(tab === 'minijocs') {
    cont.innerHTML = `
      <h3 style="text-align:center;">${LANG.minijoc_titol}</h3>
      <p id="minijoc-nivell" style="color:#4CAF50; font-weight:bold; margin:8px 0; text-align:center;">${LANG.nivell} ${estat.progres.nivellActualMapa}</p>
      <p style="color:#888; margin:12px 0; text-align:center;">${LANG.minijoc_desc}</p>
      <div id="minijoc-frase" style="background:#222; padding:15px; border-radius:12px; min-height:50px; margin-bottom:15px; text-align:center; font-size:18px;">Prem "Nova frase" per començar</div>
      <button class="btn btn-sec" onclick="novaFraseMinijoc()" style="margin-bottom:15px; width:100%;">Nova frase</button>
      <div id="minijoc-emojis" class="emoji-grid" style="grid-template-columns:repeat(5,1fr);"></div>
      <div id="minijoc-triats" style="background:#222; padding:15px; border-radius:12px; min-height:50px; margin:15px 0; text-align:center; font-size:24px;"></div>
      <button class="btn" onclick="comprovarMinijoc()" style="width:100%;">${LANG.comprovar}</button>
      <div id="minijoc-feedback" style="margin-top:15px; text-align:center;"></div>
    `;
    novaFraseMinijoc();
  }
}

function renderDiccionario() {
  const desbloquejats = new Set(estat.emojisDesbloquejats || []);
  let html = `<h3 style="text-align:center; margin-bottom:10px;">${LANG.biblioteca}</h3>`;
  html += `<p style="text-align:center; color:#888; margin-bottom:20px; font-size:14px;">${LANG.biblioteca_desc}</p>`;
  html += `<div style="background:linear-gradient(135deg, var(--accent), var(--accent2)); padding:12px; border-radius:12px; margin-bottom:20px; text-align:center; font-weight:700; font-size:14px;">${LANG.biblioteca_cta}</div>`;

  for (const [cat, emojis] of Object.entries(CATEGORIES_EMOJI)) {
    html += `<h4 style="margin:15px 0 8px; color:#4CAF50; text-transform:capitalize;">${cat}</h4>`;
    html += `<div class="emoji-grid">`;
    emojis.forEach(emoji => {
      const info = EMOJIS_JUGABLES.find(e => e.emoji === emoji);
      const nom = info? info.nom_cat : emoji;
      const paraules = info? info.para_frases.join(', ') : '';
      const comprat = desbloquejats.has(emoji);
      const opacidad = comprat? '1' : '0.12';
      const filtro = comprat? '' : 'grayscale(1) brightness(0.4)';
      const pointer = comprat? 'pointer' : 'not-allowed';
      const colorTexto = comprat? '#fff' : '#444';
      html += `<div class="emoji-item" style="opacity:${opacidad}; filter:${filtro}; pointer-events:${pointer};">
        <div class="emoji-large">${emoji}</div>
        <div class="emoji-name" style="color:${colorTexto};">${nom}</div>
        <div style="font-size:10px; color:#aaa; margin-top:4px;">${paraules}</div>
      </div>`;
    });
    html += `</div>`;
  }
  document.getElementById('gremi-contenidor').innerHTML = html;
}

// ===== MINIJOC =====
function novaFraseMinijoc() {
  if (!FRASES_MINIJOC || FRASES_MINIJOC.length === 0) {
    document.getElementById('minijoc-frase').textContent = "No hi ha frases carregades";
    return;
  }
  const emojisDisponibles = EMOJIS_JUGABLES;
  if (emojisDisponibles.length < 2) {
    document.getElementById('minijoc-frase').textContent = "Compra més emojis per jugar!";
    return;
  }
  const plantilla = FRASES_MINIJOC[Math.floor(Math.random() * FRASES_MINIJOC.length)];
  const { text, solucio } = generarFraseDinamica(plantilla, emojisDisponibles.map(e => e.emoji));
  estat.minijoc.fraseObjectiu = { text, solucio };
  estat.minijoc.emojisTriats = [];
  document.getElementById('minijoc-frase').textContent = text;
  document.getElementById('minijoc-triats').textContent = '';
  document.getElementById('minijoc-feedback').innerHTML = '';
  document.getElementById('minijoc-nivell').textContent = `${LANG.nivell} ${estat.progres.nivellActualMapa}`;
  generarEmojisParaFraseCorta({solucio});
}

function generarFraseDinamica(plantilla, emojisJugador) {
  let text = plantilla.text;
  let solucio = [];
  for (const cat of plantilla.categories) {
    const emojisDisponibles = (CATEGORIES_EMOJI[cat] || []).filter(eBase =>
      emojisJugador.some(eJug => quitarSkinTone(eJug) === quitarSkinTone(eBase))
    );
    if (!emojisDisponibles || emojisDisponibles.length === 0) {
      return generarFraseDinamica(FRASES_MINIJOC[Math.floor(Math.random() * FRASES_MINIJOC.length)], emojisJugador);
    }
    const emojiElegit = emojisDisponibles[Math.floor(Math.random() * emojisDisponibles.length)];
    const article = plantilla.generes?.[cat] === 'f'? 'La' : 'El';
    text = text.replace(`{${cat}}`, `${article} ${EMOJIS_JUGABLES.find(e=>e.emoji===emojiElegit)?.nom_cat || emojiElegit}`);
    solucio.push(emojiElegit);
  }
  return { text, solucio };
}

function generarEmojisParaFraseCorta(frase) {
  const emojisJugador = EMOJIS_JUGABLES.map(e => e.emoji);
  const emojisFalsos = emojisJugador.filter(e =>!frase.solucio.some(eSol => quitarSkinTone(e) === quitarSkinTone(eSol))).sort(() => 0.5 - Math.random()).slice(0, 10 - frase.solucio.length);
  const emojisAMostrar = [...frase.solucio,...emojisFalsos].sort(() => 0.5 - Math.random());
  estat.minijoc.emojisDisponibles = emojisAMostrar;
  let html = '';
  emojisAMostrar.forEach((emoji, i) => {
    const emojiData = EMOJIS_JUGABLES.find(e => quitarSkinTone(e.emoji) === quitarSkinTone(emoji));
    html += `<div class="emoji-item" onclick="triarEmojiMinijoc(${i})" style="cursor:pointer;">
      <div class="emoji-large">${emoji}</div>
      <div class="emoji-name">${emojiData?.nom_cat || ''}</div>
    </div>`;
  });
  document.getElementById('minijoc-emojis').innerHTML = html;
}

function triarEmojiMinijoc(index) {
  vibrar();
  const emoji = estat.minijoc.emojisDisponibles[index];
  const maxEmojis = estat.minijoc.fraseObjectiu.solucio.length;
  if (estat.minijoc.emojisTriats.length < maxEmojis) {
    estat.minijoc.emojisTriats.push(emoji);
    document.getElementById('minijoc-triats').textContent = estat.minijoc.emojisTriats.join(' ');
  }
}

function comprovarMinijoc() {
  vibrar();
  const frase = estat.minijoc.fraseObjectiu;
  const solucioCorrecta = frase.solucio.map(quitarSkinTone).join('');
  const triatsCorrecte = estat.minijoc.emojisTriats.map(quitarSkinTone).join('');
  const esCorrecte = solucioCorrecta === triatsCorrecte;
  const feedback = document.getElementById('minijoc-feedback');
  if (esCorrecte) {
    feedback.innerHTML = `<p style="color:#4CAF50; font-weight:bold;">${LANG.correcte}</p>`;
    estat.monedes += 5;
    estat.progres.respostesCorrectes += 1;
    if(estat.progres.respostesCorrectes % 25 === 0 && estat.progres.nivellActualMapa < 100) {
      estat.progres.nivellActualMapa += 1;
      mostrarModal(`${LANG.desbloquejat} ${LANG.nivell} ${estat.progres.nivellActualMapa}!`);
    }
    actualitzarUI();
    guardarEstat();
  } else {
    feedback.innerHTML = `<p style="color:#f44336; font-weight:bold;">${LANG.incorrecte} ${frase.solucio.join(' ')}</p>`;
  }
  setTimeout(() => novaFraseMinijoc(), 2000);
}


// ===== LECTURA =====  
 BANCO_VOCAB = {
  a1: {
    plantillas: [
      {
        titol: "Un dia a ${tema}",
        seq: [
          "${temp_inici}, ${protagonista} va anar a ${lloc}.",
          "${protagonista} va veure ${cosa1} i ${cosa2}.",
          "${companys} van ${accio_grup} mentre ${protagonista} ${accio_prota}.",
          "Després ${protagonista} va ${accio_dinar} amb ${menjar} i ${beguda}.",
          "Més tard, ${protagonista} va ${accio_final}.",
          "Al final del dia, ${protagonista} va pensar: ${tema} és el meu lloc preferit!"
        ],
        pregunta: "Què va fer ${protagonista} més tard a ${tema}?"
      },
      {
        titol: "${protagonista} a ${tema}",
        seq: [
          "${temp_inici} ${protagonista} va visitar ${lloc}.",
          "Allà hi havia ${cosa1} i també ${cosa2}.",
          "${protagonista} estava molt ${estat}.",
          "${protagonista} va parlar amb ${persona}.",
          "Junts van ${accio_grup}.",
          "${protagonista} va tornar a casa molt ${estat_final}."
        ],
        pregunta: "Com se sentia ${protagonista} al tornar a casa?"
      }
    ],

    la_familia: {
      persones: ["La Maria", "En Pau", "La Marta", "En Jordi", "La Clàudia"],
      lloc: ["casa de l’àvia", "casa del tiet", "la seva casa", "casa dels cosins", "casa de l’oncle"],
      cosa1: ["fotos antigues", "un gat", "un jardí", "un gos", "un àlbum"],
      cosa2: ["llibres", "un piano", "flors", "joguines", "un quadre"],
      companys: ["La seva germana", "El seu germà", "La seva mare", "El seu pare", "La seva cosina"],
      accio_grup: ["parlar", "riure", "jugar", "cantar", "mirar fotos"],
      accio_prota: ["mirar fotos", "tocar piano", "regar plantes", "jugar amb el gat", "llegir"],
      accio_dinar: ["dinar", "berenar", "sopar", "prendre cafè", "fer un mos"],
      menjar: ["pa", "truita", "galetes", "fruita", "iogurt"],
      beguda: ["aigua", "llet", "suc", "te", "refresc"],
      accio_final: ["netejar", "acomiadar-se", "passejar", "rentar plats", "recollir"],
      estat: ["content", "contenta", "sorprès", "sorpresa", "tranquil", "tranquil·la", "feliç", "curiós", "curiosa"],
      estat_final: ["feliç", "tranquil", "tranquil·la", "content", "contenta", "relaxat", "relaxada", "agraït", "agraïda"],
      persona: ["la seva àvia", "el seu tiet", "la seva mare", "el seu germà", "la seva cosina"],
      temp_inici: ["Ahir", "Diumenge", "Avui", "Dissabte", "Dilluns"]
    },

    la_casa: {
      persones: ["En Jordi", "La Laura", "En Marc", "La Marta", "En Pau"],
      lloc: ["la seva habitació", "la cuina", "el saló", "el bany", "el balcó"],
      cosa1: ["un llit", "una taula", "un sofà", "una cadira", "una estanteria"],
      cosa2: ["una finestra", "una làmpada", "un mirall", "una planta", "un quadre"],
      companys: ["El seu germà", "La seva mare", "El seu pare", "La seva germana", "Un amic"],
      accio_grup: ["netejar", "ordenar", "pintar", "decorar", "rentar"],
      accio_prota: ["fer el llit", "rentar plats", "mirar tele", "llegir", "dormir"],
      accio_dinar: ["esmorzar", "dinar", "sopar", "berenar", "menjar"],
      menjar: ["cereals", "pa", "fruita", "iogurt", "galetes"],
      beguda: ["llet", "te", "aigua", "suc", "refresc"],
      accio_final: ["rentar plats", "fer el llit", "tancar finestra", "apagar llum", "recollir"],
      estat: ["tranquil", "tranquil·la", "content", "contenta", "cansat", "cansada", "relaxat", "relaxada", "alegre"],
      estat_final: ["relaxat", "relaxada", "content", "contenta", "tranquil", "tranquil·la", "feliç", "satisfet", "satisfeta"],
      persona: ["la seva mare", "el seu pare", "el seu germà", "la seva germana", "un amic"],
      temp_inici: ["Avui", "Ahir", "Ara", "Aquest matí", "Diumenge"]
    },

    l_escola: {
      persones: ["La Marta", "En Pau", "La Clàudia", "En David", "La Laura"],
      lloc: ["l’escola", "la classe", "el pati", "la biblioteca", "el laboratori"],
      cosa1: ["un professor", "llibres", "una pissarra", "un ordinador", "un mapa"],
      cosa2: ["nens", "cadires", "motxilles", "llapis", "paper"],
      companys: ["El seu amic", "La seva amiga", "El seu germà", "La seva germana", "Un company"],
      accio_grup: ["estudiar", "escriure", "llegir", "jugar", "parlar"],
      accio_prota: ["escoltar", "fer deures", "dibuixar", "preguntar", "copiar"],
      accio_dinar: ["berenar", "dinar", "descansar", "parlar", "jugar"],
      menjar: ["entrepà", "poma", "galetes", "iogurt", "fruita"],
      beguda: ["aigua", "suc", "llet", "refresc", "te"],
      accio_final: ["recollir llibres", "acomiadar-se", "sortir", "tornar classe", "netejar"],
      estat: ["content", "contenta", "nerviós", "nerviosa", "atent", "atenta", "curiós", "curiosa", "tranquil", "tranquil·la"],
      estat_final: ["feliç", "cansat", "cansada", "content", "contenta", "tranquil", "tranquil·la", "relaxat", "relaxada"],
      persona: ["el professor", "la seva amiga", "un company", "la tutora", "el director"],
      temp_inici: ["Ahir", "Avui", "Dilluns", "Aquesta setmana", "Dimarts"]
    },

    la_ciutat: {
      persones: ["En David", "La Laura", "En Jordi", "La Marta", "En Pau"],
      lloc: ["el centre", "la plaça", "el carrer", "el mercat", "el parc"],
      cosa1: ["botigues", "cotxes", "gent", "bicis", "busos"],
      cosa2: ["edificis", "semàfors", "bancs", "font", "arbres"],
      companys: ["La seva amiga", "El seu germà", "La seva mare", "El seu pare", "Un veí"],
      accio_grup: ["caminar", "mirar", "parlar", "fer fotos", "córrer"],
      accio_prota: ["fer fotos", "mirar mapa", "comprar", "preguntar", "esperar"],
      accio_dinar: ["dinar", "berenar", "prendre", "descansar", "seure"],
      menjar: ["gelat", "entrepà", "pizza", "pastís", "fruita"],
      beguda: ["aigua", "refresc", "cafè", "suc", "llet"],
      accio_final: ["tornar", "agafar bus", "passejar", "seure", "mirar"],
      estat: ["content", "contenta", "sorprès", "sorpresa", "cansat", "cansada", "curiós", "curiosa", "tranquil", "tranquil·la"],
      estat_final: ["feliç", "tranquil", "tranquil·la", "content", "contenta", "relaxat", "relaxada", "satisfet", "satisfeta"],
      persona: ["un amic", "la seva amiga", "un venedor", "un turista", "un veí"],
      temp_inici: ["Ahir", "Avui", "Dissabte", "Diumenge", "Divendres"]
    },

    la_natura: {
      persones: ["La Maria", "En Pau", "La Marta", "En Jordi", "La Clàudia"],
      lloc: ["el parc", "el bosc", "la platja", "la muntanya", "el llac"],
      cosa1: ["arbres", "ocells", "flors", "fulles", "pedres"],
      cosa2: ["un camí", "un banc", "un riu", "una pedra", "un pont"],
      companys: ["El seu germà", "La seva amiga", "El seu pare", "La seva mare", "Un veí"],
      accio_grup: ["caminar", "mirar", "fer fotos", "córrer", "descansar"],
      accio_prota: ["collir flors", "descansar", "escoltar", "tocar aigua", "saltar"],
      accio_dinar: ["pícnic", "berenar", "descansar", "menjar", "beure"],
      menjar: ["fruita", "entrepà", "galetes", "fruits secs", "iogurt"],
      beguda: ["aigua", "suc", "te", "llet", "refresc"],
      accio_final: ["tornar", "fer foto", "tornar casa", "dir adéu", "córrer"],
      estat: ["tranquil", "tranquil·la", "content", "contenta", "sorprès", "sorpresa", "curiós", "curiosa", "relaxat", "relaxada"],
      estat_final: ["relaxat", "relaxada", "feliç", "content", "contenta", "tranquil", "tranquil·la", "agraït", "agraïda"],
      persona: ["el seu germà", "la seva amiga", "un excursionista", "el seu pare", "un guia"],
      temp_inici: ["Ahir", "Avui", "Diumenge", "Dissabte", "Dilluns"]
    },

    el_temps_lliure: {
      persones: ["La Marta", "En Pau", "La Clàudia", "En Jordi", "La Laura"],
      lloc: ["el cinema", "la biblioteca", "el parc", "el museu", "el teatre"],
      cosa1: ["pel·lícula", "llibres", "nens", "quadres", "escenari"],
      cosa2: ["palomites", "cadires", "un banc", "audioguia", "programa"],
      companys: ["El seu amic", "La seva germana", "El seu germà", "La seva mare", "Un company"],
      accio_grup: ["mirar", "llegir", "jugar", "mirar quadres", "escoltar"],
      accio_prota: ["menjar", "llegir", "dibuixar", "escoltar", "dormir"],
      accio_dinar: ["menjar", "beure", "descansar", "parlar", "riure"],
      menjar: ["palomites", "gelat", "galetes", "entrepà", "fruita"],
      beguda: ["refresc", "aigua", "suc", "cafè", "te"],
      accio_final: ["sortir", "tornar llibre", "tornar casa", "dir adéu", "pagar"],
      estat: ["content", "contenta", "relaxat", "relaxada", "divertit", "divertida", "curiós", "curiosa", "atent", "atenta"],
      estat_final: ["feliç", "tranquil", "tranquil·la", "content", "contenta", "satisfet", "satisfeta", "relaxat", "relaxada"],
      persona: ["el seu amic", "el bibliotecari", "la seva germana", "el guia", "un company"],
      temp_inici: ["Ahir", "Avui", "Divendres", "Diumenge", "Dissabte"]
    }
  },

  a2: {
    plantillas: [
      {
        titol: "Un dia a ${tema}",
        seq: [
          "${temp_inici}, ${protagonista} va decidir anar a ${lloc}.",
          "Quan va arribar, ${protagonista} va veure ${cosa1} i també ${cosa2}.",
          "${companys} van ${accio_grup} mentre ${protagonista} ${accio_prota}.",
          "Després ${protagonista} va ${accio_dinar} amb ${menjar} i va beure ${beguda}.",
          "Més tard, ${protagonista} va ${accio_final} i es va sentir ${estat_final}.",
          "En acabar, ${protagonista} va pensar que ${tema} era una bona manera de passar el dia."
        ],
        pregunta: "Què va fer ${protagonista} després de ${accio_dinar} a ${tema}?"
      },
      {
        titol: "${protagonista} visita ${tema}",
        seq: [
          "${temp_inici} ${protagonista} va anar a visitar ${lloc}.",
          "Allà hi havia ${cosa1} i ${cosa2}, i tot estava molt ${descripcio}.",
          "${protagonista} estava ${estat} i va parlar amb ${persona}.",
          "Junts van ${accio_grup} i ${protagonista} va ${accio_prota}.",
          "Abans de marxar, ${protagonista} va ${accio_final}.",
          "${protagonista} va tornar a casa molt ${estat_final}."
        ],
        pregunta: "Amb qui va parlar ${protagonista} a ${tema}?"
      }
    ],

    la_familia: {
      persones: ["La Maria", "En Pau", "La Marta", "En Jordi", "La Clàudia", "En David"],
      lloc: ["casa de l’àvia al poble", "casa del tiet", "casa dels cosins", "la seva llar", "casa de l’oncle", "pis dels avis"],
      cosa1: ["un àlbum de fotos antigues", "un gat dormint", "un jardí molt verd", "un piano antic", "un gos jugant", "flors al gerro"],
      cosa2: ["llibres apilats", "flors de colors", "joguines al terra", "un quadre bonic", "coixins al sofà", "espelmes enceses"],
      companys: ["La seva germana", "El seu germà", "La seva mare", "El seu pare", "Els seus cosins", "Un veí"],
      accio_grup: ["parlar de records", "riure molt", "jugar a cartes", "mirar l’àlbum", "cantar cançons", "cuinar junts"],
      accio_prota: ["mirar les fotos antigues", "tocar una melodia", "regar les plantes", "jugar amb el gat", "llegir un llibre", "ajudar a cuinar"],
      accio_dinar: ["dinar junts", "berenar a la terrassa", "sopar tranquils", "prendre cafè", "fer un mos", "provar pastissos"],
      menjar: ["pa amb tomàquet", "truita de patates", "galetes casolanes", "amanida fresca", "pastís de xocolata", "fruita tallada"],
      beguda: ["aigua fresca", "llet calenta", "suc natural", "te amb llimona", "cafè amb llet", "refresc"],
      accio_final: ["recollir la taula", "acomiadar-se amb abraçada", "sortir a passejar", "rentar plats", "guardar cadires", "apagar llums"],
      estat: ["content", "contenta", "sorprès", "sorpresa", "tranquil", "tranquil·la", "nostàlgic", "nostàlgica", "curiós", "curiosa", "emocionat", "emocionada"],
      estat_final: ["feliç", "tranquil", "tranquil·la", "content", "contenta", "relaxat", "relaxada", "agraït", "agraïda", "satisfet", "satisfeta"],
      persona: ["la seva àvia", "el seu tiet", "la seva mare", "el seu germà", "la seva cosina", "un veí"],
      temp_inici: ["Ahir al matí", "Diumenge passat", "Avui", "Dissabte", "Dilluns", "Aquesta setmana"],
      descripcio: ["acollidor", "net", "bonic", "tranquil", "alegre", "familiar"]
    },

    la_casa: {
      persones: ["En Jordi", "La Laura", "En Marc", "La Marta", "En Pau", "La Clàudia"],
      lloc: ["la seva habitació", "la cuina reformada", "el saló", "el bany", "el balcó", "el despatx"],
      cosa1: ["un llit ben fet", "una taula de fusta", "un sofà còmode", "una estanteria plena", "una cadira nova", "un armari gran"],
      cosa2: ["una finestra gran", "una làmpada moderna", "un mirall ovalat", "una planta verda", "un quadre colorit", "una catifa suau"],
      companys: ["El seu germà", "La seva mare", "El seu pare", "La seva germana", "Un amic", "Un veí"],
      accio_grup: ["netejar tota la casa", "ordenar els llibres", "pintar una paret", "decorar el saló", "rentar el terra", "canviar cortines"],
      accio_prota: ["fer el llit", "rentar els plats", "mirar una sèrie", "llegir un llibre", "escoltar música", "dormir una estona"],
      accio_dinar: ["preparar esmorzar", "dinar ràpid", "sopar tranquil", "berenar", "cuinar alguna cosa", "menjar a la taula"],
      menjar: ["cereals amb llet", "pa amb mantega", "fruita fresca", "iogurt amb mel", "galetes", "sandvitx"],
      beguda: ["llet freda", "te calent", "aigua mineral", "suc de taronja", "cafè", "refresc"],
      accio_final: ["rentar els plats bruts", "fer el llit amb cura", "tancar la finestra", "apagar les llums", "recollir la roba", "escombrar el terra"],
      estat: ["tranquil", "tranquil·la", "content", "contenta", "cansat", "cansada", "relaxat", "relaxada", "concentrat", "concentrada", "alegre"],
      estat_final: ["relaxat", "relaxada", "content", "contenta", "tranquil", "tranquil·la", "feliç", "satisfet", "satisfeta"],
      persona: ["la seva mare", "el seu pare", "el seu germà", "la seva germana", "un amic", "un veí"],
      temp_inici: ["Aquest matí", "Avui", "Ahir a la tarda", "Ara mateix", "Diumenge", "Dissabte"],
      descripcio: ["neteja", "acollidora", "ordenada", "luminosa", "còmoda", "moderna"]
    },

    l_escola: {
      persones: ["La Marta", "En Pau", "La Clàudia", "En David", "La Laura", "En Jordi"],
      lloc: ["l’escola", "la classe de català", "el pati gran", "la biblioteca", "el laboratori", "el gimnàs"],
      cosa1: ["un professor explicant", "llibres oberts", "una pissarra plena", "un ordinador nou", "un mapa gran", "un projecte"],
      cosa2: ["altres nens", "cadires ordenades", "motxilles al terra", "llapis de colors", "quaderns oberts", "calculadores"],
      companys: ["El seu millor amic", "La seva amiga", "El seu germà", "La seva germana", "Un company nou", "La seva tutora"],
      accio_grup: ["estudiar junts", "escriure al quadern", "llegir en veu alta", "jugar al pati", "fer un projecte", "practicar"],
      accio_prota: ["escoltar atent", "fer els deures", "dibuixar", "preguntar dubtes", "copiar la pissarra", "presentar"],
      accio_dinar: ["berenar amb amics", "dinar al menjador", "descansar al pati", "xerrar", "jugar a pilota", "llegir"],
      menjar: ["entrepà de pernil", "poma verda", "galetes casolanes", "iogurt", "fruita", "pastís"],
      beguda: ["aigua fresca", "suc de fruita", "llet", "refresc", "te", "cafè"],
      accio_final: ["recollir els llibres", "acomiadar-se dels amics", "sortir del pati", "tornar a classe", "netejar la taula", "tancar la porta"],
      estat: ["content", "contenta", "nerviós", "nerviosa", "atent", "atenta", "curiós", "curiosa", "motivat", "motivada", "tranquil", "tranquil·la"],
      estat_final: ["feliç", "cansat", "cansada", "content", "contenta", "tranquil", "tranquil·la", "satisfet", "satisfeta", "relaxat", "relaxada"],
      persona: ["el professor", "la seva millor amiga", "un company nou", "la tutora", "el director", "un monitor"],
      temp_inici: ["Ahir", "Avui al matí", "Dilluns passat", "Aquesta setmana", "Avui", "Dimarts"],
      opinions: ["m’agrada molt", "em sembla interessant", "ho trobo útil", "m’ho passo bé", "aprenc molt", "em motiva"],
      descripcio: ["interessant", "divertida", "tranquil·la", "ordenada", "moderna", "bonica"]
    },

    la_ciutat: {
      persones: ["En David", "La Laura", "En Jordi", "La Marta", "En Pau", "La Clàudia"],
      lloc: ["el centre històric", "la plaça major", "el barri modern", "el mercat", "el passeig marítim", "el carrer comercial"],
      cosa1: ["botigues obertes", "cotxes aparcats", "molta gent caminant", "bicicletes", "busos passant", "taxis esperant"],
      cosa2: ["edificis alts", "semàfors en funcionament", "bancs lliures", "una font", "arbres grans", "escultures"],
      companys: ["La seva millor amiga", "El seu germà gran", "La seva mare", "Un company", "Un veí", "Un turista"],
      accio_grup: ["caminar sense pressa", "mirar els aparadors", "xerrar de tot", "fer fotos", "prendre cafè", "comprar"],
      accio_prota: ["fer fotos boniques", "mirar el mapa al mòbil", "comprar un regal", "preguntar adreces", "esperar el bus", "llegir un cartell"],
      accio_dinar: ["anar a dinar", "berenar al bar", "prendre un cafè", "descansar", "menjar un gelat", "provar tapes"],
      menjar: ["gelat de vainilla", "entrepà gran", "pizza calenta", "pastís dolç", "tapes variades", "fruita fresca"],
      beguda: ["aigua mineral", "refresc fresc", "cafè calent", "suc natural", "te", "xocolata calenta"],
      accio_final: ["tornar cap a casa", "agafar el bus", "passejar una mica més", "seure en un banc", "mirar el rellotge", "dir adéu"],
      estat: ["content", "contenta", "sorprès", "sorpresa", "cansat", "cansada", "curiós", "curiosa", "tranquil", "tranquil·la", "animat", "animada"],
      estat_final: ["feliç", "tranquil", "tranquil·la", "content", "contenta", "relaxat", "relaxada", "satisfet", "satisfeta", "agraït", "agraïda"],
      persona: ["un amic de feina", "la seva amiga", "un venedor simpàtic", "un turista", "un veí", "un guia"],
      temp_inici: ["Ahir a la tarda", "Avui al matí", "Dissabte passat", "Aquesta setmana", "Diumenge", "Divendres"],
      opinions: ["m’agradava molt", "em semblava bonic", "era interessant", "ho trobava curiós", "m’ho vaig passar bé", "repetiré"],
      descripcio: ["molt animada", "tranquil·la", "bonica", "plena de gent", "moderna", "acollidora"]
    },

    la_natura: {
      persones: ["La Maria", "En Pau", "La Marta", "En Jordi", "La Clàudia", "En David"],
      lloc: ["el parc natural", "el bosc profund", "la muntanya", "la platja tranquil·la", "el llac", "el jardí botànic"],
      cosa1: ["arbres molt grans", "ocells cantant", "flors de colors", "fulles al terra", "pedres al camí", "herba verda"],
      cosa2: ["un camí estret", "un banc de fusta", "un riu tranquil", "una pedra gran", "un pont de fusta", "una font"],
      companys: ["El seu germà", "La seva millor amiga", "El seu pare", "Un veí", "La seva mare", "Un guia"],
      accio_grup: ["caminar en silenci", "mirar els ocells", "fer fotos del paisatge", "recollir fulles", "córrer pel camí", "descansar"],
      accio_prota: ["collir flors silvestres", "descansar al banc", "escoltar els ocells", "tocar l’aigua", "saltar pedres", "olorar les flors"],
      accio_dinar: ["preparar un pícnic", "berenar a l’ombra", "descansar una estona", "menjar fruita", "beure aigua", "compartir menjar"],
      menjar: ["fruita fresca", "entrepà casolà", "galetes integrals", "fruits secs", "iogurt", "pastís"],
      beguda: ["aigua fresca", "suc natural", "te calent", "llet", "refresc", "cafè"],
      accio_final: ["tornar al camí principal", "fer una última foto", "tornar cap a casa", "dir adéu", "córrer una mica", "recollir brossa"],
      estat: ["tranquil", "tranquil·la", "content", "contenta", "sorprès", "sorpresa", "curiós", "curiosa", "relaxat", "relaxada", "inspirat", "inspirada"],
      estat_final: ["relaxat", "relaxada", "feliç", "content", "contenta", "tranquil", "tranquil·la", "agraït", "agraïda", "satisfet", "satisfeta"],
      persona: ["el seu germà", "la seva millor amiga", "un excursionista", "el seu pare", "un guia", "un veí"],
      temp_inici: ["Diumenge passat", "Ahir al matí", "Avui", "Dissabte", "Dilluns", "Aquesta setmana"],
      opinions: ["m’encantava", "era molt bonic", "em relaxava", "ho trobava interessant", "em feia feliç", "repetiré"],
      descripcio: ["molt tranquil", "preciòs", "verd", "silenciós", "net", "fresc"]
    },

    el_temps_lliure: {
      persones: ["La Marta", "En Pau", "La Clàudia", "En Jordi", "La Laura", "En David"],
      lloc: ["el cinema del centre", "la biblioteca municipal", "el parc de la ciutat", "el museu d’art", "el teatre", "el centre esportiu"],
      cosa1: ["una pel·lícula nova", "molts llibres", "nens jugant", "quadres interessants", "un escenari", "pistes esportives"],
      cosa2: ["palomites calentes", "cadires còmodes", "un banc a l’ombra", "una audioguia", "un programa", "material esportiu"],
      companys: ["El seu millor amic", "La seva germana", "El seu germà", "La seva mare", "Un company", "Un veí"],
      accio_grup: ["mirar la pel·lícula atents", "llegir en silenci", "jugar junts", "mirar els quadres", "escoltar música", "practicar esport"],
      accio_prota: ["menjar palomites", "llegir un llibre interessant", "dibuixar al quadern", "escoltar l’audioguia", "ballar", "córrer"],
      accio_dinar: ["menjar alguna cosa", "beure un refresc", "descansar una estona", "parlar baixet", "riure", "compartir"],
      menjar: ["palomites salades", "gelat de vainilla", "galetes de xocolata", "entrepà petit", "fruita", "pastís"],
      beguda: ["refresc fresc", "aigua mineral", "suc natural", "cafè", "te", "xocolata"],
      accio_final: ["sortir del cinema", "tornar el llibre", "tornar cap a casa", "dir adéu als amics", "pagar l’entrada", "agafar el bus"],
      estat: ["content", "contenta", "relaxat", "relaxada", "divertit", "divertida", "curiós", "curiosa", "atent", "atenta", "animat", "animada"],
      estat_final: ["feliç", "tranquil", "tranquil·la", "content", "contenta", "satisfet", "satisfeta", "relaxat", "relaxada", "agraït", "agraïda"],
      persona: ["el seu millor amic", "el bibliotecari", "la seva germana", "el guia del museu", "un company", "un monitor"],
      temp_inici: ["Divendres passat", "Ahir", "Avui a la tarda", "Aquesta setmana", "Diumenge", "Dissabte"],
      opinions: ["m’ho vaig passar bé", "era molt interessant", "em va agradar", "ho recomano", "m’ho passaré bé", "tornaré"],
      descripcio: ["molt interessant", "tranquil", "divertit", "cultural", "animat", "modern"]
    }
  },

  b1: {
    plantillas: [
      {
        titol: "La meva experiència a ${tema}",
        seq: [
          "${temp_inici}, ${protagonista} va decidir passar el dia a ${lloc}.",
          "En arribar, ${protagonista} va observar ${cosa1} i també ${cosa2}, i tot plegat li va semblar molt ${descripcio}.",
          "Mentrestant, ${companys} van ${accio_grup}, mentre que ${protagonista} preferia ${accio_prota}.",
          "Més tard, ${protagonista} va ${accio_dinar} i va acompanyar-ho amb ${menjar} i ${beguda}.",
          "Abans de marxar, ${protagonista} va ${accio_final}, i això el/la va fer sentir ${estat_final}.",
          "Al final, ${protagonista} va concloure que ${tema} era un dels seus llocs favorits."
        ],
        pregunta: "Per què ${protagonista} va decidir anar a ${lloc} aquell dia?"
      },
      {
        titol: "${protagonista} descobreix ${tema}",
        seq: [
          "${temp_inici} ${protagonista} va visitar ${lloc} per primera vegada.",
          "El lloc tenia ${cosa1} i ${cosa2}, i l’ambient era força ${descripcio}.",
          "${protagonista} es trobava ${estat}, així que va començar a parlar amb ${persona}.",
          "Junts van ${accio_grup}, i després ${protagonista} va ${accio_prota}.",
          "Per acabar, ${protagonista} va ${accio_final} abans de tornar a casa.",
          "${protagonista} va marxar molt ${estat_final} i amb ganes de repetir."
        ],
        pregunta: "Quina impressió es va emportar ${protagonista} de ${tema}?"
      }
    ],

    la_familia: {
      persones: ["La Maria", "En Pau", "La Marta", "En Jordi", "La Clàudia", "En David"],
      lloc: ["la casa de l’àvia al poble", "el pis del tiet al centre", "la casa dels cosins a la platja", "la seva pròpia llar", "la casa de l’oncle a la muntanya", "el pis dels avis"],
      cosa1: ["un àlbum ple de fotos antigues", "un gat dormint al sofà", "un jardí ple de flors", "un piano que ja no s’utilitza", "un gos jugant al jardí", "espelmes decoratives"],
      cosa2: ["llibres apilats als prestatges", "flors fresques al gerro", "joguines escampades pel terra", "un quadre de paisatge", "coixins de colors al sofà", "una catifa antiga"],
      companys: ["La seva germana petita", "El seu germà gran", "La seva mare", "El seu pare", "Els seus cosins", "Un veí de confiança"],
      accio_grup: ["xerraren sobre records d’infantesa", "rien amb ganes", "jugaven a cartes a la taula", "miraven l’àlbum junts", "cantaven cançons antigues", "cuinaren un plat tradicional"],
      accio_prota: ["rememorava les fotos antigues", "assajava una melodia al piano", "regava les plantes del balcó", "jugava una estona amb el gat", "llegia un capítol d’un llibre", "ajudava a preparar el dinar"],
      accio_dinar: ["dinaren tots plegats", "berenaren a la terrassa", "soparen tranquil·lament", "prengueren un cafè", "faren un mos ràpid", "provaren postres casolanes"],
      menjar: ["pa amb tomàquet i pernil", "una truita de patates casolana", "galetes fetes a casa", "una amanida fresca", "pastís de xocolata", "fruita tallada"],
      beguda: ["aigua molt fresca", "llet calenta amb mel", "suc de fruita natural", "te amb llimona", "cafè amb llet", "refresc fred"],
      accio_final: ["ajudar a recollir tota la taula", "acomiadar-se amb una forta abraçada", "sortir a passejar pel barri", "rentar els plats bruts", "guardar les cadires", "apagar totes les llums"],
      estat: ["contenta", "sorpresa", "tranquil·la", "nostàlgica", "curiosa", "emocionada"],
      estat_final: ["feliç", "tranquil·la", "contenta", "relaxada", "agraïda", "satisfeta"],
      persona: ["la seva àvia", "el seu tiet", "la seva mare", "el seu germà", "la seva cosina", "un veí"],
      temp_inici: ["Ahir al matí", "Diumenge passat", "Avui mateix", "Dissabte a la tarda", "Aquesta setmana", "Dilluns"],
      opinions: ["li semblava molt bonic", "pensava que era interessant", "troba que valia la pena", "li encantava l’ambient", "m’ho vaig passar bé", "tornaria demà"],
      connectors: ["però", "a més", "tot i que", "per això", "finalment", "mentrestant"],
      descripcio: ["molt acollidor", "net i ordenat", "bonic i tranquil", "alegre i familiar", "ple de records", "càlid i acollidor"]
    },

    la_casa: {
      persones: ["En Jordi", "La Laura", "En Marc", "La Marta", "En Pau", "La Clàudia"],
      lloc: ["la seva habitació", "la cuina reformada", "el saló principal", "el bany nou", "el balcó amb vistes", "el despatx"],
      cosa1: ["un llit ben fet amb llençols nets", "una taula de fusta massissa", "un sofà molt còmode", "una estanteria plena de llibres", "una cadira nova", "un armari gran"],
      cosa2: ["una finestra gran i luminosa", "una làmpada moderna", "un mirall ovalat", "una planta verda i frondosa", "un quadre colorit", "una catifa suau"],
      companys: ["El seu germà", "La seva mare", "El seu pare", "La seva germana", "Un amic", "Un veí"],
      accio_grup: ["netejava tota la casa", "ordenava els llibres de l’estanteria", "pintava una paret", "decorava el saló", "rentava el terra", "canviava les cortines"],
      accio_prota: ["feia el llit amb cura", "rentava els plats bruts", "mirava una sèrie interessant", "llegia un llibre tranquil·lament", "escoltava música suau", "dormia una estona"],
      accio_dinar: ["preparar l’esmorzar", "dinar ràpidament", "sopar tranquil·lament", "berenar alguna cosa lleugera", "cuinar un plat senzill", "menjar a la taula"],
      menjar: ["cereals amb llet", "pa amb mantega", "fruita fresca", "iogurt amb mel", "galetes", "un sandvitx"],
      beguda: ["llet freda", "te calent", "aigua mineral", "suc de taronja natural", "cafè", "un refresc"],
      accio_final: ["rentar els plats bruts", "fer el llit amb cura", "tancar la finestra", "apagar totes les llums", "recollir la roba", "escombrar el terra"],
      estat: ["tranquil", "content", "cansat", "relaxat", "concentrat", "alegre"],
      estat_final: ["relaxat", "content", "tranquil", "feliç", "satisfet", "tranquil·la"],
      persona: ["la seva mare", "el seu pare", "el seu germà", "la seva germana", "un amic", "un veí"],
      temp_inici: ["Aquest matí", "Avui", "Ahir a la tarda", "Ara mateix", "Diumenge", "Dissabte"],
      opinions: ["li semblava molt còmode", "pensava que estava net", "troba que era acollidor", "li encantava l’ordre", "m’hi trobo bé", "m’agrada molt"],
      connectors: ["però", "a més", "tot i que", "per això", "mentrestant", "finalment"],
      descripcio: ["molt net i ordenat", "acollidor i tranquil", "luminós i agradable", "còmode i pràctic", "modern i funcional", "bonic i acollidor"]
    },

    l_escola: {
      persones: ["La Marta", "En Pau", "La Clàudia", "En David", "La Laura", "En Jordi"],
      lloc: ["l’escola del barri", "la classe de català", "el pati gran", "la biblioteca municipal", "el laboratori", "el gimnàs"],
      cosa1: ["un professor explicant amb claredat", "llibres oberts sobre la taula", "una pissarra plena d’exemples", "un ordinador nou", "un mapa gran a la paret", "un projecte de classe"],
      cosa2: ["altres alumnes treballant", "cadires ordenades", "motxilles al terra", "llapis de colors", "quaderns oberts", "calculadores"],
      companys: ["El seu millor amic", "La seva amiga", "El seu germà", "La seva germana", "Un company nou", "La seva tutora"],
      accio_grup: ["estudiaven junts per l’examen", "escrivien al quadern atentament", "llegien en veu alta", "jugaven al pati durant el descans", "feien un projecte en grup", "practicaven exercicis"],
      accio_prota: ["escoltava atentament el professor", "feia els deures amb calma", "dibuixava al quadern", "preguntava els dubtes", "copiava la pissarra", "feia una presentació"],
      accio_dinar: ["berenar amb els amics", "dinar al menjador escolar", "descansar al pati", "xerrar una estona", "jugar a pilota", "llegir un llibre"],
      menjar: ["un entrepà de pernil", "una poma verda", "galetes casolanes", "iogurt natural", "fruita fresca", "un pastís petit"],
      beguda: ["aigua fresca", "suc de fruita", "llet", "un refresc", "te", "cafè"],
      accio_final: ["recollir els llibres", "acomiadar-se dels amics", "sortir del pati", "tornar a classe", "netejar la taula", "tancar la porta"],
      estat: ["contenta", "nerviosa", "atenta", "curiosa", "motivada", "tranquil·la"],
      estat_final: ["feliç", "cansada", "contenta", "tranquil·la", "satisfeta", "relaxada"],
      persona: ["el professor de català", "la seva millor amiga", "un company nou", "la tutora", "el director", "un monitor"],
      temp_inici: ["Ahir", "Avui al matí", "Dilluns passat", "Aquesta setmana", "Avui", "Dimarts"],
      opinions: ["li semblava molt interessant", "pensava que era útil", "troba que aprenia molt", "li agradava l’ambient", "m’ho passo bé", "aprenc coses noves"],
      connectors: ["però", "a més", "tot i que", "per això", "finalment", "mentrestant"],
      descripcio: ["molt interessant", "divertida i dinàmica", "tranquil·la i ordenada", "bonica i moderna", "acollidora", "estimulant"]
    },

    la_ciutat: {
      persones: ["En David", "La Laura", "En Jordi", "La Marta", "En Pau", "La Clàudia"],
      lloc: ["el centre històric de la ciutat", "la plaça major", "el barri modern", "el mercat municipal", "el passeig marítim", "el carrer comercial"],
      cosa1: ["botigues tradicionals obertes", "cotxes circulant", "molta gent passejant", "bicicletes aparcades", "busos passant", "taxis esperant"],
      cosa2: ["edificis d’arquitectura moderna", "semàfors en funcionament", "bancs de fusta lliures", "una font ornamental", "arbres grans", "escultures modernes"],
      companys: ["La seva millor amiga", "El seu germà gran", "La seva mare", "Un company de feina", "Un veí", "Un turista"],
      accio_grup: ["passejaven sense pressa", "observaven els aparadors", "conversaven de tot", "feien fotografies", "prenien un cafè", "anaven de compres"],
      accio_prota: ["feia fotografies del paisatge", "consultava el mapa al mòbil", "comprava un petit regal", "preguntava per adreces", "esperava l’autobús", "llegia un cartell informatiu"],
      accio_dinar: ["anar a dinar a un restaurant", "fer una pausa per berenar", "prendre un cafè", "descansar una estona", "menjar un gelat", "provar tapes variades"],
      menjar: ["un gelat artesà de vainilla", "un entrepà ben farcit", "una pizza acabada de fer", "un pastís casolà", "tapes variades", "fruita fresca tallada"],
      beguda: ["aigua mineral fresca", "un refresc ben fred", "un cafè calent", "un suc natural", "te", "xocolata calenta"],
      accio_final: ["tornar tranquil·lament cap a casa", "agafar l’autobús", "continuar passejant", "seure en un banc a descansar", "mirar l’hora al rellotge", "acomiadar-se dels amics"],
      estat: ["content", "sorprès", "cansat", "curiós", "relaxat", "animat"],
      estat_final: ["feliç", "tranquil", "content", "relaxat", "satisfet", "agraït"],
      persona: ["un amic de la feina", "la seva millor amiga", "un venedor molt amable", "un turista estranger", "un veí del barri", "un guia turístic"],
      temp_inici: ["Ahir a la tarda", "Avui al matí", "Dissabte passat", "Aquesta mateixa setmana", "Diumenge", "Divendres"],
      opinions: ["li semblava molt bonic", "pensava que era interessant", "troba que valia la pena", "li encantava l’ambient", "m’ho vaig passar molt bé", "hi tornaré aviat"],
      connectors: ["però", "a més", "tot i que", "per això", "finalment", "mentrestant"],
      descripcio: ["molt animat i vibrant", "tranquil i agradable", "ple de vida", "interessant i cultural", "acollidor", "modern i funcional"]
    },

    la_natura: {
      persones: ["La Maria", "En Pau", "La Marta", "En Jordi", "La Clàudia", "En David"],
      lloc: ["el parc natural protegit", "el bosc profund", "la muntanya alta", "la platja solitària", "el llac tranquil", "el jardí botànic"],
      cosa1: ["arbres centenaris molt alts", "ocells cantant alegrement", "flors silvestres de colors", "fulles caigudes al terra", "pedres al camí", "herba verda i fresca"],
      cosa2: ["un camí estret de terra", "un banc de fusta vell", "un riu d’aigües tranquil·les", "una pedra gran i llisa", "un pont de fusta", "una font natural"],
      companys: ["El seu germà petit", "La seva millor amiga", "El seu pare", "La seva mare", "Un veí excursionista", "Un guia local"],
      accio_grup: ["caminaven en silenci", "observaven els ocells", "feien fotografies del paisatge", "recollien fulles seques", "corrien pel camí", "descansaven a l’ombra"],
      accio_prota: ["collia flors silvestres", "descansava assegut al banc", "escoltava atentament els ocells", "tocava l’aigua freda del riu", "saltava sobre les pedres", "olora les flors"],
      accio_dinar: ["preparar un pícnic complet", "fer una pausa per berenar", "descansar una bona estona", "menjar fruita fresca", "beure aigua", "compartir el menjar"],
      menjar: ["fruita de temporada", "un entrepà casolà", "galetes integrals", "una bossa de fruits secs", "iogurt", "un pastís petit"],
      beguda: ["aigua fresca de la motxilla", "suc de fruita natural", "te calent en un termo", "llet freda", "un refresc", "cafè"],
      accio_final: ["tornar al camí principal", "fer una darrera fotografia", "tornar cap a casa", "acomiadar-se del lloc", "correr una mica", "recollir la brossa"],
      estat: ["tranquil·la", "contenta", "sorpresa", "curiosa", "relaxada", "inspirada"],
      estat_final: ["relaxada", "feliç", "contenta", "tranquil·la", "agraïda", "satisfeta"],
      persona: ["el seu germà petit", "la seva millor amiga", "un excursionista experimentat", "el seu pare", "un guia local", "un veí"],
      temp_inici: ["Diumenge passat", "Ahir al matí", "Avui mateix", "Dissabte", "Dilluns", "Aquesta setmana"],
      opinions: ["li encantava aquell lloc", "pensava que era preciosíssim", "troba que relaxava molt", "li semblava inspirador", "m’hi sento molt bé", "tornaré aviat"],
      connectors: ["però", "a més a més", "tot i això", "per aquesta raó", "finalment", "mentrestant"],
      descripcio: ["molt tranquil i silenciós", "preciosíssim i verd", "ple de pau", "inspirador", "net i ben cuidat", "fresc i agradable"]
    },

    el_temps_lliure: {
      persones: ["La Marta", "En Pau", "La Clàudia", "En Jordi", "La Laura", "En David"],
      lloc: ["el cinema del centre", "la biblioteca municipal", "el parc de la ciutat", "el museu d’art", "el teatre", "el centre esportiu"],
      cosa1: ["una pel·lícula nova d’estrena", "molts llibres interessants", "nens jugant alegrement", "quadres molt interessants", "un escenari ben il·luminat", "pistes esportives"],
      cosa2: ["palomites calentes i salades", "cadires molt còmodes", "un banc a l’ombra", "una audioguia detallada", "un programa del teatre", "material esportiu"],
      companys: ["El seu millor amic", "La seva germana", "El seu germà", "La seva mare", "Un company", "Un veí"],
      accio_grup: ["miraven la pel·lícula atents", "llegien en silenci absolut", "jugaven junts al parc", "miraven els quadres amb calma", "escoltaven música en directe", "practicaven esport"],
      accio_prota: ["menjava palomites salades", "llegia un llibre molt interessant", "dibuixava al quadern", "escoltava atent l’audioguia", "ballava una mica", "corria per la pista"],
      accio_dinar: ["menjar alguna cosa lleugera", "beure un refresc fresc", "descansar una estona", "parlar en veu baixa", "riure junts", "compartir el menjar"],
      menjar: ["palomites salades", "un gelat de vainilla", "galetes de xocolata", "un entrepà petit", "fruita fresca", "un pastís"],
      beguda: ["un refresc ben fred", "aigua mineral", "suc natural", "un cafè calent", "te", "xocolata calenta"],
      accio_final: ["sortir del cinema", "tornar el llibre a la prestatgeria", "tornar cap a casa", "acomiadar-se dels amics", "pagar l’entrada", "agafar l’autobús"],
      estat: ["contenta", "relaxada", "divertida", "curiosa", "atenta", "animada"],
      estat_final: ["feliç", "tranquil·la", "contenta", "satisfeta", "relaxada", "agraïda"],
      persona: ["el seu millor amic", "el bibliotecari", "la seva germana", "el guia del museu", "un company", "un monitor"],
      temp_inici: ["Divendres passat", "Ahir", "Avui a la tarda", "Aquesta setmana", "Diumenge", "Dissabte"],
      opinions: ["m’ho vaig passar molt bé", "era molt interessant", "em va agradar molt", "ho recomano", "m’ho passaré bé", "tornaré aviat"],
      connectors: ["però", "a més", "tot i que", "per això", "finalment", "mentrestant"],
      descripcio: ["molt interessant i cultural", "tranquil i silenciós", "divertit i animat", "modern i ben equipat", "acollidor", "entretingut"]
    }
  }
};          

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

  const lectura = {
    nivel: nivell.toUpperCase(),
    bloque: temaKey.replace(/_/g, " ").replace(/^la |^el /, ""),
    tema: ctx.tema,
    texto: texto,
    pregunta: pregunta,
    vocab: vocabUsado
  };

  let htmlVocab = `
    <div style="background:#1a1a1a; padding:15px; border-radius:8px; margin:20px 0;">
      <div style="color:#4ade80; font-weight:bold; margin-bottom:12px;">Vocabulari del tema: ${lectura.tema}</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:15px;">
  `;
  lectura.vocab.forEach(v => {
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
      <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">Nivell ${lectura.nivel} - ${lectura.bloque}</div>
      <div style="font-size:16px; line-height:1.7; margin-bottom:20px;">${lectura.texto}</div>
      ${htmlVocab}
      ${htmlNota}
      <div style="background:#1a1a1a; padding:15px; border-radius:8px; margin-bottom:15px;">
        <div style="font-weight:bold; margin-bottom:8px;">Pregunta:</div>
        <div>${lectura.pregunta}</div>
      </div>
      <button class="btn btn-prim" onclick="mostrarLectura()" style="width:100%; margin-bottom:10px;">Generar Lectura Nova</button>
      <button class="btn btn-sec" onclick="generarLectura()" style="width:100%;">Tornar</button>
    </div>
  `;

  guardarEstat();
  actualitzarUI();
}

// Frase 1: inici 
// ===== TIPS =====
const dadesTips = {
  a1: [
    {truc: "El per masculí singular, La per femení singular", exemple: "El gat, La gata"},
    {truc: "Els per masculí plural, Les per femení plural", exemple: "Els gats, Les gates"},
    {truc: "Un/Una per indefinits singulars", exemple: "Un llibre, Una taula"},
    {truc: "Uns/Unes per indefinits plurals", exemple: "Uns llibres, Unes taules"},
    {truc: "Jo + verb en 1a persona singular", exemple: "Jo parlo"},
    {truc: "Tu + verb en 2a persona singular", exemple: "Tu parles"},
    {truc: "Ell/ella + verb en 3a persona singular", exemple: "Ell parla"},
    {truc: "Nosaltres + verb en 1a persona plural", exemple: "Nosaltres parlem"},
    {truc: "Vosaltres + verb en 2a persona plural", exemple: "Vosaltres parleu"},
    {truc: "Ells/elles + verb en 3a persona plural", exemple: "Ells parlen"},
    {truc: "Ser = ésser permanent", exemple: "Jo sóc català"},
    {truc: "Estar = estat temporal", exemple: "Estic cansat"},
    {truc: "Tenir = possessió", exemple: "Tinc un llibre"},
    {truc: "Fer = acció", exemple: "Faig els deures"},
    {truc: "Anar = moviment", exemple: "Vaig a casa"},
    {truc: "Bon dia per saludar al matí", exemple: "Bon dia! Com estàs?"},
    {truc: "Bona tarda per saludar a la tarda", exemple: "Bona tarda!"},
    {truc: "Bona nit per acomiadar-se", exemple: "Bona nit!"},
    {truc: "Si us plau = por favor", exemple: "Si us plau, ajuda'm"},
    {truc: "Gràcies = gracias", exemple: "Gràcies per tot"},
    {truc: "De res = de nada", exemple: "De res!"},
    {truc: "Quant costa? per preguntar preu", exemple: "Quant costa això?"},
    {truc: "Quant és? per preguntar hora", exemple: "Quant és?"},
    {truc: "On és? per preguntar lloc", exemple: "On és el lavabo?"},
    {truc: "Com et dius? per preguntar nom", exemple: "Com et dius?"},
    {truc: "Em dic = me llamo", exemple: "Em dic Joan"},
    {truc: "Quin/quina per preguntar qualitat", exemple: "Quin color t’agrada?"},
    {truc: "Quants/quantes per preguntar quantitat", exemple: "Quants anys tens?"},
    {truc: "Aquest/aquesta/aquests/aquestes = este/esta/estos/estas", exemple: "Aquest llibre"},
    {truc: "Aquell/aquella/aquells/aquelles = aquel/aquella/aquellos/aquellas", exemple: "Aquell cotxe"}
  ],
  a2: [
    {truc: "NY es pronuncia com ñ d'espanyol", exemple: "Any = Añ, Seny = Señ"},
    {truc: "Bon dia = Buenos días", exemple: "Bon dia! Com estàs?"},
    {truc: "Passat perifràstic: vaig + infinitiu", exemple: "Vaig menjar"},
    {truc: "Futur pròxim: anar a + infinitiu", exemple: "Vaig a estudiar"},
    {truc: "Pronoms febles van davant del verb", exemple: "Me'l dono"},
    {truc: "Negació: no + verb", exemple: "No parlo"},
    {truc: "Interrogació: posar el verb davant", exemple: "Parles català?"},
    {truc: "Perquè = porque pregunta/resposta", exemple: "Perquè sí"},
    {truc: "Per a = para + infinitiu", exemple: "És per a tu"},
    {truc: "De + nom = de", exemple: "El llibre de Joan"},
    {truc: "A + nom = a", exemple: "Vaig a casa"},
    {truc: "En + lloc = en", exemple: "Estic en classe"},
    {truc: "Amb + nom = con", exemple: "Amb amics"},
    {truc: "Sense + nom = sin", exemple: "Sense sucre"},
    {truc: "Molt + adjectiu = muy", exemple: "Molt bonic"},
    {truc: "Massa + nom = demasiado", exemple: "Massa feina"},
    {truc: "Poc + nom = poco", exemple: "Poc temps"},
    {truc: "Gaire + nom = mucho en negació", exemple: "No tinc gaire temps"},
    {truc: "Encara = todavía", exemple: "Encara no"},
    {truc: "Ja = ya", exemple: "Ja he acabat"},
    {truc: "Tampoc = tampoco", exemple: "Jo tampoc"},
    {truc: "Ni... ni = ni... ni", exemple: "Ni cafè ni te"},
    {truc: "O... o = o... o", exemple: "O vens o no"},
    {truc: "I = y", exemple: "Pa i vi"},
    {truc: "Però = pero", exemple: "Vinc però tard"},
    {truc: "Que = que", exemple: "Crec que sí"},
    {truc: "Quan = cuando", exemple: "Quan arribis"},
    {truc: "Si = si", exemple: "Si vols"},
    {truc: "Com = como", exemple: "Com estàs?"},
    {truc: "Em, et, el/la, ens, us, els/les", exemple: "Em veig, Et veig"}
  ],
  b1: [
    {truc: "Apòstrof L' D' N' S' davant vocal", exemple: "L'home, D'aigua, N'hi ha, S'obre"},
    {truc: "Accent greu È Ò obre el so de la vocal", exemple: "Pèra, Còp, Tròs"},
    {truc: "Accent agut É Ó tanca el so de la vocal", exemple: "Café, Córrer, Nóvio"},
    {truc: "È vs É canvia el significat", exemple: "Pès = pes, Pés = pies"},
    {truc: "Subjuntiu present: que + verb", exemple: "Vull que vinguis"},
    {truc: "Condicional: verb + ia/ies/ia/íem/íeu/ien", exemple: "Vindria"},
    {truc: "Pronom hi = en/aquí", exemple: "Hi vaig"},
    {truc: "Pronom en = de", exemple: "En vull"},
    {truc: "Pronom ho = neutre", exemple: "Ho sé"},
    {truc: "Combinació pronom + pronom", exemple: "Me'l, Te'l, Se'l"},
    {truc: "Passat perifràstic per accions puntuals", exemple: "Ahir vaig anar"},
    {truc: "Imperfet per accions habituals passades", exemple: "Abans anava"},
    {truc: "Perifrasi incoativa: posar-se a + infinitiu", exemple: "Es va posar a ploure"},
    {truc: "Perifrasi durativa: estar + gerundi", exemple: "Estic llegint"},
    {truc: "Gerundi = -ant/-ent", exemple: "Cantant, Bevent"},
    {truc: "Participi = -at/-it/-ut", exemple: "Parlat, Begut"},
    {truc: "Relatius: que, qui, el qual", exemple: "El llibre que llegeixo"},
    {truc: "Comparatiu: més/menys... que", exemple: "Més gran que tu"},
    {truc: "Per = causa/motiu, Per a = finalitat", exemple: "Ho faig per tu / És per a tu"}
  ]
};

// Unim tots els tips en un sol array per mostrar-los aleatòriament
const totsElsTips = [...dadesTips.a1,...dadesTips.a2,...dadesTips.b1];
let tipsUsats = [];

function carregarTips() {
  const cont = document.getElementById('tips-contenidor');

  if (totsElsTips.length === 0) {
    cont.innerHTML = `<div style="text-align:center; opacity:0.6; padding:40px;">No hi ha tips carregats</div>`;
    return;
  }

  if (tipsUsats.length >= totsElsTips.length) {
    tipsUsats = [];
  }

  let indexDisponibles = totsElsTips.map((_, i) => i).filter(i =>!tipsUsats.includes(i));
  let indexAleatori = indexDisponibles[Math.floor(Math.random() * indexDisponibles.length)];
  tipsUsats.push(indexAleatori);

  let tip = totsElsTips[indexAleatori];

  cont.innerHTML = `
    <div style="background:#1a1a1a; padding:20px; border-radius:12px; margin-bottom:15px;">
      <div style="font-size:18px; margin-bottom:10px;">💡 ${tip.truc}</div>
      <div style="opacity:0.7; font-size:14px;">Exemple: ${tip.exemple}</div>
    </div>
    <button class="btn" onclick="carregarTips()" style="width:100%;">Següent Tip</button>
  `;
}

// ===== BOTIGA =====
async function carregarBotiga() {
  const cont = document.getElementById('botiga-contenidor');
  try {
    const res = await fetch('./data/botiga_emojis.json');
    if(res.ok) {
      const data = await res.json();
      estat.packs_botiga = data;
      renderitzarBotiga();
    }
  } catch(e) {
    cont.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#f44336;">Error: ${e.message}</div>`;
  }
}

function renderitzarBotiga() {
  const cont = document.getElementById('botiga-contenidor');
  cont.innerHTML = '';
  estat.packs_botiga.forEach(pack => {
    const comprat = estat.compres.includes(pack.id);
    const card = document.createElement('div');
    card.className = 'capitol-card';
    card.innerHTML = `
      <div class="capitol-icona">🎁</div>
      <h3>${pack.nom}</h3>
      <p style="color:var(--text-sec); margin:8px 0;">${pack.descripcio}</p>
      <p style="font-size:24px;">${pack.emojis.map(e => e.emoji).join(' ')}</p>
      <button class="btn ${comprat? 'btn-sec' : ''}" onclick="comprarPack('${pack.id}', ${pack.preu}, event)" ${comprat? 'disabled' : ''}>
        ${comprat? LANG.comprat : `🪙 ${pack.preu}`}
      </button>
    `;
    cont.appendChild(card);
  });
}

async function comprarPack(id, preu, event) {
  if (event) event.stopPropagation();
  if (estat.monedes < preu) { mostrarModal(LANG.no_prou_monedes); return; }
  vibrar();
  estat.monedes -= preu;
  estat.compres.push(id);
  const pack = estat.packs_botiga.find(p => p.id === id);
  if (pack) {
    pack.emojis.forEach(e => {
      if (!estat.emojisDesbloquejats.includes(e.emoji)) estat.emojisDesbloquejats.push(e.emoji);
    });
    await carregarDades();
  }
  guardarEstat();
  actualitzarUI();
  renderitzarBotiga();
  mostrarModal("Pack desbloquejat!");
}

// REGISTRAR SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
}

// ===== INTRO ONBOARDING =====
const INTRO_SLIDES = [
  {emoji:"🙀", titol:"Cat Lingo Emoji", text:"Aprèn català jugant amb emojis. Tria emojis per formar frases i puja de nivell!"},
  {emoji:"🎯", titol:"Mapa i Gremi", text:"Mapa: 100 nivells. Gremi > Minijocs: arma la frase tocant els emojis correctes. 25 encerts = pujes de nivell!"},
  {emoji:"📖", titol:"Lectura", text:"Lectura: genera textos curts A1-B1. Gastes 10 d’energia i et surt vocabulari + pregunta de comprensió."},
  {emoji:"💡", titol:"Tips", text:"Tips: consells ràpids de gramàtica i vocabulari. Toca 'Següent Tip' per veure’n un de nou cada cop."},
  {emoji:"🪙⚡", titol:"Monedes i Energia", text:"Guanya monedes amb el minijoc. Usa energia per lectures i recarrega amb monedes. Compra packs d’emoji a la Botiga."},
  {emoji:"🚀", titol:"Ja estàs!", text:"Tens Missió per guiar-te, Botiga per desbloquejar, i tot el que cal per començar. Som-hi!"}
];
let introIndex = 0;

function mostrarIntro() {
  if(estat.introVist) return;
  document.getElementById('intro').classList.remove('hidden');
  pintarSlide();
}

function pintarSlide() {
  const s = INTRO_SLIDES[introIndex];
  document.getElementById('intro-emoji').textContent = s.emoji;
  document.getElementById('intro-titol').textContent = s.titol;
  document.getElementById('intro-text').textContent = s.text;
  document.getElementById('intro-dots').textContent = INTRO_SLIDES.map((_,i) => i===introIndex? '●' : '○').join(' ');
  document.getElementById('intro-btn').textContent = introIndex === INTRO_SLIDES.length-1? 'Entrar' : 'Següent';
}

function seguentSlide() {
  vibrar();
  introIndex++;
  if(introIndex >= INTRO_SLIDES.length) {
    tancarIntro();
  } else {
    pintarSlide();
  }
}

function tancarIntro() {
  document.getElementById('intro').classList.add('hidden');
  estat.introVist = true;
  guardarEstat();
}

window.addEventListener('load', () => setTimeout(mostrarIntro, 300));