# Bitácora y autoevaluación — Unidad 6: Agentes autónomos

## Proyecto

- **Instrumento:** visual interactivo para interpretar *Girl Like Me*, de PinkPantheress.
- **Contexto musical:** UK garage / 2-step; el proyecto usa una referencia de 138 BPM.
- **Tecnología:** JavaScript, Vite, HTML Canvas 2D y CSS.
- **Demo pública:** [Instrumento visual](https://cookielolwow.github.io/InteractivOOOOOSFUerzas/).
- **Eje de la unidad:** agentes con percepción limitada, steering behaviors, flocking, flow fields e Interactive Physarum.
- **Estado de esta bitácora:** documenté el funcionamiento actual, probé controles en el navegador local y añadí observaciones verificables. La interpretación musical completa y la medición de fluidez en el equipo final todavía requieren un ensayo presencial.

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

### 6. Prueba y retiro de la capa de letra

Probé una proyección de letra, pero no conseguí que el seguimiento quedara confiable durante la interpretación. Decidí quitarla de la interfaz en vez de dejar controles que pudieran confundirme. En la versión actual no hay botones, panel ni atajos de letra: B activa el salto de papel e I dispara la aparición manual de la foto. Esta decisión mantiene el foco en escuchar y conducir el sistema.

**Evidencia actual:** `src/main.js` (controles vigentes) y `src/ui/camcorderUI.js` (interfaz actual). Las referencias a sincronización automática que quedaron en borradores anteriores ya no describen este prototipo.

### 7. Collage, respuesta rítmica y cambio de paleta

Después de quitar la letra, reforcé el tartán, las capas de ciudad, el movimiento por golpes y los recortes fotográficos. El fondo acompaña el tiempo del audio con cambios de paleta y el control B produce un acento de papel. En las pruebas de navegador, A, S, D, C, V, B e I mostraron sus mensajes de respuesta; 3 y 6 cambiaron la sección visible del score a Coro 1 y Outro.

**Evidencia:** `src/background.js`, `src/main.js`, `src/ui/camcorderUI.js` y la matriz de pruebas de esta bitácora. No afirmo una sincronización musical completa porque no reproduje la canción durante toda la prueba.

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

## Registro de pruebas y evidencias

Realicé estas comprobaciones el **29/09/2026** en la versión local `http://127.0.0.1:5175/`, en el navegador integrado y con el HUD visible. Tomé capturas del estado general y del panel de parámetros durante esta revisión y las comparto en esta conversación; muestran el prototipo en ejecución, no una grabación de la interpretación completa.

| Prueba | Predicción | Observación comprobada | Evidencia |
|---|---|---|---|
| Compilar la versión de producción. | Vite debería resolver los módulos y generar `dist/` sin errores. | `npm run build` finalizó correctamente. Esto verifica compilación, no FPS ni compatibilidad en todos los equipos. | Salida de compilación revisada el 29/09/2026. |
| Cambiar el radio de percepción. | El valor debería actualizarse en el control y en el texto visible; los agentes deberían consultar vecinos dentro de ese radio. | El control partió de 75 px. Al llevarlo al máximo, el deslizador y el texto cambiaron a 180 px. Al recargar se restauraron los valores iniciales. El cambio de cohesión no se midió numéricamente. | Captura del panel durante la prueba; `camcorderUI.js` enlaza el control con cada agente. |
| Activar cohesión, dispersión y giro. | Cada tecla debería mostrar un acento y cambiar temporalmente la regla o el modo de flujo. | A mostró `SCATTER!`, S `GATHER!`, D `SPIN!`, C `CLOSE IN!` y V `BREAK OUT!`. B mostró `PAPER SNAP!`; I mostró `PHOTO CUT!`. El score respondió a 3 (`CORO 1`) y 6 (`OUTRO`). | Textos de respuesta visibles en la interfaz; `main.js` contiene las acciones asociadas. |
| Alternar Physarum con F. | El mensaje debería confirmar los dos estados; el sistema solo debería depositar y consultar estelas cuando están activas. | F mostró `TRAIL OFF` y, al repetirla, `TRAIL ON`. El código activa o suspende el búfer y la consulta sensorial según ese estado. No medí densidad ni evaporación con una captura comparativa. | Mensajes del HUD y condiciones de `AgentSystem.update()` / `render()`. |
| Interactuar con clic sobre el lienzo. | Cada clic debería iniciar un gesto local temporal y dejar que el movimiento autónomo retome el control. | Hice dos clics sobre el lienzo; la animación siguió ejecutándose y no aparecieron errores de consola. El código alterna dispersión, agrupación, órbita y deriva. No medí en segundos el retorno al estado base. | `AgentSystem.interactAt()` y `setInteractionMode()`; consola sin errores durante la sesión. |
| Ocultar y restaurar el HUD. | M debería alternar la capa de interfaz sin detener el lienzo. | M ocultó los controles y otra pulsación los restauró; el canvas continuó animándose. | Estado visual en el navegador y manejador de M en `main.js`. |
| Pantalla completa y fluidez. | El botón debería ampliar la proyección y el movimiento mantenerse fluido. | La solicitud de pantalla completa no se activó en el navegador integrado. No medí FPS ni ejecuté la canción completa; esos puntos quedan por probar en el equipo de presentación. | Prueba local: `document.fullscreenElement` siguió vacío; el manejador descarta silenciosamente el rechazo. |

La interfaz actual no ofrece controles de letra y no muestra el rótulo “LONDON / 2-STEP”. Revisé la consola de la pestaña al terminar las interacciones: no registró errores. La captura del panel sirve como evidencia del control de percepción; la captura general muestra las seis secciones y los controles de performance.

## Autoevaluación provisional

Esta es mi valoración razonada del estado actual, no una nota asignada por el curso.

### 1. Cumplimiento del encargo — 23 / 25

Construí el instrumento web y comprobé que compila, que aparecen las seis secciones y que los controles principales responden. No me asigno el puntaje completo porque todavía no he presentado la ejecución en el equipo final ni he comprobado allí la pantalla completa.

### 2. Comprensión y verificación — 23 / 25

Puedo explicar cómo se combinan separación, alineación, cohesión y flujo, y dónde actúan los sensores Physarum. Comprobé los cambios de controles y el radio de percepción en el navegador. Todavía me falta comparar trayectorias con mediciones repetibles, no solo con lo que veo en una captura.

### 3. Diseño e intención — 22 / 25

Relacioné el movimiento autónomo con corrientes, agrupaciones y rupturas de la música. El tartán, la ciudad en capas y los recortes apoyan la intención británica de la pieza. Quiero revisar la legibilidad en una proyección grande y ajustar el contraste si el espacio de presentación lo requiere.

### 4. Interpretación humana — 21 / 25

Comprobé que puedo elegir secciones y activar gestos con el teclado, y que el score no cambia de sección por sí solo. Aún me falta ensayar la canción completa y registrar por qué elegí cada intervención; por eso no presento esta prueba de controles como evidencia de un performance ya realizado.

### Puntaje de autoevaluación: 89 / 100

No marco 100/100 porque quedan por realizar el ensayo completo, la verificación de fluidez en el equipo de proyección y la comprobación de pantalla completa fuera del navegador integrado.

## Antes de la presentación

- [ ] Reproducir la canción completa y anotar mis decisiones por sección.
- [ ] Probar pantalla completa en el equipo de proyección; el navegador integrado no activó esa solicitud durante la revisión local.
- [ ] Medir la fluidez en el equipo final y registrar navegador, resolución y resultado.
- [ ] Probar en contexto musical las transiciones de color, las estelas y los saltos de papel; la prueba local de controles no sustituye ese ensayo.
- [ ] Añadir una reflexión personal después de presentar la pieza.

## Referencias de consulta

- Shiffman, Daniel. [The Nature of Code, capítulo 5: Autonomous Agents](https://natureofcode.com/autonomous-agents/).
- Reynolds, Craig. [Steering Behaviors For Autonomous Characters](https://www.red3d.com/cwr/papers/1999/gdc99steer.html).
- Hobbs, Tyler. [Flow Fields](https://www.tylerxhobbs.com/words/flow-fields).
- Bleuje. [Algorithms for making interesting organic simulations (Physarum)](https://bleuje.com/physarum-explanation/).
- Patt Vira. [Slime Molds (Physarum), tutorial con p5.js](https://www.pattvira.com/coding-tutorials/v/slime-molds-physarum).

Consulto estas referencias para explicar los principios. En mi bitácora registro también qué probé, qué predije y qué observé en este prototipo.
