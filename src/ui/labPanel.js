function createSectionTitle(text) {
  const title =
    document.createElement(
      'div'
    );

  title.className =
    'ui-section-title';

  title.textContent =
    text;

  return title;
}


function createSlider({
  label,
  min,
  max,
  step,
  value,
  onInput
}) {
  const wrapper =
    document.createElement(
      'div'
    );

  wrapper.className =
    'ui-slider-row';


  const header =
    document.createElement(
      'div'
    );

  header.className =
    'ui-slider-header';


  const labelEl =
    document.createElement(
      'span'
    );

  labelEl.className =
    'ui-slider-label';

  labelEl.textContent =
    label;


  const valueEl =
    document.createElement(
      'span'
    );

  valueEl.className =
    'ui-slider-value';

  valueEl.textContent =
    Number(value).toFixed(2);


  header.append(
    labelEl,
    valueEl
  );


  const input =
    document.createElement(
      'input'
    );

  input.type =
    'range';

  input.className =
    'ui-slider';

  input.min =
    String(min);

  input.max =
    String(max);

  input.step =
    String(step);

  input.value =
    String(value);


  input.addEventListener(
    'input',
    () => {
      const numericValue =
        Number(input.value);

      valueEl.textContent =
        numericValue.toFixed(
          step >= 1
            ? 0
            : 2
        );

      onInput?.(
        numericValue
      );
    }
  );


  wrapper.append(
    header,
    input
  );


  return {
    wrapper,
    input,
    valueEl
  };
}


function createButton(
  text,
  onClick
) {
  const button =
    document.createElement(
      'button'
    );

  button.className =
    'ui-button';

  button.type =
    'button';

  button.textContent =
    text;


  button.addEventListener(
    'pointerdown',
    (event) => {
      event.stopPropagation();
    }
  );


  button.addEventListener(
    'click',
    (event) => {
      event.stopPropagation();

      onClick?.();
    }
  );


  return button;
}


export function createLabPanel({
  params,

  omegaSpread = 1.0,

  jumpAmount = 1.0,

  onKChange,

  onOmegaChange,

  onJumpChange,

  onDrop,

  onModeChange
}) {
  const panel =
    document.createElement(
      'aside'
    );

  panel.className =
    'ui-panel';


  // ========================================================
  // HEADER
  // ========================================================

  const header =
    document.createElement(
      'div'
    );

  header.className =
    'ui-panel-header';


  const title =
    document.createElement(
      'div'
    );

  title.className =
    'ui-panel-title';

  title.textContent =
    'KURAMOTO SYSTEM';


  const subtitle =
    document.createElement(
      'div'
    );

  subtitle.className =
    'ui-panel-subtitle';

  subtitle.textContent =
    'AUDIOVISUAL PERFORMANCE';


  header.append(
    title,
    subtitle
  );


  // ========================================================
  // SIMULACIÓN
  // ========================================================

  const simulationSection =
    document.createElement(
      'section'
    );

  simulationSection.className =
    'ui-section';


  simulationSection.append(
    createSectionTitle(
      'SIMULACIÓN'
    )
  );


  const kSlider =
    createSlider({
      label:
        'K — ACOPLAMIENTO',

      min:
        0,

      max:
        30,

      step:
        0.1,

      value:
        params?.couplingK?.value ??
        2.0,

      onInput:
        (value) => {
          if (
            params?.couplingK
          ) {
            params.couplingK.value =
              value;
          }

          onKChange?.(
            value
          );
        }
    });


  const omegaSlider =
    createSlider({
      label:
        'OMEGA — DISPERSIÓN',

      min:
        0,

      max:
        2,

      step:
        0.01,

      value:
        omegaSpread,

      onInput:
        (value) => {
          onOmegaChange?.(
            value
          );
        }
    });


  const jumpSlider =
    createSlider({
      label:
        'ENERGÍA DE SALTO',

      min:
        0.2,

      max:
        1.8,

      step:
        0.01,

      value:
        jumpAmount,

      onInput:
        (value) => {
          onJumpChange?.(
            value
          );
        }
    });


  simulationSection.append(
    kSlider.wrapper,
    omegaSlider.wrapper,
    jumpSlider.wrapper
  );


  // ========================================================
  // MODO
  // ========================================================

  const modeSection =
    document.createElement(
      'section'
    );

  modeSection.className =
    'ui-section';


  modeSection.append(
    createSectionTitle(
      'MODO DE PISTA'
    )
  );


  const modeDescription =
    document.createElement(
      'div'
    );

  modeDescription.className =
    'ui-mode-description';

  modeDescription.textContent =
    '1 · PISTA ORGÁNICA / 2 · GRUPOS';


  const modeButtons =
    document.createElement(
      'div'
    );

  modeButtons.className =
    'ui-button-grid';


  let mode1Button;

  let mode2Button;


  mode1Button =
    createButton(
      'MODO 1',
      () => {
        onModeChange?.(
          1
        );

        mode1Button.classList.add(
          'active'
        );

        mode2Button.classList.remove(
          'active'
        );
      }
    );


  mode2Button =
    createButton(
      'MODO 2',
      () => {
        onModeChange?.(
          2
        );

        mode2Button.classList.add(
          'active'
        );

        mode1Button.classList.remove(
          'active'
        );
      }
    );


  mode1Button.classList.add(
    'active'
  );


  modeButtons.append(
    mode1Button,
    mode2Button
  );


  modeSection.append(
    modeDescription,
    modeButtons
  );


  // ========================================================
  // PERTURBACIÓN
  // ========================================================

  const perturbSection =
    document.createElement(
      'section'
    );

  perturbSection.className =
    'ui-section';


  perturbSection.append(
    createSectionTitle(
      'PERTURBACIÓN'
    )
  );


  const dropButton =
    createButton(
      'GLOBAL DROP',
      () => {
        onDrop?.();
      }
    );


  dropButton.classList.add(
    'ui-button-primary'
  );


  const dropDescription =
    document.createElement(
      'div'
    );

  dropDescription.className =
    'ui-small-text';

  dropDescription.textContent =
    'Rompe temporalmente la sincronización global.';


  perturbSection.append(
    dropButton,
    dropDescription
  );


  // ========================================================
  // PERSONALIDADES
  // ========================================================

  const personalitySection =
    document.createElement(
      'section'
    );

  personalitySection.className =
    'ui-section';


  personalitySection.append(
    createSectionTitle(
      'PERSONALIDADES'
    )
  );


  const personalities = [
    {
      name:
        'KICK',

      color:
        '#FF3B30'
    },

    {
      name:
        'RUMBLE',

      color:
        '#8E44FF'
    },

    {
      name:
        'CLAP',

      color:
        '#FFFFFF'
    },

    {
      name:
        'CLOSED HAT',

      color:
        '#00D9FF'
    },

    {
      name:
        'OPEN HAT',

      color:
        '#FF2BA6'
    },

    {
      name:
        'ACID',

      color:
        '#7CFF00'
    }
  ];


  const legend =
    document.createElement(
      'div'
    );

  legend.className =
    'ui-legend';


  for (
    const personality
    of personalities
  ) {
    const item =
      document.createElement(
        'div'
      );

    item.className =
      'ui-legend-item';


    const dot =
      document.createElement(
        'span'
      );

    dot.className =
      'ui-legend-dot';

    dot.style.backgroundColor =
      personality.color;

    dot.style.boxShadow =
      `0 0 8px ${personality.color}`;


    const name =
      document.createElement(
        'span'
      );

    name.className =
      'ui-legend-name';

    name.textContent =
      personality.name;


    item.append(
      dot,
      name
    );


    legend.append(
      item
    );
  }


  personalitySection.append(
    legend
  );


  // ========================================================
  // ESTADOS
  // ========================================================

  const stateSection =
    document.createElement(
      'section'
    );

  stateSection.className =
    'ui-section';


  stateSection.append(
    createSectionTitle(
      'ESTADOS DEL SISTEMA'
    )
  );


  const states = [
    {
      name:
        'DESORDEN',

      description:
        'R bajo · fases desfasadas'
    },

    {
      name:
        'PARCIAL',

      description:
        'R medio · coordinación emergente'
    },

    {
      name:
        'ESTABLE',

      description:
        'R alto · sincronización colectiva'
    }
  ];


  const stateList =
    document.createElement(
      'div'
    );

  stateList.className =
    'ui-state-list';


  for (
    const state
    of states
  ) {
    const item =
      document.createElement(
        'div'
      );

    item.className =
      'ui-state-item';


    const stateName =
      document.createElement(
        'div'
      );

    stateName.className =
      'ui-state-name';

    stateName.textContent =
      state.name;


    const stateDescription =
      document.createElement(
        'div'
      );

    stateDescription.className =
      'ui-state-description';

    stateDescription.textContent =
      state.description;


    item.append(
      stateName,
      stateDescription
    );


    stateList.append(
      item
    );
  }


  stateSection.append(
    stateList
  );


  // ========================================================
  // CONTROLES
  // ========================================================

  const controlsSection =
    document.createElement(
      'section'
    );

  controlsSection.className =
    'ui-section';


  controlsSection.append(
    createSectionTitle(
      'CONTROLES'
    )
  );


  const controls = [
    '[ / ]   modificar K',

    '- / =   modificar omega',

    'SPACE   perturbación global',

    'CLICK   perturbar agente',

    '1 / 2   cambiar modo'
  ];


  const controlsList =
    document.createElement(
      'div'
    );

  controlsList.className =
    'ui-controls-list';


  for (
    const text
    of controls
  ) {
    const item =
      document.createElement(
        'div'
      );

    item.className =
      'ui-control-item';

    item.textContent =
      text;

    controlsList.append(
      item
    );
  }


  controlsSection.append(
    controlsList
  );


  // ========================================================
  // FOOTER
  // ========================================================

  const footer =
    document.createElement(
      'div'
    );

  footer.className =
    'ui-panel-footer';

  footer.textContent =
    'KURAMOTO · SYNCHRONIZATION · LIVE SYSTEM';


  // ========================================================
  // ARMAR PANEL
  // ========================================================

  panel.append(
    header,
    simulationSection,
    modeSection,
    perturbSection,
    personalitySection,
    stateSection,
    controlsSection,
    footer
  );


  document.body.append(
    panel
  );


  return {
    refresh() {}
  };
}