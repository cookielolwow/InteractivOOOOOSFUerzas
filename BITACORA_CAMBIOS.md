# Bitácora y autoevaluación — Unidad 6: Agentes autónomos

## Proyecto

- **Instrumento:** visual interactivo para interpretar *Girl Like Me*, de PinkPantheress.
- **Contexto musical:** UK garage / 2-step; el proyecto usa una referencia de 138 BPM.
- **Tecnología:** JavaScript, Vite, HTML Canvas 2D y CSS.
- **Eje de la unidad:** agentes con percepción limitada, steering behaviors, flocking, flow fields e Interactive Physarum.
- **Estado de esta bitácora:** borrador escrito desde mi proceso y contrastado con el código. Dejé como pendientes los ensayos que todavía tengo que realizar y documentar.

## Intención y metáfora

Quiero interpretar los contrastes de la canción entre voz íntima y percusión 2-step. El enjambre funciona como una multitud de recortes: cada pieza responde a su vecindad y a las huellas que dejan las demás. Las fuerzas de cohesión pueden producir sensación de cercanía; la separación, aperturas y rupturas; el campo de flujo, corrientes; y Physarum, caminos que se refuerzan y luego se evaporan.

El escenario usa tartán, fotografías recortadas y capas de ciudad londinense para relacionar la imagen con PinkPantheress y el contexto británico. La escenografía acompaña la lectura del movimiento; las posiciones futuras de los agentes no están dibujadas como una coreografía fija.

## Cómo toma decisiones el sistema

La autonomía ocurre en dos niveles distintos:

1. **Cada agente decide su siguiente movimiento localmente.** Mantiene posición, velocidad y aceleración; observa vecinos dentro de un radio limitado; calcula separación, alineación y cohesión; consulta la dirección del flow field en su posición; y compara tres muestras de la estela Physarum delante de sí. Con esa información ajusta velocidad y rumbo. No hay un agente líder que dicte la trayectoria de todo el grupo.
2. **Yo conduzco la interpretación musical.** Escucho y decido cuándo cambiar de sección, marcar un golpe, dispersar o reunir el grupo, cambiar el flujo y activar o desactivar las estelas. Mis intervenciones cambian parámetros o añaden impulsos; después, los agentes siguen calculando sus propias respuestas.

En forma resumida, la fuerza base que combina el enjambre es:

```text
F = w_sep · F_sep + w_ali · F_ali + w_coh · F_coh + w_flow · F_flow
```

Physarum modifica el rumbo al comparar sus muestras izquierda, centro y derecha. Los gestos de teclado o puntero agregan fuerzas temporales, y el golpe rítmico activa un resorte visual y un pequeño impulso. Por eso, el movimiento no depende de una secuencia de posiciones prescritas.

### Evidencia en el código

| Idea | Dónde se puede localizar | Qué hace |
|---|---|---|
| Estado de cada agente | `src/agents/Boid.js`, constructor y `update()` | Conserva posición, velocidad, aceleración y límites de movimiento. |
| Percepción local y flocking | `Boid.js`, `separate()`, `align()`, `cohere()`; `src/agents/AgentSystem.js`, `getNeighbors()` | Calcula las tres reglas usando vecinos dentro de radios definidos. |
| Campo de flujo | `src/agents/FlowField.js`, `update()` y `getAngleAt()`; `Boid.js`, `followFlow()` | Genera direcciones con ruido y cada agente consulta la celda correspondiente a su ubicación. |
| Sensores Physarum | `Boid.js`, `physarumSense()` y `sampleTrail()` | Compara tres puntos adelantados y gira hacia la señal química más intensa. |
| Depósito, difusión y evaporación | `src/agents/PhysarumTrailBuffer.js` | Los agentes dejan señal, el mapa se difumina y pierde intensidad con el tiempo. |
| Intervenciones | `src/main.js`, `bindEvents()`; `AgentSystem.js`, `triggerBeat()`, `setInteractionMode()`, `interactAt()` | Teclas y clics cambian temporalmente el sistema sin asignar una ruta individual. |

## Controles que uso

### Durante la interpretación

| Control | Qué hago con él |
|---|---|
| **Q** o **espacio** | Marco un golpe. Los agentes reciben un impulso breve y la ciudad da un acento de papel. |
| **A** | Disperso el enjambre con una respuesta breve de separación. |
| **S** | Reúno el enjambre con una respuesta breve de cohesión. |
| **D** | Hago girar el gesto y ciclo el flow field por corriente, vórtice y ondas. |
| **C** | Alterno el peso de cohesión para acercar o soltar el grupo. |
| **V** | Alterno el peso de separación para abrir o cerrar el espacio entre agentes. |
| **F** o **T** | Enciendo o apago Physarum: depósito, visualización y consulta de las estelas. |
| **I** | Elijo el instante del recorte de PinkPantheress. Aparece brevemente en una posición aleatoria; no lo dispara el reloj de la canción. |
| **Clic en el lienzo** | Aplico en ese punto un gesto que alterna entre dispersar, reunir, girar y volver al movimiento libre. |
| **1–6** | Elijo manualmente una sección del score. Si la canción está reproduciéndose, la sección también posiciona el audio en su tiempo inicial. |

### Audio y presentación

| Control | Qué hago con él |
|---|---|
| **L** o botón de canción | Reproduzco o pauso *Girl Like Me*. También puedo cargar otro archivo de audio desde el panel. |
| **P** o botón de base 2-step | Enciendo o apago el acompañamiento sintético de 138 BPM. |
| **B** | Lanzo los recortes del collage con un salto de papel más amplio. |
| **M** o **F2** | Oculto o muestro el HUD. |
| Botón **FULLSCREEN** | Presento el instrumento a pantalla completa. |
| **R** | Reinicio la distribución del enjambre y limpio sus estelas. |

### Panel **PARÁMETROS**

Uso sus controles para hacer pruebas, no como acciones que tenga que pulsar constantemente durante el performance:

- **Radio de percepción:** 30–180 px; cambia cuántos vecinos puede considerar cada agente.
- **Radio de separación:** 10–80 px; cambia el umbral de proximidad para evitar choques.
- **Fuerza máxima de Reynolds:** 0.05–0.5; limita el tamaño de los cambios de velocidad.
- **Velocidad máxima:** 1.5–8; limita la rapidez de los agentes.
- **Evaporación de Physarum:** 0.02–0.20; cambia qué tan rápido se debilita la memoria de las estelas.
- **Cantidad de agentes:** 80–600; cambia el tamaño del colectivo.
- **Mostrar vectores del flow field:** activa la visualización de diagnóstico del campo.

También puedo usar los botones del dock para golpear, cambiar cohesión o separación, rotar el flow field y encender o apagar las estelas.

## Iteraciones y decisiones de diseño

### 1. Del sistema de partículas al instrumento

**Decisión:** relacionar los comportamientos con partes de la música en vez de usar las partículas como decoración independiente.

**Resultado visible en el prototipo:** existen controles separados para golpes, cohesión, dispersión, cambio de campo y estelas. El score presenta seis secciones con una intención y una sugerencia de intervención.

**Por comprobar en ensayo:** si puedo distinguir auditivamente los pasajes y elegir el control adecuado sin depender de leer el HUD.

### 2. Dirección de arte: collage británico

**Iteración motivada por:** las formas geométricas y las placas blancas no se sentían como recortes de papel; el tartán y la ciudad debían tener mayor presencia.

**Decisión:** usar un patrón tartán como fondo, fotografía con transparencia y skyline repetido en capas que avanzan a distintas velocidades. Los vehículos y retratos se tratan como recortes con inclinación por pasos, no como tarjetas blancas opacas.

**Control performativo del retrato:** al principio los destellos estaban programados para aparecer según el reloj musical. Para decidir yo el instante, los cambié a una tecla dedicada: `[I]` muestra el recorte durante un tiempo corto en una posición aleatoria. El tartán cambia de paleta cuando selecciono una sección. El paisaje conserva su deriva continua como escenografía, pero esos adornos ya no marcan una secuencia musical por su cuenta.

**Evidencia:** `src/background.js`, funciones `makeTartanTile()`, `drawTartan()`, `drawMovingCity()`, `drawImageCutout()` y `drawPortraitCue()`.

### 3. Feedback rítmico y legibilidad

**Iteración motivada por:** las partículas se percibían poco y las ondas circulares del golpe competían con la estética de collage.

**Decisión:** retirar las ondas circulares del feedback y usar golpes cortos de papel rasgado. Las partículas tienen relleno con contornos claro y oscuro para separarse del tartán y de las imágenes.

**Evidencia:** `AgentSystem.render()` dibuja los agentes y evita las ondas circulares; `FancyBackground.drawPaperHitFeedback()` crea el feedback de recorte; `Boid.draw()` aplica los dos contornos.

### 4. Interacción y autonomía

**Decisión:** hacer que los clics alternen entre dispersión, agrupación, órbita y retorno al movimiento libre. Las teclas A, S y D ofrecen acceso directo a tres de esos gestos. La fuerza del gesto decae, de modo que el movimiento colectivo vuelve a depender de las reglas locales.

**Evidencia:** `AgentSystem.interactAt()`, `setInteractionMode()` y el cálculo de `gestureFx` / `gestureFy` dentro de `update()`.

**Aprendizaje:** un control humano puede cambiar las condiciones iniciales o el peso de las reglas sin convertirse en un director que dicte la trayectoria de cada partícula.

### 5. Optimización para la proyección

**Problema reportado durante la iteración:** la animación se sentía trabada.

**Cambios realizados:** el mapa de estelas se procesa a media resolución por eje; el campo de flujo se recalcula en fotogramas alternos; las sombras de los recortes se preparan en caché, y se quitó el desenfoque individual de cada depósito de partícula.

**Evidencia de verificación disponible:** `npm run build` terminó correctamente en la iteración del 29 de septiembre de 2026. Esto confirma la compilación, pero no demuestra por sí mismo una tasa concreta de FPS ni fluidez en el equipo de presentación.

### 6. Corrección del cambio entre letra automática y manual

Al usar la letra encontré un salto de estado: al pasar del modo sincronizado al manual podía continuar con un índice antiguo, en vez de partir de la palabra que estaba viendo. Corregí el cambio para que B o el clic continúen desde la línea y palabra actuales. También hice que el modo sincronizado espere la primera marca de tiempo del `.LRC`, y que un archivo vacío o inválido limpie el estado anterior.

**Evidencia:** `src/ui/lyricsOverlay.js`, `findCueIndex()`, `advanceManualCue()`, `setAutomaticMode()` y `showMessage()`. La compilación de producción pasó después de esta corrección; me falta comprobar ambos modos durante un ensayo real.

### 7. Seguimiento automático del audio

Encontré que el proyecto ya incluía las marcas de tiempo de la letra, pero al cargarla empezaba en modo manual. Cambié el inicio para que la proyección consulte el tiempo actual del reproductor y siga las marcas del archivo `.LRC`; si quiero intervenir, B pasa al avance manual y N vuelve al seguimiento automático. Así no dependo de estimar el tiempo de la canción con el pulso de 138 BPM.

**Evidencia:** `src/lyrics/girl-like-me.lrc`, `src/ui/lyricsOverlay.js` (`load()`, `update()` y `setAutomaticMode()`) y `src/main.js` (`getSongTime()`). La compilación pasó; debo escuchar la canción completa en el navegador para detectar cualquier desfase específico de la versión de audio.

### 8. Retiro de la capa de letra y respuesta del collage

Después de probarla, la proyección de letra no funcionó de forma confiable y decidí quitarla de la interfaz. También retiré sus teclas y el panel para estudiar el fraseo; B ahora activa un salto más amplio de los recortes. Hice que los golpes impulsen las capas fotográficas y que los colores y el tartán transicionen con el reloj de la canción. Quité además el rótulo “LONDON / 2-STEP” del fondo.

**Evidencia:** `src/main.js` (teclas y reloj de audio), `src/ui/camcorderUI.js` (controles visibles), `src/background.js` (paleta, tartán y movimiento por golpes) y `src/styles.css` (estilos de proyección retirados). La compilación de producción pasó; comprobé que la interfaz ya no ofrece controles de letra.

## Partitura de interpretación

La tabla es una guía de escucha, no una secuencia ejecutada automáticamente. Si durante el performance la canción pide otra respuesta, puedo sostener el estado actual o elegir otra intervención.

| Sección | Pasaje / intención | Posible intervención humana |
|---|---|---|
| Intro, 0:00–0:18 | Voz íntima; buscar un grupo cercano y menos agitado. | S para reunir; dejar que las estelas se acumulen. |
| Verso 1, 0:18–0:45 | Entra el 2-step; escuchar el pulso y observar las corrientes. | Q o espacio para marcar golpes; D para cambiar el modo del campo. |
| Coro 1, 0:45–1:12 | Aumenta la energía; abrir el enjambre. | A para dispersar; F o T para cambiar las estelas. |
| Puente, 1:12–1:40 | Contraste y cortes; explorar trayectorias sinuosas. | D para cambiar el flujo; esperar y observar antes de volver a golpear. |
| Coro 2, 1:40–2:05 | Reaparece el clímax; alternar expansión y reunión. | Alternar A y S según lo que escuche; Q para acentuar. |
| Outro, 2:05–2:25 | Dejar espacio al final de la canción y observar la evaporación. | Reducir intervenciones y dejar que las estelas decaigan. |

## Registro de pruebas y ensayos

No registro como observación algo que todavía no he comprobado. Completaré las celdas vacías con fecha, condiciones y una captura o video corto del prototipo.

| Prueba | Predicción antes de probar | Observación real / evidencia |
|---|---|---|
| Bajar radio de percepción y subirlo después (control Parámetros). | Con menor radio, cada agente consulta menos vecinos; el grupo debería perder coordinación local. Al aumentarlo, separación, alineación y cohesión deberían considerar más agentes. | **Pendiente:** anotar valores, cambio visible y captura. |
| Cambiar fuerza de cohesión con S / control del panel. | Una cohesión mayor debería aumentar la tendencia de los agentes a dirigirse al promedio de posiciones de sus vecinos; no debería fijar un centro absoluto. | **Pendiente:** anotar antes/después y si la predicción se cumplió. |
| Cambiar modo del flow field con D. | Aunque el campo cambie, cada agente debería seguir una dirección local distinta según su posición. Las trayectorias deberían variar sin volverse idénticas. | **Pendiente:** comparar modos y guardar captura del overlay si se activa. |
| Desactivar y reactivar estelas con F/T. | Al apagarlas, los agentes dejan de depositar y consultar el campo químico; al encenderlas, el depósito, la difusión, la evaporación y los sensores vuelven a influir en el rumbo. | **Pendiente:** anotar diferencia en trayectoria y visibilidad. |
| Usar clic y observar el retorno. | El gesto afectará agentes próximos al punto; al decaer la fuerza temporal, el flocking y el campo volverán a dominar. | **Pendiente:** describir el efecto y cuánto tarda en volver al comportamiento base. |
| Probar el modo de pantalla completa durante la canción. | El HUD se debería poder ocultar y el canvas continuar ocupando la pantalla. | **Pendiente:** registrar navegador, resolución y cualquier caída de fluidez. |

## Autoevaluación provisional

Esta calificación es un **borrador para revisar después del ensayo**. No asigno puntaje completo a la comprensión o a la interpretación hasta registrar las pruebas anteriores y poder defenderlas oralmente.

### 1. Cumplimiento del encargo — 22 / 25 (provisional)

Construí el instrumento con tecnologías web para acompañar en tiempo real una canción que elegí. Tiene controles de interpretación y opción de pantalla completa. La compilación de producción pasó. Me faltan evidencias de una ejecución completa en la resolución y el equipo del performance, incluida una comprobación de fluidez.

**Evidencias:** `src/main.js` (canvas, bucle de animación y controles); `src/ui/camcorderUI.js` (botón de pantalla completa y controles); compilación de Vite (`npm run build`, 29/09/2026).

### 2. Comprensión y verificación — 18 / 25 (provisional)

Puedo ubicar el estado, las reglas de flocking, el campo de direcciones y los sensores de Physarum en módulos separados. La interfaz permite cambiar parámetros comunes. Sin embargo, aún debo completar la tabla de pruebas con predicción, observación y evidencia para demostrar que puedo anticipar y verificar los cambios.

**Evidencias:** `Boid.js`, `AgentSystem.js`, `FlowField.js`, `PhysarumTrailBuffer.js` y controles del panel en `camcorderUI.js`.

### 3. Diseño e intención — 21 / 25 (provisional)

La combinación entre cohesión, dispersión, flow fields y estelas ofrece una metáfora que puedo relacionar con voz, breakbeat, corrientes y memoria química. El tartán, las fotografías y los recortes hacen reconocible el contexto visual. Me falta documentar, con una grabación o notas de ensayo, qué combinación funciona mejor para cada pasaje y qué ajustes hice a partir de lo observado.

**Evidencias:** score de seis secciones en `src/visualScore.js`; dirección de arte en `src/background.js`; formas y reglas en `src/agents/Boid.js`.

### 4. Interpretación humana — 21 / 25 (provisional)

Las secciones se seleccionan manualmente con 1–6 y hay controles de gesto, golpe y estelas. Los clics cambian temporalmente el comportamiento alrededor del punto elegido. La tecla I deja en mis manos el momento del recorte fotográfico; al avanzar la canción, el fondo cambia sus colores. Debo mostrar en el ensayo que escucho y decido cuándo intervenir, sin seguir el score de forma automática.

**Evidencias:** `src/main.js` (teclas, puntero y selección de sección) y `src/visualScore.js` (el score no avanza de sección por sí solo).

### Puntaje de trabajo: 82 / 100 — revisar tras el ensayo

Este total no es una nota certificada. Debo ajustar cada criterio según las pruebas que realice y las evidencias que pueda mostrar en la presentación.

## Pendientes antes de entregar

- [ ] Ejecutar y registrar las pruebas de percepción, cohesión, flow field y Physarum.
- [ ] Ensayar la pieza completa con las secciones elegidas en vivo; registrar qué decidí y por qué.
- [ ] Capturar evidencia del modo de pantalla completa y de dos cambios perceptibles de parámetros.
- [ ] Comprobar fluidez en el equipo y navegador de presentación; no afirmar “60 FPS estables” sin medirlo.
- [ ] Ensayar cuándo usar I, A/S/D y Q para que los recortes y cambios del enjambre respondan a decisiones que tomo al escuchar.
- [ ] Probar las transiciones de color y los saltos de papel mientras avanza la canción.
- [ ] Añadir a esta bitácora la fecha y una reflexión personal después del ensayo.

## Referencias de consulta

- Shiffman, Daniel. [The Nature of Code, capítulo 5: Autonomous Agents](https://natureofcode.com/autonomous-agents/).
- Reynolds, Craig. [Steering Behaviors For Autonomous Characters](https://www.red3d.com/cwr/papers/1999/gdc99steer.html).
- Hobbs, Tyler. [Flow Fields](https://www.tylerxhobbs.com/words/flow-fields).
- Bleuje. [Algorithms for making interesting organic simulations (Physarum)](https://bleuje.com/physarum-explanation/).
- Patt Vira. [Slime Molds (Physarum), tutorial con p5.js](https://www.pattvira.com/coding-tutorials/v/slime-molds-physarum).

Consulto estas referencias para explicar los principios. En mi bitácora registro también qué probé, qué predije y qué observé en este prototipo.
