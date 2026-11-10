// main.js v21 LIMPIO - 50 PLANTILLAS KATLINGO - A1 15 + A2 25 + B1/B2 10 - Motor lectura v21 LLICO GRAMATICA COMPLETA ORTOGRAFIA + PRONUNCIA + TAULA + QUIZ - RESTO IGUAL v20, NO TOCAR
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e;
  const btn = document.createElement('button'); btn.textContent = '📱 Instal·la l\'App'; btn.className = 'btn btn-sec';
  btn.style.cssText = 'position:fixed; bottom:80px; right:20px; z-index:999; padding:10px 16px; border-radius:20px;';
  btn.onclick = () => { deferredPrompt.prompt(); btn.remove(); }; document.body.appendChild(btn);
});
const DEBUG_NO_ENERGIA = true;
let estat = {
  progres: {
    nivellActualMapa: parseInt(localStorage.getItem('cat_nivell')) || 1,
    encerts: parseInt(localStorage.getItem('cat_encerts')) || 0,
    frasesDesDeUltimNivell: parseInt(localStorage.getItem('cat_frasesContador')) || 0,
    energia: (() => { const s=localStorage.getItem('cat_energia'); return s===null?100:parseInt(s); })(),
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
const PERSONATGES_JUGADOR = [{id:'joven',emoji:'👨',nom:'Joven'},{id:'jova',emoji:'👩',nom:'Jova'},{id:'noi',emoji:'👦',nom:'Noi'},{id:'noia',emoji:'👧',nom:'Noia'},{id:'home',emoji:'👨‍🦰',nom:'Home'},{id:'dona',emoji:'👩‍🦰',nom:'Dona'}];
let nomPersonatge = localStorage.getItem('cat_nom_personatge') || null;
let CATEGORIES_TOTS={}; let BIBLIOTECA_PLA=[]; let BIBLIOTECA_POR_CAT={}; let PACKS_BOTIGA=[]; let FRASES_MINIJOC=[]; let TOTS_EMOJIS=[]; let CATEGORIES_DESBLOQUEJADES={}; let BANCO_VOCAB={}; let dadesTips={}; let BANCO_LECTURA=null;
let lecturaActualVocab=[]; let lecturaActualText=''; let lecturaActualHTML=''; let lecturaActualPreguntes=[]; let lecturaContext={};
let NIVELL_MINIJOC={minEmojis:2,maxEmojis:5,nivelActual:parseInt(localStorage.getItem('cat_nivell_minijoc')||'1')};
let minijoc={fraseObjectiu:null,emojisTriats:[],emojisDisponibles:[]}; let minijocInicialitzat=false; let totsElsTips=[]; let tipsUsats=[]; let slideActual=0;
const INTRO_SLIDES=[{emoji:"🙀",titol:"Benvingut a Cat Lingo",text:"Aprèn català en 5 minuts al dia."},{emoji:"⛷️",titol:"Vocabulari visual",text:"Toca emojis i aprèn paraules."},{emoji:"📝",titol:"Gramàtica fàcil",text:"Explicacions curtes amb exemples."},{emoji:"📚",titol:"Lectures adaptades",text:"Textos al teu nivell A1, A2 o B1."},{emoji:"🚀",titol:"A jugar!",text:"Prem Saltar per començar"}];
let gramaticaMode='contextual'; let gramaticaTemaSeleccionat=null;
let MAPA_DET = {};
const CATS_SENSE_ARTICLE = new Set(['numero','direccio','temps','forma_color','so','simbol','festa']);
function quitarSkinTone(e){return e? e.replace(/[\u{1F3FB}-\u{1F3FF}]/gu,'') : '';}
function vibrar(){if(navigator.vibrate)navigator.vibrate(50);}
function mostrarMissatge(t){const d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#22c55e;color:#000;padding:12px 20px;border-radius:8px;font-weight:700;z-index:10000;';document.body.appendChild(d);setTimeout(()=>d.remove(),2000);}
function actualitzarUI(){const m=document.getElementById('monedes'),n=document.getElementById('nivell'),e=document.getElementById('energia'),b=document.getElementById('barra-progres'),h=document.getElementById('header-personatge');if(m)m.textContent=estat.monedes;if(n)n.textContent=estat.progres.nivellActualMapa;if(e)e.textContent=estat.progres.energia;if(b)b.style.width=((estat.progres.frasesDesDeUltimNivell/25)*100)+'%';const p=PERSONATGES_JUGADOR.find(p=>p.id===estat.personatgeTriat);if(h&&p)h.textContent=p.emoji;}
function regenerarEnergia(){const a=Date.now(),d=Math.floor((a-estat.ultimaRecargaEnergia)/60000);if(d>=5&&estat.progres.energia<100){const bl=Math.floor(d/5);estat.progres.energia=Math.min(100,estat.progres.energia+bl*30);estat.ultimaRecargaEnergia=a-((d%5)*60000);guardarEstat();actualitzarUI();}}
function iniciarRegeneracioAutomatica(){setInterval(()=>{if(estat.progres.energia<100){estat.progres.energia=Math.min(100,estat.progres.energia+30);guardarEstat();actualitzarUI();if(document.getElementById('tab-missio')?.classList.contains('active'))renderMissio();}},5*60*1000);}
function guardarEstat(){localStorage.setItem('cat_monedes',estat.monedes);localStorage.setItem('cat_compres',JSON.stringify(estat.compres));localStorage.setItem('cat_nivell',estat.progres.nivellActualMapa);localStorage.setItem('cat_encerts',estat.progres.encerts);localStorage.setItem('cat_frasesContador',estat.progres.frasesDesDeUltimNivell);localStorage.setItem('cat_energia',estat.progres.energia);localStorage.setItem('cat_ultimaEnergia',estat.ultimaRecargaEnergia);localStorage.setItem('cat_intro',JSON.stringify(estat.introVist));localStorage.setItem('cat_desbloquejats',JSON.stringify(estat.desbloquejats));localStorage.setItem('cat_nivell_minijoc',NIVELL_MINIJOC.nivelActual);localStorage.setItem('cat_personatge',estat.personatgeTriat);localStorage.setItem('cat_xp',estat.progres.xp);}
function getCurrentLevel(){if(estat.progres.nivellActualMapa<=33)return'a1';if(estat.progres.nivellActualMapa<=66)return'a2';return'b1';}
function gastarEnergia(c){if(DEBUG_NO_ENERGIA)return true;if(estat.progres.energia<c)return false;estat.progres.energia-=c;guardarEstat();actualitzarUI();return true;}
async function carregarDadesMinijoc(){
  try{ const fr = await fetch('./data/minijoc_frases.json'); if(fr.ok){ const d = await fr.json(); FRASES_MINIJOC = Array.isArray(d)? d : (d.frases || []); } }catch(e){ console.log('minijoc error', e); }
  if(!FRASES_MINIJOC.length){ FRASES_MINIJOC = [{"id":"p1_1","text":"{persona} mira {objecte}","roles":{"persona":["persona"],"objecte":["objecte"]}},{"id":"p1_2","text":"{persona} porta {roba}","roles":{"persona":["persona"],"roba":["roba"]}},{"id":"p1_3","text":"{persona} va cap a {direccio}","roles":{"persona":["persona"],"direccio":["direccio"]}},{"id":"p1_4","text":"Són {numero} {animal}","roles":{"numero":["numero"],"animal":["animal"]}}]; }
  minijocInicialitzat = true;
}
async function carregarDades(){
  try{ const r=await fetch('./data/categories_emoji.json'); if(r.ok) CATEGORIES_TOTS=await r.json(); }catch(e){}
  try{ const r=await fetch('./data/biblioteca_emoji.json'); if(r.ok) BIBLIOTECA_PLA=await r.json(); }catch(e){}
  try{ const r=await fetch('./data/botiga_emoji.json'); if(r.ok) PACKS_BOTIGA=await r.json(); }catch(e){}
  try{ const r=await fetch('./data/banco_lectura.json'); if(r.ok){ BANCO_VOCAB=await r.json(); BANCO_LECTURA=BANCO_VOCAB; } }catch(e){ console.error('BANCO LECTURA carregarDades error', e); }
  try{ const r=await fetch('./data/tips.json'); if(r.ok) dadesTips=await r.json(); }catch(e){}
  construirMapaDet(); agruparBibliotecaPorCategoria(); construirCategories(); construirTotsEmojis(); inicialitzarNomPersonatgeDefault(); renderMapa();
}
function construirMapaDet(){
  MAPA_DET = {};
  for(const cat in CATEGORIES_TOTS){ const arr = CATEGORIES_TOTS[cat] || []; arr.forEach(obj => { if(!obj) return; const emoji = obj.emoji || obj; const base = quitarSkinTone(emoji); const det = obj.det || (cat==='roba'?'La':"El"); const nom = obj.nom || obj.nom_cat || base; const genere = obj.genere || (cat==='roba'?'f':"m"); if(!MAPA_DET[base]){ MAPA_DET[base] = { det, nom, genere, categoria: cat, emojiOriginal: emoji }; } }); }
  BIBLIOTECA_PLA.forEach(e=>{ const base = quitarSkinTone(e.emoji); if(!MAPA_DET[base]){ MAPA_DET[base] = { det: "El", nom: e.nom_cat, genere: "m", categoria: e.categoria, emojiOriginal: e.emoji }; } else { if(e.categoria) MAPA_DET[base].categoria = e.categoria; } });
}
function inicialitzarNomPersonatgeDefault(){if(nomPersonatge) return; let llista = BANCO_LECTURA?.personatges; if(!llista || !llista.length) llista = ["La Laia","En Pau","La Mercè","En Biel","L'Ona","En Roc"]; const triat = llista[Math.floor(Math.random()*llista.length)]; nomPersonatge = triat; localStorage.setItem('cat_nom_personatge', triat);}
function agruparBibliotecaPorCategoria(){BIBLIOTECA_POR_CAT={};BIBLIOTECA_PLA.forEach(e=>{if(!BIBLIOTECA_POR_CAT[e.categoria])BIBLIOTECA_POR_CAT[e.categoria]=[];BIBLIOTECA_POR_CAT[e.categoria].push(e);});}
function construirCategories(){
  const d=new Set(PACK_INICIAL.map(e=>quitarSkinTone(e)));
  estat.compres.forEach(id=>{ const pId=id.includes('_p')?id.split('_p')[0]:id; const p=PACKS_BOTIGA.find(x=>x.id===pId || x.id===id); if(p&&p.emojis) p.emojis.forEach(e=>d.add(quitarSkinTone(e.emoji || e))); const p2=PACKS_BOTIGA.find(x=>x.id===id); if(p2&&p2.emojis) p2.emojis.forEach(e=>d.add(quitarSkinTone(e.emoji || e))); });
  CATEGORIES_DESBLOQUEJADES={};
  Object.keys(CATEGORIES_TOTS).forEach(c=>{ const arr = CATEGORIES_TOTS[c] || []; const filtrats = arr.filter(obj=>{ const emoji = obj.emoji || obj; return d.has(quitarSkinTone(emoji)); }).map(obj=> (obj.emoji || obj)); CATEGORIES_DESBLOQUEJADES[c]=filtrats; });
  estat.desbloquejats=CATEGORIES_DESBLOQUEJADES;
}
function construirTotsEmojis(){TOTS_EMOJIS=BIBLIOTECA_PLA.map(e=>({...e}));}
document.addEventListener('DOMContentLoaded',async()=>{regenerarEnergia();iniciarRegeneracioAutomatica();mostrarIntro();await carregarDades();await carregarDadesMinijoc();actualitzarUI();canviarTab('mapa',null);setTimeout(()=>{if(!lecturaActualText)generarLectura();},500);});
function canviarTab(tab,e){document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));document.getElementById('tab-'+tab)?.classList.add('active');if(e&&e.target)e.target.closest('.nav-item')?.classList.add('active');else document.querySelector(`.nav-item[onclick*="'${tab}'"]`)?.classList.add('active');if(tab==='mapa')renderMapa();if(tab==='missio')renderMissio();if(tab==='gremi')mostrarSubTab('biblioteca');if(tab==='lectura'){mostrarSubTab('lectura');if(!lecturaActualHTML)setTimeout(()=>generarLectura(),100);}if(tab==='tips')carregarTips();if(tab==='botiga')renderBotiga();}
function forcarLecturaVisible(){
  const c = document.getElementById('lectura-texto');
  if(c){ c.style.display='block'; c.style.visibility='visible'; c.style.opacity='1'; }
  const card = document.querySelector('.lectura-card');
  if(card){ card.style.display='block'; card.style.visibility='visible'; }
  let p = c ? c.parentElement : null;
  while(p){
    if(p.classList && p.classList.contains('sub-tab-content')) p.style.display='block';
    if(p.id === 'tab-lectura') break;
    p = p.parentElement;
  }
}
function mostrarSubTab(sub){const tabActiva=document.querySelector('.tab-content.active');if(!tabActiva)return;tabActiva.querySelectorAll('.sub-tab-content').forEach(t=>t.style.display='none');document.querySelectorAll('.sub-tab-btn').forEach(b=>b.classList.remove('active'));const ids=[`lectura-${sub}`,`lectura-${sub}-inner`,`gremi-${sub}`,`lectura-${sub}-content`,`lectura-${sub}-texto`,`lectura-texto`,`gremi-${sub}-inner`,sub];let target=null;for(let id of ids){target=document.getElementById(id);if(target&&(tabActiva.contains(target)||sub==='lectura'))break;}if(!target){const todos=tabActiva.querySelectorAll('.sub-tab-content');if(sub==='lectura'&&todos[0])target=todos[0];if(sub==='vocab'&&todos[1])target=todos[1];if(sub==='gramatica'&&todos[2])target=todos[2];}if(target){target.style.display='block';const p=target.closest('.sub-tab-content');if(p)p.style.display='block';}document.querySelectorAll(`.sub-tab-btn[onclick*="'${sub}'"]`).forEach(b=>b.classList.add('active'));if(sub==='personatges')mostrarGremiPersonatges();if(sub==='biblioteca')renderDiccionari();if(sub==='minijoc')setTimeout(()=>novaFraseMinijoc(),100);if(sub==='gramatica')setTimeout(()=>generarGramatica(),10);if(sub==='vocab')setTimeout(()=>renderVocabLectura(),10);if(sub==='lectura'){const c=document.getElementById('lectura-texto');if(c&&lecturaActualHTML&&!c.innerHTML.trim())c.innerHTML=lecturaActualHTML;if(c)c.style.display='block';forcarLecturaVisible();}}
function mostrarIntro(){const el=document.getElementById('intro');if(!el)return;el.style.display='flex';slideActual=0;pintarSlide();el.onclick=()=>seguentSlide();}
function pintarSlide(){const s=INTRO_SLIDES[slideActual];document.getElementById('intro-emoji').textContent=s.emoji;document.getElementById('intro-titol').textContent=s.titol;document.getElementById('intro-text').textContent=s.text;const d=document.getElementById('intro-dots');if(d)d.innerHTML=INTRO_SLIDES.map((_,i)=>`<span style="opacity:${i===slideActual?1:0.3}">●</span>`).join(' ');const b=document.getElementById('intro-btn');if(b){b.textContent=slideActual===INTRO_SLIDES.length-1?'Començar':'Següent';b.onclick=e=>{e.stopPropagation();seguentSlide();};}}
function seguentSlide(){vibrar();if(slideActual<INTRO_SLIDES.length-1){slideActual++;pintarSlide();}else saltarIntro();}
function saltarIntro(){estat.introVist=true;guardarEstat();document.getElementById('intro').style.display='none';}
function renderMapa(){const c=document.getElementById('mapa-contenidor');if(!c)return;if(!CATEGORIES_TOTS||Object.keys(CATEGORIES_TOTS).length===0){let h='<h3 style="text-align:center;margin-bottom:20px;">Carregant mapa...</h3><div class="nivells-grid">';for(let i=1;i<=100;i++)h+=`<div class="nivell-card" style="background:#222;border-color:#333;color:#555;opacity:0.5">${i}</div>`;c.innerHTML=h+'</div>';return;}let h='<h3 style="text-align:center;margin-bottom:20px;">Mapa de Nivells</h3><div class="nivells-grid">';for(let i=1;i<=100;i++){const d=i<=estat.progres.nivellActualMapa,o=d?'1':'0.4',cu=d?'pointer':'not-allowed',co=d?'#22c55e':'#333',oc=d?`jugarNivell(${i})`:'';h+=`<div class="nivell-card" style="border-color:${co};opacity:${o};cursor:${cu}" onclick="${oc}">${i}</div>`;}h+='</div>';c.innerHTML=h;}
function jugarNivell(n){if(n>estat.progres.nivellActualMapa)return;canviarTab('gremi',null);mostrarSubTab('minijoc');}
function renderMissio(){const c=document.getElementById('missio-contenidor');if(!c)return;const n=estat.progres.nivellActualMapa||1,xp=n*100,xpF=xp-(estat.progres.xp||0),nB1=25,pB1=Math.min(100,Math.max(0,(n/nB1)*100)),fB1=Math.max(0,nB1-n);c.innerHTML=`<h3 style="text-align:center;margin-bottom:20px;">Missions</h3><div class="missio-item" onclick="canviarTab('gremi',null);mostrarSubTab('minijoc');" style="cursor:pointer;">${xpF>0?'🎯':'✅'} Et falten ${xpF} acerts per pujar de nivell</div><div class="missio-item" onclick="canviarTab('botiga',null);" style="cursor:pointer;">📦 Desbloqueja tota la biblioteca</div><div class="missio-item" onclick="canviarTab('lectura',null);setTimeout(()=>mostrarSubTab('gramatica'),100);" style="cursor:pointer;">📚 Aprèn gramàtica</div><div class="missio-item" onclick="recarregarEnergia()" style="cursor:pointer;">⚡ Recarrega energia per 50 🪙</div><div class="missio-item"><div style="display:flex;gap:12px;margin-bottom:8px;"><span style="font-size:32px;">${fB1===0?'✅':'🏆'}</span><div style="flex:1;"><div style="font-weight:700;">Arriba al nivell B1</div><div style="font-size:13px;color:#aaa;">Nivell ${n} de ${nB1} - Falten ${fB1}</div></div></div><div style="width:100%;height:8px;background:#333;border-radius:4px;"><div style="width:${pB1}%;height:100%;background:#22c55e;"></div></div></div>`;}
function recarregarEnergia(){if(estat.progres.energia>=100){mostrarMissatge('Ja tens l\'energia al màxim!');return;}if(estat.monedes<50){mostrarMissatge('Necessites 50 monedes');return;}estat.monedes-=50;estat.progres.energia=100;estat.ultimaRecargaEnergia=Date.now();guardarEstat();actualitzarUI();renderMissio();vibrar();mostrarMissatge('Energia recarregada!');}
function mostrarGremiPersonatges(){const c=document.getElementById('gremi-personatges');if(!c)return;let h=`<div style="text-align:center;padding:20px;"><div style="font-size:80px;">${PERSONATGES_JUGADOR.find(p=>p.id===estat.personatgeTriat).emoji}</div><h3>${PERSONATGES_JUGADOR.find(p=>p.id===estat.personatgeTriat).nom}</h3><p style="color:#22c55e;">Preferit: <b>${nomPersonatge || 'aleatori'}</b></p><div style="border-top:1px solid #333;padding-top:20px;"><h4>Canvia avatar</h4><div class="emoji-grid">`;PERSONATGES_JUGADOR.forEach(x=>{const s=x.id===estat.personatgeTriat;h+=`<div class="emoji-item" style="border:${s?'2px solid #22c55e':'1px solid #333'};cursor:pointer;" onclick="triarPersonatge('${x.id}')"><div class="emoji-large">${x.emoji}</div><div class="emoji-name">${x.nom}</div></div>`;});h+=`</div></div></div>`;c.innerHTML=h;}
function triarPersonatge(id){estat.personatgeTriat=id;guardarEstat();actualitzarUI();mostrarGremiPersonatges();vibrar();}
function renderDiccionari(){const c=document.getElementById('gremi-biblioteca');if(!c)return;let h=`<h3 style="text-align:center;">Biblioteca</h3>`;const base=PACK_INICIAL.map(e=>quitarSkinTone(e));for(const[cat,emojis]of Object.entries(BIBLIOTECA_POR_CAT)){h+=`<h4 style="margin:20px 0 8px;color:#4CAF50;text-transform:capitalize;">${cat}</h4><div class="emoji-grid">`;emojis.forEach(e=>{const net=quitarSkinTone(e.emoji),esBase=base.includes(net),perPack=estat.compres.some(id=>{const pid=id.includes('_p')?id.split('_p')[0]:id;const pack=PACKS_BOTIGA.find(p=>p.id===pid || p.id===id);return pack&&pack.emojis.some(pe=>quitarSkinTone((pe.emoji||pe))===net);}),des=esBase||perPack;h+=`<div class="emoji-item" style="opacity:${des?'1':'0.12'};filter:${des?'':'grayscale(1)'};"><div class="emoji-large">${e.emoji}</div><div class="emoji-name">${e.nom_cat}</div></div>`;});h+=`</div>`;}c.innerHTML=h;}
function obtenirArticleNet(emoji){ const base = quitarSkinTone(emoji); const info = MAPA_DET[base]; if(!info) return emoji; if(CATS_SENSE_ARTICLE.has(info.categoria)) return info.nom; let det = info.det; let nom = info.nom; if(nom.toLowerCase()==="home" && det==="En") det="L'"; if(nom.toLowerCase()==="dona" && det==="Na") det="La"; if(det==="L'" || det==="l'") return det+nom; return det+" "+nom; }
function obtenirNomSenseArticle(emoji){ const b=quitarSkinTone(emoji); const i=MAPA_DET[b]; return i?i.nom:emoji; }
function obtenirArticle(emoji){ return obtenirArticleNet(emoji); }
function generarFraseDinamicaLogica(pl, jug){
  let text=pl.text; let sol=[]; let usats=new Set(); let claus = pl.roles? Object.keys(pl.roles) : [];
  if(!pl.roles){ const all = text.match(/\{(\w+)\}/g) || []; all.forEach(m=>{ const k=m.replace(/[{}]/g,''); if(!claus.includes(k)) claus.push(k); }); }
  for(const rol of claus){
    const baseKey = rol.split('_')[0]; const cats = pl.roles? pl.roles[rol] : [baseKey]; let pool=[];
    cats.forEach(cat=>{ (CATEGORIES_TOTS[cat]||[]).forEach(o=>{ const em=o.emoji||o; const base=quitarSkinTone(em); if(!usats.has(base) && jug.some(j=>quitarSkinTone(j)===base)) pool.push(em); }); (BIBLIOTECA_POR_CAT[cat]||[]).forEach(e=>{ const base=quitarSkinTone(e.emoji); if(!usats.has(base) && jug.some(j=>quitarSkinTone(j)===base)){ if(!pool.some(p=>quitarSkinTone(p)===base)) pool.push(e.emoji); } }); });
    if(pool.length===0){ jug.forEach(j=>{ const b=quitarSkinTone(j); const info=MAPA_DET[b]; if(info && cats.includes(info.categoria) &&!usats.has(b)) pool.push(j); }); }
    if(pool.length===0) continue;
    const elegido=pool[Math.floor(Math.random()*pool.length)]; usats.add(quitarSkinTone(elegido)); const infoElegido = MAPA_DET[quitarSkinTone(elegido)]; const esSenseArticle = infoElegido && CATS_SENSE_ARTICLE.has(infoElegido.categoria); let reemplazo = esSenseArticle? obtenirNomSenseArticle(elegido) : obtenirArticleNet(elegido);
    if(text.includes('a {'+rol+'}')){ if(!esSenseArticle){ if(reemplazo.startsWith('El ')) reemplazo='el '+obtenirNomSenseArticle(elegido); if(reemplazo.startsWith("L'")) reemplazo="l'"+obtenirNomSenseArticle(elegido); if(reemplazo.startsWith('La ')) reemplazo='la '+obtenirNomSenseArticle(elegido); } text=text.replace('a {'+rol+'}','a '+reemplazo); }
    else if(text.includes('amb {'+rol+'}') || text.includes('per {'+rol+'}') || text.includes('sota {'+rol+'}') || text.includes('de {'+rol+'}')){ text=text.replace('{'+rol+'}', esSenseArticle? reemplazo : reemplazo.toLowerCase()); }
    else { text=text.replace('{'+rol+'}', reemplazo); }
    sol.push(elegido);
  }
  text=text.replace(/En home/g, "L'home").replace(/Na dona/g, 'La dona'); text=text.replace(/al El /g,'al ').replace(/a El /gi,'al ').replace(/a La /gi,'a la ').replace(/amb El /g,'amb el ').replace(/amb La /g,'amb la '); text=text.replace(/ +/g,' ').trim(); if(text.length>0) text=text.charAt(0).toUpperCase()+text.slice(1); return {text, solucio:sol};
}
function generarFraseDinamica(pl, jug){ return generarFraseDinamicaLogica(pl, jug); }
function novaFraseMinijoc(){
  const fraseEl=document.getElementById('minijoc-frase'); const triatsEl=document.getElementById('minijoc-triats'); const feedbackEl=document.getElementById('minijoc-feedback'); const nivellEl=document.getElementById('minijoc-nivell'); const gridEl=document.getElementById('minijoc-emojis');
  if(fraseEl &&!FRASES_MINIJOC.length){ fraseEl.textContent="Carregant frases..."; carregarDadesMinijoc().then(()=>novaFraseMinijoc()); return; }
  if(!minijocInicialitzat){ if(fraseEl) fraseEl.textContent="Carregant..."; setTimeout(()=>novaFraseMinijoc(),300); return; }
  const emojisJugador=BIBLIOTECA_PLA.filter(e=>{ const net=quitarSkinTone(e.emoji),esBase=PACK_INICIAL.map(x=>quitarSkinTone(x)).includes(net), perPack=estat.compres.some(id=>{ const pid=id.includes('_p')?id.split('_p')[0]:id; const pack=PACKS_BOTIGA.find(p=>p.id===pid || p.id===id); return pack&&pack.emojis.some(pe=>quitarSkinTone((pe.emoji||pe))===net); }); return esBase||perPack; }).map(e=>e.emoji);
  let emojisUsables = emojisJugador.length>0? emojisJugador : PACK_INICIAL;
  if(emojisUsables.length<2){ if(fraseEl) fraseEl.textContent="Desbloqueja més packs!"; if(gridEl) gridEl.innerHTML=''; return; }
  const pl=FRASES_MINIJOC[Math.floor(Math.random()*FRASES_MINIJOC.length)]; const{text,solucio}=generarFraseDinamicaLogica(pl,emojisUsables); minijoc.fraseObjectiu={text,solucio}; minijoc.emojisTriats=[]; if(fraseEl) fraseEl.textContent=text; if(triatsEl) triatsEl.textContent=''; if(feedbackEl) feedbackEl.innerHTML=''; if(nivellEl) nivellEl.textContent=`Nivell ${estat.progres.nivellActualMapa} - ${solucio.length} emojis`; generarOpcionsMinijoc(solucio);
}
function generarOpcionsMinijoc(solucio){
  const grid=document.getElementById('minijoc-emojis');if(!grid)return; const num=solucio.length<=3?16:20,numF=num-solucio.length;
  const emojisJugador=BIBLIOTECA_PLA.filter(e=>{ const net=quitarSkinTone(e.emoji),esBase=PACK_INICIAL.map(x=>quitarSkinTone(x)).includes(net), perPack=estat.compres.some(id=>{ const pid=id.includes('_p')?id.split('_p')[0]:id; const pack=PACKS_BOTIGA.find(p=>p.id===pid || p.id===id); return pack&&pack.emojis.some(pe=>quitarSkinTone((pe.emoji||pe))===net); }); return esBase||perPack; }).map(e=>e.emoji);
  let baseJug=emojisJugador.length>0?emojisJugador:PACK_INICIAL; const falsos=baseJug.filter(e=>!solucio.some(s=>quitarSkinTone(e)===quitarSkinTone(s))).sort(()=>0.5-Math.random()).slice(0,numF); const opcions=[...solucio,...falsos].sort(()=>0.5-Math.random()); minijoc.emojisDisponibles=opcions; grid.innerHTML=''; opcions.forEach((emoji,i)=>{ const ed=BIBLIOTECA_PLA.find(e=>quitarSkinTone(e.emoji)===quitarSkinTone(emoji)); const div=document.createElement('div');div.className='emoji-item'; div.innerHTML=`<div class="emoji-large">${emoji}</div><div class="emoji-name">${ed?.nom_cat||''}</div>`; div.onclick=()=>triarEmojiMinijoc(i); grid.appendChild(div); });
}
function triarEmojiMinijoc(idx){vibrar();const emoji=minijoc.emojisDisponibles[idx],max=minijoc.fraseObjectiu.solucio.length;if(minijoc.emojisTriats.length<max){minijoc.emojisTriats.push(emoji);document.getElementById('minijoc-triats').textContent=minijoc.emojisTriats.join(' ');if(minijoc.emojisTriats.length===max)setTimeout(comprovarMinijoc,300);}}
function comprovarMinijoc(){const fb=document.getElementById('minijoc-feedback');if(!fb||!minijoc.fraseObjectiu)return;const sol=minijoc.fraseObjectiu.solucio.map(quitarSkinTone).join(''),tri=minijoc.emojisTriats.map(quitarSkinTone).join('');if(sol===tri){fb.innerHTML=`<p style="color:#4CAF50;font-weight:bold;">Correcte! +5 🪙</p>`;estat.monedes+=5;estat.progres.encerts++;estat.progres.frasesDesDeUltimNivell++;if(estat.progres.frasesDesDeUltimNivell>=25&&estat.progres.nivellActualMapa<100){estat.progres.nivellActualMapa++;estat.progres.frasesDesDeUltimNivell=0;mostrarMissatge(`🔓 Nivell ${estat.progres.nivellActualMapa} desbloquejat!`);}NIVELL_MINIJOC.nivelActual=Math.min(NIVELL_MINIJOC.nivelActual+1,5);guardarEstat();actualitzarUI();setTimeout(()=>novaFraseMinijoc(),1500);}else{fb.innerHTML=`<p style="color:#f44336;">No és així. Era: ${minijoc.fraseObjectiu.solucio.join(' ')}</p>`;setTimeout(()=>novaFraseMinijoc(),2000);}}

// --- MOTOR LECTURA v21 LIMPIO - V3.3 LECTURA DIRECTA + VOCAB AMPLIAT + LLICO GRAMATICA V21 ---
async function cargarBancoLectura(){
  if(BANCO_LECTURA && BANCO_LECTURA.a1 && BANCO_LECTURA.a1.plantillas) return BANCO_LECTURA;
  try{
    const r = await fetch('./data/banco_lectura.json');
    if(!r.ok) throw new Error('HTTP '+r.status);
    const j = await r.json();
    if(!j || !j.a1 || !j.a1.plantillas) throw new Error('JSON sin plantillas a1');
    BANCO_LECTURA = j;
  }catch(e){
    console.error('BANCO LECTURA ERROR:', e);
    const el = document.getElementById('lectura-texto');
    if(el){
      el.style.display='block'; el.style.visibility='visible'; el.style.opacity='1';
      el.innerHTML = `<div style="padding:20px;background:#3f1d1d;border:1px solid #f44336;border-radius:8px;"><h3>⚠️ No puedo leer banco_lectura.json</h3><p>Error: ${e.message}</p><p>Revisa que el archivo en <b>data/banco_lectura.json</b> sea JSON válido. Usa el V3 LECTURA DIRECTA.</p><button class="btn btn-primari" onclick="generarLectura()">🔄 Reintentar</button></div>`;
      forcarLecturaVisible();
    }
    return null;
  }
  if(!nomPersonatge) inicialitzarNomPersonatgeDefault();
  return BANCO_LECTURA;
}
let _ultimaPlantillaId = null;
function _barrejar(arr){ const a = [...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function _reemplaLectura(t, pers, pronom){
  if(!t) return "";
  return t.replace(/\$\{(\w+)\}/g,(m,k)=>{
    if(k==='personatge') return pers; if(k==='pronom') return pronom; return k;
  });
}
function renderVocabLectura(){
  const c = document.getElementById('lectura-vocab-inner') || document.getElementById('lectura-vocab'); if(!c) return;
  if(!lecturaActualText){ c.innerHTML = '<div style="padding:20px;text-align:center;opacity:0.6"><p>Genera una lectura</p></div>'; return; }
  const va = lecturaContext._vocabAmpliat;
  const vocab = lecturaContext._vocabCat || lecturaActualVocab;
  const verbs = lecturaContext._verbsCat || [];
  if(!va){
    c.innerHTML = `<div style="padding:12px;"><h4 style="margin:10px 0 8px;">📚 Vocabulari d'aquesta lectura - ${lecturaContext._plantillaNom || ''}</h4><div class="vocab-grid">${vocab.map(w=>`<div class="vocab-card"><div class="vocab-word">${w}</div></div>`).join('')}</div>${verbs.length ? `<h4 style="margin:16px 0 8px;">⚡ Verbs clau</h4><div class="vocab-grid">${verbs.map(w=>`<div class="vocab-card" style="border-color:#f59e0b;"><div class="vocab-word">${w}</div></div>`).join('')}</div>` : ''}<p style="font-size:12px;color:#aaa;margin-top:12px;">Cada plantilla té el seu propi vocabulari. Aquestes paraules només surten en aquest tema.</p></div>`;
    return;
  }
  const bloc = (titol, arr, color) => arr && arr.length ? `<h4 style="margin:16px 0 8px;">${titol}</h4><div class="vocab-grid">${arr.map(w=>`<div class="vocab-card" style="border-color:${color}"><div class="vocab-word">${w}</div></div>`).join('')}</div>` : '';
  c.innerHTML = `<div style="padding:12px;"><h3>📚 Vocabulari - ${lecturaContext._plantillaNom||''}</h3><p style="font-size:13px;color:#aaa;">Totes aquestes paraules surten a la lectura que acabes de llegir. No són d'un altre tema.</p>${bloc('📖 Noms', va.noms, '#22c55e')}${bloc('⚡ Verbs', va.verbs, '#f59e0b')}${bloc('🎨 Adjectius', va.adjectius, '#3b82f6')}${bloc('💬 Expressions', va.expressions, '#a855f7')}<button class="btn btn-primari" onclick="repassarVocab()" style="margin-top:16px;width:100%;">🔁 Repassar amb targetes</button><div id="vocab-repas" style="margin-top:12px;"></div></div>`;
}
function repassarVocab(){
  const va = lecturaContext._vocabAmpliat; if(!va) return;
  const totes = [...(va.noms||[]), ...(va.verbs||[]), ...(va.adjectius||[])];
  if(!totes.length) return;
  const w = totes[Math.floor(Math.random()*totes.length)];
  const el = document.getElementById('vocab-repas');
  if(el) el.innerHTML = `<div style="padding:16px;background:#222;border:2px solid #22c55e;border-radius:12px;text-align:center;"><div style="font-size:28px;font-weight:800;">${w}</div><div style="font-size:13px;color:#aaa;margin-top:6px;">Digues una frase amb aquesta paraula. Després, prem Repassar per una altra.</div></div>`;
}
async function generarLectura(){
  if(!gastarEnergia(30)){ alert('No tens energia'); return; }
  const banco = await cargarBancoLectura();
  if(!banco){ const c=document.getElementById('lectura-texto'); if(c){ c.style.display='block'; forcarLecturaVisible(); } return; }
  const nivell = getCurrentLevel(); const data = banco[nivell];
  if(!data || !data.plantillas || !data.plantillas.length){ const c=document.getElementById('lectura-texto'); if(c){ c.innerHTML='<p>No hi ha lectures per aquest nivell</p>'; c.style.display='block'; forcarLecturaVisible(); } return; }
  lecturaActualVocab = []; lecturaContext = {};
  let llista = banco.personatges;
  if(!llista || !llista.length) llista = ["La Laia","En Pau","La Mercè","En Biel","L'Ona","En Roc"];
  let pers = llista[Math.floor(Math.random()*llista.length)];
  if(!pers) pers = "La Laia";
  nomPersonatge = pers;
  localStorage.setItem('cat_nom_personatge', pers);
  let genere = 'm';
  if(banco.personatges_detall && banco.personatges_detall[pers]){
    const gRaw = banco.personatges_detall[pers]; genere = (typeof gRaw === 'object' ? (gRaw.g || 'm') : gRaw) || 'm';
  } else {
    if(/^La\s|^L'/i.test(pers)) genere = 'f';
    if(/^En\s|^El\s/i.test(pers)) genere = 'm';
  }
  genere = genere.toLowerCase().startsWith('f') ? 'f' : 'm';
  const pronom = genere === 'f' ? 'ella' : 'ell';
  let candidates = data.plantillas.filter(p => p.id !== _ultimaPlantillaId);
  if(!candidates.length) candidates = data.plantillas;
  let plantilla = candidates[Math.floor(Math.random()*candidates.length)];
  _ultimaPlantillaId = plantilla.id;
  const vocabCat = plantilla.vocab || [];
  const verbsCat = plantilla.verbs || [];
  const vocabAmpliat = plantilla.vocab_ampliat || null;
  const gramaticaPlantilla = plantilla.gramatica || null;
  lecturaContext = { genere, personatge: pers, pronom, _vocabCat: vocabCat, _verbsCat: verbsCat, _vocabAmpliat: vocabAmpliat, _gramatica: gramaticaPlantilla, _plantillaNom: plantilla.name, _plantillaId: plantilla.id, _ultimaPlantillaId: plantilla.id };
  _barrejar(vocabCat).slice(0,6).forEach(w=>{ if(!lecturaActualVocab.includes(w)) lecturaActualVocab.push(w); });
  let textBase = plantilla.lectura ? _reemplaLectura(plantilla.lectura, pers, pronom) : "No hi ha text per aquesta lectura.";
  let tit = plantilla.name || "Lectura";
  lecturaActualText = textBase;
  lecturaActualPreguntes = (plantilla.preguntes || []).map(p=>{
    const opcionsBrutes = (p.opcions || []).map(op=>_reemplaLectura(op, pers, pronom));
    const correctaText = opcionsBrutes[p.correcta||0] || '';
    let opcions = _barrejar(opcionsBrutes);
    let correctaIdx = opcions.indexOf(correctaText);
    return { q: _reemplaLectura(p.q, pers, pronom), opcions, correcta: correctaIdx };
  });
  const badge = `<span style="font-size:11px;background:#22c55e;color:#000;padding:2px 6px;border-radius:10px;margin-left:8px;">${plantilla.level || nivell.toUpperCase()} · ${plantilla.name} · ${vocabCat.length} paraules</span>`;
  const html = `<div class="lectura-card"><h3>${tit} ${badge}</h3><p class="lectura-text" style="line-height:1.7;font-size:16px;">${lecturaActualText}</p><div style="margin-top:10px;font-size:12px;color:#aaa;">Tema: ${plantilla.topic||''} | ${plantilla.topic_cat||''} | Vocabulari: ${vocabCat.slice(0,5).join(', ')}</div><div class="lectura-preguntes" style="margin-top:20px;">${lecturaActualPreguntes.map((p,i)=>`<div style="margin-bottom:15px;padding:12px;background:#222;border-radius:8px;"><p><strong>${i+1}. ${p.q}</strong></p>${p.opcions.map((op,j)=>`<button class="btn btn-sec" style="display:block;width:100%;margin:5px 0;text-align:left;" onclick="comprovarPregunta(${i},${j})">${op}</button>`).join('')}<div id="feedback-${i}" style="margin-top:8px;"></div></div>`).join('')}</div><button class="btn btn-primari" onclick="generarLectura()" style="margin-top:15px;">🔄 Nova lectura (${data.plantillas.length} disponibles)</button></div>`;
  lecturaActualHTML = html; const el = document.getElementById('lectura-texto'); if(el){ el.innerHTML = html; el.style.display = 'block'; el.style.visibility='visible'; forcarLecturaVisible(); } renderVocabLectura();
}
function comprovarPregunta(i,r){const p=lecturaActualPreguntes[i],fb=document.getElementById(`feedback-${i}`);if(!fb)return;if(r===p.correcta){fb.innerHTML='<span style="color:#4CAF50">✅ Correcte! +0.5 XP</span>';estat.progres.encerts+=0.5;estat.progres.xp+=1;guardarEstat();actualitzarUI();}else fb.innerHTML=`<span style="color:#f44336">❌ No. Era: ${p.opcions[p.correcta]}</span>`;}
function slugGramatica(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_');}
async function generarGramatica(){
  const cont=document.getElementById('lectura-gramatica-inner')||document.getElementById('lectura-gramatica');
  if(!cont) return;
  if(!lecturaActualText){ cont.innerHTML=`<div style="padding:20px;"><p>Genera primer una lectura</p></div>`; return; }
  const g = lecturaContext._gramatica;
  const btns = `<div style="display:flex;gap:8px;margin-bottom:15px;"><button class="btn ${gramaticaMode==='contextual'?'btn-primari':'btn-sec'}" onclick="setGramaticaMode('contextual')">Contextual</button><button class="btn ${gramaticaMode==='guia'?'btn-primari':'btn-sec'}" onclick="setGramaticaMode('guia')">Guia</button></div>`;
  if(!g){
    cont.innerHTML = btns + `<div style="padding:12px;"><div class="grammar-card"><div class="grammar-title">Gramàtica contextual - ${lecturaContext._plantillaNom||''}</div><div class="grammar-explanation">${lecturaActualText.slice(0,300)}...</div><p style="font-size:12px;color:#aaa;margin-top:10px;">Vocabulari: ${(lecturaContext._vocabCat||[]).join(', ')}</p></div></div>`;
    return;
  }
  if(!g.ortografia){
    const exemplesHtml = (g.exemples||[]).map(e=>`<li style="margin:6px 0;">${e}</li>`).join('');
    cont.innerHTML = btns + `<div style="padding:12px;"><h3>📚 Gramàtica - ${lecturaContext._plantillaNom||''}</h3><div class="grammar-card" style="border-left:4px solid #22c55e;"><div class="grammar-title" style="font-size:18px;">${g.titol||''}</div><div class="grammar-explanation" style="margin:10px 0;">${g.regla||''}</div>${exemplesHtml ? `<h4>✅ Exemples d'aquesta lectura</h4><ul>${exemplesHtml}</ul>` : ''}${g.error_comu ? `<div style="background:#3f1d1d;padding:10px;border-radius:8px;margin-top:12px;"><b>⚠️ Error comú:</b> ${g.error_comu}</div>` : ''}${g.practica ? `<div style="background:#1e293b;padding:10px;border-radius:8px;margin-top:10px;"><b>✍️ Practica:</b> ${g.practica}</div>` : ''}</div></div>`;
    return;
  }
  const taulaHtml = (g.taula||[]).map(f=>`<div style="display:flex;gap:8px;padding:8px;background:#222;border-radius:8px;margin:4px 0;"><b style="min-width:60px;">${f[0]}</b><span>${f[1]}</span></div>`).join('');
  const errorsHtml = (g.errors_frequents||[]).map(e=>`<li style="margin:6px 0;">${e}</li>`).join('');
  const quizHtml = (g.mini_quiz||[]).map((p,i)=>`<div style="margin-bottom:12px;padding:12px;background:#222;border-radius:8px;"><p><strong>${i+1}. ${p.q}</strong></p>${p.opcions.map((op,j)=>`<button class="btn btn-sec grammar-quiz-btn" style="display:block;width:100%;margin:5px 0;text-align:left;" onclick="comprovarQuizGramatica(${i},${j},this)">${op}</button>`).join('')}<div id="quiz-gram-${i}" style="margin-top:6px;"></div></div>`).join('');
  cont.innerHTML = btns + `<div style="padding:12px;">
    <h3>📚 Lliçó de Gramàtica - ${lecturaContext._plantillaNom||''}</h3>
    <div class="grammar-card" style="border-left:4px solid #22c55e;">
      <div class="grammar-title" style="font-size:20px;">${g.titol}</div>
      ${g.que_aprens ? `<div class="grammar-que-aprens"><b>🎯 Què aprens avui:</b> ${g.que_aprens}</div>` : ''}
      <h4>📖 Regla</h4><div class="grammar-explanation">${g.regla}</div>
      ${g.ortografia ? `<div class="grammar-ortografia"><b>✍️ Ortografia - Com s'escriu:</b><br>${g.ortografia}</div>` : ''}
      ${g.pronuncia ? `<div class="grammar-pronuncia"><b>🗣️ Pronunciació - Com es diu:</b><br>${g.pronuncia}</div>` : ''}
      ${taulaHtml ? `<h4 style="margin-top:14px;">📋 Taula</h4>${taulaHtml}` : ''}
      <h4 style="margin-top:14px;">✅ Exemples d'aquesta lectura</h4><ul>${(g.exemples||[]).map(e=>`<li style="margin:6px 0;">${e}</li>`).join('')}</ul>
      ${g.error_comu ? `<div class="grammar-error"><b>⚠️ Error comú:</b> ${g.error_comu}</div>` : ''}
      ${errorsHtml ? `<h4 style="margin-top:12px;">⚠️ 3 Errors freqüents</h4><ul>${errorsHtml}</ul>` : ''}
      ${g.practica ? `<div class="grammar-practica"><b>✍️ Practica:</b> ${g.practica}</div>` : ''}
      ${quizHtml ? `<h4 style="margin-top:16px;">🧠 Mini-quiz - Prova't</h4>${quizHtml}` : ''}
    </div>
  </div>`;
}
function comprovarQuizGramatica(i, j, btn){
  const g = lecturaContext._gramatica; if(!g || !g.mini_quiz) return;
  const p = g.mini_quiz[i]; const fb = document.getElementById('quiz-gram-'+i);
  if(!fb) return;
  if(j === p.correcta){ fb.innerHTML = '<span style="color:#4CAF50">✅ Correcte! +0.5 XP</span>'; estat.progres.xp+=1; guardarEstat(); actualitzarUI(); if(btn){ btn.style.borderColor='#22c55e'; btn.style.background='#1a3a1a'; } }
  else { fb.innerHTML = `<span style="color:#f44336">❌ No. Era: ${p.opcions[p.correcta]}</span>`; if(btn){ btn.style.borderColor='#f44336'; btn.style.background='#3a1a1a'; } }
}
function setGramaticaMode(m){gramaticaMode=m;gramaticaTemaSeleccionat=null;generarGramatica();}
function seleccionarTemaGramatica(s){gramaticaTemaSeleccionat=s;generarGramatica();}
function tornarAGuia(){gramaticaTemaSeleccionat=null;generarGramatica();}
window.setGramaticaMode=setGramaticaMode;window.seleccionarTemaGramatica=seleccionarTemaGramatica;window.tornarAGuia=tornarAGuia;window.generarGramatica=generarGramatica;window.repassarVocab=repassarVocab;window.comprovarQuizGramatica=comprovarQuizGramatica;
function carregarTips(){const n=getCurrentLevel();if(totsElsTips.length===0)totsElsTips=dadesTips[n]||[];mostrarTipRandom();}
function mostrarTipRandom(){if(!totsElsTips||totsElsTips.length===0){const el=document.getElementById('tip-text');if(el)el.textContent='No hi ha tips';return;}if(tipsUsats.length===totsElsTips.length)tipsUsats=[];let idx;do{idx=Math.floor(Math.random()*totsElsTips.length);}while(tipsUsats.includes(idx));tipsUsats.push(idx);const tip=totsElsTips[idx];document.getElementById('tip-text').textContent=tip.truc;const ex=document.getElementById('tip-exemple');if(ex)ex.textContent=tip.exemple||'';}
function renderBotiga(){const c=document.getElementById('botiga-contenidor');if(!c)return;if(!PACKS_BOTIGA||PACKS_BOTIGA.length===0){c.innerHTML=`<div style="text-align:center;padding:40px;opacity:0.6;">No hi ha packs</div>`;return;}c.innerHTML='';PACKS_BOTIGA.forEach(pack=>{let subs=[];if(pack.emojis.length>6){for(let i=0;i<pack.emojis.length;i+=6){const ch=pack.emojis.slice(i,i+6),num=Math.floor(i/6)+1,tot=Math.ceil(pack.emojis.length/6),preu=Math.ceil(pack.preu/tot);subs.push({id:`${pack.id}_p${num}`,nom:`${pack.nom} ${num}/${tot}`,descripcio:pack.descripcio,preu,emojis:ch});}}else subs=[{id:pack.id,nom:pack.nom,descripcio:pack.descripcio,preu:pack.preu,emojis:pack.emojis}];subs.forEach(sp=>{const comp=estat.compres.includes(sp.id) || estat.compres.includes(pack.id),card=document.createElement('div');card.className='capitol-card';card.innerHTML=`<div class="capitol-icona">🎁</div><h3>${sp.nom}</h3><p style="color:#aaa;margin:8px 0;">${sp.descripcio}</p><p style="font-size:24px;">${sp.emojis.map(e=>e.emoji).join(' ')}</p><button class="btn ${comp?'btn-sec':''}" onclick="comprarPack('${sp.id}',${sp.preu})" ${comp?'disabled':''}>${comp?'Desbloquejat':'🪙 '+sp.preu}</button>`;c.appendChild(card);});});}
function comprarPack(id,preu){if(estat.monedes<preu){mostrarMissatge('No tens prou monedes');return;}estat.monedes-=preu;estat.compres.push(id);NIVELL_MINIJOC.nivelActual=Math.min(NIVELL_MINIJOC.nivelActual+1,5);guardarEstat();actualitzarUI();construirCategories();construirMapaDet();renderBotiga();renderDiccionari();mostrarMissatge('Pack desbloquejat!');}
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(e=>console.log('SW error:',e));});}