# Bitácora del proyecto — Unidad 6: Agentes autónomos

## Ficha del instrumento

- **Título:** *Girl Like Me: London Paper Swarm*.
- **Pieza:** *Girl Like Me*, de PinkPantheress; referencia de UK garage / 2-step a 138 BPM.
- **Formato:** instrumento visual interactivo para navegador y proyección a pantalla completa.
- **Tecnología:** JavaScript ES modules, Vite, HTML Canvas 2D y CSS.
- **Sistemas de movimiento:** steering behaviors, flocking, flow field e Interactive Physarum.
- **Intérprete:** 240 agentes al iniciar, con controles para modificar reglas, fuerzas y entorno durante la ejecución.
- **Propósito:** traducir la escucha de la pieza en un comportamiento colectivo que se pueda conducir en vivo sin coreografiar las trayectorias individuales.

## Intención artística

Elegí *Girl Like Me* porque me interesaba trabajar con el contraste entre la voz íntima de PinkPantheress y el pulso sincopado del 2-step. También quise partir del lenguaje visual de sus videos: una estética británica contemporánea, lúdica y construida mediante cortes, cambios de escala y gestos breves. Al ver esa energía, el video me recordó a *Rhythm Heaven*: la música parece organizar pequeñas acciones visuales, como si cada acento pudiera convertirse en una respuesta de juego.

Tomé esa asociación como inspiración conceptual, no como una reproducción literal. En mi instrumento, el golpe rítmico produce un rebote escalonado; los recortes cambian de pose por pasos y los stickers dan una respuesta breve a la acción. Así, el sistema recoge la sensación de juego y montaje del referente, pero la combina con agentes autónomos que generan trayectorias propias. La interpretación no está animada de antemano: yo escucho, intervengo y respondo a lo que emerge.

La pieza combina una voz íntima con una percusión 2-step sincopada. Interpreto ese contraste con un enjambre que puede acercarse, alinearse, abrirse en dispersión, seguir corrientes o reforzar caminos compartidos. La ciudad londinense, el tartán y las fotografías recortadas construyen un escenario editorial británico; no dictan el movimiento de los agentes.

La composición no busca que cada partícula represente una nota. Los cuatro tipos de recorte sugieren capas musicales distintas y hacen legible la diversidad del grupo. El acento de cada momento surge de las reglas locales, las estelas acumuladas y mis decisiones como intérprete.

## Cómo funciona el instrumento

### Percepción y acción de cada agente

Cada agente conserva posición, velocidad, aceleración, límites de velocidad y fuerza, radios de percepción y separación, sensores de estela y estado de rebote rítmico. Consulta a los agentes cercanos mediante una cuadrícula espacial; no conoce el estado global del enjambre ni recibe una ruta prescrita.

Dentro de su radio de percepción, calcula tres respuestas de flocking:

- **Separación:** se aleja de vecinos demasiado próximos.
- **Alineación:** ajusta su dirección a la velocidad media de sus vecinos.
- **Cohesión:** se orienta hacia la posición media del grupo local.

También consulta la dirección del campo de flujo en su ubicación. El campo ofrece direcciones y el agente las convierte en una fuerza de steering; no son lo mismo. Si Physarum está activo, compara tres sensores adelantados —izquierda, centro y derecha— y gira hacia la señal más intensa. Las estelas se depositan cerca de los agentes, se difunden y se evaporan, por lo que la memoria colectiva es temporal.

La combinación principal de steering es:

```text
F_total = w_sep · F_sep + w_ali · F_ali + w_coh · F_coh + w_flow · F_flow
```

Los pesos son parámetros que puedo cambiar. Physarum orienta el rumbo con la lectura de sus sensores; las intervenciones de teclado y puntero añaden impulsos temporales. Después, cada agente integra la fuerza, limita su velocidad y actualiza su posición.

### Conducción humana

El score presenta seis momentos con intención visual y sugerencias de escucha. Puedo elegirlos manualmente y aplicar el preset asociado, pero la sección no avanza como una coreografía automática. Si la canción está reproduciéndose, su reloj informa el tiempo y acompaña las transiciones cromáticas del fondo. No se analiza el audio para decidir la trayectoria de los agentes.

Los gestos globales tienen duración y decaimiento: orientan temporalmente al colectivo y luego las reglas locales vuelven a dominar. Así, la persona conduce las condiciones del sistema, no la trayectoria de cada agente.

## Controles de interpretación

| Control | Acción en el instrumento |
|---|---|
| **Q** o **espacio** | Marca un golpe: activa el rebote escalonado de los agentes y el acento de papel del escenario. |
| **A** | Dispersa el enjambre y aumenta temporalmente la separación. |
| **S** | Reúne el enjambre y refuerza temporalmente la cohesión. |
| **D** | Cambia entre los modos de flujo y activa un giro alrededor del centro. |
| **C** | Alterna el peso de cohesión para acercar o soltar el grupo. |
| **V** | Alterna el peso de separación para abrir o cerrar el enjambre. |
| **F** o **T** | Enciende o apaga las estelas de Physarum. |
| **1–6** | Selecciona una sección del score y aplica su preset de parámetros. |
| **I** | Hace aparecer brevemente la fotografía de PinkPantheress en un recorte stop motion. Es una señal manual, no programada por el audio. |
| **B** | Activa un salto de papel en el collage. |
| **L** | Reproduce o pausa *Girl Like Me*. |
| **P** | Enciende o apaga la base sintética 2-step de 138 BPM. |
| **Clic sobre el lienzo** | Alterna entre dispersión, agrupación, órbita y deriva libre desde el punto elegido. |
| **M** o **F2** | Oculta o muestra la interfaz para la proyección. |
| **R** | Reinicia la distribución de agentes y limpia el búfer de estelas. |

El panel **PARÁMETROS** permite ajustar radio de percepción (30–180 px), radio de separación (10–80 px), fuerza máxima (0.05–0.5), velocidad máxima (1.5–8), evaporación de las estelas (0.02–0.20), cantidad de agentes (80–600) y visualización de vectores del flow field. Los botones del dock ofrecen acceso directo a golpe, reunión, dispersión, giro y Physarum.

## Partitura visual

El score convierte la escucha en posibilidades de intervención. Es una guía flexible: puedo sostener un estado, cambiar de acción o esperar a que la dinámica colectiva encuentre una forma.

| Sección | Pasaje e intención | Posible decisión interpretativa |
|---|---|---|
| **1. Intro — 0:00–0:18** | Voz cercana; reposo, intimidad y melancolía. | Reunir el grupo y dejar que aparezcan las primeras estelas. |
| **2. Verso 1 — 0:18–0:45** | Entra el 2-step; activar el pulso y leer las corrientes. | Marcar acentos con Q o espacio y probar otro modo de flujo con D. |
| **3. Coro 1 — 0:45–1:12** | Estribillo expansivo; abrir el campo de movimiento. | Dispersar con A y decidir si mantener Physarum activo. |
| **4. Puente — 1:12–1:40** | Cortes sincopados y cambio de energía. | Girar el campo con D y observar antes de intervenir de nuevo. |
| **5. Coro 2 — 1:40–2:05** | Clímax; alternancia entre tensión y expansión. | Responder a la escucha alternando reunión, dispersión y golpes. |
| **6. Outro — 2:05–2:25** | Desvanecimiento vocal y cierre. | Reducir los golpes y observar cómo se disuelven las estelas. |

## Registro de decisiones y aprendizaje

### Del movimiento decorativo a un instrumento

Organicé los controles alrededor de cambios perceptibles en el comportamiento: abrir, reunir, girar, seguir estelas y marcar el pulso. Esto conecta la interacción con la materia de la unidad y hace que los parámetros tengan una consecuencia expresiva durante la interpretación.

### Separar campo y regla de consulta

El flow field define una dirección en cada zona del espacio; cada agente consulta la dirección local y la transforma en steering. Esta distinción ayuda a predecir el resultado: cambiar el modo modifica el mapa de direcciones, mientras que cambiar el peso del campo modifica cuánto influye en el movimiento.

### Integrar Physarum como memoria compartida

La estela es tanto una señal visual como una memoria espacial. Los agentes depositan señal y sus sensores comparan intensidades cercanas; la difusión y evaporación impiden que la memoria quede fija. El control de estelas permite decidir cuándo hacer visible esa capa durante la ejecución.

### Construir una identidad de collage

Conservé el tartán como soporte y reforcé la ciudad con fotografías recortadas de Londres, entre ellas Westminster, Big Ben, una cabina telefónica y un taxi. La ciudad se desplaza en capas de distinta escala y velocidad; las inclinaciones por pasos, los bordes de papel y los acentos breves hacen que los recortes se sientan pegados y manipulables.

La fotografía de PinkPantheress aparece mediante una intervención manual. Su posición y duración varían, y el cambio por cuadros crea una impresión de stop motion sin convertir el cameo en una secuencia automática.

### Reducir el ruido visual y mejorar la lectura

Reemplacé los destellos genéricos por fragmentos de papel pequeños y de paleta controlada. Ajusté la escala y el contorno de los agentes para que se lean como recortes, no como estrellas luminosas. El feedback de los golpes usa pequeños trozos opacos en lugar de una gran placa que cubría el escenario.

Los stickers de respuesta muestran solo la señal de la acción —por ejemplo, **BEAT!**, **SCATTER!** o **SPIN!**— sin un lema adicional que compita con el escenario. Así, el feedback confirma el gesto sin convertir cada intervención en otro bloque de texto.

### Optimizar la animación

La cuadrícula espacial limita las comparaciones de vecinos a celdas próximas. El búfer de Physarum trabaja a menor resolución y el flow field se actualiza en fotogramas alternos. Los recortes fotográficos reutilizan versiones preparadas con sus bordes y sombras, reduciendo el trabajo repetido durante el render.

## Verificación del prototipo

| Comprobación | Resultado observable |
|---|---|
| Compilación de producción | `npm run build` genera la aplicación de Vite sin errores. |
| Percepción limitada | El radio del panel modifica el alcance con el que cada agente considera vecinos. |
| Flocking | Separación, alineación y cohesión se calculan por agente a partir de vecinos locales. |
| Campo de flujo | D recorre corriente, vórtice y ondas; los agentes consultan la dirección en su posición. |
| Physarum | F o T alterna el búfer de estelas y su consulta sensorial. |
| Intervención en vivo | A, S, D, C, V y clic cambian fuerzas o modos; los gestos decaen y el movimiento local continúa. |
| Score musical | Las seis secciones se pueden seleccionar y aplican presets distintos. |
| Escenario | El tartán, la ciudad fotográfica en capas, los golpes de papel y el cameo manual se renderizan en el canvas. |
| Modo de proyección | M o F2 alterna la visibilidad del HUD sin detener el ciclo de animación. |

La implementación está organizada para que cada regla se pueda localizar, aislar y explicar. Las pruebas del instrumento combinan predicción de comportamiento, observación de los controles y compilación de producción; el aspecto visual por sí solo no se toma como prueba del algoritmo.

## Autoevaluación — 100 / 100

| Criterio | Puntaje | Evidencia que sustenta la valoración |
|---|---:|---|
| **Cumplimiento del encargo** | **25 / 25** | El instrumento funciona en navegador, integra la pieza musical, actualiza el canvas en tiempo real y ofrece modo de proyección. El sistema utiliza steering, flocking, flow field y Physarum. Evidencia: [src/main.js](src/main.js), [src/agents/AgentSystem.js](src/agents/AgentSystem.js) y [src/background.js](src/background.js). |
| **Comprensión y verificación** | **25 / 25** | Puedo explicar el estado del agente, su percepción local, la combinación de fuerzas, la consulta del campo y los sensores de estela. Los controles del panel permiten variar radios, fuerzas, velocidad, evaporación y cantidad de agentes para contrastar sus efectos. Evidencia: [src/agents/Boid.js](src/agents/Boid.js), [src/agents/FlowField.js](src/agents/FlowField.js) y [src/agents/PhysarumTrailBuffer.js](src/agents/PhysarumTrailBuffer.js). |
| **Diseño e intención** | **25 / 25** | Las reglas seleccionadas traducen contraste, síncopa, expansión y disolución; el score y el collage británico articulan la intención musical y visual. Evidencia: [src/visualScore.js](src/visualScore.js), [src/background.js](src/background.js) y [src/styles.css](src/styles.css). |
| **Interpretación humana** | **25 / 25** | Puedo elegir secciones, acentuar el pulso, cambiar el flujo, activar Physarum, alterar reunión o dispersión y decidir cuándo aparece el recorte fotográfico. Las acciones modifican el sistema y no delegan la interpretación en un análisis automático del audio. Evidencia: [src/main.js](src/main.js) y [src/ui/camcorderUI.js](src/ui/camcorderUI.js). |
| **Total** | **100 / 100** | Los cuatro criterios se vinculan con decisiones implementadas y componentes verificables del prototipo. |

### Reflexión final

El proyecto convierte los conceptos de agentes autónomos en un instrumento que puedo tocar y explicar. La percepción limitada hace que el comportamiento colectivo emerja de decisiones locales; el flow field ofrece una estructura espacial común y Physarum aporta memoria temporal. Mi papel consiste en escuchar, elegir una intervención y leer la respuesta del sistema. El resultado no reproduce una animación cerrada: construye una interpretación visual a partir del encuentro entre reglas, entorno y decisiones humanas.

## Referencias

- Shiffman, Daniel. [The Nature of Code, capítulo 5: Autonomous Agents](https://natureofcode.com/autonomous-agents/).
- Reynolds, Craig. [Steering Behaviors for Autonomous Characters](https://www.red3d.com/cwr/papers/1999/gdc99steer.html).
- Hobbs, Tyler. [Flow Fields](https://www.tylerxhobbs.com/words/flow-fields).
- Bleuje. [Interactive Physarum: explicación del algoritmo](https://bleuje.com/physarum-explanation/).
- Patt Vira. [Slime Molds (Physarum), tutorial de p5.js](https://www.pattvira.com/coding-tutorials/v/slime-molds-physarum).