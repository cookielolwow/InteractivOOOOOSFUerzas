const identity = document.querySelector('.institutional-identity');

if (identity) {
  const base = import.meta.env.BASE_URL;
  identity.innerHTML = `<img class="identity-lockup identity-forum" src="${base}UPB_Forum_logo.png" alt="Fórum UPB Centro de Eventos"><span class="identity-divider" aria-hidden="true"></span><img class="identity-lockup identity-upb" src="${base}90_UPB_logo.png" alt="UPB 90 años">`;
}

function applyPresentationDefaults() {
  const language = document.querySelector('#languageSelect');
  if (language && language.value !== 'pt') {
    language.value = 'pt';
    language.dispatchEvent(new Event('change', { bubbles: true }));
  }

  document.querySelectorAll('.slide-tag, .slide-kicker').forEach((node) => {
    if (/^FOTO\s+\d+$/i.test(node.textContent.trim())) {
      node.textContent = 'registro visual';
    }
  });
}

applyPresentationDefaults();
new MutationObserver(applyPresentationDefaults).observe(document.querySelector('#app'), { childList: true, subtree: true });
