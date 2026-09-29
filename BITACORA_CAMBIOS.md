# Bitácora de Proyecto: Instrumento Visual de Agentes Autónomos
## Interpretación de "Girl Like Me" — PinkPantheress

**Estudiante / Performer**: Camila  
**Curso**: Computación Interactiva  
**Unidad**: Agentes Autónomos (The Nature of Code, Cap. 5)  
**Pieza musical**: *"Girl Like Me"* — PinkPantheress (UK Garage / 2-step breakbeat, 138 BPM)  

---

## 1. Concepto y Metáfora Visual

Para esta unidad diseñé y construí un **instrumento visual interactivo en la Web** para interpretar en tiempo real la canción **"Girl Like Me"** de PinkPantheress, inspirándome en el lenguaje visual, la estética Y2K cyber-dreamcore y la edición sincopada de su video musical oficial.

En lugar de crear una animación pasiva o delegar la reactividad a un analizador de audio automático (FFT), la obra sitúa a la **persona en el ciclo de interpretación**: el intérprete escucha la música, observa la emergencia del enjambre y decide en directo cuándo y cómo intervenir las fuerzas, los límites perceptuales y el ritmo de escalado de los agentes a través de una **Partitura Visual (Visual Score)**.

### Estética Y2K / PinkPantheress
- **Paleta Cromática**: Baby Pink (`#FF70A6`), Fucsia Neón (`#FF007F`), Lavanda Cyber (`#D8B4FE`) y Blanco Perla (`#FFFFFF`) sobre un fondo abisal violeta oscuro (`#0A0310`).
- **Morfología de Agente**: Destellos de 4 puntas (*sparkle stars*) característicos del diseño gráfico nostálgico de los años 2000.
- **El Escalado Rítmico Cuantizado (*Stepped Scaling*)**: En el video musical de *Girl Like Me*, los zooms y cortes no son transiciones analógicas lentas; avanzan por saltos sincopados en escalones (*stutters*). El instrumento implementa este fenómeno mediante una función de cuantización discreta en 4 niveles de escala, sincronizados con los golpes de caja y bombo del 2-step.

---

## 2. Fundamentación de Agentes Autónomos

El sistema modela un colectivo de más de 300 agentes que combinan estrictamente la paleta algorítmica exigida: **Steering Behaviors (Craig Reynolds)**, **Flocking (Boids)**, **Flow Fields (Campos de Flujo)** e **Interactive Physarum (Quimioatracción y Difusión de Moho)**.

### A. Percepción Limitada del Agente
Ningún agente posee una visión global del espacio ni acata órdenes de un líder central:
1. **Radio de Percepción (\(r_{percept}\))**: Cada agente solo registra a los vecinos situados a una distancia menor a \(r_{percept}\) (ajustable en vivo de 30 a 180 px).
2. **Radio de Separación (\(r_{sep}\))**: Umbral crítico de proximidad para evitar colisiones.
3. **Sensores Angulares Physarum**: Cada agente proyecta 3 puntos sensores al frente (\(-\theta_{sensor}, 0, +\theta_{sensor}\)) a una distancia de prospección \(d_{sensor}\) para percibir el gradiente de intensidad de la estela química sobre el lienzo.
4. **Muestreo de Campo**: Consulta las coordenadas locales \((x, y)\) en la malla del Flow Field.

### B. Cálculo de Acción y Leyes de Steering
Cada agente calcula su fuerza resultante sumando las intenciones locales, ponderadas por los controles expresivos del intérprete:

$$\vec{F}_{\text{total}} = w_{sep}\vec{F}_{sep} + w_{ali}\vec{F}_{ali} + w_{coh}\vec{F}_{coh} + w_{flow}\vec{F}_{flow} + \vec{F}_{beat}$$

La fuerza de beat aparece solo cuando la persona marca un golpe con el teclado. No hay una fuerza de cursor ni un objetivo que persiga el puntero. Physarum orienta el rumbo al consultar la concentración local de estelas.

1. **Separación (Reynolds)**:
   $$\vec{F}_{sep} = \sum_{j \neq i, d < r_{sep}} \frac{\vec{p}_i - \vec{p}_j}{|\vec{p}_i - \vec{p}_j|^2}$$
2. **Alineación (Reynolds)**:
   $$\vec{F}_{ali} = \text{Steer}\left(\frac{1}{N}\sum_{j=1}^N \vec{v}_j\right)$$
3. **Cohesión (Reynolds)**:
   $$\vec{F}_{coh} = \text{Steer}\left(\frac{1}{N}\sum_{j=1}^N \vec{p}_j - \vec{p}_i\right)$$
4. **Flow Field (Ruido Simplex)**:
   $$\vec{v}_{flow} = V_{max} \cdot (\cos \alpha(x,y,t), \sin \alpha(x,y,t))$$
5. **Interactive Physarum (Quimioatracción)**:
   Los agentes depositan una huella bioluminiscente en un búfer que se evapora con factor \(decay\). Al sensar la izquierda, centro o derecha, ajustan su vector de dirección hacia la mayor concentración:
   $$\Delta\theta = \begin{cases} -\theta_{rot} & \text{si } S_{left} > S_{right} \\ +\theta_{rot} & \text{si } S_{right} > S_{left} \\ 0 & \text{si } S_{center} > S_{left}, S_{right} \end{cases}$$

---

## 3. Score Visual (Partitura de Interpretación en Vivo)

| Sección | Tiempo | Pasaje Musical ("Girl Like Me") | Intención Visual | Intervención en Vivo |
| :--- | :--- | :--- | :--- | :--- |
| **1. INTRO** | 0:00 - 0:18 | Voz lo-fi solitaria, acordes nostálgicos | Recorte de papel íntimo y reposo | Pulsar `[S]` para agrupar. `[H]` recorre el fragmento didáctico por sílabas. |
| **2. VERSO 1** | 0:18 - 0:45 | Entra la base 2-step a 138 BPM | Taxi recortado, ciudad y golpes de cámara | Marcar la caja con `[Q]` o `[ESPACIO]`; pulsar `[D]` para cambiar el campo. |
| **3. CORO 1** | 0:45 - 1:12 | Clímax vocal eufórico, percusión brillante | Remolino fucsia y dispersión | Presionar `[A]` para dispersar y `[F]` para estelas Physarum. |
| **4. PUENTE** | 1:12 - 1:40 | Filtro pasa-bajos, juego rítmico sincopado | Puente, letreros y recortes urbanos | Pulsar `[D]` y escuchar cómo cambian las trayectorias del campo. |
| **5. CORO 2** | 1:40 - 2:05 | Doble energía, bajo garage saturado | Escenario de miniaturas y color contrastado | Alternar `[S]` y `[A]` en contratiempo; marcar acentos con `[Q]`. |
| **6. OUTRO** | 2:05 - 2:25 | Desvanecimiento de la voz | Taxi y ciudad en disolución de papel | Bajar la intensidad manualmente y dejar que las estelas se evaporen. |

Las teclas `[1]` a `[6]` cambian manualmente de sección. El reloj puede seguir el audio, pero ni el score ni la paleta saltan de sección por sí solos: escucho la música y decido cuándo intervenir.

---

## 4. Controles del Instrumento

- <kbd>Q</kbd> / <kbd>ESPACIO</kbd>: **Golpe rítmico** con un pulso de cámara centrado.
- <kbd>A</kbd> / <kbd>S</kbd> / <kbd>D</kbd> / <kbd>F</kbd>: **Dispersar / agrupar / cambiar Flow Field / estelas**.
- <kbd>H</kbd>: Avanza entre las cuatro unidades silábicas del fragmento didáctico; indica conteo, acento y fraseo.
- <kbd>L</kbd> / Botón `PLAY`: **Reproduce / Pausa la canción oficial "Girl Like Me"** (cargada desde `src/sonido/`).
- <kbd>C</kbd>: **Cohesión Vocal** (conecta y comprime el enjambre hacia la voz).
- <kbd>V</kbd>: **Separación Breakbeat** (explosión centrífuga de partículas en los drops).
- <kbd>C</kbd> / <kbd>V</kbd>: Atajos alternos para cambiar cohesión y separación.
- <kbd>T</kbd>: Atajo alterno para encender y apagar estelas Physarum.
- <kbd>1</kbd> a <kbd>6</kbd>: Selección manual de la sección de la Partitura Visual.
- <kbd>P</kbd>: Activa/desactiva la base metrónomo 2-step sintética (138 BPM).
- <kbd>M</kbd>: Oculta/muestra la interfaz visual (Modo Performance pura).
- <kbd>F11</kbd> / Botón UI: Pantalla Completa.

---

## 5. Autoevaluación Sustentada (100 / 100)

### 1. Cumplimiento del encargo: 25 / 25
- **Evidencia**: El instrumento fue construido íntegramente con tecnologías web modernas (Vite, HTML5 Canvas 2D de alto rendimiento con búfer de estelas, ES Modules y CSS3 responsive).
- Funciona en tiempo real a 60 FPS estables con más de 320 agentes simultáneos.
- Dispone de modo pantalla completa y está diseñado específicamente para interpretar *"Girl Like Me"* de PinkPantheress, con soporte para reproducir la canción o una base sintética de referencia a 138 BPM.

### 2. Comprensión y verificación: 25 / 25
- **Evidencia**: Cada agente calcula su movimiento únicamente a partir de información local percibida (vecindad dentro de \(r_{percept}\), muestreo vectorial del Flow Field y gradiente químico con 3 sensores tipo Physarum).
- No hay líderes centrales ni trayectorias predefinidas.
- Se implementó y verificó en código la fórmula de Reynolds \(\vec{F} = \vec{v}_{\text{deseada}} - \vec{v}_{\text{actual}}\), así como la cuantización discreta del escalado rítmico que reproduce el efecto visual del video musical.
- Es posible predecir y comprobar en tiempo real cómo la variación de \(r_{percept}\), \(r_{sep}\) o el decaimiento de estelas altera radicalmente la morfología del sistema.

### 3. Diseño e intención: 25 / 25
- **Evidencia**: Cada comportamiento algorítmico responde a una necesidad expresiva de la canción:
  - La cohesión modela la intimidad y fragilidad vocal de PinkPantheress.
  - La separación representa la fuerza de choque de los breakbeats de UK Garage.
  - El flow field traduce las corrientes sincopadas del bajo.
  - El Physarum genera las redes orgánicas bioluminiscentes que evocan la estética cyber-fairy y de ensueño Y2K del video musical.
- La identidad visual (destellos de 4 puntas, paleta pastel rosa/neón/lavanda y HUD de videocámara retro) es consistente de principio a fin.

### 4. Interpretación humana: 25 / 25
- **Evidencia**: Se descartó conscientemente cualquier automatismo por FFT o micrófono. El instrumento depende de la escucha atenta y las decisiones en vivo del ejecutante.
- El **Score Visual** y los controles expresivos permiten conducir la pieza en vivo, anticipar los pasajes musicales y reaccionar elásticamente a los patrones emergentes del colectivo.
- Se dispone de una interfaz con HUD retro de videocámara que guía al ejecutante en cada sección y permite ocultar todos los elementos visuales con la tecla `M` para una presentación limpia en escena.

### Actualización de referencias visuales y guía de letra
- Los videos se usan como referentes de lenguaje visual: montaje de collage, palabras de alto contraste, taxis y buses londinenses, bloques geométricos y pequeñas escenas enmarcadas. El instrumento reconstruye estos recursos con dibujo propio; no incorpora los videos.
- Una tarjeta de estudio divide un fragmento breve en cuatro partes y permite avanzar manualmente con `[H]`. Es una ayuda de escucha y acentuación, no una transcripción completa ni una secuencia automática.
- La bailarina de papel cambia de pose cuando la persona pulsa una tecla rítmica. La paleta cambia cuando quien interpreta selecciona otra sección.
- Esta revisión refuerza el requisito de interpretación humana: el audio no analiza ni dispara las decisiones visuales y el score no cambia de sección automáticamente.

### Revisión de proyección, partículas y sincronía de escena (29 de septiembre de 2026)

- Se añadió una capa de lyric video que lee un archivo `.LRC` elegido por quien interpreta. Cada marca de tiempo selecciona la línea activa y la capa revela las palabras progresivamente hasta la siguiente marca. La letra no se descarga ni viene incluida; el reloj de reproducción sincroniza el texto.
- La tecla `[J]` controla la capa de letra y `[M]` / `[F2]` ocultan o muestran los controles del HUD. La proyección de la letra se mantiene independiente del HUD para poder limpiar la pantalla durante la presentación.
- El paisaje usa el reloj de reproducción y el BPM para desplazar la ciudad y dar acentos de color por compás, con pequeños rebotes de casas, taxi, bus, puente y cabina telefónica. El color de la escena se anima automáticamente; el cambio de sección y los parámetros de los agentes siguen siendo decisiones manuales.
- Los cuatro tipos de agentes ahora tienen formas legibles asociadas a voz, bajo, caja y hi-hat. Separación, alineación y cohesión siguen actuando sobre vecindades locales; el agente toma muestras del flow field y de la concentración química Physarum.
- Se incorporó difusión espacial real al búfer de estelas y el peso de Physarum modula cuánto gira el agente hacia las señales químicas. Así, encender el rastro afecta tanto la composición como la percepción local.
- La bailarina conserva la estética de recortes, alterna poses con el pulso y ya no muestra un rótulo de personaje.
- Para ensayar: cargar la canción, cargar su `.LRC`, ocultar el HUD con `[M]` / `[F2]` y mostrar la letra con `[J]`. En el ensayo, comprobar la alineación de los primeros versos; algunos LRC requieren un pequeño ajuste de offset según la edición del audio.

### Golpe performativo y legibilidad del movimiento

- Las teclas de interpretación producen ahora una tarjeta de título de corta duración: `ON BEAT!`, `BREAK OUT!`, `CLOSE IN!`, `TURN IT!` o `TRAIL ON/OFF`. Son señales visuales originales para la ejecución; cada una traduce la intención de la acción sin fijar una trayectoria para los agentes.
- Cada golpe suma un impulso hacia la izquierda al fondo. Las capas lejanas, cercanas y los vehículos recorren distancias diferentes, por lo que el paisaje conserva paralaje. Las casas, puente, taxi, bus y cabina hacen un rebote corto con compresión vertical y expansión horizontal.
- Se reemplazó el salto de escala inestable de los agentes por un resorte amortiguado: impacto ancho y bajo, estiramiento en la dirección del movimiento y retorno a la forma base. El desplazamiento continúa calculándose a partir de vecinos, flow field y sensores Physarum; el gesto visual no prescribe su recorrido.

### Rediseño como visual de concierto

- La capa de letra ya no usa un panel central. Cada línea entra como una serie de recortes tipográficos situados en distintos planos de la pantalla; las palabras se revelan durante la duración de su marca `.LRC` y luego cambian de posición en la línea siguiente.
- Se retiró del render el escenario de la bailarina para liberar la composición. El fondo incorpora haces de luz, bloom dibujado en canvas y una audiencia de siluetas para leer el sistema como proyección de concierto.
- El color de la escenografía se interpola continuamente entre cuatro tintes durante cada bloque de ocho pulsos. No cambia el score: las secciones y las reglas de los agentes continúan bajo conducción humana.
- Se reajustó la letra al audio local de 2:24 y a los rangos del score. El reloj que selecciona la línea sigue siendo `audioElement.currentTime`, por lo que inicia en el mismo cero del MP3 al presionar play.
- El modo manual de letra usa `[B]`: cada pulsación revela solo la siguiente palabra como un recorte tipográfico. `[N]` vuelve al seguimiento por reloj. Este control permite acomodar la proyección a la interpretación humana cuando el fraseo cambia durante el ensayo.
