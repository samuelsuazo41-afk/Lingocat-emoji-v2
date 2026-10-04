// main.js v16.1 FIX DEFINITIU MINIJOC LOGIC - Basat en el teu v16.0 FINAL - No trenca res
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
let CATEGORIES_TOTS={}; let BIBLIOTECA_PLA=[]; let BIBLIOTECA_POR_CAT={}; let PACKS_BOTIGA=[]; let FRASES_MINIJOC=[]; let DETERMINANTS={}; let TOTS_EMOJIS=[]; let CATEGORIES_DESBLOQUEJADES={}; let BANCO_VOCAB={}; let dadesTips={}; let BANCO_LECTURA=null;
let lecturaActualVocab=[]; let lecturaActualText=''; let lecturaActualHTML=''; let lecturaActualPreguntes=[]; let lecturaContext={};
let NIVELL_MINIJOC={minEmojis:2,maxEmojis:5,nivelActual:parseInt(localStorage.getItem('cat_nivell_minijoc')||'1')};
let minijoc={fraseObjectiu:null,emojisTriats:[],emojisDisponibles:[]}; let minijocInicialitzat=false; let totsElsTips=[]; let tipsUsats=[]; let slideActual=0;
const INTRO_SLIDES=[{emoji:"🙀",titol:"Benvingut a Cat Lingo",text:"Aprèn català en 5 minuts al dia."},{emoji:"⛷️",titol:"Vocabulari visual",text:"Toca emojis i aprèn paraules."},{emoji:"📝",titol:"Gramàtica fàcil",text:"Explicacions curtes amb exemples."},{emoji:"📚",titol:"Lectures adaptades",text:"Textos al teu nivell A1, A2 o B1."},{emoji:"🚀",titol:"A jugar!",text:"Prem Saltar per començar"}];
let gramaticaMode='contextual'; let gramaticaTemaSeleccionat=null;
const CONECTORS_LECTURA=["Després","Més tard","Mentrestant","De sobte","Al final","Aleshores","Però","A més","Tot i això","Per això","De cop","Sense avís"];
let MAPA_DET = {};
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
  try{
    const fr = await fetch('./data/minijoc_frases.json');
    if(fr.ok){
      const d = await fr.json();
      FRASES_MINIJOC = Array.isArray(d)? d : (d.frases || []);
    }
  }catch(e){ console.log('minijoc error', e); }
  if(!FRASES_MINIJOC.length){
    FRASES_MINIJOC = [
      {"id":"p1_1","text":"{persona} mira {objecte}","roles":{"persona":["persona"],"objecte":["objecte"]}},
      {"id":"p1_2","text":"{persona} troba {objecte} a {lloc}","roles":{"persona":["persona"],"objecte":["objecte"],"lloc":["lloc"]}},
      {"id":"p1_3","text":"{animal} corre per {natura}","roles":{"animal":["animal"],"natura":["natura"]}}
    ];
  }
  minijocInicialitzat = true;
}
async function carregarDades(){
  try{ const r=await fetch('./data/categories_emoji.json'); if(r.ok) CATEGORIES_TOTS=await r.json(); }catch(e){}
  try{ const r=await fetch('./data/biblioteca_emoji.json'); if(r.ok) BIBLIOTECA_PLA=await r.json(); }catch(e){}
  try{ const r=await fetch('./data/botiga_emoji.json'); if(r.ok) PACKS_BOTIGA=await r.json(); }catch(e){}
  try{ const r=await fetch('./data/banco_lectura.json'); if(r.ok){ BANCO_VOCAB=await r.json(); BANCO_LECTURA=BANCO_VOCAB; } }catch(e){}
  try{ const r=await fetch('./data/tips.json'); if(r.ok) dadesTips=await r.json(); }catch(e){}
  construirMapaDet();
  agruparBibliotecaPorCategoria(); construirCategories(); construirTotsEmojis(); inicialitzarNomPersonatgeDefault(); renderMapa();
}
function construirMapaDet(){
  MAPA_DET = {};
  for(const cat in CATEGORIES_TOTS){
    const arr = CATEGORIES_TOTS[cat] || [];
    arr.forEach(obj => {
      if(!obj) return;
      const emoji = obj.emoji || obj;
      const base = quitarSkinTone(emoji);
      const det = obj.det || "El";
      const nom = obj.nom || obj.nom_cat || base;
      const genere = obj.genere || "m";
      if(!MAPA_DET[base]){
        MAPA_DET[base] = { det, nom, genere, emojiOriginal: emoji };
      }
    });
  }
  BIBLIOTECA_PLA.forEach(e=>{
    const base = quitarSkinTone(e.emoji);
    if(!MAPA_DET[base]){
      MAPA_DET[base] = { det: "El", nom: e.nom_cat, genere: "m", emojiOriginal: e.emoji };
    }
  });
}
function inicialitzarNomPersonatgeDefault(){if(nomPersonatge) return; const llista = BANCO_LECTURA?.personatges || ["La Laia","En Pau","La Mercè","En Biel","L'Ona","En Roc"]; const triat = llista[Math.floor(Math.random()*llista.length)]; nomPersonatge = triat; localStorage.setItem('cat_nom_personatge', triat);}
function agruparBibliotecaPorCategoria(){BIBLIOTECA_POR_CAT={};BIBLIOTECA_PLA.forEach(e=>{if(!BIBLIOTECA_POR_CAT[e.categoria])BIBLIOTECA_POR_CAT[e.categoria]=[];BIBLIOTECA_POR_CAT[e.categoria].push(e);});}
function construirCategories(){
  const d=new Set(PACK_INICIAL.map(e=>quitarSkinTone(e)));
  estat.compres.forEach(id=>{
    const pId=id.includes('_p')?id.split('_p')[0]:id;
    const p=PACKS_BOTIGA.find(x=>x.id===pId);
    if(p&&p.emojis) p.emojis.forEach(e=>d.add(quitarSkinTone(e.emoji || e)));
  });
  CATEGORIES_DESBLOQUEJADES={};
  Object.keys(CATEGORIES_TOTS).forEach(c=>{
    const arr = CATEGORIES_TOTS[c] || [];
    const filtrats = arr.filter(obj=>{
      const emoji = obj.emoji || obj;
      return d.has(quitarSkinTone(emoji));
    }).map(obj=> (obj.emoji || obj));
    CATEGORIES_DESBLOQUEJADES[c]=filtrats;
  });
  estat.desbloquejats=CATEGORIES_DESBLOQUEJADES;
}
function construirTotsEmojis(){TOTS_EMOJIS=BIBLIOTECA_PLA.map(e=>({...e}));}
document.addEventListener('DOMContentLoaded',async()=>{regenerarEnergia();iniciarRegeneracioAutomatica();mostrarIntro();await carregarDades();await carregarDadesMinijoc();actualitzarUI();canviarTab('mapa',null);setTimeout(()=>{if(!lecturaActualText)generarLectura();},500);});
function canviarTab(tab,e){document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));document.getElementById('tab-'+tab)?.classList.add('active');if(e&&e.target)e.target.closest('.nav-item')?.classList.add('active');else document.querySelector(`.nav-item[onclick*="'${tab}'"]`)?.classList.add('active');if(tab==='mapa')renderMapa();if(tab==='missio')renderMissio();if(tab==='gremi')mostrarSubTab('biblioteca');if(tab==='lectura'){mostrarSubTab('lectura');if(!lecturaActualHTML)setTimeout(()=>generarLectura(),100);}if(tab==='tips')carregarTips();if(tab==='botiga')renderBotiga();}
function mostrarSubTab(sub){const tabActiva=document.querySelector('.tab-content.active');if(!tabActiva)return;tabActiva.querySelectorAll('.sub-tab-content').forEach(t=>t.style.display='none');document.querySelectorAll('.sub-tab-btn').forEach(b=>b.classList.remove('active'));const ids=[`lectura-${sub}`,`lectura-${sub}-inner`,`gremi-${sub}`,`lectura-${sub}-content`,`lectura-${sub}-texto`,`lectura-texto`,`gremi-${sub}-inner`,sub];let target=null;for(let id of ids){target=document.getElementById(id);if(target&&(tabActiva.contains(target)||sub==='lectura'))break;}if(!target){const todos=tabActiva.querySelectorAll('.sub-tab-content');if(sub==='lectura'&&todos[0])target=todos[0];if(sub==='vocab'&&todos[1])target=todos[1];if(sub==='gramatica'&&todos[2])target=todos[2];}if(target){target.style.display='block';const p=target.closest('.sub-tab-content');if(p)p.style.display='block';}document.querySelectorAll(`.sub-tab-btn[onclick*="'${sub}'"]`).forEach(b=>b.classList.add('active'));if(sub==='personatges')mostrarGremiPersonatges();if(sub==='biblioteca')renderDiccionari();if(sub==='minijoc')setTimeout(()=>novaFraseMinijoc(),100);if(sub==='gramatica')setTimeout(()=>generarGramatica(),10);if(sub==='vocab')setTimeout(()=>renderVocabLectura(),10);if(sub==='lectura'){const c=document.getElementById('lectura-texto');if(c&&lecturaActualHTML&&!c.innerHTML.trim())c.innerHTML=lecturaActualHTML;if(c)c.style.display='block';}}
function mostrarIntro(){const el=document.getElementById('intro');if(!el)return;el.style.display='flex';slideActual=0;pintarSlide();el.onclick=()=>seguentSlide();}
function pintarSlide(){const s=INTRO_SLIDES[slideActual];document.getElementById('intro-emoji').textContent=s.emoji;document.getElementById('intro-titol').textContent=s.titol;document.getElementById('intro-text').textContent=s.text;const d=document.getElementById('intro-dots');if(d)d.innerHTML=INTRO_SLIDES.map((_,i)=>`<span style="opacity:${i===slideActual?1:0.3}">●</span>`).join(' ');const b=document.getElementById('intro-btn');if(b){b.textContent=slideActual===INTRO_SLIDES.length-1?'Començar':'Següent';b.onclick=e=>{e.stopPropagation();seguentSlide();};}}
function seguentSlide(){vibrar();if(slideActual<INTRO_SLIDES.length-1){slideActual++;pintarSlide();}else saltarIntro();}
function saltarIntro(){estat.introVist=true;guardarEstat();document.getElementById('intro').style.display='none';}
function renderMapa(){const c=document.getElementById('mapa-contenidor');if(!c)return;if(!CATEGORIES_TOTS||Object.keys(CATEGORIES_TOTS).length===0){let h='<h3 style="text-align:center;margin-bottom:20px;">Carregant mapa...</h3><div class="nivells-grid">';for(let i=1;i<=100;i++)h+=`<div class="nivell-card" style="background:#222;border-color:#333;color:#555;opacity:0.5">${i}</div>`;c.innerHTML=h+'</div>';return;}let h='<h3 style="text-align:center;margin-bottom:20px;">Mapa de Nivells</h3><div class="nivells-grid">';for(let i=1;i<=100;i++){const d=i<=estat.progres.nivellActualMapa,o=d?'1':'0.4',cu=d?'pointer':'not-allowed',co=d?'#22c55e':'#333',oc=d?`jugarNivell(${i})`:'';h+=`<div class="nivell-card" style="border-color:${co};opacity:${o};cursor:${cu}" onclick="${oc}">${i}</div>`;}h+='</div>';c.innerHTML=h;}
function jugarNivell(n){if(n>estat.progres.nivellActualMapa)return;canviarTab('gremi',null);mostrarSubTab('minijoc');}
function renderMissio(){const c=document.getElementById('missio-contenidor');if(!c)return;const n=estat.progres.nivellActualMapa||1,xp=n*100,xpF=xp-(estat.progres.xp||0),nB1=25,pB1=Math.min(100,Math.max(0,(n/nB1)*100)),fB1=Math.max(0,nB1-n);c.innerHTML=`<h3 style="text-align:center;margin-bottom:20px;">Missions</h3><div class="missio-item" onclick="canviarTab('gremi',null);mostrarSubTab('minijoc');" style="cursor:pointer;">${xpF>0?'🎯':'✅'} Et falten ${xpF} acerts per pujar de nivell</div><div class="missio-item" onclick="canviarTab('botiga',null);" style="cursor:pointer;">📦 Desbloqueja tota la biblioteca</div><div class="missio-item" onclick="canviarTab('lectura',null);setTimeout(()=>mostrarSubTab('gramatica'),100);" style="cursor:pointer;">📚 Aprèn gramàtica</div><div class="missio-item" onclick="recarregarEnergia()" style="cursor:pointer;">⚡ Recarrega energia per 50 🪙</div><div class="missio-item"><div style="display:flex;gap:12px;margin-bottom:8px;"><span style="font-size:32px;">${fB1===0?'✅':'🏆'}</span><div style="flex:1;"><div style="font-weight:700;">Arriba al nivell B1</div><div style="font-size:13px;color:#aaa;">Nivell ${n} de ${nB1} - Falten ${fB1}</div></div></div><div style="width:100%;height:8px;background:#333;border-radius:4px;"><div style="width:${pB1}%;height:100%;background:#22c55e;"></div></div></div>`;}
function recarregarEnergia(){if(estat.progres.energia>=100){mostrarMissatge('Ja tens l\'energia al màxim!');return;}if(estat.monedes<50){mostrarMissatge('Necessites 50 monedes');return;}estat.monedes-=50;estat.progres.energia=100;estat.ultimaRecargaEnergia=Date.now();guardarEstat();actualitzarUI();renderMissio();vibrar();mostrarMissatge('Energia recarregada!');}
function mostrarGremiPersonatges(){const c=document.getElementById('gremi-personatges');if(!c)return;const noms=new Set(BANCO_LECTURA?.personatges || []);const p=PERSONATGES_JUGADOR.find(p=>p.id===estat.personatgeTriat);let h=`<div style="text-align:center;padding:20px;"><div style="font-size:80px;">${p.emoji}</div><h3>${p.nom}</h3><p style="color:#22c55e;">Preferit: <b>${nomPersonatge || 'aleatori'}</b></p><div style="border-top:1px solid #333;padding-top:20px;"><h4>Canvia avatar</h4><div class="emoji-grid">`;PERSONATGES_JUGADOR.forEach(x=>{const s=x.id===estat.personatgeTriat;h+=`<div class="emoji-item" style="border:${s?'2px solid #22c55e':'1px solid #333'};cursor:pointer;" onclick="triarPersonatge('${x.id}')"><div class="emoji-large">${x.emoji}</div><div class="emoji-name">${x.nom}</div></div>`;});h+=`</div></div></div>`;c.innerHTML=h;}
function triarPersonatge(id){estat.personatgeTriat=id;guardarEstat();actualitzarUI();mostrarGremiPersonatges();vibrar();}
function renderDiccionari(){const c=document.getElementById('gremi-biblioteca');if(!c)return;let h=`<h3 style="text-align:center;">Biblioteca</h3>`;const base=PACK_INICIAL.map(e=>quitarSkinTone(e));for(const[cat,emojis]of Object.entries(BIBLIOTECA_POR_CAT)){h+=`<h4 style="margin:20px 0 8px;color:#4CAF50;text-transform:capitalize;">${cat}</h4><div class="emoji-grid">`;emojis.forEach(e=>{const net=quitarSkinTone(e.emoji),esBase=base.includes(net),perPack=estat.compres.some(id=>{const pid=id.includes('_p')?id.split('_p')[0]:id;const pack=PACKS_BOTIGA.find(p=>p.id===pid);return pack&&pack.emojis.some(pe=>quitarSkinTone((pe.emoji||pe))===net);}),des=esBase||perPack;h+=`<div class="emoji-item" style="opacity:${des?'1':'0.12'};filter:${des?'':'grayscale(1)'};"><div class="emoji-large">${e.emoji}</div><div class="emoji-name">${e.nom_cat}</div></div>`;});h+=`</div>`;}c.innerHTML=h;}

// FIX V25 LOGIC - AQUI ESTA EL FIX DEFINITIU
function obtenirArticleNet(emoji){
  const base = quitarSkinTone(emoji);
  const info = MAPA_DET[base];
  if(!info) return emoji;
  let det = info.det;
  let nom = info.nom;
  if(nom.toLowerCase()==="home" && det==="En") det="L'";
  if(nom.toLowerCase()==="dona" && det==="Na") det="La";
  if(det==="L'" || det==="l'") return det+nom;
  return det+" "+nom;
}
function obtenirNomSenseArticle(emoji){
  const b=quitarSkinTone(emoji);
  const i=MAPA_DET[b];
  return i?i.nom:emoji;
}
function obtenirArticle(emoji){ return obtenirArticleNet(emoji); }
function generarFraseDinamicaLogica(pl, jug){
  let text=pl.text;
  let sol=[];
  let usats=new Set();
  let claus = pl.roles? Object.keys(pl.roles) : (pl.categories || []);
  // Soporta vell i nou format
  if(!pl.roles){
    claus = [];
    let occ = {};
    let tmp = text;
    let idx=0;
    while(tmp.includes('{persona}') && (tmp.match(/\{persona\}/g)||[]).length>1){
      idx++;
      tmp = tmp.replace('{persona}', '{persona}').replace('{persona}', '{persona_'+(idx+1)+'}');
      if(idx>5) break;
    }
    const all = text.match(/\{(\w+)\}/g) || [];
    all.forEach(m=>{ const k=m.replace(/[{}]/g,''); if(!claus.includes(k)) claus.push(k); });
  }
  for(const rol of claus){
    const baseKey = rol.split('_')[0];
    const cats = pl.roles? pl.roles[rol] : [baseKey];
    let pool=[];
    cats.forEach(cat=>{
      (CATEGORIES_TOTS[cat]||[]).forEach(o=>{
        const em=o.emoji||o;
        const base=quitarSkinTone(em);
        if(!usats.has(base) && jug.some(j=>quitarSkinTone(j)===base)) pool.push(em);
      });
      (BIBLIOTECA_POR_CAT[cat]||[]).forEach(e=>{
        const base=quitarSkinTone(e.emoji);
        if(!usats.has(base) && jug.some(j=>quitarSkinTone(j)===base)){
          if(!pool.some(p=>quitarSkinTone(p)===base)) pool.push(e.emoji);
        }
      });
    });
    if(pool.length===0) continue;
    const elegido=pool[Math.floor(Math.random()*pool.length)];
    usats.add(quitarSkinTone(elegido));
    let reemplazo=obtenirArticleNet(elegido);
    if(text.includes('a {'+rol+'}')){
      if(reemplazo.startsWith('El ')) reemplazo='el '+obtenirNomSenseArticle(elegido);
      if(reemplazo.startsWith("L'")) reemplazo="l'"+obtenirNomSenseArticle(elegido);
      if(reemplazo.startsWith('La ')) reemplazo='la '+obtenirNomSenseArticle(elegido);
      text=text.replace('a {'+rol+'}','a '+reemplazo);
    } else if(text.includes('amb {'+rol+'}') || text.includes('per {'+rol+'}') || text.includes('sota {'+rol+'}') || text.includes('de {'+rol+'}')){
      text=text.replace('{'+rol+'}',reemplazo.toLowerCase());
    } else {
      text=text.replace('{'+rol+'}',reemplazo);
    }
    sol.push(elegido);
  }
  text=text.replace(/En home/g, "L'home").replace(/Na dona/g, 'La dona');
  text=text.replace(/al El /g,'al ').replace(/a El /gi,'al ').replace(/a La /gi,'a la ').replace(/amb El /g,'amb el ').replace(/amb La /g,'amb la ');
  text=text.replace(/ +/g,' ').trim();
  if(text.length>0) text=text.charAt(0).toUpperCase()+text.slice(1);
  return {text, solucio:sol};
}
function generarFraseDinamica(pl, jug){ return generarFraseDinamicaLogica(pl, jug); }
function novaFraseMinijoc(){
  const fraseEl=document.getElementById('minijoc-frase');
  const triatsEl=document.getElementById('minijoc-triats');
  const feedbackEl=document.getElementById('minijoc-feedback');
  const nivellEl=document.getElementById('minijoc-nivell');
  const gridEl=document.getElementById('minijoc-emojis');
  if(fraseEl &&!FRASES_MINIJOC.length){
    fraseEl.textContent="Carregant frases...";
    carregarDadesMinijoc().then(()=>novaFraseMinijoc());
    return;
  }
  if(!minijocInicialitzat){
    if(fraseEl) fraseEl.textContent="Carregant...";
    setTimeout(()=>novaFraseMinijoc(),300);
    return;
  }
  const emojisJugador=BIBLIOTECA_PLA.filter(e=>{
    const net=quitarSkinTone(e.emoji),esBase=PACK_INICIAL.map(x=>quitarSkinTone(x)).includes(net),
    perPack=estat.compres.some(id=>{const pid=id.includes('_p')?id.split('_p')[0]:id;const pack=PACKS_BOTIGA.find(p=>p.id===pid);return pack&&pack.emojis.some(pe=>quitarSkinTone((pe.emoji||pe))===net);});
    return esBase||perPack;
  }).map(e=>e.emoji);
  let emojisUsables = emojisJugador.length>0? emojisJugador : PACK_INICIAL;
  if(emojisUsables.length<2){
    if(fraseEl) fraseEl.textContent="Desbloqueja més packs!";
    if(gridEl) gridEl.innerHTML='';
    return;
  }
  const pl=FRASES_MINIJOC[Math.floor(Math.random()*FRASES_MINIJOC.length)];
  const{text,solucio}=generarFraseDinamicaLogica(pl,emojisUsables);
  minijoc.fraseObjectiu={text,solucio};
  minijoc.emojisTriats=[];
  if(fraseEl) fraseEl.textContent=text;
  if(triatsEl) triatsEl.textContent='';
  if(feedbackEl) feedbackEl.innerHTML='';
  if(nivellEl) nivellEl.textContent=`Nivell ${estat.progres.nivellActualMapa} - ${solucio.length} emojis`;
  generarOpcionsMinijoc(solucio);
}
function generarOpcionsMinijoc(solucio){const grid=document.getElementById('minijoc-emojis');if(!grid)return;const num=solucio.length<=3?16:20,numF=num-solucio.length;const emojisJugador=BIBLIOTECA_PLA.filter(e=>{const net=quitarSkinTone(e.emoji),esBase=PACK_INICIAL.map(x=>quitarSkinTone(x)).includes(net),perPack=estat.compres.some(id=>{const pid=id.includes('_p')?id.split('_p')[0]:id;const pack=PACKS_BOTIGA.find(p=>p.id===pid);return pack&&pack.emojis.some(pe=>quitarSkinTone((pe.emoji||pe))===net);});return esBase||perPack;}).map(e=>e.emoji);let baseJug=emojisJugador.length>0?emojisJugador:PACK_INICIAL;const falsos=baseJug.filter(e=>!solucio.some(s=>quitarSkinTone(e)===quitarSkinTone(s))).sort(()=>0.5-Math.random()).slice(0,numF);const opcions=[...solucio,...falsos].sort(()=>0.5-Math.random());minijoc.emojisDisponibles=opcions;grid.innerHTML='';opcions.forEach((emoji,i)=>{const ed=BIBLIOTECA_PLA.find(e=>quitarSkinTone(e.emoji)===quitarSkinTone(emoji));const div=document.createElement('div');div.className='emoji-item';div.innerHTML=`<div class="emoji-large">${emoji}</div><div class="emoji-name">${ed?.nom_cat||''}</div>`;div.onclick=()=>triarEmojiMinijoc(i);grid.appendChild(div);});}
function triarEmojiMinijoc(idx){vibrar();const emoji=minijoc.emojisDisponibles[idx],max=minijoc.fraseObjectiu.solucio.length;if(minijoc.emojisTriats.length<max){minijoc.emojisTriats.push(emoji);document.getElementById('minijoc-triats').textContent=minijoc.emojisTriats.join(' ');if(minijoc.emojisTriats.length===max)setTimeout(comprovarMinijoc,300);}}
function comprovarMinijoc(){const fb=document.getElementById('minijoc-feedback');if(!fb||!minijoc.fraseObjectiu)return;const sol=minijoc.fraseObjectiu.solucio.map(quitarSkinTone).join(''),tri=minijoc.emojisTriats.map(quitarSkinTone).join('');if(sol===tri){fb.innerHTML=`<p style="color:#4CAF50;font-weight:bold;">Correcte! +5 🪙</p>`;estat.monedes+=5;estat.progres.encerts++;estat.progres.frasesDesDeUltimNivell++;if(estat.progres.frasesDesDeUltimNivell>=25&&estat.progres.nivellActualMapa<100){estat.progres.nivellActualMapa++;estat.progres.frasesDesDeUltimNivell=0;mostrarMissatge(`🔓 Nivell ${estat.progres.nivellActualMapa} desbloquejat!`);}NIVELL_MINIJOC.nivelActual=Math.min(NIVELL_MINIJOC.nivelActual+1,5);guardarEstat();actualitzarUI();setTimeout(()=>novaFraseMinijoc(),1500);}else{fb.innerHTML=`<p style="color:#f44336;">No és així. Era: ${minijoc.fraseObjectiu.solucio.join(' ')}</p>`;setTimeout(()=>novaFraseMinijoc(),2000);}}
async function cargarBancoLectura(){if(BANCO_LECTURA&&BANCO_LECTURA.regles_globals)return BANCO_LECTURA;const r=await fetch('./data/banco_lectura.json');BANCO_LECTURA=await r.json();if(!nomPersonatge) inicialitzarNomPersonatgeDefault();return BANCO_LECTURA;}
function renderVocabLectura(){const c=document.getElementById('lectura-vocab-inner')||document.getElementById('lectura-vocab');if(!c)return;if(lecturaActualVocab.length===0){c.innerHTML='<div style="padding:20px;text-align:center;opacity:0.6"><p>Genera una lectura</p></div>';return;}c.innerHTML=`<div class="vocab-grid">${lecturaActualVocab.map(w=>`<div class="vocab-card"><div class="vocab-word">${w}</div></div>`).join('')}</div>`;}
async function generarLectura(){if(!gastarEnergia(30)){alert('No tens energia');return;}const banco=await cargarBancoLectura(),nivell=getCurrentLevel(),data=banco[nivell];if(!data||!data.plantillas){const c=document.getElementById('lectura-texto');if(c)c.innerHTML='<p>No hi ha lectures</p>';return;}const llista=banco.personatges;let pers=llista[Math.floor(Math.random()*llista.length)];nomPersonatge=pers;let genere=banco.personatges_detall[pers];if(typeof genere==='object')genere=genere.g||'m';genere=genere||'m';const pronom=genere==='f'?'ella':'ell';lecturaActualVocab=[];lecturaContext={genere};const plantilla=data.plantillas[Math.floor(Math.random()*data.plantillas.length)],temes=['la_familia','la_casa','l_escola'],tema=temes[Math.floor(Math.random()*temes.length)];const vocab=data[tema];if(!vocab)return;function pick(k,a){if(!a||!a.length)return k;if(lecturaContext[k])return lecturaContext[k];const v=a[Math.floor(Math.random()*a.length)];if(!lecturaActualVocab.includes(v))lecturaActualVocab.push(v);lecturaContext[k]=v;return v;}function reempla(t){return t.replace(/\$\{(\w+)\}/g,(m,k)=>{if(k==='personatge')return pers;if(k==='pronom')return pronom;if(vocab[k])return pick(k,vocab[k]);return lecturaContext[k]||k;});}const tit=reempla(plantilla.titol);let frases=plantilla.seq.map(l=>reempla(l));let textBase=frases.join(' ');lecturaActualText=textBase;lecturaActualPreguntes=plantilla.preguntes.map(p=>({q:reempla(p.q),opcions:p.opcions.map(o=>reempla(o)),correcta:p.correcta}));const html=`<div class="lectura-card"><h3>${tit}</h3><p class="lectura-text">${lecturaActualText}</p><div class="lectura-preguntes">${lecturaActualPreguntes.map((p,i)=>`<div style="margin-bottom:15px;"><p><strong>${i+1}. ${p.q}</strong></p>${p.opcions.map((op,j)=>`<button class="btn btn-sec" style="display:block;width:100%;margin:5px 0;" onclick="comprovarPregunta(${i},${j})">${op}</button>`).join('')}<div id="feedback-${i}"></div></div>`).join('')}</div><button class="btn btn-primari" onclick="generarLectura()" style="margin-top:15px;">Nova lectura</button></div>`;lecturaActualHTML=html;const el=document.getElementById('lectura-texto');if(el){el.innerHTML=html;el.style.display='block';}renderVocabLectura();}
function comprovarPregunta(i,r){const p=lecturaActualPreguntes[i],fb=document.getElementById(`feedback-${i}`);if(r===p.correcta){fb.innerHTML='<span style="color:#4CAF50">Correcte! +0.5 XP</span>';estat.progres.encerts+=0.5;guardarEstat();actualitzarUI();}else fb.innerHTML=`<span style="color:#f44336">No. Era: ${p.opcions[p.correcta]}</span>`;}
function slugGramatica(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_');}
async function generarGramatica(){const cont=document.getElementById('lectura-gramatica-inner')||document.getElementById('lectura-gramatica');if(!cont)return;const banco=await cargarBancoLectura();if(!banco||!banco.gramatica||!banco.gramatica.guia){cont.innerHTML=`<div style="padding:20px;opacity:0.6"><p>No trobo gramatica.guia</p></div>`;return;}const G=banco.gramatica.guia,keys=Object.keys(G);let h=`<div style="display:flex;gap:8px;margin-bottom:15px;"><button class="btn ${gramaticaMode==='contextual'?'btn-primari':'btn-sec'}" onclick="setGramaticaMode('contextual')">Contextual</button><button class="btn ${gramaticaMode==='guia'?'btn-primari':'btn-sec'}" onclick="setGramaticaMode('guia')">Guia</button></div>`;if(gramaticaMode==='contextual'){if(!lecturaActualText){cont.innerHTML=h+`<div style="padding:20px;"><p>Genera primer una lectura</p></div>`;return;}h+=`<div class="grammar-card"><div class="grammar-title">Gramàtica contextual</div><div class="grammar-explanation">${lecturaActualText.slice(0,200)}...</div></div>`;}else{if(!gramaticaTemaSeleccionat){h+=`<div class="emoji-grid">`;keys.forEach(k=>{const t=G[k];h+=`<div class="emoji-item" onclick="seleccionarTemaGramatica('${slugGramatica(k)}')" style="cursor:pointer;"><div class="emoji-large">${t.emoji||'📚'}</div><div class="emoji-name">${t.titol}</div></div>`;});h+=`</div>`;}else{const kr=gramaticaTemaSeleccionat;h+=`<button class="btn btn-sec" onclick="tornarAGuia()">← Tornar</button><div class="grammar-card"><div class="grammar-title">Tema</div></div>`;}}cont.innerHTML=h;}
function setGramaticaMode(m){gramaticaMode=m;gramaticaTemaSeleccionat=null;generarGramatica();}
function seleccionarTemaGramatica(s){gramaticaTemaSeleccionat=s;generarGramatica();}
function tornarAGuia(){gramaticaTemaSeleccionat=null;generarGramatica();}
window.setGramaticaMode=setGramaticaMode;window.seleccionarTemaGramatica=seleccionarTemaGramatica;window.tornarAGuia=tornarAGuia;window.generarGramatica=generarGramatica;
function carregarTips(){const n=getCurrentLevel();if(totsElsTips.length===0)totsElsTips=dadesTips[n]||[];mostrarTipRandom();}
function mostrarTipRandom(){if(!totsElsTips||totsElsTips.length===0){const el=document.getElementById('tip-text');if(el)el.textContent='No hi ha tips';return;}if(tipsUsats.length===totsElsTips.length)tipsUsats=[];let idx;do{idx=Math.floor(Math.random()*totsElsTips.length);}while(tipsUsats.includes(idx));tipsUsats.push(idx);const tip=totsElsTips[idx];document.getElementById('tip-text').textContent=tip.truc;const ex=document.getElementById('tip-exemple');if(ex)ex.textContent=tip.exemple||'';}
function renderBotiga(){const c=document.getElementById('botiga-contenidor');if(!c)return;if(!PACKS_BOTIGA||PACKS_BOTIGA.length===0){c.innerHTML=`<div style="text-align:center;padding:40px;opacity:0.6;">No hi ha packs</div>`;return;}c.innerHTML='';PACKS_BOTIGA.forEach(pack=>{let subs=[];if(pack.emojis.length>6){for(let i=0;i<pack.emojis.length;i+=6){const ch=pack.emojis.slice(i,i+6),num=Math.floor(i/6)+1,tot=Math.ceil(pack.emojis.length/6),preu=Math.ceil(pack.preu/tot);subs.push({id:`${pack.id}_p${num}`,nom:`${pack.nom} ${num}/${tot}`,descripcio:pack.descripcio,preu,emojis:ch});}}else subs=[{id:pack.id,nom:pack.nom,descripcio:pack.descripcio,preu:pack.preu,emojis:pack.emojis}];subs.forEach(sp=>{const comp=estat.compres.includes(sp.id),card=document.createElement('div');card.className='capitol-card';card.innerHTML=`<div class="capitol-icona">🎁</div><h3>${sp.nom}</h3><p style="color:#aaa;margin:8px 0;">${sp.descripcio}</p><p style="font-size:24px;">${sp.emojis.map(e=>e.emoji).join(' ')}</p><button class="btn ${comp?'btn-sec':''}" onclick="comprarPack('${sp.id}',${sp.preu})" ${comp?'disabled':''}>${comp?'Desbloquejat':'🪙 '+sp.preu}</button>`;c.appendChild(card);});});}
function comprarPack(id,preu){if(estat.monedes<preu){mostrarMissatge('No tens prou monedes');return;}estat.monedes-=preu;estat.compres.push(id);NIVELL_MINIJOC.nivelActual=Math.min(NIVELL_MINIJOC.nivelActual+1,5);guardarEstat();actualitzarUI();construirCategories();construirMapaDet();renderBotiga();renderDiccionari();mostrarMissatge('Pack desbloquejat!');}
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(e=>console.log('SW error:',e));});}