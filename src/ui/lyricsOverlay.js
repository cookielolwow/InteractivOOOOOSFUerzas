export class LyricsOverlay {
  constructor(container) {
    this.container = document.createElement('section');
    this.container.className = 'lyrics-projector is-empty';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-label', 'Letra sincronizada');
    this.container.innerHTML = `
      <div class="lyrics-kicker"><span class="lyrics-equalizer">♫</span><span id="lyricsStatus">LETRA PARA PROYECCIÓN</span><span class="lyrics-page">LRC · J</span></div>
      <div class="lyrics-previous" id="lyricsPrevious"></div>
      <div class="lyrics-current" id="lyricsCurrent"></div>
      <div class="lyrics-next" id="lyricsNext">Carga un archivo .LRC para mostrar toda la letra a tiempo.</div>
      <div class="lyrics-progress"><span id="lyricsProgress"></span></div>`;
    document.body.appendChild(this.container);
    this.previous = this.container.querySelector('#lyricsPrevious');
    this.current = this.container.querySelector('#lyricsCurrent');
    this.next = this.container.querySelector('#lyricsNext');
    this.status = this.container.querySelector('#lyricsStatus');
    this.progress = this.container.querySelector('#lyricsProgress');
    this.cues = [];
    this.visible = true;
    this.currentIndex = -1;
    this.currentWordIndex = -1;
    this.manualMode = false;
    this.manualIndex = 0;
    this.manualWordIndex = -1;
  }

  load(cues, filename = 'LETRA LOCAL') {
    this.cues = cues;
    this.currentIndex = -1;
    this.currentWordIndex = -1;
    this.manualMode = false;
    this.status.textContent = filename.replace(/\.lrc$/i, '').slice(0, 32).toUpperCase();
    this.container.classList.toggle('is-empty', !cues.length);
    this.container.classList.remove('is-error');
    this.container.classList.add('is-loaded');
    this.setVisible(true);
    if (!cues.length) this.showMessage('No encontré líneas con marcas de tiempo. Usa un .LRC con marcas [mm:ss.xx].', true);
  }

  showMessage(message, error = false) {
    this.cues = [];
    this.container.classList.add('is-empty');
    this.container.classList.toggle('is-error', error);
    this.current.textContent = error ? 'LETRA NO CARGADA' : 'LETRA EN VIVO';
    this.next.textContent = message;
  }

  setVisible(visible) {
    this.visible = visible;
    this.container.classList.toggle('is-hidden', !visible);
  }

  toggle() { this.setVisible(!this.visible); }

  findCueIndex(timeSeconds) {
    let lo = 0, hi = this.cues.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.cues[mid].time <= timeSeconds) lo = mid + 1;
      else hi = mid;
    }
    return Math.max(0, lo - 1);
  }

  renderWord(cueIndex, wordIndex) {
    const cue = this.cues[cueIndex];
    if (!cue) return;
    const words = cue.text.split(/\s+/);
    const safeWordIndex = Math.max(0, Math.min(words.length - 1, wordIndex));
    if (cueIndex === this.currentIndex && safeWordIndex === this.currentWordIndex) return;

    this.currentIndex = cueIndex;
    this.currentWordIndex = safeWordIndex;
    this.container.dataset.layout = String((cueIndex + safeWordIndex) % 5);
    this.previous.textContent = '';
    this.next.textContent = '';
    const cube = document.createElement('span');
    cube.className = 'lyric-word is-sung is-current';
    cube.textContent = words[safeWordIndex];
    this.current.replaceChildren(cube);
    this.current.classList.remove('line-arrive');
    void this.current.offsetWidth;
    this.current.classList.add('line-arrive');
  }

  advanceManualCue(timeSeconds = 0) {
    if (!this.cues.length) return false;
    if (!this.manualMode) {
      this.manualMode = true;
      this.manualIndex = this.findCueIndex(timeSeconds);
      this.manualWordIndex = -1;
      this.status.textContent = 'CUE MANUAL · B SIGUIENTE';
    }
    const words = this.cues[this.manualIndex].text.split(/\s+/);
    this.manualWordIndex += 1;
    if (this.manualWordIndex >= words.length) {
      this.manualIndex = Math.min(this.manualIndex + 1, this.cues.length - 1);
      this.manualWordIndex = 0;
    }
    this.renderWord(this.manualIndex, this.manualWordIndex);
    return true;
  }

  setAutomaticMode() {
    this.manualMode = false;
    this.currentIndex = -1;
    this.currentWordIndex = -1;
    this.status.textContent = 'GIRL LIKE ME · LETRA';
  }

  update(timeSeconds) {
    if (!this.visible || !this.cues.length || !Number.isFinite(timeSeconds)) return;
    if (this.manualMode) return;
    const index = this.findCueIndex(timeSeconds);
    if (index < 0) {
      this.currentIndex = -1;
      this.currentWordIndex = -1;
      this.container.classList.add('before-first-line');
      this.previous.textContent = '';
      this.current.textContent = '';
      this.next.textContent = this.cues[0].text;
      this.progress.style.width = '0%';
      return;
    }
    this.container.classList.remove('before-first-line');
    const cue = this.cues[index];
    const nextCue = this.cues[index + 1];
    const duration = Math.max(0.35, (nextCue?.time ?? cue.time + 3) - cue.time);
    const progress = Math.max(0, Math.min(1, (timeSeconds - cue.time) / duration));
    this.progress.style.width = `${progress * 100}%`;
    const wordIndex = Math.min(cue.text.split(/\s+/).length - 1, Math.max(0, Math.floor(progress * cue.text.split(/\s+/).length)));
    this.renderWord(index, wordIndex);
  }
}
