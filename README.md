# PinkPantheress — "Girl Like Me"
### Instrumento Visual de Agentes Autónomos (The Nature of Code, Cap. 5)

Instrumento interactivo para interpretar en vivo **"Girl Like Me"** de **PinkPantheress** (UK Garage / 2-step breakbeat, 138 BPM). Su lenguaje visual combina tartán británico impreso, fotos recortadas, skyline londinense en capas y agentes como fragmentos de papel.

Construido utilizando exclusivamente la paleta algorítmica de **Steering Behaviors (Craig Reynolds)**, **Flocking**, **Flow Fields (Campos de Flujo por Ruido Simplex)** e **Interactive Physarum (Simulación de Moho del Fango)**.

---

## Características Principales

- **Agentes con Percepción Limitada**: Cada agente percibe a sus vecinos locales en un radio acotado, consulta el campo vectorial de flujo y utiliza 3 sensores frontales para quimioatracción sobre un búfer de estelas bioluminiscentes (*Physarum polycephalum*).
- **Escalado Rítmico Cuantizado (*Stepped Scaling*)**: Emula la edición del video musical de PinkPantheress mediante saltos discretos de escala y ráfagas de impulsos sincopados que reaccionan a tus toques de ritmo.
- **Interpretación Humana Activa**: Sin análisis de audio ni avance automático de secciones. El reloj puede seguir la canción; quien interpreta escucha, decide y conduce los cambios del score en tiempo real.
- **Partitura Visual (Visual Score)**: Guía de interpretación en 6 secciones (Intro, Verso 1, Coro 1, Puente, Coro 2 y Outro) con presets de parámetros y pistas de acción en tiempo real.
- **Escenario tartán**: el tejido impreso cubre el fondo; varias capas fotográficas del skyline se desplazan a la izquierda a distintas velocidades. Taxi y cabina cruzan el escenario como recortes con contorno y sombra, sin una tarjeta blanca detrás.
- **Color y movimiento ligados a la canción**: la paleta y el tartán transicionan entre secciones siguiendo el reloj del audio. Los golpes de teclado hacen que los recortes fotográficos salten con más fuerza, en poses cortadas como papel animado.
- **Retratos en cortes breves**: con <kbd>I</kbd>, quien interpreta decide cuándo aparece la foto de PinkPantheress; su posición cambia aleatoriamente, se inclina en poses discretas de stop motion y desaparece. El reloj musical no dispara este recorte.
- **Golpes de escena**: Cada acción de interpretación muestra una tarjeta tipográfica de papel, empuja el collage urbano y desplaza brevemente algunos recortes. El feedback evita ondas circulares.
- **Modo concierto**: Haces de luz, bloom suave y una silueta de audiencia convierten el paisaje en una proyección escénica. El HUD puede ocultarse con <kbd>M</kbd> o <kbd>F2</kbd>.
- **Partículas con roles**: cuatro tipos de fragmento recortado sugieren voz, bajo, caja y hi-hat. Conservan percepción vecinal, alineación, cohesión, separación, consulta del flow field y sensores de Physarum.
- **Intención y conducción humana**: los controles alteran las reglas o el entorno durante la interpretación; quien toca activa los gestos y la foto con <kbd>I</kbd>, mientras el color acompaña el avance de la canción. No se analiza el audio para decidir el movimiento de los agentes.
- **Acompañamiento de Audio Opcional**: Incluye un sintetizador de base 2-step a 138 BPM incorporado y un cargador de archivos MP3 para ensayar la canción localmente.

---

## Controles en Vivo

| Control | Acción | Descripción |
| :--- | :--- | :--- |
| <kbd>Q</kbd> / <kbd>ESPACIO</kbd> | **Golpe rítmico (Beat Step)** | Muestra **ON BEAT!**, salta los agentes y empuja la ciudad. |
| <kbd>A</kbd> | **Scatter** | Muestra **BREAK OUT!** y separa el enjambre con un acento de cámara. |
| <kbd>S</kbd> | **Gather** | Reúne el enjambre para los pasajes vocales. |
| <kbd>D</kbd> | **Spin** | Cambia el campo entre corriente, vórtice y ondas. |
| <kbd>F</kbd> / <kbd>T</kbd> | **Estelas Physarum** | Enciende o apaga las estelas químicas. |
| <kbd>I</kbd> | **Recorte fotográfico** | Hace aparecer la foto en un lugar aleatorio por un instante; quien interpreta decide cuándo. |
| <kbd>B</kbd> | **Salto de papel** | Da un impulso más amplio a los recortes del collage. |
| <kbd>L</kbd> / Botón | **Reproducir "Girl Like Me"** | Reproduce/Pausa la canción oficial cargada desde `src/sonido/`. |
| <kbd>C</kbd> | **Cohesión (Vocal)** | Muestra **CLOSE IN!** e incrementa la cohesión durante la voz íntima. |
| <kbd>V</kbd> | **Separación (Breakbeat)** | Muestra **BREAK OUT!** para una dispersión centrífuga explosiva. |
| <kbd>1</kbd> - <kbd>6</kbd> | **Secciones de la Partitura** | Salta a los movimientos de la canción (Intro, Verso, Coro, Puente, etc.). |
| <kbd>P</kbd> | **Metrónomo 2-Step** | Activa/detiene la base rítmica sintetizada a 138 BPM. |
| <kbd>M</kbd> / <kbd>F2</kbd> | **Ocultar / Mostrar HUD** | Modo de proyección para dejar visible la escenografía y el enjambre. |
| <kbd>R</kbd> | **Reiniciar Enjambre** | Reposiciona los agentes en el centro. |
| <kbd>F11</kbd> | **Pantalla Completa** | Activa pantalla completa para el performance. |

---

## Instalación y Ejecución

1. Clona el repositorio e instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre en tu navegador la URL local indicada por Vite (ej. `http://localhost:5173/`).

4. Para compilar la versión de producción:
```bash
npm run build
npm run preview
```

---

## Documentación y Bitácora

Consulta la bitácora, las evidencias pendientes y la autoevaluación provisional en [BITACORA_CAMBIOS.md](BITACORA_CAMBIOS.md).

## Referentes consultados

- [The Pink Panther — Watch the Titles](https://www.watchthetitles.com/titlesequence/the-pink-panther/): referencia de timing musical, acting gráfico y títulos animados; no es una guía para reproducir personajes o diseños.
- [Interactive Physarum — Bleuje](https://bleuje.com/physarum-explanation/): sensores frontales, giro hacia la concentración de estela, difusión y evaporación.
