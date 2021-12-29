(function() {
const kBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const kApis = {
  esummary: 'esummary.fcgi?db=pmc&retmode=json',
  efetch: 'efetch.fcgi?db=pubmed&retmode=xml',
};
const kRetries = 10;
const kLink = 'https://pubmed.ncbi.nlm.nih.gov/';
const kBatchDelay = 300;
const kBatchLimit = 100;

class Cache {
  constructor(storage) {
    this.storage = storage;
  }

  async lookup(key, getter) {
    if (this.storage == null) return await getter();
    let val = this.storage.getItem(key);
    if (val != null) return val;
    val = await getter();
    this.storage.setItem(key, val);
    return val;
  }
}
const cache = new Cache(window.localStorage);

class Xml {
  static parse(xml) {
    if (xml == null) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      return new Xml(doc.documentElement);
    } catch (error) {
      console.error('PUBMED', error);
      return null;
    }
  }
  constructor(node) {
    this.node = node;
  }
  get text() {
    return this.node.textContent;
  }
  attr(name) {
    return this.node.getAttribute(name);
  }
  all(type) {
    const a = [];
    for (const n of this.node.children) {
      if (n.tagName == type) a.push(new Xml(n));
    }
    return a;
  }
  one(type, i = 0) {
    for (const n of this.node.children) {
      if (n.tagName == type) {
        if (i == 0) return new Xml(n);
        --i;
      }
    }
    return null;
  }
  serialize() {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(this.node);
  }
}

class RequestBatcher {
  constructor(batchRequest, splitResponse) {
    this.batchRequest = batchRequest;
    this.splitResponse = splitResponse;
    this.currentTimeout = null;
    this.currentPromises = [];
  }

  clearTimeout() {
    if (this.currentTimeout != null) {
      window.clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  get(id) {
    return new Promise((resolve, reject) => {
      this.currentPromises.push([id, resolve, reject]);
      if (this.currentPromises.length >= kBatchLimit) {
        this.send();
      } else {
        this.clearTimeout();
        this.currentTimeout = window.setTimeout(() => this.send(), kBatchDelay);
      }
    });
  }

  async send() {
    this.clearTimeout();
    if (this.currentPromises.length == 0) return;
    const promises = this.currentPromises;
    this.currentPromises = [];
    const ids = promises.map(x => x[0]);
    let err = 'No result';
    let response = null;
    try {
      response = await this.batchRequest(ids);
    } catch (e) {
      err = e;
    }
    const splitResults = response == null ? null : this.splitResponse(response);
    console.log('PUBMED', 'Batch response', Array.from(splitResults.keys()));
    for (const [id, resolve, reject] of promises) {
      const result = splitResults?.get(id);
      if (result == null) {
        reject(err);
      } else {
        resolve(result);
      }
    }
  }
}

async function asyncPubMedRequest(api, id) {
  const url = `${kBaseUrl}/${api}&id=${id}&${kPubMedApiSuffix}`;
  let errorCode = null;
  let errorResponse = null;
  let bail = false;
  for (let i = 0; i < kRetries; ++i) {
    try {
      return await new Promise((resolve, reject) => {
        const r = new XMLHttpRequest();
        r.type = 'text';
        r.onload = () => {
          if (r.status == 200) {
            resolve(r.responseText);
          } else {
            errorResponse = r.responseText;
            errorCode = r.status;
            if (errorCode == 400) {
              // Special case 400 errors, because it means that the id was
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
      console.log('PUBMED', `Retrying in ${t} seconds...`, url);
      await new Promise((resolve, reject) => {
        window.setTimeout(resolve, t * 1000);
      });
    }
  }
  console.error('PUBMED', 'Request failed: ', url, errorCode, errorResponse);
  throw errorCode == 400 ? 'Bad PMID (A)' :
                           'Network Error. Try reloading the page.';
}

const asyncPubMedGetArticle_Batcher = new RequestBatcher(
    ids => asyncPubMedRequest(kApis.efetch, ids.join(',')),
    (response) => {
      const data = Xml.parse(response);
      const split = new Map();
      for (const article of data?.all('PubmedArticle')) {
        const mc = article?.one('MedlineCitation');
        const id = parseInt(mc?.one('PMID')?.text);
        if (!isNaN(id)) split.set(id, mc.serialize());
      }
      return split;
    },
);
async function asyncPubMedGetArticle(id) {
  return cache.lookup(
      'PUBMEDv2_getArticle_' + id, () => asyncPubMedGetArticle_Batcher.get(id));
}

function cleanText(text, end = null) {
  if (text == null) text = '';
  text = text.trim().replaceAll(/\s+/g, ' ');
  if (text != '' && end != null && !text.endsWith(end)) text += end;
  return text;
}

function fixCase(text) {
  return text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase();
}

function maybePrefix(text, pre = ' ') {
  return text == '' ? '' : pre + text;
}

function emptyDiv(n) {
  while (n.hasChildNodes()) n.removeChild(n.lastChild);
}

function newElement(type, parent, classes = [], text = null) {
  const n = document.createElement(type);
  if (text != null) n.innerText = text;
  for (const cls of classes) n.classList.add(cls);
  if (parent != null) parent.appendChild(n);
  return n;
}

function newDiv(parent, classes = [], text = null) {
  return newElement('div', parent, classes, text);
}

function newBtn(
    parent, classes = [], onclick = null, title = null, text = null) {
  const btn = newDiv(parent, classes, text);
  if (onclick != null) btn.addEventListener('click', onclick);
  if (title != null) btn.title = title;
  return btn;
}

function newLink(parent, classes = [], url = null, text = null) {
  const n = newElement('a', parent, classes, text);
  n.target = '_blank';
  if (url != null) n.href = url;
  return n;
}

function searchUp(node, cls) {
  while (node) {
    if (node.classList?.contains(cls)) return node;
    node = node.parentNode;
  }
  return null;
}

function parseMonth(month) {
  const kMonthNameLen = 3;
  const kMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
    'Dec'
  ];
  if (month == null || month == '') return '';
  let monthNum = parseInt(month);
  if (!isNaN(monthNum)) {
    monthNum -= 1;
    if (monthNum >= 0 && monthNum < kMonthNames.length) {
      return kMonthNames[monthNum];
    }
  }
  if (month.length >= kMonthNameLen) return month.slice(0, kMonthNameLen);
  return '';
}

function parseDate(date, includeDay = false) {
  const year = maybePrefix(cleanText(date?.one('Year')?.text));
  if (year == '') {
    return maybePrefix(cleanText(date?.one('MedlineDate')?.text));
  }
  const month = maybePrefix(parseMonth(date?.one('Month')?.text));
  if (month == '') return year;
  const day = includeDay ? maybePrefix(parseMonth(date?.one('Day')?.text)) : '';
  return `${year}${month}${day}`;
}

function parseAuthors(article, maxAuthors = 3) {
  let authors = article?.one('AuthorList')
                    ?.all('Author')
                    ?.map(x => {
                      const lastName = cleanText(x?.one('LastName')?.text);
                      if (lastName == '') return '';
                      const initials = cleanText(x?.one('Initials')?.text);
                      if (initials == '') return lastName;
                      return `${lastName} ${initials}`;
                    })
                    ?.filter(x => x != '') ??
      [];
  if (authors.length > maxAuthors) {
    authors = authors.slice(0, maxAuthors);
    authors.push('et al');
  }
  return authors.join(', ');
}

function parseDoi(article) {
  return (article?.all('ELocationID')?.filter(loc => {
           if (loc?.attr('EIdType') != 'doi') return false;
           return (loc?.attr('ValidYN') ?? 'Y').toUpperCase() == 'Y';
         }) ??
          [])[0]
      ?.text;
}

let domPma = null;
class PubMedImpl {
  constructor(node) {
    this.node = node;
    this.node.classList.add('loading');
    this.pmid = parseInt(this.node.getAttribute('pmid'));
    this.allowAbstract = this.node.getAttribute('no-abstract') == null;
    this.title = null;
    this.abstract = null;
    this.citation = null;
    window.setTimeout(async () => {
      if (isNaN(this.pmid)) {
        this._fillError('Bad PMID (B)');
        return;
      } else {
        let data = null;
        try {
          data = Xml.parse(await asyncPubMedGetArticle(this.pmid));
        } catch (e) {
          this._fillError(e);
          return;
        }
        this._fill(data);
      }
    }, 0);
  }
  _fillError(error) {
    emptyDiv(this.node);
    this.node.classList.remove('loading');
    this.node.classList.add('error');
    this.node.innerText = error + ': ' + this.node.getAttribute('pmid');
  }
  _fill(data) {
    if (domPma == null) domPma = this._setupAbstract();
    const article = data.one('Article');
    this.title = cleanText(article?.one('ArticleTitle')?.text, '.');
    this.abstract = article?.one('Abstract')?.all('AbstractText')?.map(x => {
      return [fixCase(cleanText(x.attr('Label'), ':')), cleanText(x.text, '.')];
    }) ??
        [];
    const authorText = parseAuthors(article);
    const journal = article?.one('Journal');
    const isoAbbr = cleanText(journal?.one('ISOAbbreviation')?.text, '.');
    const journalIssue = journal?.one('JournalIssue');
    const volume = cleanText(journalIssue?.one('Volume')?.text);
    const issue = cleanText(journalIssue?.one('Issue')?.text);
    const pubYearMonth = parseDate(journalIssue?.one('PubDate'));
    const page = cleanText(article?.one('Pagination')?.one('MedlinePgn')?.text);
    this.cite = `${authorText}. ${this.title} ${isoAbbr}${pubYearMonth};` +
        `${volume}(${issue}):${page}`;
    emptyDiv(this.node);
    this.node.classList.remove('loading');
    if (!this.allowAbstract) this.node.classList.add('no-abstract');
    const absBtnTitle = this.allowAbstract ? 'View abstract' : 'Open on PubMed';
    const absBtnFn = () => this._showAbstract();
    newBtn(
        this.node, ['pub-med-title'], absBtnFn, absBtnTitle, `${this.title} `);
    newBtn(this.node, ['pub-med-authors'], absBtnFn, absBtnTitle, authorText);
    if (pubYearMonth != '') {
      const dateText = ` -${pubYearMonth}`;
      newBtn(this.node, ['pub-med-date'], absBtnFn, absBtnTitle, dateText);
    }
    newBtn(this.node, ['pub-med-copy'], e => this._copy(e), 'Copy citation');
  }
  _openPubMed() {
    newLink(null, [], kLink + this.pmid).click();
  }
  _hideAbstract() {
    if (domPma == null) return;
    emptyDiv(domPma);
  }
  _showAbstract() {
    if (domPma == null) return;
    emptyDiv(domPma);
    const titleRow = newDiv(domPma, ['pub-med-abstract-title-row']);
    newBtn(
        titleRow, ['pub-med-abstract-title'], () => this._openPubMed(),
        'Open on PubMed', this.title);
    newBtn(
        titleRow, ['pub-med-abstract-close'], () => this._hideAbstract(),
        'Close');
    newDiv(domPma, ['pub-med-abstract-citation'], this.cite);
    if (!this.allowAbstract) {
      const part = newDiv(domPma, ['pub-med-abstract-part']);
      newDiv(
          part, ['pub-med-abstract-text', 'pub-med-abstract-text-no-abstract'],
          'Abstract opened in a new tab.');
      this._openPubMed();
    } else if (this.abstract.length == 0) {
      const part = newDiv(domPma, ['pub-med-abstract-part']);
      newDiv(
          part,
          ['pub-med-abstract-text', 'pub-med-abstract-text-not-available'],
          'Abstract not available.');
    } else {
      for (const [label, text] of this.abstract) {
        const part = newDiv(domPma, ['pub-med-abstract-part']);
        if (label.length > 0) newDiv(part, ['pub-med-abstract-label'], label);
        newDiv(part, ['pub-med-abstract-text'], text);
      }
    }
  }
  _copy(e) {
    navigator.clipboard.writeText(this.cite);
    e.target.classList.add('clicked');
    window.setTimeout(() => e.target.classList.remove('clicked'), 200);
  }
  _setupAbstract() {
    const pma = document.getElementById('pub-med-abstract');
    if (pma == null) {
      console.log('PUBMED', 'Couldn\'t find pub-med-abstract');
      return null;
    }
    // To get the sticky behavior to work on squarespace, we need to walk up the
    // parents to find the enclosing .code-block and .row, and set some custom
    // styles on them.
    const codeBlock = searchUp(pma, 'code-block');
    if (codeBlock != null) {
      codeBlock.style.position = 'sticky';
      codeBlock.style.top = '0';
    } else {
      console.log('PUBMED', 'Couldn\'t find code-block');
    }
    const row = searchUp(pma, 'row');
    if (row != null) {
      row.style.display = 'flex';
    } else {
      console.log('PUBMED', 'Couldn\'t find row');
    }
    return pma;
  }
}

class PubMed extends HTMLElement {
  constructor() {
    super();
    this.impl = new PubMedImpl(this);
  }
}

window.addEventListener('load', () => customElements.define('pub-med', PubMed));

if (typeof (module) != 'undefined') {
  module.exports = {
    kLink,
    Cache,
    Xml,
    RequestBatcher,
    asyncPubMedGetArticle_Batcher,
    asyncPubMedRequest,
    asyncPubMedGetArticle,
    cleanText,
    fixCase,
    maybePrefix,
    emptyDiv,
    newElement,
    newDiv,
    newBtn,
    newLink,
    searchUp,
    parseMonth,
    parseDate,
    parseAuthors,
    parseDoi,
    PubMedImpl,
    PubMed,
  };
}
})();
