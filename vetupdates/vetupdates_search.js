(function() {
const kLocalDev = false;
const kApiEndpoint =
    kLocalDev ? 'http://localhost:8080' : 'https://squeakysqueenoctopus.com';
const kAdvancedSearchApi = kApiEndpoint + '/zpqk';
const kSearchApi = kApiEndpoint + '/gqmo';
const kGetIdsApi = kApiEndpoint + '/rmdl';
const kMetadataApi = kApiEndpoint + '/meta';
const kRetries = 10;
const kMajorTagText = 'Topics';
const kMinorTagText = 'Subtopics';

const kMajorTags = new Set([
  'acid base',
  'analgesia',
  'anesthesia',
  'cardiovascular',
  'coagulation',
  'cpr',
  'critical illness',
  'electrolytes',
  'endocrine',
  'environmental',
  'extracorporeal',
  'fluid therapy',
  'gi and nutrition',
  'hemolymphatic',
  'hepatobiliary and pancreas',
  'immunology',
  'infectious',
  'integument',
  'monitoring',
  'musculoskeletal',
  'neurology',
  'ophthalmology',
  'pharmacology',
  'pocus',
  'radiology',
  'renal',
  'reproduction',
  'respiratory',
  'sepsis sirs mods',
  'shock and ischemia',
  'statistics',
  'surgery',
  'toxicology',
  'transfusion',
  'trauma',
]);

function isMajorTag(tag) { return kMajorTags.has(tag.toLowerCase().trim()); }

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

async function advancedSearchRequest(q) {
  return JSON.parse(await asyncRequest(
      kAdvancedSearchApi + '?' + q.filter(w => w.length > 0).join('&')));
}

async function searchRequest(q) {
  return JSON.parse(await asyncRequest(kSearchApi + '?' + q));
}

async function getIdsRequest(pmids, pmcids) {
  const q = [encodeIdQuery('p', pmids), encodeIdQuery('c', pmcids)];
  return JSON.parse(await asyncRequest(
      kGetIdsApi + '?' + q.filter(w => w.length > 0).join('&')));
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

function newTextInput(
    parent, classes = [], placeholder = null, onEnter = null) {
  const n = newElement(
      'input', parent, classes, null,
      [['type', 'text'], ['placeholder', placeholder]]);
  if (onEnter != null) {
    n.addEventListener('keyup', e => {
      e.preventDefault();
      if (e.keyCode == 13) onEnter();
    });
  }
  return n;
}

function newDateInput(parent, classes = []) {
  return newElement('input', parent, classes, null, [['type', 'date']]);
}

function newCheckboxInput(parent, classes = [], onclick = null) {
  const check =
      newElement('input', parent, classes, null, [['type', 'checkbox']]);
  if (onclick != null) check.addEventListener('click', () => onclick(check));
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

function newDropOptionsItem(list, option, sublistIndex = null) {
  const i = (sublistIndex == null ? 0 : sublistIndex + 1);
  newDropOptionsCheckWithLabel(list.children[i], option, c => {
    if (!c.checked) return;
    list.children[0].children[0].children[0].checked = false;
  });
}

function newDropOptionsInput(parent, classes = [], name = null, groups = []) {
  const menu =
      newElement('dropdown-menu', parent, classes, null, [['name', name]]);
  const list = newDiv(menu);
  const firstSublist = newDiv(list);
  newDropOptionsCheckWithLabel(firstSublist, 'Any', c => {
    if (!c.checked) return;
    for (let i = 0; i < list.children.length; ++i) {
      const sublist = list.children[i];
      // In the first sublist, we skip "Any". In later ones we skip the title.
      for (let j = 1; j < sublist.children.length; ++j) {
        sublist.children[j].children[0].checked = false;
      }
    }
  }).checked = true;
  for (const g of groups) {
    const sublist = newDiv(list);
    const title = newDiv(sublist, ['dropdown-options-group-title'], g);
  }
  return list;
}

function newPubMedTag(parent, pmid) {
  return newElement('pub-med', parent, [], null, [['pmid', pmid]]);
}

const reClean = /[^a-zA-Z0-9]+/g;
function cleanText(t) { return t.replaceAll(reClean, ' ').trim(); }

function fixCase(t) {
  return t.slice(0, 1).toUpperCase() + t.slice(1).toLowerCase();
}

function cleanTitle(t) { return t.split(' ').map(fixCase).join(' '); }

function removeThe(t) {
  if (t.toLowerCase().startsWith('the ')) return t.substring(4);
  return t;
}

function cleanMetadata(a) {
  const b = a.map(cleanTitle);
  b.sort((x, y) => {
    const x0 = removeThe(x);
    const y0 = removeThe(y);
    if (x0 < y0) return -1;
    if (x0 > y0) return 1;
    return 0;
  });
  return b;
}

function encodeIdQuery(q, v) {
  if (v.length == 0) return '';
  return q + '=' + encodeURIComponent(v.join(','));
}

function encodeTextQuery(q, t) {
  if (t.value.length == 0) return '';
  return q + '=' +
      encodeURIComponent(cleanText(t.value).toLowerCase().split(' ').join(','));
}

function encodeOptionQuery(q, o) {
  if (o.children[0].children[0].children[0].checked) return '';
  const a = [];
  for (let i = 0; i < o.children.length; ++i) {
    const sublist = o.children[i];
    // In the first sublist, we skip "Any". In later ones we skip the title.
    for (let j = 1; j < sublist.children.length; ++j) {
      const c = sublist.children[j];
      if (c.children[0].checked) {
        a.push(cleanText(c.children[1].innerText).toLowerCase());
      }
    }
  }
  return q + '=' + encodeURIComponent(a.join(','));
}

function encodeDateQuery(q, d) {
  const x = d.valueAsNumber;
  if (isNaN(x)) return '';
  return q + '=' + (Math.floor(x / 1000).toString(36));
}

async function buildVetUpdatesSearch(node) {
  const smpRow = newDiv(node, ['input-row']);
  const advCol = newDiv(node, ['input-col', 'hidden']);
  const advRow1 = newDiv(advCol, ['input-row']);
  const advRow2 = newDiv(advCol, ['input-row']);
  const advRow3 = newDiv(advCol, ['input-row']);
  const resultRow = newDiv(node, ['results']);

  const clearResults = () => {
    resultRow.classList.add('loading');
    emptyDiv(resultRow);
  };
  const fillResults = result => {
    resultRow.classList.remove('loading');
    if (result.length == 0) {
      newDiv(resultRow, ['no-results'], 'No results');
    } else {
      for (const pmid of result) {
        newPubMedTag(resultRow, pmid);
      }
    }
  };

  const doSearch = async () => {
    clearResults();
    const q = encodeTextQuery('q', searchInput);
    const result = await searchRequest(q);
    fillResults(result);
  };
  const searchInput = newTextInput(smpRow, ['text-input'], 'Search', doSearch);
  newButton(smpRow, ['button'], 'Search', doSearch);
  newButton(smpRow, ['button'], 'Advanced', async () => {
    smpRow.classList.add('hidden');
    advCol.classList.remove('hidden');
  });

  const doAdvSearch = async () => {
    clearResults();
    const t = encodeTextQuery('t', titleInput);
    const j = encodeOptionQuery('j', journalInput);
    const d = encodeDateQuery('d', fromDateInput);
    const e = encodeDateQuery('e', toDateInput);
    const a = encodeTextQuery('a', authorsInput);
    const g = encodeOptionQuery('g', tagsInput);
    const k = encodeTextQuery('k', keywordsInput);
    const w = encodeTextQuery('w', abstractInput);
    const result = await advancedSearchRequest([t, j, d, e, a, g, k, w]);
    fillResults(result);
  };
  const dateInput = (row, title) => {
    const wrap = newDiv(row, ['date-input-wrap']);
    newDiv(wrap, ['date-input-title'], title);
    return newDateInput(wrap, ['date-input']);
  };

  const titleInput =
      newTextInput(advRow1, ['text-input'], 'Title', doAdvSearch);
  const abstractInput =
      newTextInput(advRow1, ['dropdown-input'], 'Abstract', doAdvSearch);
  const tagsInput = newDropOptionsInput(
      advRow1, ['dropdown-input'], kMajorTagText,
      [kMajorTagText, kMinorTagText]);
  const keywordsInput =
      newTextInput(advRow1, ['dropdown-input'], 'Keywords', doAdvSearch);

  const authorsInput =
      newTextInput(advRow2, ['text-input'], 'Authors', doAdvSearch);
  const journalInput =
      newDropOptionsInput(advRow2, ['dropdown-input'], 'Journal');
  const fromDateInput = dateInput(advRow2, 'From:');
  const toDateInput = dateInput(advRow2, 'To:');

  newButton(advRow3, ['button'], 'Search', doAdvSearch);
  newButton(advRow3, ['button'], 'Simple', () => {
    advCol.classList.add('hidden');
    smpRow.classList.remove('hidden');
  });

  const [journals, tags] = (await metadataRequest()).map(cleanMetadata);
  for (const journal of journals) newDropOptionsItem(journalInput, journal);
  for (const tag of tags) {
    newDropOptionsItem(tagsInput, tag, isMajorTag(tag) ? 0 : 1);
  }
}

class VetUpdatesSearch extends HTMLElement {
  constructor() { super(); }
  connectedCallback() { buildVetUpdatesSearch(this); }
  attributeChangedCallback() { buildVetUpdatesSearch(this); }
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

if (typeof (module) != 'undefined') {
  module.exports = {
    metadataRequest,
    advancedSearchRequest,
    searchRequest,
    getIdsRequest,
    kMajorTags,
  };
}
})();
