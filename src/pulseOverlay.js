const pulseCanvas = document.createElement('canvas');
pulseCanvas.className = 'pulse-overlay';
document.querySelector('#app')?.append(pulseCanvas);

const context = pulseCanvas.getContext('2d');
const pulses = [];
let width = 0;
let height = 0;

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  pulseCanvas.width = width * ratio;
  pulseCanvas.height = height * ratio;
  pulseCanvas.style.width = `${width}px`;
  pulseCanvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function addPulse(x = width * 0.68, y = height * 0.58, color = '#009fe1') {
  pulses.push({ x, y, born: performance.now(), color });
  if (pulses.length > 8) pulses.shift();
}

function animate(time) {
  context.clearRect(0, 0, width, height);
  for (let index = pulses.length - 1; index >= 0; index -= 1) {
    const pulse = pulses[index];
    const age = time - pulse.born;
    const progress = age / 1500;
    if (progress >= 1) {
      pulses.splice(index, 1);
      continue;
    }
    const radius = 30 + progress * Math.max(width, height) * 0.24;
    const alpha = (1 - progress) ** 2;
    context.beginPath();
    context.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
    context.strokeStyle = `${pulse.color}${Math.round(alpha * 210).toString(16).padStart(2, '0')}`;
    context.lineWidth = 2 + alpha * 5;
    context.shadowBlur = 18;
    context.shadowColor = pulse.color;
    context.stroke();
    context.shadowBlur = 0;
  }
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
window.addEventListener('pointerdown', (event) => addPulse(event.clientX, event.clientY, '#f28fbe'));
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === ' ') {
    addPulse();
  }
});

resize();
addPulse();
requestAnimationFrame(animate);
