// main.js - Lingocat Emoji v3

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
  btn.onclick = () => { deferredPrompt.prompt(); btn.remove(); };
  document.body.appendChild(btn);
});

// ===== PERSONATGES JUGADOR =====
const PERSONATGES_JUGADOR = [
  {id: 'joven', emoji: '👨', nom: 'Joven'},
  {id: 'jova', emoji: '👩', nom: 'Jova'},
  {id: 'noi', emoji: '👦', nom: 'Noi'},
  {id: 'noia', emoji: '👧', nom: 'Noia'},
  {id: 'home', emoji: '👨‍🦰', nom: 'Home'},
  {id: 'dona', emoji: '👩‍🦰', nom: 'Dona'}
];

// ===== ESTADO GLOBAL =====
let estat = {
  monedes: parseInt(localStorage.getItem('cat_monedes')) || 0,
  compres: JSON.parse(localStorage.getItem('cat_compres')) || [],
  introVist: JSON.parse(localStorage.getItem('cat_intro')) || false,
  personatgeTriat: localStorage.getItem('cat_personatge') || 'joven',
  progres: {
    nivellActualMapa: parseInt(localStorage.getItem('cat_nivell')) || 1,
    encerts: parseInt(localStorage.getItem('cat_encerts')) || 0,
    frasesDesDeUltimNivell: parseInt(localStorage.getItem('cat_frasesContador')) || 0
  },
  energia: parseInt(localStorage.getItem('cat_energia')) || 100,
  ultimaRecargaEnergia: parseInt(localStorage.getItem('cat_ultimaEnergia')) || Date.now(),
  desbloquejats: JSON.parse(localStorage.getItem('cat_desbloquejats')) || {}
};

const PACK_INICIAL = ["😀","😊","😂","👨","👩","🐶","🐱","🏠","🍎","🚗","⚽","📱","💻","🎵","❤️"];

// ===== DATOS =====
let CATEGORIES_TOTS = {};
let BIBLIOTECA_PLA = [];
let BIBLIOTECA_POR_CAT = {};
let PACKS_BOTIGA = [];
let FRASES_MINIJOC = [];
let TOTS_EMOJIS = [];
let CATEGORIES_DESBLOQUEJADES = {};
let BANCO_VOCAB = {};
let dadesTips = {};

// ===== MINIJOC =====
let NIVELL_MINIJOC = {minEmojis: 2, maxEmojis: 5, nivelActual: parseInt(localStorage.getItem('cat_nivell_minijoc')) || 1};
let minijoc = {fraseObjectiu: null, emojisTriats: [], emojisDisponibles: []};

// ===== TIPS =====
let totsElsTips = [];
let tipsUsats = [];

// ===== INTRO =====
let slideActual = 0;
const INTRO_SLIDES = [
  {emoji: "👋", titol: "Benvingut a Cat Lingo Emoji", text: "Aprèn català jugant amb emojis"},
  {emoji: "🎯", titol: "Missió diària", text: "Completa 25 frases per desbloquejar el següent nivell"},
  {emoji: "🎁", titol: "Desbloqueja emojis", text: "Compra packs a la botiga i amplia vocabulari"},
  {emoji: "📖", titol: "Generador de lectura", text: "Practica amb textos adaptats al teu nivell"},
  {emoji: "🚀", titol: "Comencem!", text: "Prem Saltar per jugar"}
];

// ===== UTILS =====
function quitarSkinTone(emoji) { return emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, ''); }
function vibrar() { if (navigator.vibrate) navigator.vibrate(50); }

function actualitzarUI() {
  const monedesEl = document.getElementById('monedes');
  const nivellEl = document.getElementById('nivell');
  const energiaEl = document.getElementById('energia');
  const barraEl = document.getElementById('barra-progres');
  if (monedesEl) monedesEl.textContent = estat.monedes;
  if (nivellEl) nivellEl.textContent = estat.progres.nivellActualMapa;
  if (energiaEl) energiaEl.textContent = estat.energia;
  if (barraEl) barraEl.style.width = ((estat.progres.frasesDesDeUltimNivell / 25) * 100) + '%';
}

function guardarEstat() {
  localStorage.setItem('cat_monedes', estat.monedes);
  localStorage.setItem('cat_compres', JSON.stringify(estat.compres));
  localStorage.setItem('cat_nivell', estat.progres.nivellActualMapa);
  localStorage.setItem('cat_encerts', estat.progres.encerts);
  localStorage.setItem('cat_frasesContador', estat.progres.frasesDesDeUltimNivell);
  localStorage.setItem('cat_energia', estat.energia);
  localStorage.setItem('cat_ultimaEnergia', estat.ultimaRecargaEnergia);
  localStorage.setItem('cat_intro', JSON.stringify(estat.introVist));
  localStorage.setItem('cat_desbloquejats', JSON.stringify(estat.desbloquejats));
  localStorage.setItem('cat_nivell_minijoc', NIVELL_MINIJOC.nivelActual);
  localStorage.setItem('cat_personatge', estat.personatgeTriat);
}

// ===== INICIALITZACIÓ =====
document.addEventListener('DOMContentLoaded', async () => {
  mostrarIntro();
  await carregarDades();
  actualitzarUI();
  canviarTab('mapa', null);
});

// ===== NAVEGACIÓ =====
function canviarTab(tab, e) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  if(e && e.target) e.target.closest('.nav-item').classList.add('active');

  if(tab === 'mapa') renderMapa();
  if(tab === 'missio') renderMissio();
  if(tab === 'gremi') mostrarSubTab('personatges');
  if(tab === 'lectura') generarLectura();
  if(tab === 'tips') carregarTips();
  if(tab === 'botiga') renderBotiga();
}

function mostrarSubTab(sub) {
  // 1. Oculta TODO
  document.querySelectorAll('#gremi-contenidor .sub-tab-content').forEach(t => {
    t.style.display = 'none';
  });
  
  // 2. Quita active de todos los botones
  document.querySelectorAll('.sub-tab-btn').forEach(b => {
    b.classList.remove('active');
  });
  
  // 3. Activa solo el botón correcto
  const btn = document.getElementById('btn-' + sub);
  if (btn) btn.classList.add('active');
  
  // 4. Muestra solo el contenido correcto
  const cont = document.getElementById('gremi-' + sub);
  if (cont) cont.style.display = 'block';

  // 5. Carga datos solo para ese subtab
  if (sub === 'personatges') mostrarGremiPersonatges();
  if (sub === 'biblioteca') renderDiccionari();
  if (sub === 'minijoc') setTimeout(() => novaFraseMinijoc(), 50);
  
  vibrar();
}

function jugarNivell(n) {
  if (n > estat.progres.nivellActualMapa) return;
  canviarTab('gremi', null);
  setTimeout(() => {
    mostrarSubTab('minijoc');
    novaFraseMinijoc();
  }, 50);
}

function jugarNivell1() {
  jugarNivell(1);
}

// ===== CARREGAR DADES =====
async function carregarDades() {
  try {
    const [catRes, bibRes, botRes, frasesRes, lecturaRes, tipsRes] = await Promise.all([
      fetch('./data/categories_emoji.json'),
      fetch('./data/biblioteca_emoji.json'),
      fetch('./data/botiga_emoji.json'),
      fetch('./data/minijoc_frases.json'),
      fetch('./data/banco_lectura.json'),
      fetch('./data/tips.json')
    ]);
    CATEGORIES_TOTS = await catRes.json();
    BIBLIOTECA_PLA = await bibRes.json();
    PACKS_BOTIGA = await botRes.json();
    const frasesData = await frasesRes.json();
    FRASES_MINIJOC = Array.isArray(frasesData)? frasesData : (frasesData.frases || []);
    BANCO_VOCAB = await lecturaRes.json();
    dadesTips = await tipsRes.json();
  } catch(e) {
    console.error('Error carregant dades:', e);
    alert('Error carregant dades. Revisa que els fitxers /data/ existeixin');
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
    const pack = PACKS_BOTIGA.find(p => p.id === idPack);
    if (pack && pack.emojis) pack.emojis.forEach(e => desbloquejats.add(quitarSkinTone(e.emoji)));
  });
  CATEGORIES_DESBLOQUEJADES = {};
  Object.keys(CATEGORIES_TOTS).forEach(cat => {
    CATEGORIES_DESBLOQUEJADES[cat] = CATEGORIES_TOTS[cat].filter(e =>
      desbloquejats.has(quitarSkinTone(e))
    );
  });
  estat.desbloquejats = CATEGORIES_DESBLOQUEJADES;
}
function construirTotsEmojis() { TOTS_EMOJIS = BIBLIOTECA_PLA.map(e => ({...e})); }

// ===== INTRO =====
function mostrarIntro() {
  const introEl = document.getElementById('intro');
  if (!introEl) return;
  if (estat.introVist) { introEl.style.display = 'none'; return; }
  introEl.style.display = 'flex';
  slideActual = 0;
  pintarSlide();
}
function pintarSlide() {
  const slide = INTRO_SLIDES[slideActual];
  document.getElementById('intro-emoji').textContent = slide.emoji;
  document.getElementById('intro-titol').textContent = slide.titol;
  document.getElementById('intro-text').textContent = slide.text;
  document.getElementById('intro-dots').innerHTML = INTRO_SLIDES.map((_, i) =>
    `<span style="opacity:${i===slideActual?1:0.3}">●</span>`).join(' ');
  document.getElementById('intro-btn').textContent =
    slideActual === INTRO_SLIDES.length - 1? 'Començar' : 'Següent';
}
function seguentSlide() {
  vibrar();
  if (slideActual < INTRO_SLIDES.length - 1) { slideActual++; pintarSlide(); }
  else { estat.introVist = true; guardarEstat(); document.getElementById('intro').style.display = 'none'; }
}

// ===== MAPA =====
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
    const onclick = desbloquejat? (i === 1? `jugarNivell1()` : `jugarNivell(${i})`) : '';
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
function jugarNivell1() {
  canviarTab('gremi', null);
  setTimeout(() => {
    mostrarSubTab('minijoc');
    novaFraseMinijoc();
  }, 50);
}

// ===== MISSIONS =====
function renderMissio() {
  const cont = document.getElementById('missio-contenidor');
  if (!cont) return;
  const frasesFaltants = 25 - estat.progres.frasesDesDeUltimNivell;
  const teEnergia = estat.energia >= 20;
  cont.innerHTML = `
    <h3 style="text-align:center; margin-bottom:20px;">Missions</h3>
    <div class="missio-item" onclick="jugarNivell1();" style="cursor:pointer;">
      🎯 Missió 1: Completa ${frasesFaltants} frases més per pujar al nivell ${estat.progres.nivellActualMapa + 1}
    </div>
    <div class="missio-item" onclick="canviarTab('lectura', null);" style="cursor:pointer;">
      ⚡ Missió 2: ${teEnergia? 'Tens energia! Genera nova lectura' : 'Recarrega energia per llegir'}
    </div>
    <div class="missio-item" onclick="canviarTab('botiga', null);" style="cursor:pointer;">
      🎁 Missió 3: Compra un pack d'emojis a la Botiga
    </div>
  `;
}

// ===== GREMI =====
function mostrarGremiPersonatges() {
  const cont = document.getElementById('gremi-contenidor');
  const personatge = PERSONATGES_JUGADOR.find(p => p.id === estat.personatgeTriat);
  let html = `<div style="text-align:center; padding:20px;">`;
  html += `<div style="font-size:80px; margin-bottom:10px;">${personatge.emoji}</div>`;
  html += `<h3>${personatge.nom}</h3>`;
  html += `<p style="color:#888; margin-bottom:30px;">Aquest és el teu personatge actual</p>`;
  html += `<div style="padding-top:20px; border-top:1px solid #333;"><h4 style="text-align:center; margin-bottom:15px;">Canvia de personatge</h4><div class="emoji-grid">`;
  PERSONATGES_JUGADOR.forEach(p => {
    const seleccionat = p.id === estat.personatgeTriat;
    html += `<div class="emoji-item" style="border:${seleccionat? '2px solid #22c55e' : '1px solid #333'}; cursor:pointer;" onclick="triarPersonatge('${p.id}')">
      <div class="emoji-large">${p.emoji}</div>
      <div class="emoji-name">${p.nom}</div>
    </div>`;
  });
  html += `</div></div></div>`;
  cont.innerHTML = html;
}
function triarPersonatge(id) {
  estat.personatgeTriat = id;
  guardarEstat();
  mostrarGremiPersonatges();
  vibrar();
}
function mostrarGremiLlegendes() {
  const cont = document.getElementById('gremi-contenidor');
  cont.innerHTML = `<div style="text-align:center; color:#888; padding:40px;">Pròximament: Llegendes de Catalunya</div>`;
}
function renderDiccionari() {
  const cont = document.getElementById('gremi-biblioteca');
  if (!cont) return;
  let html = `<h3 style="text-align:center; margin-bottom:10px;">Biblioteca</h3>`;
  html += `<p style="text-align:center; color:#888; margin-bottom:20px; font-size:14px;">Tots els emojis disponibles. Compra packs a la Botiga per desbloquejar-los.</p>`;
  for (const [cat, emojis] of Object.entries(BIBLIOTECA_POR_CAT)) {
    html += `<h4 style="margin:20px 0 8px; color:#4CAF50; text-transform:capitalize;">${cat}</h4><div class="emoji-grid">`;
    emojis.forEach(e => {
      const emojiNet = quitarSkinTone(e.emoji);
      const desbloquejat = CATEGORIES_DESBLOQUEJADES[cat]?.includes(emojiNet);
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
  if (!emojiData ||!emojiData.genere) return emojiData?.nom_cat || emoji;
  const nom = emojiData.nom_cat;
  const article = emojiData.genere === 'f'? 'La' : 'El';
  return `${article} ${nom}`;
}
function generarFraseDinamica(plantilla, emojisJugador) {
  let text = plantilla.text;
  let solucio = [];
  for (const cat of plantilla.categories) {
    const emojisDisponibles = CATEGORIES_TOTS[cat]?.filter(eBase =>
      emojisJugador.some(eJug => quitarSkinTone(eJug) === quitarSkinTone(eBase))
    ) || [];
    if (!emojisDisponibles.length) return generarFraseDinamica(FRASES_MINIJOC[Math.floor(Math.random() * FRASES_MINIJOC.length)], emojisJugador);
    const emojiElegit = emojisDisponibles[Math.floor(Math.random() * emojisDisponibles.length)];
    text = text.replace(`{${cat}}`, obtenirArticle(emojiElegit));
    solucio.push(emojiElegit);
  }
  return { text, solucio };
}
function novaFraseMinijoc() {
  if (!FRASES_MINIJOC || FRASES_MINIJOC.length === 0) return;
  const emojisJugador = [...PACK_INICIAL];
  estat.compres.forEach(idPack => {
    const pack = PACKS_BOTIGA.find(p => p.id === idPack);
    if (pack && pack.emojis) pack.emojis.forEach(e => emojisJugador.push(e.emoji));
  });
  if (emojisJugador.length < 2) {
    document.getElementById('minijoc-frase').textContent = "Compra més emojis per desbloquejar frases!";
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
  document.getElementById('minijoc-nivell').textContent = `Nivell ${NIVELL_MINIJOC.nivelActual} - ${solucio.length} emojis`;
  generarOpcionsMinijoc(solucio);
}
function generarOpcionsMinijoc(solucio) {
  const grid = document.getElementById('minijoc-emojis');
  if (!grid) return;
  const numOpcions = solucio.length <= 3? 16 : 20;
  const numFalsos = numOpcions - solucio.length;
  const emojisJugador = [...PACK_INICIAL];
  estat.compres.forEach(idPack => {
    const pack = PACKS_BOTIGA.find(p => p.id === idPack);
    if (pack && pack.emojis) pack.emojis.forEach(e => emojisJugador.push(e.emoji));
  });
  const falsos = emojisJugador.filter(e =>!solucio.some(eSol => quitarSkinTone(e) === quitarSkinTone(eSol))).sort(() => 0.5 - Math.random()).slice(0, numFalsos);
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
      alert(`🔓 Nivell ${estat.progres.nivellActualMapa} desbloquejat!`);
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

// ===== LECTURA =====
function generarLectura() {
  const nivell = estat.progres.nivellActualMapa <= 33? 'a1' : estat.progres.nivellActualMapa <= 66? 'a2' : 'b1';
  const lecturesNivell = BANCO_VOCAB[nivell]?.plantillas || [];
  const cont = document.getElementById('lectura-contingut');
  if (!cont) return;
  if (lecturesNivell.length === 0) {
    cont.innerHTML = '<p>No hi ha lectures per aquest nivell</p>';
    return;
  }
  const lectura = lecturesNivell[Math.floor(Math.random() * lecturesNivell.length)];
  const temes = ['la_familia', 'la_casa', 'l_escola', 'la_ciutat', 'la_natura', 'el_temps_lliure'];
  const temaTriat = temes[Math.floor(Math.random() * temes.length)];
  const vocab = BANCO_VOCAB[nivell][temaTriat];
  const vocabulariUsat = [];
  function reemplaçar(text) {
    return text.replace(/\$\{(\w+)\}/g, (match, key) => {
      const opcions = vocab[key];
      if (!opcions ||!opcions.length) return key;
      const triat = opcions[Math.floor(Math.random() * opcions.length)];
      if (!vocabulariUsat.includes(triat)) vocabulariUsat.push(triat);
      return triat;
    });
  }
  const titol = reemplaçar(lectura.titol);
  const text = lectura.seq.map(linia => reemplaçar(linia)).join(' ');
  const pregunta = reemplaçar(lectura.pregunta);
  cont.innerHTML = `
    <div class="lectura-card">
      <h3>${titol}</h3>
      <p class="lectura-text">${text}</p>
      <div id="lectura-vocab">
        <h4>Vocabulari:</h4>
        ${vocabulariUsat.slice(0,8).map(w => `<span class="vocab-tag">${w}</span>`).join('')}
      </div>
      <div class="lectura-preguntes">
        <p><strong>Pregunta:</strong> ${pregunta}</p>
        <button class="btn-primari" onclick="comprovarLectura()">Respondre</button>
        <div id="feedback-lectura" class="feedback"></div>
      </div>
      <button class="btn-primari" onclick="generarLectura()" style="margin-top:15px;">Nova lectura</button>
    </div>
  `;
}

// ===== TIPS =====
function carregarTips() {
  const nivell = estat.progres.nivellActualMapa <= 33? 'a1' : estat.progres.nivellActualMapa <= 66? 'a2' : 'b1';
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
  do { idx = Math.floor(Math.random() * totsElsTips.length); } while (tipsUsats.includes(idx));
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
    const comprat = estat.compres.includes(pack.id);
    const card = document.createElement('div');
    card.className = 'capitol-card';
    card.innerHTML = `<div class="capitol-icona">🎁</div><h3>${pack.nom}</h3><p style="color:#aaa; margin:8px 0;">${pack.descripcio}</p><p style="font-size:24px;">${pack.emojis.slice(0,6).map(e => e.emoji).join(' ')}${pack.emojis.length > 6? '...' : ''}</p><button class="btn ${comprat? 'btn-sec' : ''}" onclick="comprarPack('${pack.id}', ${pack.preu})" ${comprat? 'disabled' : ''}>${comprat? 'Desbloquejat' : `🪙 ${pack.preu}`}</button>`;
    cont.appendChild(card);
  });
}
function comprarPack(id, preu) {
  if (estat.monedes < preu) { alert('No tens prou monedes'); return; }
  estat.monedes -= preu;
  estat.compres.push(id);
  const pack = PACKS_BOTIGA.find(p => p.id === id);
  if (pack && pack.emojis) {
    pack.emojis.forEach(e => {
      const emojiNet = quitarSkinTone(e.emoji);
      const cat = e.categoria;
      if (cat) {
        if (!estat.desbloquejats[cat]) estat.desbloquejats[cat] = [];
        if (!estat.desbloquejats[cat].includes(emojiNet)) estat.desbloquejats[cat].push(emojiNet);
      }
    });
  }
  NIVELL_MINIJOC.nivelActual = Math.min(NIVELL_MINIJOC.nivelActual + 1, NIVELL_MINIJOC.maxEmojis);
  guardarEstat();
  actualitzarUI();
  construirCategories();
  renderBotiga();
  renderDiccionari();
  alert('Pack desbloquejat a la biblioteca!');
}

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  });
}