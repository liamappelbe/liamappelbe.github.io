(function() {
const kLocalDev = false;
const kApiEndpoint =
    kLocalDev ? 'http://localhost:8080' : 'https://squeakysqueenoctopus.com/';
const kSearchApi = kApiEndpoint + '/zpqk';
const kMetadataApi = kApiEndpoint + '/meta';
const kRetries = 10;

async function asyncRequest(url) {
  let errorCode = null;
  let errorResponse = null;
  let bail = false;
  for (let i = 0; i < kRetries; ++i) {
    try {
      return await new Promise((resolve, reject) => {
        const r = new XMLHttpRequest();
        r.type = 'application/json';
        r.onload = () => {
          if (r.status == 200) {
            resolve(r.responseText);
          } else {
            errorResponse = r.responseText;
            errorCode = r.status;
            if (errorCode == 400) {
              // Special case 400 errors, because it means that the request was
              // bad, so don't bother retrying.
              bail = true;
            }
            reject();
          }
        };
        r.onerror = reject;
        r.open('GET', url, true);
        r.send();
      });
    } catch (e) {
      if (bail) break;
      // Exponential backoff, with a limit, and some randomization.
      const t = Math.min(0.5 * (1 << i), 10) * (0.75 + 0.5 * Math.random());
      console.log('VETUPSEARCH', `Retrying in ${t} seconds...`, url);
      await new Promise((resolve, reject) => {
        window.setTimeout(resolve, t * 1000);
      });
    }
  }
  console.error(
      'VETUPSEARCH', 'Request failed: ', url, errorCode, errorResponse);
  throw 'Network Error. Try reloading the page.';
}

async function metadataRequest() {
  return JSON.parse(await asyncRequest(kMetadataApi));
}

function getUniqueElementId() {
  while (true) {
    const newId = `id_${Math.floor(1e9 * Math.random())}`;
    if (document.getElementById(newId) == null) return newId;
  }
}

function isAncestor(child, ancestor) {
  while (child != null) {
    if (child == ancestor) return true;
    child = child.parentNode;
  }
  return false;
}

function emptyDiv(n) {
  while (n.hasChildNodes()) n.removeChild(n.lastChild);
}

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

function newButton(parent, classes = [], text = null, onclick = null) {
  const btn = newDiv(parent, classes, text);
  if (onclick != null) btn.addEventListener('click', onclick);
  return btn;
}

function newTextInput(parent, classes = [], placeholder = null) {
  return newElement(
      'input', parent, classes, null,
      [['type', 'text'], ['placeholder', placeholder]]);
}

function newDateInput(parent, classes = []) {
  return newElement('input', parent, classes, null, [['type', 'date']]);
}

function newCheckboxInput(parent, classes = [], onclick = null) {
  const check =
      newElement('input', parent, classes, null, [['type', 'checkbox']]);
  if (onclick != null) check.addEventListener('click', onclick);
  return check;
}

function newInputLabel(input, classes = [], text = null) {
  if (input.id == null || input.id == '') input.id = getUniqueElementId();
  return newElement(
      'label', input.parentNode, classes, text, [['for', input.id]]);
}

function newDropOptionsCheckWithLabel(list, label, onclick) {
  const row = newDiv(list, ['dropdown-options-input-row']);
  const c = newCheckboxInput(row, [], onclick);
  newInputLabel(c, [], label);
  return c;
};

function newDropOptionsItem(list, option) {
  newDropOptionsCheckWithLabel(list, option, () => {
    list.children[0].checked = false;
  });
}

function newDropOptionsInput(parent, classes = [], name = null) {
  const menu =
      newElement('dropdown-menu', parent, classes, null, [['name', name]]);
  const list = newDiv(menu);
  newDropOptionsCheckWithLabel(list, 'Any', () => {
    for (let i = 1; i < list.children.length; ++i) {
      list.children[i].checked = false;
    }
  }).checked = true;
  return list;
}

function fixCase(text) {
  return text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase();
}

function cleanTitle(t) {
  return t.split(' ').map(fixCase).join(' ');
}

function cleanMetadata(a) {
  return a.map(cleanTitle);
}

async function buildVetUpdatesSearch(node) {
  const inputRow = newDiv(node, ['input-row']);
  const dateInput = title => {
    const wrap = newDiv(inputRow, ['date-input-wrap']);
    newDiv(wrap, ['date-input-title'], title);
    return newDateInput(wrap, ['date-input']);
  };
  const titleInput = newTextInput(inputRow, ['text-input'], 'Title');
  const journalInput =
      newDropOptionsInput(inputRow, ['dropdown-input'], 'Journal');
  const fromDateInput = dateInput('From:');
  const toDateInput = dateInput('To:');
  const authorsInput = newTextInput(inputRow, ['text-input'], 'Authors');
  const tagsInput = newDropOptionsInput(inputRow, ['dropdown-input'], 'Tags');
  const keywordsInput = newTextInput(inputRow, ['dropdown-input'], 'Keywords');
  const abstractInput = newTextInput(inputRow, ['dropdown-input'], 'Abstract');
  const searchButton = newButton(inputRow, ['button'], 'Search', () => {
    console.log('search!');
  });
  const resultRow = newDiv(node, ['results']);
  const [journals, tags] = (await metadataRequest()).map(cleanMetadata);
  for (const journal of journals) newDropOptionsItem(journalInput, journal);
  for (const tag of tags) newDropOptionsItem(tagsInput, tag);
}

class VetUpdatesSearch extends HTMLElement {
  constructor() {
    super();
    buildVetUpdatesSearch(this);
  }
}

function buildDropdownMenu(node) {
  const ch = Array.from(node.children);
  emptyDiv(node);
  let items = null;
  newButton(node, ['name'], node.getAttribute('name'), () => {
    if (items.classList.contains('visible')) {
      items.classList.remove('visible');
    } else {
      items.classList.add('visible');
    }
  });
  items = newDiv(node, ['items']);
  for (const c of ch) items.appendChild(c);
  window.addEventListener('click', e => {
    if (!isAncestor(e.target, node)) {
      items.classList.remove('visible');
    }
  });
}

class DropdownMenu extends HTMLElement {
  constructor() {
    super();
    buildDropdownMenu(this);
  }
}

window.addEventListener('load', () => {
  customElements.define('vetupdates-search', VetUpdatesSearch);
  customElements.define('dropdown-menu', DropdownMenu);
});
})();
