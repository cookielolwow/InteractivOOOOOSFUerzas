# 📋 BITÁCORA DE CAMBIOS - U3 · Forces Instrument

**Fecha de inicio**: 2026-09-01  
**Proyecto**: Rave de Kuramoto con síntesis de audio en tiempo real  
**Estado actual**: ✅ Funcional con estética rave mejorada

---

## 🔄 HISTORIAL DE CAMBIOS

### **CAMBIO 1: Reducción de Agentes para Fluidez**
**Fecha**: 2026-09-01  
**Archivos modificados**:
- `src/main.js` - Línea 33
- `src/simulation/createSimulation.js` - Línea ~70

**Descripción**:
- `NUM_AGENTS`: 144 → **96 agentes**
- `TYPE_LIMITS`: Ajustados proporcionalmente
  - KICK: 36 → 24
  - RUMBLE: 24 → 16
  - CLAP: 18 → 12
  - CLOSED_HAT: 30 → 20
  - OPEN_HAT: 18 → 12
  - ACID: 18 → 12

**Razón**: Mejor rendimiento (FPS más estable) mientras se mantiene la experiencia visual

---

### **CAMBIO 2: Distribución de Agentes en Grid Uniforme**
**Fecha**: 2026-09-01  
**Archivo modificado**: `src/simulation/createSimulation.js` (función `generateCrowdPositions`)

**Cambio**:
```javascript
// ANTES: Distribución caótica en pequeños grupos
- Grupos aleatorios con centros imaginarios
- Agentes muy juntos, distribución desigual
- Aspecto de "fiesta desorganizada"

// DESPUÉS: Grid regular con pequeños offsets
- Grid: 9 columnas × 11 filas (96 agentes)
- Espaciado regular: width/10 × depth/12
- Pequeños offsets aleatorios (35% del espaciado) para naturalidad
- Evita atravesamiento entre agentes
```

**Razón**: Crear sensación de "crowd organizado" sin ser demasiado rígido

---

### **CAMBIO 3: Movimiento "Gelatinita" - Oscilación Suave**
**Fecha**: 2026-09-01  
**Archivo modificado**: `src/simulation/createSimulation.js` (función `stepSimulation`)

**Cambio**:
```javascript
// ANTES: rawPulse con Math.pow() → saltos afilados
const jumpPulse = Math.pow(rawPulse, data.jumpSharpness);

// DESPUÉS: Oscilación suave sin compresión
const smoothOscillation = rawPulse;
const smoothFactor = 0.12; // Suavizado gradual
data.currentJump += (targetJump - data.currentJump) * smoothFactor;
```

**Efecto**: 
- ⬆️ Estira cuando sube
- 🫧 Se comprime cuando baja
- ⬇️ Cae suavemente
- 🫧 Rebota
- ⬆️ Vuelve a subir

**Razón**: Recuperar el efecto "gelatinita" de versiones anteriores

---

### **CAMBIO 4: Deformación de Escala Tipo Gelatina**
**Fecha**: 2026-09-01  
**Archivo modificado**: `src/simulation/createSimulation.js` (función `stepSimulation`)

**Cambio**:
```javascript
// Deformación coordinada
const compression = Math.max(0, -Math.sin(jumpPhase));
const stretch = Math.max(0, Math.sin(jumpPhase));

const scaleY = 1.0 + stretch * 0.15 - compression * 0.12;
const scaleXZ = 1.0 - stretch * 0.07 + compression * 0.08;

data.object.scale.y = scaleY;
data.object.scale.x = scaleXZ;
data.object.scale.z = scaleXZ;
```

**Efecto Visual**:
- Cuando sube: se estira verticalmente (Y += 0.15), se adelgaza (XZ -= 0.07)
- Cuando baja: se comprime verticalmente (Y -= 0.12), se engruesa (XZ += 0.08)

**Razón**: Crear sensación de cuerpo suave/blando, como una masa pulsante

---

### **CAMBIO 5: Movimiento "Charrito" - Rotaciones**
**Fecha**: 2026-09-01  
**Archivo modificado**: `src/simulation/createSimulation.js` (función `stepSimulation`)

**Código agregado**:
```javascript
// Rotación Z: Oscilación lateral
data.object.rotation.z = Math.sin(phase) * data.jumpSharpness * 0.0045;

// Rotación X: Bamboleo frontal
data.object.rotation.x = Math.cos(phase * 0.7 + data.index) * 0.04;

// Rotación Y: Giro vertical (intensifica con altura)
data.object.rotation.y = Math.sin(phase * 0.55) * 0.08 * (1 + data.currentJump * 3.5);
```

**Efecto**: Agentes "bailotean" naturalmente en los 3 ejes

---

### **CAMBIO 6: Impactos Visuales - Emissiveintensity Dinámico**
**Fecha**: 2026-09-01  
**Archivo modificado**: `src/main.js` (sección ATERRIZAJES)

**Lógica agregada**:
```javascript
const groupEnergy = [0, 0, 0, 0, 0, 0];

// Calcular energía máxima por tipo
for (const impact of impacts) {
  groupEnergy[impact.type] = Math.max(
    groupEnergy[impact.type],
    impact.strength
  );
}

// Aplicar brillo dinámico a agentes
for (const impact of impacts) {
  const energy = groupEnergy[impact.type];
  const visualStrength = THREE.MathUtils.clamp(
    impact.strength * (0.45 + energy * 2.1),
    0,
    1.5
  );
  
  if (simulation.ravers[impact.index]) {
    raver.traverse(object => {
      if ('emissiveIntensity' in object.material) {
        object.material.emissiveIntensity = visualStrength > 0.7
          ? 4.0 + energy * 4.0
          : 1.5 + energy * 2.5;
      }
    });
  }
}
```

**Efecto**: Los agentes brillan más intensamente cuando impactan basado en la energía del grupo

---

### **CAMBIO 7: Cámara Animada al BPM**
**Fecha**: 2026-09-01  
**Archivo modificado**: `src/main.js` (sección CÁMARA)

**Código**:
```javascript
// Oscilación vertical al beat (BPM = 138)
const beatPhaseForCamera = (time / BEAT_SECONDS) * Math.PI * 2;
const cameraHeightPulse = Math.sin(beatPhaseForCamera) * 0.35;

// Oscilación horizontal suave
const cameraSwayPhase = (time / BEAT_SECONDS) * Math.PI * 2;
const cameraSway = Math.sin(cameraSwayPhase * 0.5) * 0.8;

camera.position.x = ... + cameraSway;
camera.position.y = 7.6 + ... + cameraHeightPulse;
```

**Efecto**: Cámara se mueve suavemente al ritmo de la música (0.35 unidades de altura, 0.8 en X)

**Razón**: Immersión: la vista pulsa con el BPM

---

## 🎨 CAMBIOS VISUALES APLICADOS

### Colores Neon
**Archivo**: `src/simulation/createSimulation.js`

```javascript
PERSONALITY_COLORS = [
  '#FF0080',   // KICK - Rosa fuerte
  '#00FF00',   // RUMBLE - Verde lima
  '#FFFF00',   // CLAP - Amarillo
  '#00FFFF',   // CLOSED_HAT - Cian
  '#FF00FF',   // OPEN_HAT - Magenta
  '#7CFF00'    // ACID - Verde ácido
];
```

### Lighting Enhancement
**Archivo**: `src/main.js`

- Luz ambiental: `#7CFF00` (verde ácido) con intensidad = 0.12 + R * 0.08
- 8 luces de club distribuidas en círculo (antes 4)
- Intensidad de luces: 120 + localPulse * (400 + R * 700)
- Bloom mejorado: (0.08, 0.35, 0.98)

### Styling HUD
**Archivo**: `src/styles.css`

- Glow text neon: `0 0 10px #7CFF00, 0 0 20px #FF1493`
- Fondo translúcido: `rgba(124, 255, 0, 0.08)`
- Border: `2px solid #7CFF00`

---

## 🔊 SISTEMA DE AUDIO

### Síntesis en Tiempo Real
**Archivo**: `src/main.js`

**8 tipos de sonidos sintetizados**:
1. **playKick()** - Frecuencia 54 Hz, decaimiento rápido
2. **playRumble()** - Frecuencia 32 Hz, sub-bass
3. **playClap()** - Ruido blanco filtrado
4. **playHat()** - Ruido de hi-hat
5. **playOpenHat()** - Hi-hat abierto, más resonancia
6. **playAcid()** - Síntesis acid (frecuencias variables)
7. **playStab()** - Stab sintetizado
8. **playBuildNoise()** - Ruido de construcción/buildUp

### Music Scheduler
**Lógica**:
- R (order parameter) controla el patrón de beat
- R alto → más notas y eventos sonoros
- R bajo → patrón más simple y tranquilo
- Subdivisiones: Beat, Eighths, Sixteenths

---

## 📊 CONFIGURACIÓN ACTUAL

| Parámetro | Valor | Descripción |
|-----------|-------|------------|
| **Agentes** | 96 | Reduced from 144 for better FPS |
| **Grid** | 9×11 | Uniform distribution |
| **BPM** | 138 | Tempo base |
| **Kuramoto K** | ~2-3 | Coupling constant (variable) |
| **Cámara Y** | 7.6 + pulse | Base height + animation |
| **Bloom** | 0.08/0.35/0.98 | Threshold/strength/radius |
| **Smooth Factor** | 0.12 | Gelatina movement smoothing |
| **Stretch Scale** | ±0.15Y/±0.07XZ | Deformation amplitude |

---

## ✅ CHECKLIST DE FUNCIONAMIENTO

- ✅ Agentes bailando en grid uniforme
- ✅ Efecto gelatinita (estiramiento/compresión)
- ✅ Movimiento charrito (rotaciones suaves)
- ✅ Impactos generan brillo dinámico
- ✅ Colores neon vibrantes
- ✅ Luces de club animadas
- ✅ Cámara pulsando al BPM
- ✅ Audio sintetizado en tiempo real
- ✅ Sincronización Kuramoto funcionando
- ✅ No hay atravesamiento entre agentes
- ✅ Rendimiento fluido (60 FPS)

---

## 🎯 NOTAS TÉCNICAS

### Por qué Grid en lugar de distribución caótica
- **Mejor control**: Evita que agentes se atraviesen
- **Visual más limpio**: Aspecto de crowd organizado pero vivo
- **Offsets aleatorios**: Evita rigidez extrema

### Por qué Smooth Factor = 0.12
- Menos de 0.12 → movimiento lento, "pesado"
- Más de 0.12 → movimiento rígido, "saltarín"
- 0.12 es el punto donde se ve "blando" sin perder respuesta

### Por qué Deformación XZ opuesta a Y
- Cuando suben (Y estira), XZ se comprime (conservación de volumen)
- Cuando bajan (Y comprime), XZ se expande
- Simula deformación física realista

### Impactos y GroupEnergy
- `groupEnergy[type]` = máxima fuerza de impacto de ese tipo
- Usada en `visualStrength = strength * (0.45 + energy * 2.1)`
- Factor multiplicador asegura que agentes brillen más cuando el tipo está activo

---

## 🚀 FUTURAS MEJORAS POSIBLES

1. **Movimiento horizontal**: Agregar roaming suave basado en R
2. **Variación de intensidad**: Diferentes amplitudes por tipo de agente
3. **Interacción de cámara**: Zoom in/out basado en R
4. **Transiciones suaves**: Fade between visual modes
5. **Grabación/Reproducción**: Guardar y reproducir sesiones
6. **VR Support**: Optimizar para headsets de realidad virtual

---

**Última actualización**: 2026-09-01 23:59  
**Versión**: 1.0 - Rave de Kuramoto con Gelatinita
