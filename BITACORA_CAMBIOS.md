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

$$\vec{F}_{\text{total}} = w_{sep}\vec{F}_{sep} + w_{ali}\vec{F}_{ali} + w_{coh}\vec{F}_{coh} + w_{flow}\vec{F}_{flow} + w_{mouse}\vec{F}_{mouse}$$

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
| **1. INTRO** | 0:00 - 0:18 | Voz lo-fi solitaria, acordes nostálgicos | Nebulosa íntima, calma, melancolía | Pulsar `[C]` (Cohesión alta). Partículas agrupadas en el centro con estelas suaves. |
| **2. VERSO 1** | 0:18 - 0:45 | Entra la base 2-step a 138 BPM | Despertar del ritmo y corrientes de aire | Golpear `[ESPACIO]` al compás de la caja para el **Escalado Rítmico cuantizado**. `[F]` para corriente fluida. |
| **3. CORO 1** | 0:45 - 1:12 | Clímax vocal eufórico, percusión brillante | Explosión expansiva de destellos neón | Presionar `[V]` para Separación máxima y `[T]` para estelas de luz fluorescente. |
| **4. PUENTE** | 1:12 - 1:40 | Filtro pasa-bajos, juego rítmico sincopado | Vórtices magnéticos (*The Pinkette*) | Mover el cursor para conducir las partículas en espirales vivas. |
| **5. CORO 2** | 1:40 - 2:05 | Doble energía, bajo garage saturado | Fusión elástica: contracción y expansión | Alternar `[C]` y `[V]` en contratiempo con ráfagas continuas de `[ESPACIO]`. |
| **6. OUTRO** | 2:05 - 2:25 | Desvanecimiento de la voz (*"...like me"*) | Disolución lenta y quietud Y2K | Desacelerar, soltar controles y permitir que las estelas se evaporen en el vacío púrpura. |

---

## 4. Controles del Instrumento

- <kbd>ESPACIO</kbd> / <kbd>Clic en lienzo</kbd>: **Escalado Rítmico Cuantizado (Beat Stutter)** en 4 escalones.
- <kbd>L</kbd> / Botón `PLAY`: **Reproduce / Pausa la canción oficial "Girl Like Me"** (cargada desde `src/sonido/`).
- <kbd>C</kbd>: **Cohesión Vocal** (conecta y comprime el enjambre hacia la voz).
- <kbd>V</kbd>: **Separación Breakbeat** (explosión centrífuga de partículas en los drops).
- <kbd>F</kbd>: **Flow Field Swirl** (activa torbellinos y corrientes de flujo).
- <kbd>T</kbd>: **Estelas Physarum** (activa/desactiva el rastro químico bioluminiscente).
- <kbd>1</kbd> a <kbd>6</kbd>: Salto directo a las secciones de la Partitura Visual (sincroniza automáticamente la posición de la canción).
- <kbd>Cursor / Touch</kbd>: Punto de atracción magnética (*The Pinkette*).
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
