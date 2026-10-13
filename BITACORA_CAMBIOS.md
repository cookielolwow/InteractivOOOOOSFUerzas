# Bitácora de presentación y autoevaluación — A Bold Dream (ABD)

**Fecha de revisión:** 13 de octubre de 2026  
**Versión publicada:** [A Bold Dream · ABD](https://cookielolwow.github.io/InteractivOOOOOSFUerzas/)  
**Estado:** autoevaluación terminada antes de la presentación. La prueba con una persona del grupo todavía debe realizarse y registrarse; no se inventan observaciones.

## 1. Autoevaluación previa

Escala: 0 a 25 puntos por criterio. La puntuación reconoce el estado técnico verificado y descuenta lo que aún necesita evidencia de uso con otra persona.

| Criterio | Puntaje | Sustento y evidencia |
|---|---:|---|
| **Cumplimiento del encargo** | **23/25** | El sistema organiza las letras A, B y D de A Bold Dream como un puzzle 3D interactivo. En navegador se cargaron las tres letras, sus audios y los 17 stickers; la página pública y el workflow de GitHub Pages quedaron publicados. El arrastre, los gizmos, la paleta, el solucionador y las respuestas sonoras están implementados en tiempo real. Evidencia: [src/main.js](src/main.js), [src/HolographicStickerDOMManager.js](src/HolographicStickerDOMManager.js) y el [sitio publicado](https://cookielolwow.github.io/InteractivOOOOOSFUerzas/). |
| **Comprensión y verificación** | **22/25** | Puedo explicar el grafo `Group → visual`, el frustum usado para limitar el spawn, y las tolerancias de posición, color, escala y rotación. La victoria usa escalas diferenciadas (A 2.21×, B 2.6×, D 2.99×) y el orden de rebotes A-B-D repetido. Las pruebas verifican escalas y rotación; `npm test -- --run` pasó (2/2) y `npm run build` terminó correctamente. Evidencia: [src/abdGameLogic.js](src/abdGameLogic.js), [src/abdGameLogic.test.js](src/abdGameLogic.test.js) y [src/main.js](src/main.js). |
| **Interacción e identidad** | **13/25** | Las acciones permiten mover, escalar, rotar y colorear las letras; cada transformación tiene guía sonora y una confirmación al entrar en su tolerancia. La intención propuesta es una expresividad lúdica y optimista para A Bold Dream. Falta contrastar esta lectura con una prueba presencial; por eso no doy por demostrado qué descubre o interpreta otra persona. |
| **Resolución tipográfica y experiencia de juego** | **21/25** | La composición final asigna jerarquía de escala, alinea las bases y centra el conjunto; en la comprobación geométrica, las bases coincidieron y no hubo vértices fuera del canvas. La animación final mantiene una cadencia de 0.68 s durante la canción; los colores provienen de una paleta saturada. El lienzo quedó libre de doodles/confeti y los stickers se distribuyen en los márgenes de la interfaz. Falta observar en persona si el ritmo y las señales resultan suficientemente claros y agradables. |
| **Total** | **79/100** | El sistema está implementado y publicado. La principal evidencia pendiente es la interpretación espontánea de alguien del grupo antes de explicar la intención. |

## 2. Prueba antes de explicar

**Regla de presentación:** mostrar la página funcionando e invitar a jugar sin describir primero la identidad, el atributo ni el significado de los sonidos. Escuchar la interpretación espontánea antes de explicar.

**Invitación sugerida:**

> “Te invito a probarlo un momento. Intenta acomodar las letras como creas que deben quedar. Mientras juegas, dime qué intentas hacer, qué vas descubriendo y qué crees que significan las respuestas del sistema.”

Durante la prueba, observar sin corregir ni orientar. Al terminar, preguntar:

- ¿Qué intentaste hacer primero y por qué?
- ¿Qué descubriste al mover, escalar, rotar o cambiar el color?
- ¿Cómo interpretaste los sonidos y las respuestas visuales?
- ¿Qué te indicó que una letra estaba más cerca o ya estaba correcta?
- ¿Qué fue confuso o qué te gustaría probar de otra manera?

### Registro de la prueba con otra persona

Completar después de una sesión real y antes de presentar la explicación. Usar un alias o iniciales, no hace falta registrar datos personales.

| Dato | Registro |
|---|---|
| Fecha y dispositivo | **Pendiente** |
| Persona / alias | **Pendiente** |
| Qué intentó hacer | **Pendiente: anotar sus palabras o acciones observadas** |
| Qué descubrió | **Pendiente: no inferirlo por la persona** |
| Cómo interpretó sonidos y señales | **Pendiente: registrar su interpretación literal** |
| ¿Resolvió el puzzle? ¿Qué le ayudó o bloqueó? | **Pendiente** |
| Cambio que haré a partir de la prueba | **Pendiente de analizar después de escucharle** |

**Importante:** hasta completar este registro, no afirmar que otras personas entendieron la intención ni usar esta bitácora como evidencia de una prueba con pares.

## 3. Explicación después de escuchar

Solo después de que la persona comparta su experiencia, explicar brevemente:

1. **Organización, atributo y contexto:** la organización/marca representada es **A Bold Dream (ABD)**. Para esta propuesta exploro una identidad de **expresividad lúdica y optimista**, en una experiencia web donde la composición del nombre se convierte en un puzzle manipulable. La referencia visual combina color pop-tech y brillo inspirado en la dirección artística definida para el proyecto. Si el equipo entiende otro atributo como prioritario, actualizar esta frase antes de exponer.
2. **Tipografía, reglas y acciones:** las letras A, B y D se separan en un `Group` de posición y un objeto visual de escala/rotación. Se pueden mover, ajustar de tamaño, girar y colorear; los tonos, los sonidos y los checks comunican proximidad a la composición objetivo. La jerarquía final A < B < D y la línea de base compartida convierten el armado del nombre en la exploración de esa expresividad.

## 4. Evidencias técnicas y cambios

- **Composición:** escalas objetivo A 2.21×, B 2.6× y D 2.99×; bases alineadas y resultado centrado en el canvas. La revisión geométrica comprobó cero vértices fuera del frustum en la pose objetivo.
- **Interacción:** drag y gizmos escriben transformaciones en nodos separados; el muelle pasivo se pausa durante la manipulación para evitar conflictos.
- **Reglas:** ganar exige posición, color, escala objetivo por letra y rotación dentro de tolerancia. La prueba de lógica pasó junto con el resto de la suite (2 tests).
- **Audio:** el motor paramétrico diferencia movimiento, escala y rotación; al acertar posición, escala o color suena un check, y la rotación correcta produce un acorde mayor.
- **Final:** el solucionador anima las letras y la celebración repite A-B-D durante la canción, con intervalo de 0.68 s y colores saturados.
- **Material y escenario:** material físico de globo con transmisión/Fresnel y entorno procedural; halftone CSS detrás del canvas transparente. Las decoraciones flotantes del canvas fueron retiradas; quedan 17 stickers en zonas de interfaz.
- **Publicación:** el deploy de GitHub Pages terminó correctamente. Se corrigieron las rutas de modelos, audio y stickers para usar la base de Vite; la prueba pública confirmó respuesta `200` para esos recursos.
- **Verificación ejecutada:** `npm test -- --run` (2/2), `npm run build` y comprobaciones de runtime/bounds en navegador. La automatización del navegador se ejecutó en una pestaña marcada `hidden`, por lo que el timeline de GSAP se comprobó programáticamente; la reproducción natural debe observarse con la página visible durante la prueba con el grupo.