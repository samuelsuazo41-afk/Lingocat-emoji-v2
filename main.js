// main.js - Lingocat Emoji v15.2 FINAL - FIX INTEGRAT V14.6 + V15.1
// Fixes: "El seu amic van estudiar" -> "va estudiar", "Quan, el seu" -> "Aleshores",
// "tornar classe/lliure/llibre" -> "tornar a classe/a casa", "descansar amb galetes" -> "berenar", "mentre ell escoltar" -> "escoltava"
// Conserva: mapa, missio, gremi, lectura, tips, botiga, energia, personatges

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.createElement('button');
  btn.textContent = '📱 Instal·la l\'App';
  btn.className = 'btn btn-sec';
  btn.style.cssText = 'position:fixed; bottom:80px; right:20px; z-index:999; padding:10px 16px; border-radius:20px;';
  btn.onclick = () => { deferredPrompt.prompt(); btn.remove(); };
  document.body.appendChild(btn);
});

const DEBUG_NO_ENERGIA = true;

let estat = {
  progres: {
    nivellActualMapa: parseInt(localStorage.getItem('cat_nivell')) || 1,
    encerts: parseInt(localStorage.getItem('cat_encerts')) || 0,
    frasesDesDeUltimNivell: parseInt(localStorage.getItem('cat_frasesContador')) || 0,
    energia: (() => {
      const saved = localStorage.getItem('cat_energia');
      return saved === null? 100 : parseInt(saved);
    })(),
    xp: parseInt(localStorage.getItem('cat_xp')) || 0
  },
  monedes: parseInt(localStorage.getItem('cat_monedes')) || 0,
  compres: JSON.parse(localStorage.getItem('cat_compres') || '[]'),
  introVist: JSON.parse(localStorage.getItem('cat_intro') || 'false'),
  personatgeTriat: localStorage.getItem('cat_personatge') || 'joven',
  ultimaRecargaEnergia: parseInt(localStorage.getItem('cat_ultimaEnergia')) || Date.now(),
  desbloquejats: JSON.parse(localStorage.getItem('cat_desbloquejats') || '{}')
};

const PACK_INICIAL = ["😀","😊","😂","👨","👩","🐶","🐱","🏠","🍎","🚗","⚽","📱","💻","🎵","❤️"];

const PERSONATGES_JUGADOR = [
  {id: 'joven', emoji: '👨', nom: 'Joven'},
  {id: 'jova', emoji: '👩', nom: 'Jova'},
  {id: 'noi', emoji: '👦', nom: 'Noi'},
  {id: 'noia', emoji: '👧', nom: 'Noia'},
  {id: 'home', emoji: '👨‍🦰', nom: 'Home'},
  {id: 'dona', emoji: '👩‍🦰', nom: 'Dona'}
];

let nomPersonatge = 'Joven';
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
let BANCO_LECTURA = null;
let lecturaActualVocab = [];
let lecturaActualText = '';
let lecturaActualHTML = '';
let lecturaActualPreguntes = [];
let lecturaContext = {};
let NIVELL_MINIJOC = {minEmojis: 2, maxEmojis: 5, nivelActual: parseInt(localStorage.getItem('cat_nivell_minijoc') || '1')};
let minijoc = {fraseObjectiu: null, emojisTriats: [], emojisDisponibles: []};
let minijocInicialitzat = false;
let totsElsTips = [];
let tipsUsats = [];
let slideActual = 0;
const INTRO_SLIDES = [
  {emoji: "🙀", titol: "Benvingut a Cat Lingo", text: "Aprèn català en 5 minuts al dia. Tria personatge i comencem."},
  {emoji: "⛷️", titol: "Vocabulari visual", text: "Toca emojis i aprèn paraules. Desbloqueja packs a la Botiga."},
  {emoji: "📝", titol: "Gramàtica fàcil", text: "Explicacions curtes amb exemples de les teves lectures."},
  {emoji: "📚", titol: "Lectures adaptades", text: "Textos al teu nivell A1, A2 o B1. Guanya XP i puja."},
  {emoji: "🚀", titol: "A jugar!", text: "Prem Saltar o toca la pantalla per començar"}
];
let gramaticaMode = 'contextual';
let gramaticaTemaSeleccionat = null;

const CONECTORS_LECTURA = ["Després", "Més tard", "Mentrestant", "De sobte", "Al final", "Aleshores", "Però", "A més", "Tot i això", "Per això", "De cop", "Sense avís"];
const CONECTORS_MINIJOC = ["i després", "mentre", "però", "perquè", "quan"];

function quitarSkinTone(emoji) { return emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, ''); }
function vibrar() { if (navigator.vibrate) navigator.vibrate(50); }
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
    estat.progres.energia = Math.min(100, estat.progres.energia + blocs * 30);
    estat.ultimaRecargaEnergia = ara - ((diffMinuts % 5) * 60000);
    guardarEstat(); actualitzarUI();
  }
}
function iniciarRegeneracioAutomatica() {
  setInterval(() => {
    if (estat.progres.energia < 100) {
      estat.progres.energia = Math.min(100, estat.progres.energia + 30);
      guardarEstat(); actualitzarUI();
      if (document.getElementById('tab-missio')?.classList.contains('active')) renderMissio();
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
function getCurrentLevel() {
  if (estat.progres.nivellActualMapa <= 33) return 'a1';
  if (estat.progres.nivellActualMapa <= 66) return 'a2';
  return 'b1';
}
function gastarEnergia(cantidad) {
  if (DEBUG_NO_ENERGIA) return true;
  if (estat.progres.energia < cantidad) return false;
  estat.progres.energia -= cantidad;
  guardarEstat(); actualitzarUI();
  return true;
}
async function carregarDadesMinijoc() {
  try {
    const [frasesRes, detRes] = await Promise.all([
      fetch('./data/minijoc_frases.json'),
      fetch('./data/minijoc_determinants.json')
    ]);
    if (!frasesRes.ok ||!detRes.ok) throw new Error('HTTP minijoc');
    const frasesData = await frasesRes.json();
    FRASES_MINIJOC = Array.isArray(frasesData)? frasesData : (frasesData.frases || []);
    DETERMINANTS = await detRes.json();
    minijocInicialitzat = true;
  } catch (e) { console.error('Error minijoc:', e); }
}
async function carregarDades() {
  try {
    const [catRes, bibRes, botRes, lecturaRes, tipsRes] = await Promise.all([
      fetch('./data/categories_emoji.json'),
      fetch('./data/biblioteca_emoji.json'),
      fetch('./data/botiga_emoji.json'),
      fetch('./data/banco_lectura.json'),
      fetch('./data/tips.json')
    ]);
    CATEGORIES_TOTS = catRes.ok? await catRes.json() : {};
    BIBLIOTECA_PLA = bibRes.ok? await bibRes.json() : [];
    PACKS_BOTIGA = botRes.ok? await botRes.json() : [];
    BANCO_VOCAB = lecturaRes.ok? await lecturaRes.json() : {};
    BANCO_LECTURA = BANCO_VOCAB;
    dadesTips = tipsRes.ok? await tipsRes.json() : {};
  } catch(e) { console.error('Error carregant dades:', e); }
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
function construirTotsEmojis() { TOTS_EMOJIS = BIBLIOTECA_PLA.map(e => ({...e})); }

document.addEventListener('DOMContentLoaded', async () => {
  regenerarEnergia();
  iniciarRegeneracioAutomatica();
  mostrarIntro();
  await carregarDades();
  await carregarDadesMinijoc();
  actualitzarUI();
  canviarTab('mapa', null);
  setTimeout(() => {
    if (document.getElementById('lectura-texto') &&!lecturaActualText) generarLectura();
  }, 300);
});

function canviarTab(tab, e) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+tab)?.classList.add('active');
  if(e && e.target) e.target.closest('.nav-item')?.classList.add('active');
  else document.querySelector(`.nav-item[onclick*="'${tab}'"]`)?.classList.add('active');
  if(tab === 'mapa') renderMapa();
  if(tab === 'missio') renderMissio();
  if(tab === 'gremi') mostrarSubTab('biblioteca');
  if(tab === 'lectura'){
    mostrarSubTab('lectura');
    if(!lecturaActualHTML) generarLectura();
  }
  if(tab === 'tips') carregarTips();
  if(tab === 'botiga') renderBotiga();
}

function mostrarSubTab(sub) {
  document.querySelectorAll('.sub-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  const enTabLectura = document.getElementById('tab-lectura')?.classList.contains('active');
  const idsPosibles = enTabLectura? [
    `lectura-${sub}`,
    `lectura-${sub}-inner`,
    `gremi-${sub}`,
    `lectura-${sub}-content`,
    `lectura-${sub}-texto`,
    sub
  ] : [
    `gremi-${sub}`,
    `lectura-${sub}`,
    `lectura-${sub}-inner`
  ];
  let target = null;
  for(let id of idsPosibles){
    target = document.getElementById(id);
    if(target){ break; }
  }
  if (target){
    target.style.display = 'block';
    const padre = target.closest('.sub-tab-content');
    if(padre) padre.style.display = 'block';
  }
  document.querySelectorAll(`.sub-tab-btn[onclick*="'${sub}'"]`).forEach(b=>b.classList.add('active'));
  if (sub === 'personatges') mostrarGremiPersonatges();
  if (sub === 'biblioteca') renderDiccionari();
  if (sub === 'minijoc') setTimeout(() => novaFraseMinijoc(), 50);
  if (sub === 'gramatica') setTimeout(() => generarGramatica(), 10);
  if (sub === 'vocab') setTimeout(() => renderVocabLectura(), 10);
  if (sub === 'lectura'){
    const c = document.getElementById('lectura-texto');
    if(c && lecturaActualHTML &&!c.innerHTML.trim()){
      c.innerHTML = lecturaActualHTML;
    }
  }
}

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
  const dots = document.getElementById('intro-dots');
  if(dots) dots.innerHTML = INTRO_SLIDES.map((_, i) => `<span style="opacity:${i===slideActual?1:0.3}">●</span>`).join(' ');
  const btn = document.getElementById('intro-btn');
  if(btn){
    btn.textContent = slideActual === INTRO_SLIDES.length - 1? 'Començar' : 'Següent';
    btn.onclick = (e) => { e.stopPropagation(); seguentSlide(); };
  }
}
function seguentSlide() {
  vibrar();
  if (slideActual < INTRO_SLIDES.length - 1) { slideActual++; pintarSlide(); }
  else { saltarIntro(); }
}
function saltarIntro() {
  estat.introVist = true; guardarEstat();
  document.getElementById('intro').style.display = 'none';
}
function renderMapa() {
  const cont = document.getElementById('mapa-contenidor');
  if (!cont) return;
  if (!CATEGORIES_TOTS || Object.keys(CATEGORIES_TOTS).length === 0) {
    let html = '<h3 style="text-align:center; margin-bottom:20px;">Carregant mapa...</h3><div class="nivells-grid">';
    for (let i = 1; i <= 100; i++) html += `<div class="nivell-card" style="background:#222; border-color:#333; color:#555; opacity:0.5">${i}</div>`;
    cont.innerHTML = html + '</div>'; return;
  }
  let html = '<h3 style="text-align:center; margin-bottom:20px;">Mapa de Nivells</h3><div class="nivells-grid">';
  for (let i = 1; i <= 100; i++) {
    const desbloquejat = i <= estat.progres.nivellActualMapa;
    const opacitat = desbloquejat? '1' : '0.4';
    const cursor = desbloquejat? 'pointer' : 'not-allowed';
    const color = desbloquejat? '#22c55e' : '#333';
    const onclick = desbloquejat? `jugarNivell(${i})` : '';
    html += `<div class="nivell-card" style="border-color:${color}; opacity:${opacitat}; cursor:${cursor}" onclick="${onclick}">${i}</div>`;
  }
  html += '</div>'; cont.innerHTML = html;
}
function jugarNivell(n) { if (n > estat.progres.nivellActualMapa) return; canviarTab('gremi', null); mostrarSubTab('minijoc'); }
function renderMissio() {
  const cont = document.getElementById('missio-contenidor'); if (!cont) return;
  const nivell = estat.progres.nivellActualMapa || 1;
  const xpPerNivell = nivell * 100; const xpFaltant = xpPerNivell - (estat.progres.xp||0);
  const nivellB1 = 25; const progresoB1 = Math.min(100, Math.max(0, (nivell / nivellB1) * 100));
  const nivellsPerB1 = Math.max(0, nivellB1 - nivell);
  cont.innerHTML = `
    <h3 style="text-align:center; margin-bottom:20px;">Missions</h3>
    <div class="missio-item" onclick="canviarTab('gremi', null); mostrarSubTab('minijoc');" style="cursor:pointer;">${xpFaltant>0?'🎯':'✅'} Et falten ${xpFaltant} acerts per pujar de nivell</div>
    <div class="missio-item" onclick="canviarTab('botiga', null);" style="cursor:pointer;">📦 Desbloqueja tota la biblioteca</div>
    <div class="missio-item" onclick="canviarTab('lectura', null); setTimeout(()=>mostrarSubTab('gramatica'),100);" style="cursor:pointer;">📚 Aprèn gramàtica</div>
    <div class="missio-item" onclick="recarregarEnergia()" style="cursor:pointer;">⚡ Recarrega energia per 50 🪙</div>
    <div class="missio-item"><div style="display:flex; gap:12px; margin-bottom:8px;"><span style="font-size:32px;">${nivellsPerB1===0?'✅':'🏆'}</span><div style="flex:1;"><div style="font-weight:700;">Arriba al nivell B1</div><div style="font-size:13px; color:#aaa;">Nivell ${nivell} de ${nivellB1} - Falten ${nivellsPerB1}</div></div></div><div style="width:100%; height:8px; background:#333; border-radius:4px;"><div style="width:${progresoB1}%; height:100%; background:#22c55e;"></div></div></div>`;
}
function recarregarEnergia() {
  if (estat.progres.energia >= 100) { mostrarMissatge('Ja tens l\'energia al màxim!'); return; }
  if (estat.monedes < 50) { mostrarMissatge('Necessites 50 monedes'); return; }
  estat.monedes -= 50; estat.progres.energia = 100; estat.ultimaRecargaEnergia = Date.now();
  guardarEstat(); actualitzarUI(); renderMissio(); vibrar(); mostrarMissatge('Energia recarregada!');
}
function mostrarGremiPersonatges() {
  const cont = document.getElementById('gremi-personatges'); if (!cont) return;
  const nomsDisponibles = new Set();
  ['a1','a2','b1'].forEach(niv=>{ const data=BANCO_VOCAB[niv]; if(data?.personatges) data.personatges.forEach(nom=>nomsDisponibles.add(nom)); });
  if (nomsDisponibles.size===0) ['Ana','Pau','Sofia','Marc','Laia','Jordi'].forEach(n=>nomsDisponibles.add(n));
  const personatge = PERSONATGES_JUGADOR.find(p=>p.id===estat.personatgeTriat);
  let html = `<div style="text-align:center; padding:20px;"><div style="font-size:80px;">${personatge.emoji}</div><h3>${personatge.nom}</h3><p style="color:#22c55e;">Nom lectures: <b>${nomPersonatge}</b></p><button class="btn btn-sec" onclick="mostrarSelectorNom()" style="margin:20px;">Canviar nom</button><div style="border-top:1px solid #333; padding-top:20px;"><h4>Canvia avatar</h4><div class="emoji-grid">`;
  PERSONATGES_JUGADOR.forEach(p=>{
    const sel=p.id===estat.personatgeTriat;
    html+=`<div class="emoji-item" style="border:${sel?'2px solid #22c55e':'1px solid #333'}; cursor:pointer;" onclick="triarPersonatge('${p.id}')"><div class="emoji-large">${p.emoji}</div><div class="emoji-name">${p.nom}</div></div>`;
  });
  html+=`</div></div><div id="selector-nom" style="display:none; margin-top:20px; border-top:1px solid #333; padding-top:20px;"><h4>Tria nom lectura:</h4><div class="emoji-grid">`;
  [...nomsDisponibles].sort().forEach(nom=>{
    const sel=nom===nomPersonatge;
    html+=`<div class="emoji-item" style="border:${sel?'2px solid #22c55e':'1px solid #333'}; cursor:pointer;" onclick="setNomPersonatge('${nom}')"><div class="emoji-name">${nom}</div></div>`;
  });
  html+=`</div></div></div>`; cont.innerHTML=html;
}
function mostrarSelectorNom(){ const el=document.getElementById('selector-nom'); if(el) el.style.display=el.style.display==='none'?'block':'none'; }
function setNomPersonatge(nom){ nomPersonatge=nom; mostrarGremiPersonatges(); vibrar(); if(document.getElementById('tab-lectura')?.classList.contains('active')) generarLectura(); }
function triarPersonatge(id){ estat.personatgeTriat=id; guardarEstat(); actualitzarUI(); mostrarGremiPersonatges(); vibrar(); }
function renderDiccionari() {
  const cont=document.getElementById('gremi-biblioteca'); if(!cont) return;
  let html=`<h3 style="text-align:center;">Biblioteca</h3>`;
  const BASE_INICIAL=PACK_INICIAL.map(e=>quitarSkinTone(e));
  for(const [cat, emojis] of Object.entries(BIBLIOTECA_POR_CAT)){
    html+=`<h4 style="margin:20px 0 8px; color:#4CAF50; text-transform:capitalize;">${cat}</h4><div class="emoji-grid">`;
    emojis.forEach(e=>{
      const net=quitarSkinTone(e.emoji);
      const esBase=BASE_INICIAL.includes(net);
      const desbloquejatPerPack=estat.compres.some(idPack=>{
        const packId=idPack.includes('_p')?idPack.split('_p')[0]:idPack;
        const pack=PACKS_BOTIGA.find(p=>p.id===packId);
        return pack && pack.emojis.some(pe=>quitarSkinTone(pe.emoji)===net);
      });
      const desbloquejat=esBase||desbloquejatPerPack;
      html+=`<div class="emoji-item" style="opacity:${desbloquejat?'1':'0.12'}; filter:${desbloquejat?'':'grayscale(1)'};"><div class="emoji-large">${e.emoji}</div><div class="emoji-name">${e.nom_cat}</div></div>`;
    });
    html+=`</div>`;
  }
  cont.innerHTML=html;
}
function obtenirArticle(emoji){
  const emojiData=BIBLIOTECA_PLA.find(e=>quitarSkinTone(e.emoji)===quitarSkinTone(emoji));
  if(!emojiData||!emojiData.nom_cat) return emoji;
  const nom=emojiData.nom_cat.toLowerCase();
  let det=DETERMINANTS[nom]||(emojiData.genere==='f'?'La':'El');
  if(det==="L'" &&!'aeiouàèéíòóúh'.includes(nom[0])) det="El";
  return `${det} ${emojiData.nom_cat}`;
}
function generarFraseDinamica(plantilla, emojisJugador){
  let text=plantilla.text;
  let solucio=[];
  let esPrimer=true;
  if(text.split(' ').length > 6 && Math.random() > 0.5){
    const con = CONECTORS_MINIJOC[Math.floor(Math.random()*CONECTORS_MINIJOC.length)];
    text = text.replace(/\{/, `${con} {`);
  }
  for(const cat of plantilla.categories){
    const disp=CATEGORIES_TOTS[cat]?.filter(eBase=>emojisJugador.some(eJug=>quitarSkinTone(eJug)===quitarSkinTone(eBase)))||[];
    if(!disp.length) return generarFraseDinamica(FRASES_MINIJOC[Math.floor(Math.random()*FRASES_MINIJOC.length)], emojisJugador);
    const emojiElegit=disp[Math.floor(Math.random()*disp.length)];
    let reemplazo=obtenirArticle(emojiElegit);
    if(esPrimer){
      const emojiData=BIBLIOTECA_PLA.find(e=>quitarSkinTone(e.emoji)===quitarSkinTone(emojiElegit));
      const nom=emojiData?.nom_cat?.toLowerCase()||'';
      const detCorrecte=DETERMINANTS[nom]||(emojiData?.genere==='f'?'La':'El');
      const detIncorrecte=detCorrecte==='La'?'El':'La';
      const detAmbBarra=detCorrecte==="L'" &&!'aeiouàèéíòóúh'.includes(nom[0])?`El/${detIncorrecte}`:`${detCorrecte}/${detIncorrecte}`;
      reemplazo=`${detAmbBarra} ${emojiData.nom_cat}`; esPrimer=false;
    }
    text=text.replace(new RegExp(`\\s*(La |El |L'|La/|El/|l'|el |l'/la )?\\{${cat}\\}`, 'gi'), ` ${reemplazo}`);
    solucio.push(emojiElegit);
  }
  return {text,solucio};
}
function novaFraseMinijoc(){
  if(!FRASES_MINIJOC.length||!minijocInicialitzat) return;
  const emojisJugador=BIBLIOTECA_PLA.filter(e=>{
    const net=quitarSkinTone(e.emoji); const esBase=PACK_INICIAL.map(x=>quitarSkinTone(x)).includes(net);
    const perPack=estat.compres.some(idPack=>{
      const pid=idPack.includes('_p')?idPack.split('_p')[0]:idPack;
      const pack=PACKS_BOTIGA.find(p=>p.id===pid);
      return pack && pack.emojis.some(pe=>quitarSkinTone(pe.emoji)===net);
    });
    return esBase||perPack;
  }).map(e=>e.emoji);
  if(emojisJugador.length<2){ document.getElementById('minijoc-frase').textContent="Puja de nivell!"; return; }
  const plantilla=FRASES_MINIJOC[Math.floor(Math.random()*FRASES_MINIJOC.length)];
  const {text,solucio}=generarFraseDinamica(plantilla, emojisJugador);
  minijoc.fraseObjectiu={text,solucio}; minijoc.emojisTriats=[];
  document.getElementById('minijoc-frase').textContent=text;
  document.getElementById('minijoc-triats').textContent='';
  document.getElementById('minijoc-feedback').innerHTML='';
  document.getElementById('minijoc-nivell').textContent=`Nivell ${estat.progres.nivellActualMapa} - ${solucio.length} emojis`;
  generarOpcionsMinijoc(solucio);
}
function generarOpcionsMinijoc(solucio){
  const grid=document.getElementById('minijoc-emojis'); if(!grid) return;
  const numOpcions=solucio.length<=3?16:20; const numFalsos=numOpcions-solucio.length;
  const emojisJugador=BIBLIOTECA_PLA.filter(e=>{
    const net=quitarSkinTone(e.emoji); const esBase=PACK_INICIAL.map(x=>quitarSkinTone(x)).includes(net);
    const perPack=estat.compres.some(idPack=>{
      const pid=idPack.includes('_p')?idPack.split('_p')[0]:idPack;
      const pack=PACKS_BOTIGA.find(p=>p.id===pid);
      return pack && pack.emojis.some(pe=>quitarSkinTone(pe.emoji)===net);
    });
    return esBase||perPack;
  }).map(e=>e.emoji);
  const falsos=emojisJugador.filter(e=>!solucio.some(eSol=>quitarSkinTone(e)===quitarSkinTone(eSol))).sort(()=>0.5-Math.random()).slice(0,numFalsos);
  const opcions=[...solucio,...falsos].sort(()=>0.5-Math.random());
  minijoc.emojisDisponibles=opcions; grid.innerHTML='';
  opcions.forEach((emoji,i)=>{
    const emojiData=BIBLIOTECA_PLA.find(e=>quitarSkinTone(e.emoji)===quitarSkinTone(emoji));
    const div=document.createElement('div'); div.className='emoji-item';
    div.innerHTML=`<div class="emoji-large">${emoji}</div><div class="emoji-name">${emojiData?.nom_cat||''}</div>`;
    div.onclick=()=>triarEmojiMinijoc(i); grid.appendChild(div);
  });
}
function triarEmojiMinijoc(index){
  vibrar(); const emoji=minijoc.emojisDisponibles[index]; const max=minijoc.fraseObjectiu.solucio.length;
  if(minijoc.emojisTriats.length<max){
    minijoc.emojisTriats.push(emoji);
    document.getElementById('minijoc-triats').textContent=minijoc.emojisTriats.join(' ');
    if(minijoc.emojisTriats.length===max) setTimeout(comprovarMinijoc,300);
  }
}
function comprovarMinijoc(){
  const feedback=document.getElementById('minijoc-feedback'); if(!feedback||!minijoc.fraseObjectiu) return;
  const solCorrecta=minijoc.fraseObjectiu.solucio.map(quitarSkinTone).join('');
  const triats=minijoc.emojisTriats.map(quitarSkinTone).join('');
  if(solCorrecta===triats){
    feedback.innerHTML=`<p style="color:#4CAF50; font-weight:bold;">Correcte! +5 🪙</p>`;
    estat.monedes+=5; estat.progres.encerts++; estat.progres.frasesDesDeUltimNivell++;
    if(estat.progres.frasesDesDeUltimNivell>=25 && estat.progres.nivellActualMapa<100){
      estat.progres.nivellActualMapa++; estat.progres.frasesDesDeUltimNivell=0; mostrarMissatge(`🔓 Nivell ${estat.progres.nivellActualMapa} desbloquejat!`);
    }
    NIVELL_MINIJOC.nivelActual=Math.min(NIVELL_MINIJOC.nivelActual+1, 5);
    guardarEstat(); actualitzarUI(); setTimeout(()=>novaFraseMinijoc(),1500);
  } else {
    feedback.innerHTML=`<p style="color:#f44336;">No és així. Era: ${minijoc.fraseObjectiu.solucio.join(' ')}</p>`;
    setTimeout(()=>novaFraseMinijoc(),2000);
  }
}
async function cargarBancoLectura(){
  if(BANCO_LECTURA && BANCO_LECTURA.regles_globals) return BANCO_LECTURA;
  const res=await fetch('./data/banco_lectura.json'); BANCO_LECTURA=await res.json(); return BANCO_LECTURA;
}

// === MOTOR LECTURA V15.2 - FIX FOTOS 22:44 / 21:54 ===
function esSingular(grup) {
  if(!grup) return false;
  const t = grup.trim().toLowerCase();
  return t.startsWith('el seu ') || t.startsWith('la seva ') || t.startsWith('el ') || t.startsWith('la ') || t.startsWith('un ') || t.startsWith('una ');
}
function esGrupPlural(grup){
  if(!grup) return false;
  return /companys|amics|germans/i.test(grup) || grup.toLowerCase().includes(' i ') || grup.toLowerCase().includes(',');
}

function conjugarImperfet(accio) {
  if(!accio) return accio;
  const mapa = {
    "escoltar": "escoltava", "jugar": "jugava", "mirar": "mirava",
    "preguntar": "preguntava", "esperar": "esperava", "caminar": "caminava",
    "parlar": "parlava", "fer fotos": "feia fotos", "tocar piano": "tocava el piano",
    "regar plantes": "regava les plantes", "mirar fotos": "mirava fotos",
    "llegir": "llegia", "dormir": "dormia", "fer el llit": "feia el llit",
    "rentar plats": "rentava plats", "tornar classe": "tornava a classe",
    "tornar a classe": "tornava a classe", "tornar": "tornava", "dinar": "dinava",
    "berenar": "berenava", "descansar": "descansava", "escriure": "escrivia",
    "estudiar": "estudiava", "treballar": "treballava", "córrer": "corria",
    "passejar": "passejava", "mirar quadres": "mirava quadres"
  };
  const key = accio.toLowerCase().trim();
  if(mapa[key]) return mapa[key];
  if(key.includes("tornar classe")) return "tornava a classe";
  if(key.includes("tornar lliure")) return "tornava a casa";
  if(key.includes("tornar llibre")) return "tornava a casa";
  if(key.includes("tornar")) return "tornava a casa";
  if(key.includes("descansar")) return "descansava";
  return accio;
}

async function generarLectura(){
  if(!gastarEnergia(30)){ alert('No tens energia suficient'); return; }
  const banco=await cargarBancoLectura();
  const nivell=getCurrentLevel();
  const dataNivell=banco[nivell];
  const regles=banco.regles_globals;
  if(!dataNivell||!dataNivell.plantillas){ document.getElementById('lectura-texto').innerHTML='<p>No hi ha lectures</p>'; return; }

  lecturaActualVocab=[]; lecturaContext={};
  const plantilla=dataNivell.plantillas[Math.floor(Math.random()*dataNivell.plantillas.length)];
  const temes=['la_familia','la_casa','l_escola','la_ciutat','la_natura','el_temps_lliure'];
  const tema=temes[Math.floor(Math.random()*temes.length)];
  lecturaContext.tema_text=tema.replace(/_/g,' ');
  const vocab=dataNivell[tema];
  if(!vocab){ document.getElementById('lectura-texto').innerHTML='<p>Tema no trobat</p>'; return; }
  const personatge=nomPersonatge||'Joven';

  let genere='m';
  const fems=['Ana','Sofia','Laia','Marta','Clara','Berta','Emma','Núria','Aina','Claudia','Laura','Maria','Jova','Noia','Dona','Rita'];
  if(fems.includes(personatge)) genere='f';

  const pronom = genere==='f'? 'ella' : 'ell';
  const Pronom = genere==='f'? 'Ella' : 'Ell';

  // Conectors únics sense repetir
  const conectoresDisponibles = regles?.connectors_ortografia || CONECTORS_LECTURA;
  let ultimsConnectors=[];
  const getConectorUnic = () => {
    let c, tries=0;
    do {
      c = conectoresDisponibles[Math.floor(Math.random()*conectoresDisponibles.length)];
      if(c==="Quan") c="Aleshores"; // evita "Quan," orfe
      tries++;
    } while(ultimsConnectors.includes(c) && tries<20);
    ultimsConnectors.push(c);
    if(ultimsConnectors.length>3) ultimsConnectors.shift();
    return c;
  };

  lecturaContext['conector1'] = getConectorUnic();
  lecturaContext['conector2'] = getConectorUnic();
  lecturaContext['conector3'] = getConectorUnic();
  lecturaContext['pronom'] = pronom;
  lecturaContext['Pronom'] = Pronom;

  function pick(key,arr){
    if(!arr||!arr.length) return key;
    if(lecturaContext[key]) return lecturaContext[key];
    const val=arr[Math.floor(Math.random()*arr.length)];
    if(!lecturaActualVocab.includes(val)) lecturaActualVocab.push(val);
    lecturaContext[key]=val;
    return val;
  }

  function reemplaçar(text,congelar=false){
    return text.replace(/\$\{(\w+)\}/g,(match,key)=>{
      if(key==='personatge') return personatge;
      if(key==='tema') return lecturaContext.tema_text||key;
      if(key==='pronom') return pronom;
      if(key==='Pronom') return Pronom;
      if(key.startsWith('conector')) {
        if(!lecturaContext[key]) lecturaContext[key]=getConectorUnic();
        return lecturaContext[key];
      }
      if(congelar && lecturaContext[key]) return lecturaContext[key];
      if(vocab[key]) return pick(key,vocab[key]);
      return lecturaContext[key] || key;
    });
  }

  function concordarGenere(text){
    let resultat=text;
    if(!regles?.generes_paraules) return text;
    Object.keys(regles.generes_paraules).forEach(paraula=>{
      const formes=regles.generes_paraules[paraula];
      if(!formes) return;
      const regex=new RegExp(`\\b${paraula}\\b`,'gi');
      resultat=resultat.replace(regex,formes[genere] || paraula);
    });
    return resultat;
  }

  function aplicarFixesGramaticals(text){
    let t = text;
    // FIX 1: tornar + preposició - FOTOS 21:54
    t = t.replace(/\bva tornar classe\b/gi, "va tornar a classe");
    t = t.replace(/\bva tornar lliure\b/gi, "va tornar a casa");
    t = t.replace(/\bva tornar llibre\b/gi, "va tornar a casa");
    t = t.replace(/\bva tornar escola\b/gi, "va tornar a l'escola");
    t = t.replace(/\btornar classe\b/gi, "tornar a classe");
    t = t.replace(/\btornar lliure\b/gi, "tornar a casa");
    t = t.replace(/\btornar llibre\b/gi, "tornar a casa");
    t = t.replace(/\bI escola ha estat\b/g, "L'escola ha estat");
    t = t.replace(/\bI escola és\b/g, "L'escola és");
    t = t.replace(/\bl escola\b/gi, "l'escola");

    // FIX 2: Singular vs Plural - "El seu amic van" -> "va"
    if(lecturaContext.companys && esSingular(lecturaContext.companys) &&!esGrupPlural(lecturaContext.companys)){
      t = t.replace(/\bvan estudiar\b/gi, "va estudiar");
      t = t.replace(/\bvan jugar\b/gi, "va jugar");
      t = t.replace(/\bvan parlar\b/gi, "va parlar");
      t = t.replace(/\bvan riure\b/gi, "va riure");
      t = t.replace(/\bvan mirar\b/gi, "va mirar");
      t = t.replace(/\bvan cantar\b/gi, "va cantar");
      t = t.replace(/\bvan caminar\b/gi, "va caminar");
      t = t.replace(/\bvan pintar\b/gi, "va pintar");
    }

    // FIX 3: Conector orfe "Quan," -> "Aleshores" - FOTO 22:44
    t = t.replace(/^Quan, el seu\b/gm, "Aleshores, el seu");
    t = t.replace(/\.\s*Quan, el seu\b/g, ". Aleshores, el seu");
    t = t.replace(/\bQuan va descansar amb\b/gi, "Després va berenar amb");
    t = t.replace(/\bQuan, el seu amic va mirar\b/gi, "Aleshores, el seu amic va mirar");

    // FIX 4: descansar amb menjar -> berenar
    t = t.replace(/\bva descansar amb galetes\b/gi, "va berenar amb galetes");
    t = t.replace(/\bva descansar amb pa\b/gi, "va berenar amb pa");
    t = t.replace(/\bva descansar amb fruita\b/gi, "va berenar amb fruita");
    t = t.replace(/\bva descansar amb suc\b/gi, "va berenar amb suc");
    t = t.replace(/\bAmb què va descansar\b/g, "Amb què va berenar");

    // FIX 5: mentre ell infinitiu -> imperfet
    t = t.replace(/\bmentre ell escoltar\b/gi, "mentre ell escoltava");
    t = t.replace(/\bmentre ell jugar\b/gi, "mentre ell jugava");
    t = t.replace(/\bmentre ell mirar\b/gi, "mentre ell mirava");
    t = t.replace(/\bmentre ell preguntar\b/gi, "mentre ell preguntava");
    t = t.replace(/\bmentre ella escoltar\b/gi, "mentre ella escoltava");

    // FIX 6: Apostrofacio general del banc
    if(regles?.apostrofacio){
      Object.entries(regles.apostrofacio).forEach(([k,v])=>{
        const re = new RegExp(`\\b${k}\\b`, 'gi');
        t = t.replace(re, v);
      });
    }
    return t.replace(/\ba l ([aeiouàèéíòóúh])/gi,"a l'$1")
     .replace(/\bde l ([aeiouàèéíòóúh])/gi,"de l'$1")
     .replace(/tranquil·la·la/g,'tranquil·la')
     .replace(/\s+/g,' ').trim();
  }

  const titol_raw=reemplaçar(plantilla.titol,false);

  let frasesProcessades = plantilla.seq.map((l,i)=>{
    let frase = reemplaçar(l,false);
    frase = concordarGenere(frase);

    // Fix imperfet abans d'apostrofar - per "mentre ell escoltava"
    if(frase.toLowerCase().includes("mentre")){
      const accioRaw = lecturaContext.accio_prota;
      if(accioRaw &&!frase.toLowerCase().includes("escoltava") &&!frase.toLowerCase().includes("jugava") &&!frase.toLowerCase().includes("mirava")){
        const conj = conjugarImperfet(accioRaw);
        // només reemplaça si encara està en infinitiu
        if(frase.includes(accioRaw)) frase = frase.replace(accioRaw, conj);
      }
    }

    frase = aplicarFixesGramaticals(frase);

    if(i>0 && frase.includes(personatge) &&!l.includes('${pronom}')){
       if(Math.random()>0.3){
         frase = frase.replace(new RegExp(`\\b${personatge}\\b`, 'g'), pronom);
       }
    }
    if(i>0 &&!l.toLowerCase().includes('conector') &&!l.match(/^(Després|Més tard|Mentrestant|Al final|De sobte|Aleshores|Però|A més|Tot i això)/i)){
      if(Math.random()>0.5){
        const conector = getConectorUnic();
        if(!frase.toLowerCase().startsWith(conector.toLowerCase())){
          frase = `${conector}, ${frase.charAt(0).toLowerCase() + frase.slice(1)}`;
        }
      }
    }
    return frase;
  });

  let textBase=frasesProcessades.join(' ');
  textBase=aplicarFixesGramaticals(textBase);

  const finalsAlternatius=['és el meu lloc preferit!','m\'encanta passar temps aquí!','vull tornar aviat!','ha estat un dia genial!'];
  // només canvia final si és el genèric antic
  if(textBase.includes('és el meu lloc preferit!') && Math.random()>0.5){
    textBase=textBase.replace(/és el meu lloc preferit!.*$/i, finalsAlternatius[Math.floor(Math.random()*finalsAlternatius.length)]);
  }

  lecturaActualText=textBase;

  lecturaActualPreguntes=plantilla.preguntes.map(p=>({
    q:concordarGenere(aplicarFixesGramaticals(reemplaçar(p.q,true))),
    opcions:p.opcions.map(o=>concordarGenere(aplicarFixesGramaticals(reemplaçar(o,true)))),
    correcta:p.correcta
  }));

  const titol=aplicarFixesGramaticals(concordarGenere(titol_raw)).replace(/\s+/g,' ').trim();
  const htmlFinal=`<div class="lectura-card"><h3>${titol}</h3><p class="lectura-text">${lecturaActualText}</p><div class="lectura-preguntes">${lecturaActualPreguntes.map((p,i)=>`<div style="margin-bottom:15px;"><p><strong>${i+1}. ${p.q}</strong></p>${p.opcions.map((op,j)=>`<button class="btn btn-sec" style="display:block; width:100%; margin:5px 0; text-align:left;" onclick="comprovarPregunta(${i},${j})">${op}</button>`).join('')}<div id="feedback-${i}" class="feedback"></div></div>`).join('')}</div><button class="btn btn-primari" onclick="generarLectura()" style="margin-top:15px;">Nova lectura (-30 energia)</button></div>`;

  lecturaActualHTML = htmlFinal;
  const contTexto = document.getElementById('lectura-texto');
  if(contTexto) contTexto.innerHTML = htmlFinal;
  renderVocabLectura();
  if(gramaticaMode==='contextual') await generarGramatica();
}

function renderVocabLectura(){
  const cont = document.getElementById('lectura-vocab-inner') || document.getElementById('lectura-vocab') || document.getElementById('gremi-vocab') || document.getElementById('lectura-vocab-content');
  if(!cont) return;
  if(lecturaActualVocab.length===0){
    cont.innerHTML='<div style="padding:20px;text-align:center;opacity:0.6"><p>Genera una lectura per veure el vocabulari</p><button class="btn btn-primari" onclick="mostrarSubTab(\'lectura\');generarLectura()">Generar</button></div>';
    return;
  }
  cont.innerHTML=`<div class="vocab-grid">${lecturaActualVocab.map(w=>`<div class="vocab-card"><div class="vocab-word">${w}</div><div class="vocab-pron">/${w}/</div></div>`).join('')}</div>`;
}
function comprovarPregunta(idx,resp){
  const p=lecturaActualPreguntes[idx]; const fb=document.getElementById(`feedback-${idx}`);
  if(resp===p.correcta){ fb.innerHTML='<span style="color:#4CAF50">Correcte! +0.5 XP</span>'; estat.progres.encerts+=0.5; guardarEstat(); actualitzarUI(); }
  else { fb.innerHTML=`<span style="color:#f44336">No. Era: ${p.opcions[p.correcta]}</span>`; }
}
function slugGramatica(str){ return str.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_'); }
async function generarGramatica(){
  const container = document.getElementById('lectura-gramatica-inner') || document.getElementById('lectura-gramatica') || document.getElementById('gremi-gramatica') || document.getElementById('lectura-gramatica-content');
  if(!container) return;
  const banco=await cargarBancoLectura();
  if(!banco||!banco.gramatica||!banco.gramatica.guia){ container.innerHTML=`<div style="padding:20px;opacity:0.6"><p>No trobo gramatica.guia - revisa data/banco_lectura.json</p></div>`; return; }
  const GRAMATICA_BANCO=banco.gramatica.guia; const keys=Object.keys(GRAMATICA_BANCO); const mapa={}; keys.forEach(k=>mapa[slugGramatica(k)]=k);
  let html=`<div style="display:flex; gap:8px; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:12px;"><button class="btn ${gramaticaMode==='contextual'?'btn-primari':'btn-sec'}" onclick="setGramaticaMode('contextual')">Contextual</button><button class="btn ${gramaticaMode==='guia'?'btn-primari':'btn-sec'}" onclick="setGramaticaMode('guia')">Guia</button></div>`;
  if(gramaticaMode==='contextual'){
    if(!lecturaActualText||lecturaActualVocab.length===0){ container.innerHTML=html+`<div style="padding:20px;opacity:0.6"><p>Genera primer una lectura</p><button class="btn btn-primari" onclick="mostrarSubTab('lectura');generarLectura()">Generar lectura</button></div>`; return; }
    const grammarPoint=detectarPuntGramatica(lecturaActualText,getCurrentLevel(),GRAMATICA_BANCO);
    html+=`<div class="grammar-card"><div class="grammar-title">${grammarPoint.titol}</div><div class="grammar-explanation">${grammarPoint.explicacio}</div><div class="grammar-examples"><div class="grammar-examples-title">Exemples del teu text:</div>${grammarPoint.exemples?.map(ex=>`<div class="grammar-example">• ${ex}</div>`).join('')||''}</div><div class="grammar-exercise"><div class="grammar-exercise-title">Practica:</div>${grammarPoint.exercici?.map((f,i)=>`<div class="grammar-exercise-item">${i+1}. ${f}</div>`).join('')||''}</div>${grammarPoint.tip?`<div class="grammar-tip">💡 ${grammarPoint.tip}</div>`:''}</div>`;
  } else {
    if(!gramaticaTemaSeleccionat){
      html+=`<div class="emoji-grid">`;
      keys.forEach(keyReal=>{ const tema=GRAMATICA_BANCO[keyReal]; html+=`<div class="emoji-item" onclick="seleccionarTemaGramatica('${slugGramatica(keyReal)}')" style="cursor:pointer;"><div class="emoji-large">${tema.emoji||'📚'}</div><div class="emoji-name">${tema.titol}</div></div>`; });
      html+=`</div>`;
    } else {
      const keyReal=mapa[gramaticaTemaSeleccionat]||gramaticaTemaSeleccionat; const tema=GRAMATICA_BANCO[keyReal];
      if(!tema){ gramaticaTemaSeleccionat=null; return generarGramatica(); }
      html+=`<button class="btn btn-sec" onclick="tornarAGuia()" style="margin-bottom:15px;">← Tornar</button><div class="grammar-card"><div class="grammar-title">${tema.titol}</div><div class="grammar-explanation">${tema.explicacio}</div><div style="background:#1a1a1a; padding:12px; border-radius:8px; margin:12px 0; font-family:monospace; color:#4CAF50;">Estructura: ${tema.estructura}</div><div class="grammar-examples"><div class="grammar-examples-title">Exemples:</div>${tema.exemples?.map(ex=>`<div class="grammar-example">• ${ex}</div>`).join('')||''}</div><div class="grammar-exercise"><div class="grammar-exercise-title">Practica:</div>${tema.exercici?.map((f,i)=>`<div class="grammar-exercise-item">${i+1}. ${f}</div>`).join('')||''}</div>${tema.tip?`<div class="grammar-tip">💡 ${tema.tip}</div>`:''}</div>`;
    }
  }
  container.innerHTML=html;
}
function detectarPuntGramatica(texto,nivell,GRAMATICA_BANCO){
  if((texto.includes('va ')||texto.includes('vam ')||texto.includes('van ')) && GRAMATICA_BANCO.preterit_perifrastic){ const d={...GRAMATICA_BANCO.preterit_perifrastic}; d.exemples=extraerFrasesCon(texto,'va '); return d; }
  if((texto.includes('estava')||texto.includes('està')||texto.includes('estic')) && GRAMATICA_BANCO.estar_adjectiu){ const d={...GRAMATICA_BANCO.estar_adjectiu}; d.exemples=extraerFrasesCon(texto,'estav'); return d; }
  return GRAMATICA_BANCO.articles || GRAMATICA_BANCO[Object.keys(GRAMATICA_BANCO)[0]] || {titol:'Gramàtica', explicacio:'Genera lectura', estructura:'', exemples:[], exercici:[], tip:''};
}
function setGramaticaMode(mode){ gramaticaMode=mode; gramaticaTemaSeleccionat=null; generarGramatica(); }
function seleccionarTemaGramatica(slug){ gramaticaTemaSeleccionat=slug; generarGramatica(); }
function tornarAGuia(){ gramaticaTemaSeleccionat=null; generarGramatica(); }
function extraerFrasesCon(texto,palabra){ return texto.split('.').filter(f=>f.toLowerCase().includes(palabra.toLowerCase())).slice(0,3).map(f=>f.trim()+'.'); }
window.setGramaticaMode=setGramaticaMode; window.seleccionarTemaGramatica=seleccionarTemaGramatica; window.tornarAGuia=tornarAGuia; window.generarGramatica=generarGramatica;

function carregarTips(){
  const nivell=getCurrentLevel(); if(totsElsTips.length===0) totsElsTips=dadesTips[nivell]||[]; mostrarTipRandom();
}
function mostrarTipRandom(){
  if(!totsElsTips||totsElsTips.length===0){ const el=document.getElementById('tip-text'); if(el) el.textContent='No hi ha tips'; return; }
  if(tipsUsats.length===totsElsTips.length) tipsUsats=[];
  let idx; do{ idx=Math.floor(Math.random()*totsElsTips.length); } while(tipsUsats.includes(idx));
  tipsUsats.push(idx); const tip=totsElsTips[idx];
  document.getElementById('tip-text').textContent=tip.truc; const ex=document.getElementById('tip-exemple'); if(ex) ex.textContent=tip.exemple||'';
}
function renderBotiga(){
  const cont=document.getElementById('botiga-contenidor'); if(!cont) return;
  if(!PACKS_BOTIGA||PACKS_BOTIGA.length===0){ cont.innerHTML=`<div style="text-align:center; padding:40px; opacity:0.6;">No hi ha packs</div>`; return; }
  cont.innerHTML='';
  PACKS_BOTIGA.forEach(pack=>{
    let subPacks=[];
    if(pack.emojis.length>6){
      for(let i=0;i<pack.emojis.length;i+=6){
        const chunk=pack.emojis.slice(i,i+6); const numPart=Math.floor(i/6)+1; const totalParts=Math.ceil(pack.emojis.length/6); const preuPart=Math.ceil(pack.preu/totalParts);
        subPacks.push({id:`${pack.id}_p${numPart}`, nom:`${pack.nom} ${numPart}/${totalParts}`, descripcio:pack.descripcio, preu:preuPart, emojis:chunk});
      }
    } else {
      subPacks=[{id:pack.id, nom:pack.nom, descripcio:pack.descripcio, preu:pack.preu, emojis:pack.emojis}];
    }
    subPacks.forEach(sp=>{
      const comprat=estat.compres.includes(sp.id);
      const card=document.createElement('div'); card.className='capitol-card';
      card.innerHTML=`<div class="capitol-icona">🎁</div><h3>${sp.nom}</h3><p style="color:#aaa; margin:8px 0;">${sp.descripcio}</p><p style="font-size:24px;">${sp.emojis.map(e=>e.emoji).join(' ')}</p><button class="btn ${comprat?'btn-sec':''}" onclick="comprarPack('${sp.id}',${sp.preu})" ${comprat?'disabled':''}>${comprat?'Desbloquejat':'🪙 '+sp.preu}</button>`;
      cont.appendChild(card);
    });
  });
}
function comprarPack(id,preu){
  if(estat.monedes<preu){ mostrarMissatge('No tens prou monedes'); return; }
  estat.monedes-=preu; estat.compres.push(id);
  NIVELL_MINIJOC.nivelActual=Math.min(NIVELL_MINIJOC.nivelActual+1, 5);
  guardarEstat(); actualitzarUI(); construirCategories(); renderBotiga(); renderDiccionari(); mostrarMissatge('Pack desbloquejat!');
}
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('./sw.js').catch(err=>console.log('SW error:',err)); });
}