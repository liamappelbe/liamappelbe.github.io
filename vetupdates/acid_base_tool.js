(function() {
function newElement(type, parent, classes = [], text = null, attr = []) {
  const n = document.createElement(type);
  if (text != null) n.innerHTML = text;
  for (const cls of classes) n.classList.add(cls);
  if (parent != null) parent.appendChild(n);
  for (const [name, val] of attr) n.setAttribute(name, val);
  return n;
}

function newDiv(parent, classes = [], text = null) {
  return newElement('div', parent, classes, text);
}

function newTable(parent, classes = []) {
  return newElement('table', parent, classes);
}

function newRow(parent, classes = []) {
  return newElement('tr', parent, classes);
}

function newCell(parent, classes = [], text = null) {
  return newElement('td', parent, classes, text);
}

function newTextInput(parent, classes = [], initVal = null) {
  return newElement(
      'input', parent, classes, null, [['type', 'text'], ['value', initVal]]);
}

function emptyDiv(n) {
  while (n.hasChildNodes()) n.removeChild(n.lastChild);
}

const reFloat = /^[0-9]*[.]?[0-9]*$/;
function getFloat(n) {
  const str = n.value;
  if (!reFloat.test(str)) return null;
  const val = parseFloat(str);
  return isNaN(val) ? null : val;
}

function count(n) {
  const a = [];
  for (let i = 0; i < n; ++i) a.push(i);
  return a;
}

function newAnalysis(node, spec, displayOrder = null) {
  if (displayOrder != null) {
    console.assert(
        spec.length == displayOrder.length, spec.length, displayOrder.length);
  }
  const table = newTable(node, ['analysis']);
  const values = {};
  const updaters = [];
  const valNodes = [];
  for (const i of displayOrder ?? count(spec.length)) {
    const [name, initVal, update] = spec[i];
    if (name != null) {
      const isInput = initVal != null;
      const row =
          newRow(table, [isInput ? 'analysis-input' : 'analysis-output']);
      newCell(row, ['analysis-name'], name);
      const valCell = newCell(row, ['analysis-value']);
      console.assert(valNodes[i] == null);
      valNodes[i] = isInput ? newTextInput(valCell, [], initVal) : valCell;
    }
  }
  for (let i = 0; i < spec.length; ++i) {
    const [name, initVal, update] = spec[i];
    updaters.push(() => update(valNodes[i], values));
  }
  const loop = () => {
    for (const updater of updaters) {
      updater();
    }
    window.setTimeout(loop, 100);
  };
  loop();
}

function input(name, id, initVal) {
  return [
    name,
    initVal,
    (node, values) => {
      const val = getFloat(node);
      if (val == null) {
        node.classList.add('invalid');
      } else {
        node.classList.remove('invalid');
        values[id] = val;
      }
    },
  ];
}

function output(name, id, formula) {
  return [
    name,
    null,
    (node, values) => {
      const val = formula(values);
      values[id] = val;
      node.innerText = val.toFixed(2);
    },
  ];
}

function hidden(id, formula) {
  return [null, null, (node, values) => values[id] = formula(values)];
}

function setupStewart(node) {
  newAnalysis(
      node,
      [
        input('pH', 'pH', 7.07),
        input('CO&#x2082; (mmHg)', 'CO2', 56),
        input('Na+ (mEq/L)', 'Na', 153.8),
        input('K+ (mEq/L)', 'K', 4.81),
        input('Mg+ (mEq/L)', 'Mg', 2.2),
        input('Ca++ (mEq/L)', 'Ca', 1.2),
        input('Cl- (mEq/L)', 'Cl', 120),
        input('Lactate (mmol/L)', 'lac', 5),
        input('Albumin (g/dL)', 'alb', 5.5),
        input('Phosphate (mg/dL)', 'phos', 7),
        hidden('catSum', v => v.Na + v.K + v.Mg + v.Ca),
        output(
            'HCO&#x2083; (mEq/L)', 'HCO3',
            v => 0.03 * v.CO2 * (10 ** (v.pH - 6.1))),
        output('BE', 'BE', v => v.HCO3 + 13.77 * v.pH - 124.58),
        output(
            'Alb Contribution', 'albCon',
            v => v.alb * 10 * (0.123 * v.pH - 0.631)),
        output(
            'Phos Contribution', 'phosCon',
            v => v.phos * 0.323 * (0.309 * v.pH - 0.469)),
        output('Atot', 'atot', v => v.albCon + v.phosCon),
        output(
            'Unmeasured Anions', 'unan',
            v => v.catSum - (v.Cl + v.lac + v.albCon + v.phosCon + v.HCO3)),
        output('SIDa', 'SIDa', v => v.catSum - (v.Cl + v.lac)),
        output('SIDe', 'SIDe', v => v.HCO3 + v.albCon + v.phosCon),
        output('SIG', 'SIG', v => v.SIDa - v.SIDe),
        // output('SID', 'SID', v => v.SIG + v.atot + v.HCO3),
      ],
      [0, 1, 11, 12, 2, 3, 4, 5, 6, 7, 17, 18, 19, 8, 9, 10, 13, 14, 15, 16]);
}

function setupSemiQuant(node) {
  newAnalysis(
      node,
      [
        input('Na+ (mEq/L)', 'Na', 153),
        input('Cl- (mEq/L)', 'Cl', 88),
        output('Corrected Cl-', 'CCl', v => v.Cl * 149 / v.Na),
        input('Phosphate (mg/dL)', 'phos', 6),
        input('Albumin (g/dL)', 'alb', 1.8),
        input('Lactate (mmol/L)', 'lac', 21),
        input('Base Excess (mmol/L)', 'BE', 7),
        output('Free Water Effect', 'FWE', v => (v.Na - 149) / 4),
        output('Chloride Effect', 'ClE', v => 115.5 - v.CCl),
        output('Albumin Effect', 'albE', v => (3.8 - v.alb) * 4),
        output('Phosphate Effect', 'phosE', v => (3.9 - v.phos) / 2),
        output('Lactate Effect', 'lacE', v => -v.lac),
        hidden('sum', v => v.FWE + v.ClE + v.albE + v.phosE + v.lacE),
        output('Unmeasured Anions Effect', 'unanE', v => v.BE - v.sum),
      ],
  );
}

function setupBloodTrans(node) {
  newAnalysis(
      node,
      [
        input('PCV Target (%)', 'targ', 20),
        input('PCV Donor (%)', 'don', 60),
        input('PCV Recipient (%)', 'recp', 11),
        input('BW (kg)', 'bw', 24),
        output('Volume', 'vol', v => ((v.targ - v.recp) / v.don) * v.bw * 80),
      ],
  );
}

class AcidBaseTool extends HTMLElement {
  constructor() {
    super();
    const mode = this.getAttribute('mode');
    if (mode == 'stewart') {
      setupStewart(this);
    } else if (mode == 'semi-quant') {
      setupSemiQuant(this);
    } else if (mode == 'blood-trans') {
      setupBloodTrans(this);
    }
  }
}

window.addEventListener(
    'load', () => customElements.define('acid-base-tool', AcidBaseTool));
})();
