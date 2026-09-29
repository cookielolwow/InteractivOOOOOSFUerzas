# PinkPantheress — "Girl Like Me"
### Instrumento Visual de Agentes Autónomos (The Nature of Code, Cap. 5)

Instrumento interactivo para la Web diseñado para interpretar en vivo la canción **"Girl Like Me"** de **PinkPantheress** (UK Garage / 2-step breakbeat, 138 BPM), basado en la estética visual Y2K cyber-dreamcore y la edición sincopada de su video musical oficial.

Construido utilizando exclusivamente la paleta algorítmica de **Steering Behaviors (Craig Reynolds)**, **Flocking**, **Flow Fields (Campos de Flujo por Ruido Simplex)** e **Interactive Physarum (Simulación de Moho del Fango)**.

---

## Características Principales

- **Agentes con Percepción Limitada**: Cada agente percibe a sus vecinos locales en un radio acotado, consulta el campo vectorial de flujo y utiliza 3 sensores frontales para quimioatracción sobre un búfer de estelas bioluminiscentes (*Physarum polycephalum*).
- **Escalado Rítmico Cuantizado (*Stepped Scaling*)**: Emula la edición del video musical de PinkPantheress mediante saltos discretos de escala y ráfagas de impulsos sincopados que reaccionan a tus toques de ritmo.
- **Interpretación Humana Activa**: Sin automatización ciega por micrófono o análisis de audio. El ejecutante escucha, decide y conduce el sistema en tiempo real.
- **Partitura Visual (Visual Score)**: Guía de interpretación en 6 secciones (Intro, Verso 1, Coro 1, Puente, Coro 2 y Outro) con presets de parámetros y pistas de acción en tiempo real.
- **Estética Y2K Camcorder**: HUD estilo miniDV de los años 2000, paleta cromática Baby Pink, Fucsia Neón, Lavanda Cyber y destellos brillantes de 4 puntas.
- **Acompañamiento de Audio Opcional**: Incluye un sintetizador de base 2-step a 138 BPM incorporado y un cargador de archivos MP3 para ensayar la canción localmente.

---

## Controles en Vivo

| Control | Acción | Descripción |
| :--- | :--- | :--- |
| <kbd>ESPACIO</kbd> / <kbd>Clic</kbd> | **Escalado Rítmico (Beat Step)** | Dispara el salto de escala cuantizado sincronizado con la percusión. |
| <kbd>L</kbd> / Botón | **Reproducir "Girl Like Me"** | Reproduce/Pausa la canción oficial cargada desde `src/sonido/`. |
| <kbd>C</kbd> | **Cohesión (Vocal)** | Incrementa la cohesión para agrupar el enjambre durante la voz íntima. |
| <kbd>V</kbd> | **Separación (Breakbeat)** | Dispersión centrífuga explosiva para los drops de batería. |
| <kbd>F</kbd> | **Flow Field (Torbellino)** | Alterna modos de flujo (flujo regular, torbellino, ondas). |
| <kbd>T</kbd> | **Estelas Physarum** | Activa/desactiva la fosforescencia y rastro químico. |
| <kbd>1</kbd> - <kbd>6</kbd> | **Secciones de la Partitura** | Salta a los movimientos de la canción (Intro, Verso, Coro, Puente, etc.). |
| <kbd>P</kbd> | **Metrónomo 2-Step** | Activa/detiene la base rítmica sintetizada a 138 BPM. |
| <kbd>M</kbd> | **Ocultar / Mostrar HUD** | Modo minimalista limpio para la proyección en vivo. |
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

Consulta la autoevaluación detallada y el fundamento teórico completo en [BITACORA_CAMBIOS.md](file:///c:/Users/camil/InteractivOOOOOSFUerzas/BITACORA_CAMBIOS.md).
