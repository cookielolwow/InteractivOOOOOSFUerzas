const modes = ['GALAXY', 'SCATTER', 'ATTRACT', 'TRIAD', 'GRAVITY', 'CLUSTER', 'SPIRAL', 'PATHS', 'DUALITY', 'NETWORK', 'PRESENT', 'MERGE', 'FINAL'];
const status = document.createElement('div');
status.className = 'live-readout live-status';
status.innerHTML = '<span class="live-status-label">SISTEMA EN VIVO</span><strong id="statusMode">GALAXY</strong><span id="statusTime">00:00</span><span class="status-energy"><i id="statusEnergy"></i></span>';
const panel = document.querySelector('.control-panel');
(panel || document.querySelector('#app'))?.append(status);

const started = performance.now();
let energy = 0.42;

function update() {
  const slideIndex = [...document.querySelectorAll('.slide')].findIndex((slide) => slide.classList.contains('is-active'));
  const elapsed = Math.floor((performance.now() - started) / 1000);
  const mode = modes[Math.max(0, slideIndex)] || modes[0];
  energy = 0.24 + Math.abs(Math.sin(performance.now() * 0.0027)) * 0.52;
  status.querySelector('#statusMode').textContent = mode;
  status.querySelector('#statusTime').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  status.querySelector('#statusEnergy').style.width = `${Math.round(energy * 100)}%`;
  requestAnimationFrame(update);
}

update();
