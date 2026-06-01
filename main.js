// main.js - Lingocat emoji v2

// ===== ESTADO GLOBAL =====
let estat = {
  monedes: parseInt(localStorage.getItem('cat_monedes')) || 0,
  compres: JSON.parse(localStorage.getItem('cat_compres')) || [],
  introVist: JSON.parse(localStorage.getItem('cat_intro')) || false,
  progres: {
    nivellActualMapa: parseInt(localStorage.getItem('cat_nivell')) || 1,
    encerts: parseInt(localStorage.getItem('cat_encerts')) || 0
  },
  energia: parseInt(localStorage.getItem('cat_energia')) || 100,
  ultimaRecargaEnergia: parseInt(localStorage.getItem('cat_ultimaEnergia')) || Date.now(),
  desbloquejats: JSON.parse(localStorage.getItem('cat_desbloquejats')) || {}
};

const PACK_INICIAL = ["😀","😊","😂","👨","👩","🐶","🐱","🏠","🍎","🚗","⚽","📱","💻","🎵","❤️"];

// ===== DATOS =====
let CATEGORIES_TOTS = {}; // categories_emoji.json - solo para agrupar desbloqueos
let BIBLIOTECA_PLA = []; // biblioteca_emoji.json - array plano con nom_cat, descripcio
let BIBLIOTECA_POR_CAT = {}; // agrupado por categoria para pintar
let PACKS_BOTIGA = []; // botiga_emoji.json
let FRASES_MINIJOC = []; // minijoc_frases.json
let TOTS_EMOJIS = []; // aplanado de BIBLIOTECA_PLA para minijoc
let CATEGORIES_DESBLOQUEJADES = {}; // {categoria: [emoji1, emoji2]}

// ===== MINIJOC =====
let FRASE_ACTUAL = null;
let EMOJIS_TRIATS = [];

// ===== TIPS =====
let totsElsTips = [];
let tipsUsats = [];

// ===== INTRO =====
let slideActual = 0;

// Mapeo por si tu JSON usa "clima" en vez de "natura"
const MAP_CATEGORIES = {
  persona: 'persona', animal: 'animal', menjar: 'menjar', lloc: 'lloc',
  transport: 'transport', esport: 'esport', musica: 'musica', professio: 'professio',
  roba: 'roba', emocio: 'emocio', objecte: 'objecte', natura: 'natura', clima: 'natura'
};

// ===== UTILS =====
function quitarSkinTone(emoji) {
  return emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
}

function actualitzarUI() {
  const monedesEl = document.getElementById('monedes');
  const nivellEl = document.getElementById('nivell');
  const energiaEl = document.getElementById('energia');
  if (monedesEl) monedesEl.textContent = estat.monedes;
  if (nivellEl) nivellEl.textContent = estat.progres.nivellActualMapa;
  if (energiaEl) energiaEl.textContent = estat.energia;
}

function guardarEstat() {
  localStorage.setItem('cat_monedes', estat.monedes);
  localStorage.setItem('cat_compres', JSON.stringify(estat.compres));
  localStorage.setItem('cat_nivell', estat.progres.nivellActualMapa);
  localStorage.setItem('cat_encerts', estat.progres.encerts);
  localStorage.setItem('cat_energia', estat.energia);
  localStorage.setItem('cat_ultimaEnergia', estat.ultimaRecargaEnergia);
  localStorage.setItem('cat_intro', JSON.stringify(estat.introVist));
  localStorage.setItem('cat_desbloquejats', JSON.stringify(estat.desbloquejats));
}

function vibrar() {
  if (navigator.vibrate) navigator.vibrate(50);
}

// ===== CARREGAR DADES =====
async function carregarDades() {
  try {
    const [catRes, bibRes, botRes, frasesRes] = await Promise.all([
      fetch('./data/categories_emoji.json'),
      fetch('./data/biblioteca_emoji.json'),
      fetch('./data/botiga_emoji.json'),
      fetch('./data/minijoc_frases.json')
    ]);

    CATEGORIES_TOTS = await catRes.json();
    BIBLIOTECA_PLA = await bibRes.json();
    PACKS_BOTIGA = await botRes.json();

    const frasesData = await frasesRes.json();
    FRASES_MINIJOC = Array.isArray(frasesData)? frasesData : (frasesData.frases || []);
    console.log('Frases carregades:', FRASES_MINIJOC.length);

  } catch(e) {
    console.error('Error carregant dades:', e);
    alert('Error carregant dades. Revisa que els fitxers /data/ existeixin');
  }

  agruparBibliotecaPorCategoria();
  construirCategories();
  construirTotsEmojis();
  actualitzarUI();
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
    if (pack && pack.emojis) {
      pack.emojis.forEach(e => desbloquejats.add(quitarSkinTone(e.emoji)));
    }
  });

  CATEGORIES_DESBLOQUEJADES = {};
  Object.keys(CATEGORIES_TOTS).forEach(cat => {
    CATEGORIES_DESBLOQUEJADES[cat] = CATEGORIES_TOTS[cat].filter(e =>
      desbloquejats.has(quitarSkinTone(e))
    );
  });

  estat.desbloquejats = CATEGORIES_DESBLOQUEJADES;
}

function construirTotsEmojis() {
  TOTS_EMOJIS = BIBLIOTECA_PLA.map(e => ({...e}));
}


// ===== LECTURA =====  
 let BANCO_VOCAB = {
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
    {truc: "Com = como", exemple: "Com estàs?"}
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
    {truc: "Comparatiu: més/menys... que", exemple: "Més gran que tu"}
  ]
};


// ===== CONSTANTS =====
const INTRO_SLIDES = [
  {emoji: "👋", titol: "Benvingut a Cat Lingo Emoji", text: "Aprèn català jugant amb emojis"},
  {emoji: "🎯", titol: "Missió diària", text: "Completa 25 frases per pujar de nivell"},
  {emoji: "🎁", titol: "Desbloqueja emojis", text: "Compra packs a la botiga i amplia vocabulari"},
  {emoji: "📖", titol: "Generador de lectura", text: "Practica amb textos adaptats al teu nivell"},
  {emoji: "🚀", titol: "Comencem!", text: "Prem Saltar per jugar"}
];

// ===== INICIALITZACIÓ =====
document.addEventListener('DOMContentLoaded', async () => {
  mostrarIntro(); // 1. Intro primero si toca
  await carregarDades(); // 2. Carga datos
  actualitzarUI(); // 3. Pinta UI
  mostrarTab('mapa'); // 4. Activa menú y pinta mapa
});

// ===== NAVEGACIÓ PRINCIPAL =====
function mostrarTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`.nav-btn[onclick="mostrarTab('${tab}')"]`).classList.add('active');

  if (tab === 'mapa') renderMapa();
  if (tab === 'missio') renderMissio();
  if (tab === 'gremi') mostrarSubTab('biblioteca');
  if (tab === 'lectura') generarLectura(); // direct, sense carregarLectures
  if (tab === 'tips') carregarTips();
  if (tab === 'botiga') renderBotiga();
}

function mostrarSubTab(sub) {
  document.querySelectorAll('.sub-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('gremi-' + sub).style.display = 'block';
  document.querySelector(`.sub-tab-btn[onclick="mostrarSubTab('${sub}')"]`).classList.add('active');

  if (sub === 'biblioteca') renderDiccionari();
  if (sub === 'minijoc') setTimeout(() => novaFrase(), 50);
}

// ===== TIPS - SEPARAT DE GREMI I LECTURA =====
let totsElsTips = [];
let tipsUsats = [];

function carregarTips() {
  // Agafa el nivell actual del mapa per filtrar tips A1/A2/B1
  const nivell = estat.progres.nivellActualMapa <= 33? 'a1' : estat.progres.nivellActualMapa <= 66? 'a2' : 'b1';

  if (totsElsTips.length === 0) {
    totsElsTips = dadesTips[nivell] || [];
  }

  // Si canvies de nivell, reseteja
  if (tipsUsats.length === 0 && totsElsTips!== dadesTips[nivell]) {
    totsElsTips = dadesTips[nivell] || [];
  }

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


// ===== GENERADOR DE LECTURA - SEPARAT DE GREMI =====
let lecturesData = {}; // objecte, no array
let lecturaActual = null;

// BANCO_VOCAB ve de banco_lectures.js carregat abans de main.js
lecturesData = BANCO_VOCAB;

function generarLectura() {
  const nivell = estat.progres.nivellActualMapa <= 33? 'a1' : estat.progres.nivellActualMapa <= 66? 'a2' : 'b1';
  const lecturesNivell = lecturesData[nivell]?.plantillas || [];

  const cont = document.getElementById('lectura-contingut');
  if (!cont) return;

  if (lecturesNivell.length === 0) {
    cont.innerHTML = '<p>No hi ha lectures per aquest nivell</p>';
    return;
  }

  lecturaActual = lecturesNivell[Math.floor(Math.random() * lecturesNivell.length)];

  // Tria tema aleatori dels 6 blocs
  const temes = ['la_familia', 'la_casa', 'l_escola', 'la_ciutat', 'la_natura', 'el_temps_lliure'];
  const temaTriat = temes[Math.floor(Math.random() * temes.length)];
  const vocab = lecturesData[nivell][temaTriat];

  // Funció per reemplaçar ${variable} amb paraula aleatòria
  function reemplaçar(text) {
    return text.replace(/\$\{(\w+)\}/g, (match, key) => {
      const opcions = vocab[key];
      if (!opcions ||!opcions.length) return key;
      return opcions[Math.floor(Math.random() * opcions.length)];
    });
  }

  const titol = reemplaçar(lecturaActual.titol);
  const text = lecturaActual.seq.map(linia => reemplaçar(linia)).join(' ');
  const pregunta = reemplaçar(lecturaActual.pregunta);

  cont.innerHTML = `
    <div class="lectura-card">
      <h3>${titol}</h3>
      <p class="lectura-text">${text}</p>
      <div class="lectura-preguntes">
        <p><strong>Pregunta:</strong> ${pregunta}</p>
        <button class="btn-primari" onclick="comprovarLectura()">Respondre</button>
        <div id="feedback-lectura" class="feedback"></div>
      </div>
      <button class="btn-primari" onclick="generarLectura()" style="margin-top:15px;">Nova lectura</button>
    </div>
  `;
}

function comprovarLectura() {
  const feedback = document.getElementById('feedback-lectura');
  const resposta = prompt('Escriu la teva resposta:');
  if (resposta && resposta.trim().length > 3) {
    feedback.innerHTML = '<p style="color:#4CAF50;">Resposta registrada! +3 🪙</p>';
    estat.monedes += 3;
    guardarEstat();
    actualitzarUI();
  } else {
    feedback.innerHTML = '<p style="color:#f44336;">Escriu una resposta més llarga</p>';
  }
}


// ===== MAPA DE NIVELLS =====
function renderMapa() {
  const cont = document.getElementById('mapa-contenidor');
  if (!cont) return;

  if (!CATEGORIES_TOTS || Object.keys(CATEGORIES_TOTS).length === 0) {
    let html = '<h3 style="text-align:center; margin-bottom:20px;">Carregant mapa...</h3><div class="nivells-grid">';
    for (let i = 1; i <= 100; i++) {
      html += `<div class="nivell-card" style="background:#222; border-color:#333; color:#555; opacity:0.5">${i}</div>`;
    }
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

    html += `<div class="nivell-card" style="border-color:${color}; opacity:${opacitat}; cursor:${cursor}" onclick="${onclick}">${i}</div>`;
  }
  html += '</div>';
  cont.innerHTML = html;
}

function jugarNivell(n) {
  if (n > estat.progres.nivellActualMapa) return;
  mostrarTab('gremi');
  mostrarSubTab('minijoc');
  setTimeout(() => novaFrase(), 100);
}

// ===== MISSIONS =====
function renderMissio() {
  const cont = document.getElementById('missio-contenidor');
  if (!cont) return;

  const missio1 = estat.progres.encerts >= 5? '✅' : '🔒';
  const missio2 = estat.compres.length > 0? '✅' : '🔒';
  const missio3 = estat.progres.nivellActualMapa >= 10? '✅' : '🔒';

  cont.innerHTML = `
    <h3 style="text-align:center; margin-bottom:20px;">Missions</h3>
    <div class="missio-item" onclick="mostrarTab('gremi'); mostrarSubTab('minijoc');" style="cursor:pointer;">
      ${missio1} Juga al Minijoc 5 vegades
    </div>
    <div class="missio-item" onclick="mostrarTab('botiga');" style="cursor:pointer;">
      ${missio2} Desbloqueja 1 pack a la Botiga
    </div>
    <div class="missio-item" onclick="mostrarTab('mapa');" style="cursor:pointer;">
      ${missio3} Arriba al nivell 10
    </div>
  `;
}

// ===== MINIJOC - ESCALAT PER NIVELL =====
function novaFrase() {
  const fraseEl = document.getElementById('minijoc-frase');
  const gridEl = document.getElementById('minijoc-emojis');
  if (!fraseEl ||!gridEl) return;

  if (!FRASES_MINIJOC || FRASES_MINIJOC.length === 0 ||!BIBLIOTECA_PLA.length) {
    fraseEl.textContent = 'Error: dades no carregades';
    gridEl.innerHTML = '';
    return;
  }

  const nivell = estat.progres.nivellActualMapa;
  let dificultatMin, dificultatMax, emojisMin, emojisMax;

  if (nivell <= 33) {
    dificultatMin = 1; dificultatMax = 1;
    emojisMin = 2; emojisMax = 3;
  } else if (nivell <= 66) {
    dificultatMin = 2; dificultatMax = 3;
    emojisMin = 4; emojisMax = 5;
  } else {
    dificultatMin = 3; dificultatMax = 5;
    emojisMin = 5; emojisMax = 7;
  }

  const frasesFiltrades = FRASES_MINIJOC.filter(f =>
    f.dificultat >= dificultatMin && f.dificultat <= dificultatMax
  );
  const pool = frasesFiltrades.length > 0? frasesFiltrades : FRASES_MINIJOC;

  const plantilla = pool[Math.floor(Math.random() * pool.length)];

  const placeholders = [...plantilla.text.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  const numEmojis = Math.min(
    placeholders.length,
    Math.floor(Math.random() * (emojisMax - emojisMin + 1)) + emojisMin
  );
  const placeholdersUsats = placeholders.slice(0, numEmojis);

  const solucio = [];
  let fraseAmbEmojis = plantilla.text;

  placeholdersUsats.forEach(cat => {
    const emojisCat = BIBLIOTECA_PLA.filter(e => e.categoria === cat);
    if (emojisCat.length === 0) return;
    const emojiElegit = emojisCat[Math.floor(Math.random() * emojisCat.length)];
    solucio.push(emojiElegit.emoji);
    fraseAmbEmojis = fraseAmbEmojis.replace(`{${cat}}`, emojiElegit.emoji);
  });

  fraseAmbEmojis = fraseAmbEmojis.replace(/\{(\w+)\}/g, (match, cat) => cat);

  FRASE_ACTUAL = { frase: fraseAmbEmojis, solucio };
  EMOJIS_TRIATS = [];

  const fraseMostrada = plantilla.text.replace(/\{(\w+)\}/g, (match, cat) => {
    return placeholdersUsats.includes(cat)? '___' : cat;
  });

  fraseEl.textContent = fraseMostrada;
  document.getElementById('minijoc-seleccionats').innerHTML = '';
  document.getElementById('minijoc-feedback').innerHTML = '';

  generarOpcions(solucio);
}

function generarOpcions(solucio) {
  const grid = document.getElementById('minijoc-emojis');
  if (!grid) return;

  const numOpcions = solucio.length <= 3? 16 : 20;
  const numFalsos = numOpcions - solucio.length;

  const falsos = BIBLIOTECA_PLA
   .filter(e =>!solucio.includes(e.emoji))
   .sort(() => 0.5 - Math.random())
   .slice(0, numFalsos);

  const opcions = [
   ...solucio.map(emoji => BIBLIOTECA_PLA.find(e => e.emoji === emoji)).filter(Boolean),
   ...falsos
  ].sort(() => 0.5 - Math.random());

  grid.innerHTML = '';
  opcions.forEach(e => {
    const div = document.createElement('div');
    div.className = 'emoji-item';
    div.innerHTML = `<div class="emoji-large">${e.emoji}</div><div class="emoji-name">${e.nom_cat}</div>`;
    div.onclick = () => triarEmoji(e.emoji);
    grid.appendChild(div);
  });
}

function triarEmoji(emoji) {
  if (!FRASE_ACTUAL || EMOJIS_TRIATS.length >= FRASE_ACTUAL.solucio.length) return;
  EMOJIS_TRIATS.push(emoji);

  const cont = document.getElementById('minijoc-seleccionats');
  const span = document.createElement('span');
  span.textContent = emoji;
  span.style.fontSize = '32px';
  span.style.margin = '0 4px';
  cont.appendChild(span);

  if (EMOJIS_TRIATS.length === FRASE_ACTUAL.solucio.length) {
    setTimeout(comprovarMinijoc, 300);
  }
}

function comprovarMinijoc() {
  const feedback = document.getElementById('minijoc-feedback');
  if (!feedback ||!FRASE_ACTUAL) return;

  const correcte = FRASE_ACTUAL.solucio.join('') === EMOJIS_TRIATS.join('');

  if (correcte) {
    feedback.innerHTML = `<p style="color:#4CAF50; font-weight:bold;">Correcte! +5 🪙</p>`;
    estat.monedes += 5;
    estat.progres.encerts++;

    if (estat.progres.encerts >= 25) {
      if (estat.progres.nivellActualMapa < 100) {
        estat.progres.nivellActualMapa++;
        alert(`🔓 Nou nivell desbloquejat! Ara ets nivell ${estat.progres.nivellActualMapa}`);
      }
      estat.progres.encerts = 0;
    }

    guardarEstat();
    actualitzarUI();
    setTimeout(() => novaFrase(), 1500);
  } else {
    feedback.innerHTML = `<p style="color:#f44336;">No és així. Era: ${FRASE_ACTUAL.solucio.join(' ')}</p>`;
    setTimeout(() => novaFrase(), 2000);
  }
}

// ===== BIBLIOTECA =====
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

// ===== DADES TIPS =====
const dadesTips = {
  conjugacio: [
    {truc: "El present regular acaba en -o, -es, -a", exemple: "jo parlo, tu parles, ell parla"},
    {truc: "El passat s'forma amb -va-", exemple: "jo parlava, tu parlaves"},
    {truc: "El futur porta -r-", exemple: "jo parlaré, tu parlaràs"}
  ],
  pronunciacio: [
    {truc: "La 'e' oberta sona com en 'porta'", exemple: "porta, terra, escola"},
    {truc: "La 'e' tancada sona com en 'peix'", exemple: "peix, teva, bé"},
    {truc: "La 'o' oberta sona com en 'porta'", exemple: "porta, cotxe"}
  ],
  vocabulari: [
    {truc: "Els adjectius van després del nom", exemple: "casa gran, no gran casa"},
    {truc: "El plural s'forma amb -s", exemple: "gat → gats, casa → cases"}
  ]
};

// ===== TIPS =====
let totsElsTips = [];
let tipsUsats = [];

function carregarTips() {
  if (totsElsTips.length === 0) {
    totsElsTips = [];
    Object.values(dadesTips).forEach(arr => {
      totsElsTips.push(...arr.map(t => ({text: t.truc, exemple: t.exemple})));
    });
  }
  mostrarTipRandom();
}

function mostrarTipRandom() {
  if (totsElsTips.length === 0) return;
  if (tipsUsats.length === totsElsTips.length) tipsUsats = [];

  let idx;
  do {
    idx = Math.floor(Math.random() * totsElsTips.length);
  } while (tipsUsats.includes(idx));

  tipsUsats.push(idx);
  const tip = totsElsTips[idx];
  document.getElementById('tip-text').textContent = tip.text;
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
  if (estat.monedes < preu) {
    alert('No tens prou monedes');
    return;
  }

  estat.monedes -= preu;
  estat.compres.push(id);

  const pack = PACKS_BOTIGA.find(p => p.id === id);
  if (pack && pack.emojis) {
    pack.emojis.forEach(e => {
      const emojiNet = quitarSkinTone(e.emoji);
      const cat = e.categoria;
      if (cat) {
        if (!estat.desbloquejats[cat]) estat.desbloquejats[cat] = [];
        if (!estat.desbloquejats[cat].includes(emojiNet)) {
          estat.desbloquejats[cat].push(emojiNet);
        }
      }
    });
  }

  guardarEstat();
  actualitzarUI();
  construirCategories();
  renderBotiga();
  renderDiccionari();
  alert('Pack desbloquejat a la biblioteca!');
}

// ===== INTRO TUTORIAL =====
function mostrarIntro() {
  const introEl = document.getElementById('intro');
  if (!introEl) return;

  if (estat.introVist) {
    introEl.style.display = 'none';
    return;
  }

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
    `<span style="opacity:${i===slideActual?1:0.3}">●</span>`
  ).join(' ');
  document.getElementById('intro-btn').textContent =
    slideActual === INTRO_SLIDES.length - 1? 'Començar' : 'Següent';
}

function seguentSlide() {
  vibrar();
  if (slideActual < INTRO_SLIDES.length - 1) {
    slideActual++;
    pintarSlide();
  } else {
    tancarIntro();
  }
}

function tancarIntro() {
  estat.introVist = true;
  guardarEstat();
  document.getElementById('intro').style.display = 'none';
}

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  });
}
