const toggleUi = () => {
  const hidden = document.body.classList.toggle('ui-hidden');
  const button = document.querySelector('.toggle-ui');
  if (button) {
    button.textContent = hidden ? 'Mostrar UI' : 'Ocultar UI';
    button.setAttribute('aria-label', hidden ? 'Mostrar interfaz' : 'Ocultar interfaz');
  }
};

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() !== 'm' || event.target.matches('input, textarea')) return;
  event.preventDefault();
  toggleUi();
});
