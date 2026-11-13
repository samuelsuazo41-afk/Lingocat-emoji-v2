// main.js v23.8 COMPLET - 68 PLANTILLAS - A1 1-33 + A2 34-66 + B1 67-100 - PARCHE v23.8 MINIJOC: DESFER + BOTTOM NAV - RESTO IGUAL v23
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
    xp: parseInt(localStorage.getItem('cat_xp')) || 0,
    ratxa: parseInt(localStorage.getItem('cat_ratxa')) || 0
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
let minijoc={fraseObjectiu:null,emojisTriats:[],emojisDisponibles:[],plantillaActual:null}; let minijocInicialitzat=false; let totsElsTips=[]; let tipsUsats=[]; let slideActual=0;
const INTRO_SLIDES=[{emoji:"🙀",titol:"Benvingut a Cat Lingo",text:"Aprèn català en 5 minuts al dia."},{emoji:"⛷️",titol:"Vocabulari visual",text:"Toca emojis i aprèn paraules."},{emoji:"📝",titol:"Gramàtica fàcil",text:"Explicacions curtes amb exemples."},{emoji:"📚",titol:"Lectures adaptades",text:"Textos al teu nivell A1, A2 o B1."},{emoji:"🚀",titol:"A jugar!",text:"Prem Saltar per començar"}];
let gramaticaMode='contextual'; let gramaticaTemaSeleccionat=null;
let MAPA_DET = {};
let lecturaCorrectes = 0; let lecturaTotalPreguntes = 0; let lecturaBonusDonat = false;
let gramaticaCorrectes = 0; let gramaticaTotalQuiz = 0; let gramaticaBonusDonat = false;
let filtreBiblioteca = '';
const CATS_SENSE_ARTICLE = new Set(['numero','direccio','temps','emocio','clima','accio','esport']);
function quitarSkinTone(e){return e? e.replace(/[\u{1F3FB}-\u{1F3FF}]/gu,'') : '';}
function vibrar(){if(navigator.vibrate)navigator.vibrate(50);}
function mostrarMissatge(t){const d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#22c55e;color:#000;padding:12px 20px;border-radius:8px;font-weight:700;z-index:10000;';document.body.appendChild(d);setTimeout(()=>d.remove(),2000);}
function actualitzarUI(){const m=document.getElementById('monedes'),n=document.getElementById('nivell'),e=document.getElementById('energia'),b=document.getElementById('barra-progres'),h=document.getElementById('header-personatge');if(m)m.textContent=estat.monedes;if(n)n.textContent=estat.progres.nivellActualMapa;if(e)e.textContent=estat.progres.energia;if(b)b.style.width=((estat.progres.frasesDesDeUltimNivell/encertsNecessarisPerNivell(estat.progres.nivellActualMapa))*100)+'%';const p=PERSONATGES_JUGADOR.find(p=>p.id===estat.personatgeTriat);if(h&&p)h.textContent=p.emoji;}
function regenerarEnergia(){const a=Date.now(),d=Math.floor((a-estat.ultimaRecargaEnergia)/60000);if(d>=5&&estat.progres.energia<100){const bl=Math.floor(d/5);estat.progres.energia=Math.min(100,estat.progres.energia+bl*30);estat.ultimaRecargaEnergia=a-((d%5)*60000);guardarEstat();actualitzarUI();}}
function iniciarRegeneracioAutomatica(){setInterval(()=>{if(estat.progres.energia<100){estat.progres.energia=Math.min(100,estat.progres.energia+30);guardarEstat();actualitzarUI();if(document.getElementById('tab-missio')?.classList.contains('active'))renderMissio();}},5*60*1000);}
function guardarEstat(){localStorage.setItem('cat_monedes',estat.monedes);localStorage.setItem('cat_compres',JSON.stringify(estat.compres));localStorage.setItem('cat_nivell',estat.progres.nivellActualMapa);localStorage.setItem('cat_encerts',estat.progres.encerts);localStorage.setItem('cat_frasesContador',estat.progres.frasesDesDeUltimNivell);localStorage.setItem('cat_energia',estat.progres.energia);localStorage.setItem('cat_ultimaEnergia',estat.ultimaRecargaEnergia);localStorage.setItem('cat_intro',JSON.stringify(estat.introVist));localStorage.setItem('cat_desbloquejats',JSON.stringify(estat.desbloquejats));localStorage.setItem('cat_personatge',estat.personatgeTriat);localStorage.setItem('cat_xp',estat.progres.xp);localStorage.setItem('cat_ratxa',estat.progres.ratxa||0);}
function donarBonusDiari(){
  const avui = new Date().toDateString();
  const ultim = localStorage.getItem('cat_bonus_diari');
  if(ultim !== avui){
    estat.monedes += 10;
    localStorage.setItem('cat_bonus_diari', avui);
    guardarEstat(); actualitzarUI();
    setTimeout(()=>mostrarMissatge('🎁 Bonus diari! +10 🪙 per tornar avui'), 800);
  }
}
function getCurrentLevel(){if(estat.progres.nivellActualMapa<=33)return'a1';if(estat.progres.nivellActualMapa<=66)return'a2';return'b1';}
function getGrupNivell(n){ if(n<=33) return 'A1'; if(n<=66) return 'A2'; return 'B1'; }
function getColorNivell(n){ if(n<=33) return '#22c55e'; if(n<=66) return '#f59e0b'; return '#3b82f6'; }
function getFonsNivell(n){ if(n<=33) return 'rgba(34,197,94,0.15)'; if(n<=66) return 'rgba(245,158,11,0.15)'; return 'rgba(59,130,246,0.15)'; }
function encertsNecessarisPerNivell(n){ return 25 + Math.floor((Math.max(1,n)-1)/10)*5; }
function recompensaPerPlantilla(pl){ if(!pl) return 6; const id=(pl.id||''); if(id.startsWith('p7')||id.startsWith('p8')) return 15; if(id.startsWith('p4')||id.startsWith('p5')) return 10; if(id.startsWith('p1')) return 5; return 6; }
function getPlantillesDisponibles(){ const nivell=estat.progres.nivellActualMapa||1; let llista=FRASES_MINIJOC.filter(p=>{ const minMapa=p.minMapa||1; return minMapa<=nivell; }); if(!llista.length) llista=FRASES_MINIJOC.filter(p=>(p.id||'').startsWith('p1')); if(!llista.length) llista=FRASES_MINIJOC; return llista; }
function gastarEnergia(c){if(DEBUG_NO_ENERGIA)return true;if(estat.progres.energia<c)return false;estat.progres.energia-=c;guardarEstat();actualitzarUI();return true;}
async function carregarDadesMinijoc(){
  try{ const fr = await fetch('./data/minijoc_frases.json'); if(fr.ok){ const d = await fr.json(); FRASES_MINIJOC = Array.isArray(d)? d : (d.frases || []); } }catch(e){ console.log('minijoc error', e); }
  if(!FRASES_MINIJOC.length){ FRASES_MINIJOC = [{"id":"p1_1","text":"{persona} mira {objecte}","roles":{"persona":["persona"],"objecte":["objecte"]},"minMapa":1},{"id":"p1_2","text":"{persona} porta {roba}","roles":{"persona":["persona"],"roba":["roba"]},"minMapa":1},{"id":"p1_3","text":"{persona} va cap a {direccio}","roles":{"persona":["persona"],"direccio":["direccio"]},"minMapa":1},{"id":"p1_4","text":"Són {numero} {animal}","roles":{"numero":["numero"],"animal":["animal"]},"minMapa":1}]; }
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
  if(!MAPA_DET['🎵']) MAPA_DET['🎵'] = { det: 'La', nom: 'música', genere: 'f', categoria: 'musica', emojiOriginal: '🎵' };
  if(!MAPA_DET['❤️']) MAPA_DET['❤️'] = { det: 'El', nom: 'cor', genere: 'm', categoria: 'simbol', emojiOriginal: '❤️' };
  if(!MAPA_DET['🎵']) MAPA_DET[quitarSkinTone('🎵')] = MAPA_DET['🎵'];
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
document.addEventListener('DOMContentLoaded',async()=>{regenerarEnergia();iniciarRegeneracioAutomatica();mostrarIntro();await carregarDades();await carregarDadesMinijoc();actualitzarUI();donarBonusDiari();canviarTab('mapa',null);setTimeout(()=>{if(!lecturaActualText)generarLectura();},500);});
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
function mostrarSubTab(sub){const tabActiva=document.querySelector('.tab-content.active');if(!tabActiva)return;if(tabActiva.id==='tab-gremi'){tabActiva.classList.toggle('minijoc-actiu', sub==='minijoc');}else{tabActiva.classList.remove('minijoc-actiu');}tabActiva.querySelectorAll('.sub-tab-content').forEach(t=>t.style.display='none');document.querySelectorAll('.sub-tab-btn').forEach(b=>b.classList.remove('active'));const ids=[`lectura-${sub}`,`lectura-${sub}-inner`,`gremi-${sub}`,`lectura-${sub}-content`,`lectura-${sub}-texto`,`lectura-texto`,`gremi-${sub}-inner`,sub];let target=null;for(let id of ids){target=document.getElementById(id);if(target&&(tabActiva.contains(target)||sub==='lectura'))break;}if(!target){const todos=tabActiva.querySelectorAll('.sub-tab-content');if(sub==='lectura'&&todos[0])target=todos[0];if(sub==='vocab'&&todos[1])target=todos[1];if(sub==='gramatica'&&todos[2])target=todos[2];}if(target){target.style.display='block';const p=target.closest('.sub-tab-content');if(p)p.style.display='block';}document.querySelectorAll(`.sub-tab-btn[onclick*="'${sub}'"]`).forEach(b=>b.classList.add('active'));if(sub==='personatges')mostrarGremiPersonatges();if(sub==='biblioteca')renderDiccionari();if(sub==='minijoc')setTimeout(()=>novaFraseMinijoc(),100);if(sub==='gramatica')setTimeout(()=>generarGramatica(),10);if(sub==='vocab')setTimeout(()=>renderVocabLectura(),10);if(sub==='lectura'){const c=document.getElementById('lectura-texto');if(c&&lecturaActualHTML&&!c.innerHTML.trim())c.innerHTML=lecturaActualHTML;if(c)c.style.display='block';forcarLecturaVisible();}}
function mostrarIntro(){const el=document.getElementById('intro');if(!el)return;el.style.display='flex';slideActual=0;pintarSlide();el.onclick=()=>seguentSlide();}
function pintarSlide(){const s=INTRO_SLIDES[slideActual];document.getElementById('intro-emoji').textContent=s.emoji;document.getElementById('intro-titol').textContent=s.titol;document.getElementById('intro-text').textContent=s.text;const d=document.getElementById('intro-dots');if(d)d.innerHTML=INTRO_SLIDES.map((_,i)=>`<span style="opacity:${i===slideActual?1:0.3}">●</span>`).join(' ');const b=document.getElementById('intro-btn');if(b){b.textContent=slideActual===INTRO_SLIDES.length-1?'Començar':'Següent';b.onclick=e=>{e.stopPropagation();seguentSlide();};}}
function seguentSlide(){vibrar();if(slideActual<INTRO_SLIDES.length-1){slideActual++;pintarSlide();}else saltarIntro();}
function saltarIntro(){estat.introVist=true;guardarEstat();document.getElementById('intro').style.display='none';}
function renderMapa(){const c=document.getElementById('mapa-contenidor');if(!c)return;if(!CATEGORIES_TOTS||Object.keys(CATEGORIES_TOTS).length===0){let h='<h3 style="text-align:center;margin-bottom:20px;">Carregant mapa...</h3><div class="nivells-grid">';for(let i=1;i<=100;i++)h+=`<div class="nivell-card" style="background:#222;border-color:#333;color:#555;opacity:0.5">${i}</div>`;c.innerHTML=h+'</div>';return;}let h='<h3 style="text-align:center;margin-bottom:12px;">Mapa de Nivells</h3><div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;font-size:13px;font-weight:700;"><span style="background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#22c55e;padding:4px 10px;border-radius:20px;">🟢 A1 · 1-33</span><span style="background:rgba(245,158,11,0.15);border:1px solid #f59e0b;color:#f59e0b;padding:4px 10px;border-radius:20px;">🟠 A2 · 34-66</span><span style="background:rgba(59,130,246,0.15);border:1px solid #3b82f6;color:#3b82f6;padding:4px 10px;border-radius:20px;">🔵 B1 · 67-100</span></div><div class="nivells-grid">';for(let i=1;i<=100;i++){const d=i<=estat.progres.nivellActualMapa,o=d?'1':'0.4',cu=d?'pointer':'not-allowed',co=getColorNivell(i),bg=getFonsNivell(i),oc=d?`jugarNivell(${i})`:'';h+=`<div class="nivell-card" data-grup="${getGrupNivell(i)}" style="border-color:${co};background:${bg};opacity:${o};cursor:${cu};color:${d?co:'#888'}" onclick="${oc}">${i}<div style="font-size:10px;font-weight:700;opacity:0.9;">${getGrupNivell(i)}</div></div>`;}h+='</div>';c.innerHTML=h;}
function jugarNivell(n){if(n>estat.progres.nivellActualMapa)return;canviarTab('gremi',null);mostrarSubTab('minijoc');}
function renderMissio(){const c=document.getElementById('missio-contenidor');if(!c)return;const n=estat.progres.nivellActualMapa||1,necessaris=encertsNecessarisPerNivell(n),falten=Math.max(0,necessaris-(estat.progres.frasesDesDeUltimNivell||0)),nB1=25,pB1=Math.min(100,Math.max(0,(n/nB1)*100)),fB1=Math.max(0,nB1-n);c.innerHTML=`<h3 style="text-align:center;margin-bottom:20px;">Missions</h3><div class="missio-item" onclick="canviarTab('gremi',null);mostrarSubTab('minijoc');" style="cursor:pointer;">${falten>0?'🎯':'✅'} Et falten ${falten} encerts per pujar de nivell (Nivell ${n} · ${necessaris} encerts) · Ratxa: ${estat.progres.ratxa||0}/5</div><div class="missio-item" onclick="canviarTab('botiga',null);" style="cursor:pointer;">📦 Desbloqueja tota la biblioteca</div><div class="missio-item" onclick="canviarTab('lectura',null);setTimeout(()=>mostrarSubTab('gramatica'),100);" style="cursor:pointer;">📚 Aprèn gramàtica</div><div class="missio-item" onclick="recarregarEnergia()" style="cursor:pointer;">⚡ Recarrega energia per 50 🪙</div><div class="missio-item"><div style="display:flex;gap:12px;margin-bottom:8px;"><span style="font-size:32px;">${fB1===0?'✅':'🏆'}</span><div style="flex:1;"><div style="font-weight:700;">Arriba al nivell B1</div><div style="font-size:13px;color:#aaa;">Nivell ${n} de ${nB1} - Falten ${fB1}</div></div></div><div style="width:100%;height:8px;background:#333;border-radius:4px;"><div style="width:${pB1}%;height:100%;background:#22c55e;"></div></div></div>`;}
function recarregarEnergia(){if(estat.progres.energia>=100){mostrarMissatge('Ja tens l\'energia al màxim!');return;}if(estat.monedes<50){mostrarMissatge('Necessites 50 monedes');return;}estat.monedes-=50;estat.progres.energia=100;estat.ultimaRecargaEnergia=Date.now();guardarEstat();actualitzarUI();renderMissio();vibrar();mostrarMissatge('Energia recarregada!');}
function mostrarGremiPersonatges(){const c=document.getElementById('gremi-personatges');if(!c)return;let h=`<div style="text-align:center;padding:20px;"><div style="font-size:80px;">${PERSONATGES_JUGADOR.find(p=>p.id===estat.personatgeTriat).emoji}</div><h3>${PERSONATGES_JUGADOR.find(p=>p.id===estat.personatgeTriat).nom}</h3><p style="color:#22c55e;">Preferit: <b>${nomPersonatge || 'aleatori'}</b></p><div style="border-top:1px solid #333;padding-top:20px;"><h4>Canvia avatar</h4><div class="emoji-grid">`;PERSONATGES_JUGADOR.forEach(x=>{const s=x.id===estat.personatgeTriat;h+=`<div class="emoji-item" style="border:${s?'2px solid #22c55e':'1px solid #333'};cursor:pointer;" onclick="triarPersonatge('${x.id}')"><div class="emoji-large">${x.emoji}</div><div class="emoji-name">${x.nom}</div></div>`;});h+=`</div></div></div>`;c.innerHTML=h;}
function triarPersonatge(id){estat.personatgeTriat=id;guardarEstat();actualitzarUI();mostrarGremiPersonatges();vibrar();}
function renderDiccionari(){
  const c=document.getElementById('gremi-biblioteca');if(!c)return;
  const q=(filtreBiblioteca||'').toLowerCase().trim();
  let total=0,desbloquejats=0;
  BIBLIOTECA_PLA.forEach(e=>{
    const net=quitarSkinTone(e.emoji);
    const esBase=PACK_INICIAL.some(p=>quitarSkinTone(p)===net);
    const perPack=estat.compres.some(id=>{const pid=id.includes('_p')?id.split('_p')[0]:id;const pack=PACKS_BOTIGA.find(p=>p.id===pid||p.id===id);return pack&&pack.emojis.some(pe=>quitarSkinTone((pe.emoji||pe))===net);});
    total++; if(esBase||perPack) desbloquejats++;
  });
  const pct=total?Math.round((desbloquejats/total)*100):0;
  let h=`
    <h3 style="text-align:center;">📚 Biblioteca</h3>
    <p style="text-align:center;color:#aaa;font-size:13px;">${desbloquejats} de ${total} desbloquejats · ${pct}%</p>
    <div style="width:100%;height:8px;background:#333;border-radius:4px;margin:8px 0 14px;"><div style="width:${pct}%;height:100%;background:#22c55e;border-radius:4px;"></div></div>
    <input id="cerca-biblioteca" type="text" placeholder="🔍 Busca: gos, poma, bandera, cotxe..." value="${filtreBiblioteca.replace(/"/g,'')}" oninput="filtreBiblioteca=this.value;renderDiccionari();" style="width:100%;padding:12px;border-radius:12px;border:1px solid #333;background:#121212;color:#fff;font-size:15px;margin-bottom:6px;outline:none;">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
      <button class="btn btn-sec" style="margin:0;padding:6px 12px;font-size:12px;" onclick="filtreBiblioteca='';renderDiccionari();">Tot</button>
      <button class="btn btn-sec" style="margin:0;padding:6px 12px;font-size:12px;" onclick="filtreBiblioteca='gos';renderDiccionari();">🐶 Animals</button>
      <button class="btn btn-sec" style="margin:0;padding:6px 12px;font-size:12px;" onclick="filtreBiblioteca='poma';renderDiccionari();">🍎 Menjar</button>
      <button class="btn btn-sec" style="margin:0;padding:6px 12px;font-size:12px;" onclick="filtreBiblioteca='bandera';renderDiccionari();">🌍 Banderes</button>
      <button class="btn btn-sec" style="margin:0;padding:6px 12px;font-size:12px;" onclick="filtreBiblioteca='casa';renderDiccionari();">🏠 Casa</button>
    </div>
  `;
  const base=PACK_INICIAL.map(e=>quitarSkinTone(e));
  let trobat=false;
  for(const[cat,emojis]of Object.entries(BIBLIOTECA_POR_CAT)){
    const filtrats=emojis.filter(e=>{
      if(!q) return true;
      return (e.nom_cat||'').toLowerCase().includes(q)||(e.categoria||'').toLowerCase().includes(q)||(e.para_frases||[]).join(' ').toLowerCase().includes(q)||cat.toLowerCase().includes(q);
    });
    if(!filtrats.length) continue;
    trobat=true;
    h+=`<h4 style="margin:20px 0 8px;color:#4CAF50;text-transform:capitalize;">${cat} (${filtrats.length})</h4><div class="emoji-grid">`;
    filtrats.forEach(e=>{const net=quitarSkinTone(e.emoji),esBase=base.includes(net),perPack=estat.compres.some(id=>{const pid=id.includes('_p')?id.split('_p')[0]:id;const pack=PACKS_BOTIGA.find(p=>p.id===pid || p.id===id);return pack&&pack.emojis.some(pe=>quitarSkinTone((pe.emoji||pe))===net);}),des=esBase||perPack;h+=`<div class="emoji-item" style="opacity:${des?'1':'0.12'};filter:${des?'':'grayscale(1)'};"><div class="emoji-large">${e.emoji}</div><div class="emoji-name">${e.nom_cat}</div></div>`;});
    h+=`</div>`;
  }
  if(!trobat){ h+=`<div style="text-align:center;padding:30px;opacity:.6;">No hi ha resultats per "<b>${filtreBiblioteca}</b>"<br><button class="btn btn-sec" onclick="filtreBiblioteca='';renderDiccionari();">Veure tot</button></div>`; }
  c.innerHTML=h;
  const input=document.getElementById('cerca-biblioteca');
  if(input&&q){input.focus();input.setSelectionRange(input.value.length,input.value.length);}
}
function obtenirArticleNet(emoji){ const base = quitarSkinTone(emoji); const info = MAPA_DET[base]; if(!info) return emoji; if(CATS_SENSE_ARTICLE.has(info.categoria)) return info.nom; let det = info.det; let nom = info.nom; if(det==="En"){ if(nom.toLowerCase()==="home") det="L'"; else det="El"; } if(nom.toLowerCase()==="dona" && det==="Na") det="La"; if(det==="El" && /^[aeiouàèéíòóú]/i.test(nom)) det="L'"; if(det==="L'" || det==="l'") return det+nom; return det+" "+nom; }
function obtenirNomSenseArticle(emoji){ const b=quitarSkinTone(emoji); const i=MAPA_DET[b]; return i?i.nom:emoji; }
function obtenirArticle(emoji){ return obtenirArticleNet(emoji); }
function flexionarEmocio(nom, genere, plural){
  nom = (nom||'').toLowerCase();
  if(nom==='riure') return 'rient';
  if(nom==='somriure') return 'somrient';
  if(nom==='feliç') return plural ? (genere==='f'?'felices':'feliços') : 'feliç';
  if(nom==='content') return plural ? (genere==='f'?'contentes':'contents') : (genere==='f'?'contenta':'content');
  if(nom==='trist') return plural ? (genere==='f'?'tristes':'trists') : (genere==='f'?'trista':'trist');
  if(nom==='enfadat') return plural ? (genere==='f'?'enfadades':'enfadats') : (genere==='f'?'enfadada':'enfadat');
  if(nom==='enamorat') return plural ? (genere==='f'?'enamorades':'enamorats') : (genere==='f'?'enamorada':'enamorat');
  return nom;
}
function formatDireccio(elegido){
  const info = MAPA_DET[quitarSkinTone(elegido)]; if(!info) return obtenirNomSenseArticle(elegido);
  const nom = info.nom;
  if(nom==='amunt' || nom==='avall' || nom==='amunt a la dreta' || nom==='avall a la dreta' || nom==='avall a l\'esquerra' || nom==='amunt a l\'esquerra') return nom;
  if(nom==='dreta') return 'a la dreta';
  if(nom==='esquerra') return "a l'esquerra";
  return nom;
}
function formatTemps(elegido){ return obtenirNomSenseArticle(elegido); }
function netejarFraseFinal(text){
  text = text.replace(/En home/g, "L'home").replace(/Na dona/g, 'La dona');
  text = text.replace(/^Són la una\b/, 'És la una').replace(/^Són la una i/, 'És la una i');
  text = text.replace(/\btroba (zero|dos|tres|quatre|cinc|sis|set|vuit|nou|deu) (El |La |L')([A-Za-zÀ-ÿ]+)/g, function(m,num,art,nom){ return 'troba ' + art.toLowerCase() + nom + ' número ' + num; });
  const parts = text.split(' ');
  if(parts.length > 1){
    const cap = parts[0];
    let cua = parts.slice(1).join(' ');
    cua = cua.replace(/\bEl\b/g,'el').replace(/\bLa\b/g,'la').replace(/\bL'/g,"l'").replace(/\bEn\b/g,'en');
    cua = cua.replace(/\ba el\b/g,'al').replace(/\bde el\b/g,'del').replace(/\bal el\b/g,'al');
    text = cap + ' ' + cua;
  }
  text = text.replace(/ +/g,' ').trim();
  if(text.length>0) text = text.charAt(0).toUpperCase()+text.slice(1);
  text = text.replace(/\{[^}]+\}/g, '').replace(/ +/g,' ').trim();
  return text;
}
function generarFraseDinamicaLogica(pl, jug){
  let text=pl.text; let sol=[]; let usats=new Set(); let claus = pl.roles? Object.keys(pl.roles) : [];
  if(!pl.roles){ const all = text.match(/\{(\w+)\}/g) || []; all.forEach(m=>{ const k=m.replace(/[{}]/g,''); if(!claus.includes(k)) claus.push(k); }); }
  let generesPersones=[]; let esPluralEmocio=false;
  if(pl.roles && (pl.roles.persona_2 || (pl.text||'').includes('{persona_2}'))) esPluralEmocio=true;
  for(const rol of claus){
    const baseKey = rol.split('_')[0]; const cats = pl.roles? pl.roles[rol] : [baseKey]; let pool=[];
    cats.forEach(cat=>{
      const desbloquejats = (CATEGORIES_DESBLOQUEJADES[cat]||[]);
      const font = desbloquejats.length ? desbloquejats : (CATEGORIES_TOTS[cat]||[]);
      font.forEach(o=>{ const em=o.emoji||o; const base=quitarSkinTone(em); if(!usats.has(base)) pool.push(em); });
      (BIBLIOTECA_POR_CAT[cat]||[]).forEach(e=>{ const base=quitarSkinTone(e.emoji); if(!usats.has(base)){ if(!pool.some(p=>quitarSkinTone(p)===base)) pool.push(e.emoji); } });
      if(!desbloquejats.length){ (CATEGORIES_TOTS[cat]||[]).forEach(o=>{ const em=o.emoji||o; const base=quitarSkinTone(em); if(!usats.has(base) && !pool.some(p=>quitarSkinTone(p)===base)) pool.push(em); }); }
    });
    if(pool.length && (CATEGORIES_DESBLOQUEJADES[cats[0]]||[]).length){
      const filtratDesb = pool.filter(em=>{ return (CATEGORIES_DESBLOQUEJADES[cats[0]]||[]).some(d=>quitarSkinTone(d)===quitarSkinTone(em)) || PACK_INICIAL.some(p=>quitarSkinTone(p)===quitarSkinTone(em)); });
      if(filtratDesb.length) pool = filtratDesb;
    }
    if(pl.permet && pl.permet[rol] && pl.permet[rol].length){
      const permesos = pl.permet[rol].map(s=>s.toLowerCase());
      const filtrat = pool.filter(em => {
        const info = MAPA_DET[quitarSkinTone(em)];
        const nom = (info ? info.nom : em).toLowerCase();
        return permesos.includes(nom);
      });
      if(filtrat.length>0) pool = filtrat;
    }
    if(pl.no_combina && pl.no_combina[rol]){
      const prohibits = pl.no_combina[rol].map(s=>s.toLowerCase());
      const filtrat = pool.filter(em => {
        const info = MAPA_DET[quitarSkinTone(em)];
        const nom = (info ? info.nom : em).toLowerCase();
        return !prohibits.includes(nom);
      });
      if(filtrat.length>0) pool = filtrat;
    }
    if(pool.length===0){ text = text.replaceAll('{'+rol+'}', ''); continue; }
    const elegido=pool[Math.floor(Math.random()*pool.length)]; usats.add(quitarSkinTone(elegido)); const infoElegido = MAPA_DET[quitarSkinTone(elegido)]; const categoriaElegida = infoElegido ? infoElegido.categoria : baseKey;
    if((rol==='persona' || rol==='persona_2') && infoElegido) generesPersones.push(infoElegido.genere || 'm');
    if(categoriaElegida==='emocio'){
      let genereEmocio='m';
      if(generesPersones.length){ genereEmocio = generesPersones.every(g=>g==='f') ? 'f' : 'm'; }
      const flex = flexionarEmocio(obtenirNomSenseArticle(elegido), genereEmocio, esPluralEmocio);
      text = text.replaceAll('{'+rol+'}', flex);
      sol.push(elegido); continue;
    }
    let esSenseArticle = infoElegido && CATS_SENSE_ARTICLE.has(infoElegido.categoria);
    if(categoriaElegida==='forma_color'){ esSenseArticle = false; }
    if(categoriaElegida==='simbol' && infoElegido){
      if(infoElegido.det === '') esSenseArticle = true; else esSenseArticle = false;
    }
    let reemplazo = esSenseArticle? obtenirNomSenseArticle(elegido) : obtenirArticleNet(elegido);
    const esNumeroU = (categoriaElegida==='numero' && (obtenirNomSenseArticle(elegido)==='u' || obtenirNomSenseArticle(elegido)==='un'));
    if(categoriaElegida==='direccio'){
      const dir = formatDireccio(elegido);
      if(text.includes('van {'+rol+'}')){ text=text.replace('van {'+rol+'}', 'van ' + dir); }
      else if(text.includes('va {'+rol+'}')){ text=text.replace('va {'+rol+'}', 'va ' + dir); }
      else if(text.includes('cap a {'+rol+'}')){ text=text.replace('cap a {'+rol+'}', 'cap a ' + dir.replace(/^a /,'')); }
      else if(text.includes(' a {'+rol+'}')){ text=text.replace(' a {'+rol+'}', ' ' + dir); }
      else { text=text.replaceAll('{'+rol+'}', dir); }
      sol.push(elegido); continue;
    }
    if(categoriaElegida==='temps'){
      const t = formatTemps(elegido);
      if(text.includes('A {'+rol+'}')){ text=text.replace('A {'+rol+'}', 'A ' + t); }
      else if(text.includes('Són {'+rol+'}')){ text=text.replace('Són {'+rol+'}', 'Són ' + t); }
      else if(text.includes('a {'+rol+'}')){ text=text.replace('a {'+rol+'}', 'a ' + t); }
      else { text=text.replaceAll('{'+rol+'}', t); }
      sol.push(elegido); continue;
    }
    if(esNumeroU){
      if(text.includes('fins a {'+rol+'}')){ text=text.replaceAll('{'+rol+'}', 'u'); }
      else if(text.includes('Són {'+rol+'}')){ text=text.replace('Són {'+rol+'}', 'És un'); }
      else { text=text.replaceAll('{'+rol+'}', 'un'); }
      sol.push(elegido); continue;
    }
    if(categoriaElegida==='professio' && text.includes('de {'+rol+'}')){
      const nomP = obtenirNomSenseArticle(elegido); const deP = /^[aeiouàèéíòóú]/i.test(nomP) ? "d'" + nomP : "de " + nomP; text=text.replace('de {'+rol+'}', deP); sol.push(elegido); continue;
    }
    if(text.includes('a {'+rol+'}')){ if(!esSenseArticle){ if(reemplazo.startsWith('El ')) reemplazo='el '+obtenirNomSenseArticle(elegido); if(reemplazo.startsWith("L'")) reemplazo="l'"+obtenirNomSenseArticle(elegido); if(reemplazo.startsWith('La ')) reemplazo='la '+obtenirNomSenseArticle(elegido); } text=text.replace('a {'+rol+'}','a '+reemplazo); }
    else if(text.includes('amb {'+rol+'}') || text.includes('per {'+rol+'}') || text.includes('sota {'+rol+'}') || text.includes('de {'+rol+'}')){ text=text.replaceAll('{'+rol+'}', esSenseArticle? reemplazo : reemplazo.toLowerCase()); }
    else { text=text.replaceAll('{'+rol+'}', reemplazo); }
    sol.push(elegido);
  }
  text = netejarFraseFinal(text);
  return {text, solucio:sol};
}
function generarFraseDinamica(pl, jug){ return generarFraseDinamicaLogica(pl, jug); }
let _ultimaPlantillaMinijoc = null;
// v23.6 + v23.7 + v23.8: huecos + instruccio + caixa verda + desfer
function desferUltimEmoji(){
  if(!minijoc.fraseObjectiu) return;
  if(!minijoc.emojisTriats.length) return;
  vibrar();
  minijoc.emojisTriats.pop();
  actualitzarTriatsMinijoc();
}
function actualitzarTriatsMinijoc(){
  const el=document.getElementById('minijoc-triats'); const prof=document.getElementById('minijoc-professor'); const cont=document.getElementById('gremi-minijoc'); const inst=document.getElementById('minijoc-instruccio'); const btnDesfer=document.getElementById('minijoc-desfer');
  if(!el||!minijoc.fraseObjectiu) return;
  const total=minijoc.fraseObjectiu.solucio.length; const fets=minijoc.emojisTriats.length;
  const parts=[];
  for(let i=0;i<total;i++){ parts.push(i<fets ? minijoc.emojisTriats[i] : '○'); }
  const complet = fets===total;
  el.textContent = parts.join(' ') + '  ·  ' + fets + '/' + total + (complet ? ' ✅' : '');
  el.classList.toggle('llarg', total>=4);
  el.classList.toggle('complet', complet);
  if(prof) prof.style.display = fets===0 ? 'block' : 'none';
  if(inst){
    inst.textContent = complet ? '✅ Frase completa! Molt bé!' : '👆 Toca els emojis en ordre per completar la frase';
    inst.classList.toggle('complet', complet);
  }
  if(btnDesfer) btnDesfer.disabled = fets===0;
  if(cont){ cont.classList.toggle('minijoc-llarg', total===4); cont.classList.toggle('minijoc-molt-llarg', total>=5); }
}
function novaFraseMinijoc(){
  const fraseEl=document.getElementById('minijoc-frase'); const feedbackEl=document.getElementById('minijoc-feedback'); const nivellEl=document.getElementById('minijoc-nivell'); const gridEl=document.getElementById('minijoc-emojis');
  if(fraseEl &&!FRASES_MINIJOC.length){ fraseEl.textContent="Carregant frases..."; carregarDadesMinijoc().then(()=>novaFraseMinijoc()); return; }
  if(!minijocInicialitzat){ if(fraseEl) fraseEl.textContent="Carregant..."; setTimeout(()=>novaFraseMinijoc(),300); return; }
  if(!gastarEnergia(5)){ if(fraseEl) fraseEl.textContent="Sense energia! Espera 5 min o recarrega a Missions."; mostrarMissatge('Sense energia!'); return; }
  const emojisUsables = BIBLIOTECA_PLA.length>0 ? BIBLIOTECA_PLA.map(e=>e.emoji) : PACK_INICIAL;
  if(emojisUsables.length<2){ if(fraseEl) fraseEl.textContent="Desbloqueja més packs!"; if(gridEl) gridEl.innerHTML=''; return; }
  let disponibles = getPlantillesDisponibles();
  let candidates = disponibles.filter(p=>p.id!==_ultimaPlantillaMinijoc);
  if(!candidates.length) candidates = disponibles;
  const pl=candidates[Math.floor(Math.random()*candidates.length)]; _ultimaPlantillaMinijoc=pl.id;
  const{text,solucio}=generarFraseDinamicaLogica(pl,emojisUsables); minijoc.fraseObjectiu={text,solucio}; minijoc.plantillaActual=pl; minijoc.emojisTriats=[]; if(fraseEl) fraseEl.textContent=text; if(feedbackEl) feedbackEl.innerHTML=''; if(nivellEl) nivellEl.textContent=`Nivell ${estat.progres.nivellActualMapa} · ${getGrupNivell(estat.progres.nivellActualMapa)} · ${solucio.length} emojis · 🔥 ${estat.progres.ratxa||0}/5 · Falten ${Math.max(0,encertsNecessarisPerNivell(estat.progres.nivellActualMapa)-(estat.progres.frasesDesDeUltimNivell||0))}`; actualitzarTriatsMinijoc(); generarOpcionsMinijoc(solucio);
}
function generarOpcionsMinijoc(solucio){
  const grid=document.getElementById('minijoc-emojis');if(!grid)return; const num = solucio.length<=3 ? 10 : (solucio.length===4 ? 12 : 14); const numF=num-solucio.length;
  let baseTot = BIBLIOTECA_PLA.map(e=>e.emoji);
  ['🎵','❤️'].forEach(e=>{ if(!baseTot.some(x=>quitarSkinTone(x)===quitarSkinTone(e))) baseTot.push(e); });
  if(baseTot.length===0) baseTot = PACK_INICIAL;
  const falsos=baseTot.filter(e=>!solucio.some(s=>quitarSkinTone(e)===quitarSkinTone(s))).sort(()=>0.5-Math.random()).slice(0,numF); const opcions=[...solucio,...falsos].sort(()=>0.5-Math.random()); minijoc.emojisDisponibles=opcions; grid.innerHTML=''; opcions.forEach((emoji,i)=>{ const ed=BIBLIOTECA_PLA.find(e=>quitarSkinTone(e.emoji)===quitarSkinTone(emoji)); const info = MAPA_DET[quitarSkinTone(emoji)]; const nomMostrar = ed?.nom_cat || info?.nom || ''; const div=document.createElement('div');div.className='emoji-item'; div.innerHTML=`<div class="emoji-large">${emoji}</div><div class="emoji-name">${nomMostrar}</div>`; div.onclick=()=>triarEmojiMinijoc(i); grid.appendChild(div); });
}
function triarEmojiMinijoc(idx){vibrar();if(!minijoc.fraseObjectiu) return;const emoji=minijoc.emojisDisponibles[idx],max=minijoc.fraseObjectiu.solucio.length;if(!emoji) return;if(minijoc.emojisTriats.length<max){minijoc.emojisTriats.push(emoji);actualitzarTriatsMinijoc();if(minijoc.emojisTriats.length===max)setTimeout(comprovarMinijoc,300);}}
function comprovarMinijoc(){const fb=document.getElementById('minijoc-feedback');if(!fb||!minijoc.fraseObjectiu)return;const sol=minijoc.fraseObjectiu.solucio.map(quitarSkinTone).join(''),tri=minijoc.emojisTriats.map(quitarSkinTone).join('');if(sol===tri){const recompensa=recompensaPerPlantilla(minijoc.plantillaActual);let bonus=0;estat.progres.ratxa=(estat.progres.ratxa||0)+1;if(estat.progres.ratxa>=5){bonus=10;estat.progres.ratxa=0;mostrarMissatge('🔥 Ratxa de 5! +10 bonus');}estat.monedes+=recompensa+bonus;fb.innerHTML=`<p style="color:#4CAF50;font-weight:bold;">Correcte! +${recompensa} 🪙${bonus?` +${bonus} bonus ratxa`:''} · Ratxa ${estat.progres.ratxa}/5</p>`;estat.progres.encerts++;estat.progres.frasesDesDeUltimNivell++;const necessaris=encertsNecessarisPerNivell(estat.progres.nivellActualMapa);if(estat.progres.frasesDesDeUltimNivell>=necessaris&&estat.progres.nivellActualMapa<100){estat.progres.nivellActualMapa++;estat.progres.frasesDesDeUltimNivell=0;mostrarMissatge(`🔓 Nivell ${estat.progres.nivellActualMapa} desbloquejat! (${getGrupNivell(estat.progres.nivellActualMapa)})`);}guardarEstat();actualitzarUI();setTimeout(()=>novaFraseMinijoc(),1500);}else{estat.progres.ratxa=0;guardarEstat();fb.innerHTML=`<p style="color:#f44336;">No és així. Era: ${minijoc.fraseObjectiu.solucio.join(' ')} · Ratxa a 0</p>`;setTimeout(()=>novaFraseMinijoc(),2000);}}
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
  lecturaCorrectes = 0; lecturaBonusDonat = false;
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
  lecturaTotalPreguntes = lecturaActualPreguntes.length;
  const badge = `<span style="font-size:11px;background:#22c55e;color:#000;padding:2px 6px;border-radius:10px;margin-left:8px;">${plantilla.level || nivell.toUpperCase()} · ${plantilla.name} · ${vocabCat.length} paraules</span>`;
  const html = `<div class="lectura-card"><h3>${tit} ${badge}</h3><p class="lectura-text" style="line-height:1.7;font-size:16px;">${lecturaActualText}</p><div style="margin-top:10px;font-size:12px;color:#aaa;">Tema: ${plantilla.topic||''} | ${plantilla.topic_cat||''} | Vocabulari: ${vocabCat.slice(0,5).join(', ')}</div><div class="lectura-preguntes" style="margin-top:20px;">${lecturaActualPreguntes.map((p,i)=>`<div style="margin-bottom:15px;padding:12px;background:#222;border-radius:8px;"><p><strong>${i+1}. ${p.q}</strong></p>${p.opcions.map((op,j)=>`<button class="btn btn-sec" style="display:block;width:100%;margin:5px 0;text-align:left;" onclick="comprovarPregunta(${i},${j})">${op}</button>`).join('')}<div id="feedback-${i}" style="margin-top:8px;"></div></div>`).join('')}</div><button class="btn btn-primari" onclick="generarLectura()" style="margin-top:15px;">🔄 Nova lectura (${data.plantillas.length} disponibles)</button></div>`;
  lecturaActualHTML = html; const el = document.getElementById('lectura-texto'); if(el){ el.innerHTML = html; el.style.display = 'block'; el.style.visibility='visible'; forcarLecturaVisible(); } renderVocabLectura();
}
function comprovarPregunta(i,r){
  const p=lecturaActualPreguntes[i],fb=document.getElementById(`feedback-${i}`);if(!fb)return;
  if(r===p.correcta){
    if(fb.dataset.premiat === '1'){ fb.innerHTML='<span style="color:#4CAF50">✅ Correcte! +5 🪙</span>'; return; }
    fb.dataset.premiat = '1';
    lecturaCorrectes++;
    estat.monedes += 5;
    estat.progres.encerts+=0.5; estat.progres.xp+=1;
    fb.innerHTML='<span style="color:#4CAF50">✅ Correcte! +5 🪙 +1 XP</span>';
    if(!lecturaBonusDonat && lecturaTotalPreguntes>0 && lecturaCorrectes>=lecturaTotalPreguntes){
      lecturaBonusDonat = true;
      estat.monedes += 15; estat.progres.xp += 5;
      setTimeout(()=>mostrarMissatge('📚 Lectura completada! +15 🪙 bonus'), 400);
    }
    guardarEstat(); actualitzarUI();
  }else fb.innerHTML=`<span style="color:#f44336">❌ No. Era: ${p.opcions[p.correcta]}</span>`;
}
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
  gramaticaCorrectes = 0; gramaticaBonusDonat = false; gramaticaTotalQuiz = (g.mini_quiz||[]).length;
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
  if(j === p.correcta){
    if(fb.dataset.premiat === '1'){ fb.innerHTML = '<span style="color:#4CAF50">✅ Correcte! +3 🪙</span>'; return; }
    fb.dataset.premiat = '1';
    gramaticaCorrectes++;
    estat.monedes += 3; estat.progres.xp+=1;
    fb.innerHTML = '<span style="color:#4CAF50">✅ Correcte! +3 🪙</span>';
    if(!gramaticaBonusDonat && gramaticaTotalQuiz>0 && gramaticaCorrectes>=gramaticaTotalQuiz){
      gramaticaBonusDonat = true;
      estat.monedes += 10; estat.progres.xp += 2;
      setTimeout(()=>mostrarMissatge('🏆 Perfecte! 3/3 Gramàtica +10 🪙 bonus'), 400);
    }
    guardarEstat(); actualitzarUI();
    if(btn){ btn.style.borderColor='#22c55e'; btn.style.background='#1a3a1a'; }
  }
  else { fb.innerHTML = `<span style="color:#f44336">❌ No. Era: ${p.opcions[p.correcta]}</span>`; if(btn){ btn.style.borderColor='#f44336'; btn.style.background='#3a1a1a'; } }
}
function setGramaticaMode(m){gramaticaMode=m;gramaticaTemaSeleccionat=null;generarGramatica();}
function seleccionarTemaGramatica(s){gramaticaTemaSeleccionat=s;generarGramatica();}
function tornarAGuia(){gramaticaTemaSeleccionat=null;generarGramatica();}
window.setGramaticaMode=setGramaticaMode;window.seleccionarTemaGramatica=seleccionarTemaGramatica;window.tornarAGuia=tornarAGuia;window.generarGramatica=generarGramatica;window.repassarVocab=repassarVocab;window.comprovarQuizGramatica=comprovarQuizGramatica;
function carregarTips(){const n=getCurrentLevel();if(totsElsTips.length===0)totsElsTips=dadesTips[n]||[];mostrarTipRandom();}
function mostrarTipRandom(){if(!totsElsTips||totsElsTips.length===0){const el=document.getElementById('tip-text');if(el)el.textContent='No hi ha tips';return;}if(tipsUsats.length===totsElsTips.length)tipsUsats=[];let idx;do{idx=Math.floor(Math.random()*totsElsTips.length);}while(tipsUsats.includes(idx));tipsUsats.push(idx);const tip=totsElsTips[idx];document.getElementById('tip-text').textContent=tip.truc;const ex=document.getElementById('tip-exemple');if(ex)ex.textContent=tip.exemple||'';}
function esPackComprat(pack){
  if(estat.compres.includes(pack.id)) return true;
  return estat.compres.some(id => id === pack.id || id.startsWith(pack.id + '_p'));
}
function getBadgeBotiga(pack){
  const id = pack.id || '';
  const nom = (pack.nom || '').toLowerCase();
  const desc = (pack.descripcio || '').toLowerCase();
  if(id === 'pack_persones_base') return { text: '⭐ RECOMANAT', cls: 'badge-recomanat' };
  if(id.startsWith('pack_persones_skin')) return { text: '🎨 COSMÈTIC', cls: 'badge-cosmetic' };
  if(nom.includes('⭐') || desc.includes('premium')) return { text: '⭐ PREMIUM', cls: 'badge-premium' };
  if(nom.includes('🌍') || desc.includes('genial')) return { text: '🌍 GENIAL', cls: 'badge-genial' };
  if(nom.includes('✨')) return { text: '✨ PREMIUM', cls: 'badge-premium' };
  return null;
}
function renderBotiga(){
  const c = document.getElementById('botiga-contenidor');
  if(!c) return;
  if(!PACKS_BOTIGA || PACKS_BOTIGA.length === 0){
    c.innerHTML = `<div style="text-align:center;padding:40px;opacity:0.6;">No hi ha packs</div>`;
    return;
  }
  c.innerHTML = `
    <div class="botiga-header-luxe">
      <div style="font-size:28px;">⭐ Botiga · Biblioteca</div>
      <div style="font-size:14px;margin-top:4px;"><b>Guanya monedes jugant, llegint i aprenent gramàtica. Sense pagar res.</b></div>
      <div style="font-size:12px;color:#aaa;margin-top:4px;">Minijoc 5-15 🪙 · Lectura +5 per pregunta · Gramàtica +3 per quiz · Bonus diari +10 🪙</div>
      <div style="font-size:12px;color:#fbbf24;margin-top:6px;">${PACKS_BOTIGA.length} packs · ${PACKS_BOTIGA.reduce((a,p)=>a+(p.emojis?p.emojis.length:0),0)} emojis · Compra el pack sencer, no per trossos</div>
    </div>
    <div class="botiga-seccio-titol">⭐ Comença aquí</div>
    <div id="botiga-recomanat"></div>
    <div class="botiga-seccio-titol">📚 Tota la Biblioteca</div>
    <div id="botiga-tots" class="botiga-grid-luxe"></div>
    <div class="botiga-seccio-titol">🎨 Cosmètics - Només aspecte</div>
    <div id="botiga-cosmetic" class="botiga-grid-luxe"></div>
  `;
  const elRecomanat = document.getElementById('botiga-recomanat');
  const elTots = document.getElementById('botiga-tots');
  const elCosmetic = document.getElementById('botiga-cosmetic');
  PACKS_BOTIGA.forEach(pack => {
    const comp = esPackComprat(pack);
    const badge = getBadgeBotiga(pack);
    const card = document.createElement('div');
    card.className = 'capitol-card botiga-card-luxe' + (pack.id === 'pack_persones_base' ? ' card-recomanat' : '') + (comp ? ' card-comprat' : '');
    const nomNet = (pack.nom || '').replace(/^[⭐🌍✨🎨\s]+/, '');
    card.innerHTML = `
      ${badge ? `<span class="badge-botiga ${badge.cls}">${badge.text}</span>` : ''}
      <div class="capitol-icona">🎁</div>
      <h3>${nomNet}</h3>
      <p style="color:#aaa;margin:8px 0;font-size:13px;">${pack.descripcio || ''}</p>
      <p style="font-size:24px;line-height:1.5;">${(pack.emojis || []).map(e => e.emoji).join(' ')}</p>
      <div style="font-size:12px;color:#888;margin:6px 0;">${(pack.emojis || []).length} emojis · Pack sencer</div>
      <button class="btn ${comp ? 'btn-sec' : 'btn-primari'} btn-comprar-luxe" onclick="comprarPack('${pack.id}',${pack.preu})" ${comp ? 'disabled' : ''}>${comp ? '✅ Desbloquejat' : '🪙 ' + pack.preu + ' · Comprar'}</button>
    `;
    if(pack.id === 'pack_persones_base'){
      elRecomanat.appendChild(card);
    } else if(pack.id.startsWith('pack_persones_skin')){
      elCosmetic.appendChild(card);
    } else {
      elTots.appendChild(card);
    }
  });
}
function comprarPack(id, preu){
  const pack = PACKS_BOTIGA.find(p => p.id === id);
  if(pack && esPackComprat(pack)){
    mostrarMissatge('Ja el tens desbloquejat!');
    return;
  }
  if(estat.monedes < preu){ mostrarMissatge('No tens prou monedes'); return; }
  estat.monedes -= preu;
  if(!estat.compres.includes(id)) estat.compres.push(id);
  guardarEstat(); actualitzarUI();
  construirCategories(); construirMapaDet();
  renderBotiga(); renderDiccionari();
  vibrar();
  mostrarMissatge('Pack desbloquejat! 🎉');
}
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(e=>console.log('SW error:',e));});}