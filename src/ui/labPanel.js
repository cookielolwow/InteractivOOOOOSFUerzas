function rangeRow(
  parent,
  label,
  object,
  key,
  min,
  max,
  step,
  onInput
) {

  const wrap =
    document.createElement(
      'div'
    );

  wrap.className =
    'row';

  const lab =
    document.createElement(
      'label'
    );

  const name =
    document.createElement(
      'span'
    );

  const value =
    document.createElement(
      'span'
    );

  value.className =
    'value';

  name.textContent =
    label;

  lab.append(
    name,
    value
  );

  const input =
    document.createElement(
      'input'
    );

  input.type =
    'range';

  input.min =
    String(min);

  input.max =
    String(max);

  input.step =
    String(step);

  input.value =
    String(
      object[key]
    );


  const refresh =
    () => {

      object[key] =
        Number(
          input.value
        );

      value.textContent =
        Number(
          input.value
        ).toFixed(2);

      onInput?.(
        object[key]
      );

    };


  input.addEventListener(
    'input',
    refresh
  );

  refresh();

  wrap.append(
    lab,
    input
  );

  parent.append(
    wrap
  );

  return {
    input,
    refresh
  };

}


function button(
  parent,
  label,
  onClick
) {

  const b =
    document.createElement(
      'button'
    );

  b.textContent =
    label;

  b.addEventListener(
    'click',
    onClick
  );

  parent.append(
    b
  );

  return b;

}


export function createLabPanel({
  params,
  onDrop
}) {

  const panel =
    document.createElement(
      'aside'
    );

  panel.className =
    'panel';

  panel.innerHTML = `
    <div class="brand">
      DIRTY TECHNO 138 BPM
    </div>

    <p>
      Kuramoto Self-Organization Rave
    </p>
  `;


  const group =
    document.createElement(
      'div'
    );

  group.className =
    'group';

  group.innerHTML =
    '<h2>Kuramoto Control</h2>';

  panel.append(
    group
  );


  const state = {

    couplingK:
      params.couplingK.value,

    djIntervention:
      params.djIntervention.value

  };


  rangeRow(
    group,
    'Acoplamiento (K)',
    state,
    'couplingK',
    0,
    30,
    0.1,
    value =>
      params.couplingK.value =
        value
  );


  rangeRow(
    group,
    'DJ Fader (Chaos)',
    state,
    'djIntervention',
    0,
    60,
    1.0,
    value =>
      params.djIntervention.value =
        value
  );


  const actions =
    document.createElement(
      'div'
    );

  actions.className =
    'group';

  actions.innerHTML =
    '<h2>Acción Performativa</h2>';

  panel.append(
    actions
  );


  button(
    actions,
    'EL DROP (Romper Ritmo)',
    onDrop
  );


  document.body.append(
    panel
  );


  return {

    element:
      panel,

    setVisible:
      () => {}

  };

}