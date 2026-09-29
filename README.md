# 🐱 Cat Lingo Emoji - Aprèn Català Jugant

> PWA para aprender catalán A1/A2/B1 gamificada con emojis. 100 niveles, lecturas infinitas generadas proceduralmente y gramática contextual.

**Live Demo:** https://samuelsuazo41-afk.github.io/Lingocat-emoji-v2/

![PWA](https://img.shields.io/badge/PWA-Ready-22c55e)![VanillaJS](https://img.shields.io/badge/Vanilla_JS-100%25-yellow)![Catalan](https://img.shields.io/badge/Català-A1_A2_B1-red)

### 📱 Capturas Reales (v3.1)

- **Lectura infinita:** Textos como "Joven a la ciutat" generados al vuelo con preguntas interactivas
- **Vocabulari:** 9 palabras extraídas de cada lectura con pronunciación /fonètica/
- **Gramàtica Contextual:** Detecta `va + infinitiu` en tu texto y te lo explica
- **Gramàtica Guia:** 8 temas (Pretèrit perifràstic, Articles, Estar + adjectiu, Present, Futur, etc.)

### 🚀 Qué tiene dentro

No es un CRUD. Son 3 apps en 1:

1. **Mapa 100 niveles (Duolingo-style):** Sistema de XP, 25 frases para subir de nivel, bloqueo progresivo.
2. **Minijoc Emoji (Motor de frases):** Genera frases dinámicas tipo `El/La {categoria}` usando `categories_emoji.json` + `biblioteca_emoji.json` + determinantes. Elige entre 16-20 emojis falsos/verdaderos.
3. **Lector Procedural (Tu core):** `banco_lectura.json` contiene:
        - 2 plantillas por nivel (A1/A2/B1)
        - 6 temas: `la_familia`, `la_casa`, `l_escola`, `la_ciutat`, `la_natura`, `el_temps_lliure`
        - Vocabulario con 15 slots por tema: `persones`, `lloc`, `cosa1/2`, `companys`, `accio_grup`, `estat_final`, etc.
        - `regles_globals` para concordancia de género y apostrofación automática.

### 🧠 Lógica Clave (Fix v3.1)

El bug que rompía la app era la persistencia entre pestañas:

```js
// Antes: se borraba al ir a Vocabulari/Gramàtica -> pantalla negra
let lecturaActualHTML = ''; // Ahora guardamos el HTML completo
function mostrarSubTab(sub){
  // Busca en TODOS los IDs posibles (compatible index.html viejo y nuevo)
  const ids = [`lectura-${sub}`, `lectura-${sub}-inner`, `gremi-${sub}`]
}
