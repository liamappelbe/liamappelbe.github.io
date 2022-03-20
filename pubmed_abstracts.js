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
const kCacheFreshTimeSec = 60 * 60 * 24 * 7;  // 1 week in seconds.

class Cache {
  constructor(storage, namespace, version) {
    this.storage = storage;
    this.namespace = namespace;
    this.version = version;

    // Keys we own look like `${namespace}v${version}_${userKey}`.
    this.versionRegex = new RegExp('^' + this.namespace + 'v([0-9]+)_.*');

    // Values look like `${nowSec()}_${val}`.
    this.timeRegex = /([0-9]+)_(.*)/;

    this.clean(false);
  }

  async lookup(userKey, getter) {
    if (this.storage == null) return await getter();
    const key = `${this.namespace}v${this.version}_${userKey}`;
    let val = this.getValue(key);
    if (val != null) return val;
    val = await getter();
    const datedVal = `${this.nowSec()}_${val}`;
    for (let attempt = 0; attempt < 3; ++attempt) {
      try {
        this.storage.setItem(key, datedVal);
        break;
      } catch (e) {
        this.clean(true);
        break;
      }
    }
    return val;
  }

  nowSec() {
    return Math.floor(Date.now() / 1000);
  }

  isStale(t) {
    return (this.nowSec() - t) >= kCacheFreshTimeSec;
  }

  getValueWithTime(key) {
    const datedVal = this.storage.getItem(key);
    if (datedVal == null) return [null, null];
    const m = datedVal.match(this.timeRegex);
    if (m == null || m.length < 3) return [null, datedVal];
    return [parseInt(m[1]), m[2]];
  }

  getValue(key) {
    const [t, val] = this.getValueWithTime(key);
    if (t == null || val == null) return null;
    if (this.isStale(t)) return null;
    return val;
  }

  getVersion(key) {
    const m = key.match(this.versionRegex);
    if (m == null || m.length < 2) return null;
    return parseInt(m[1]);
  }

  clean(evictOldest) {
    // 1) Evict any keys we own for older versions of the system.
    // 2) Evict any keys we own that are older than a week.
    // 3) If evictOldest, and 1 & 2 did nothing, evict the oldest key we own.
    let oldestKey = null;
    let oldestKeyTime = null;
    let toEvict = [];
    for (let i = 0; i < this.storage.length; ++i) {
      const key = this.storage.key(i);
      const version = this.getVersion(key);
      if (version == null) continue;  // We don't own this key.
      if (version < this.version) {
        toEvict.push(key);
      } else {
        const [t, val] = this.getValueWithTime(key);
        if (oldestKeyTime == null || t < oldestKeyTime) {
          oldestKeyTime = t;
          oldestKey = key;
        }
        if (this.isStale(t)) {
          toEvict.push(key);
        }
      }
    }
    if (toEvict.length == 0 && evictOldest && oldestKey != null) {
      toEvict.push(oldestKey);
    }
    for (const key of toEvict) {
      this.storage.removeItem(key);
    }
  }
}
const cache = new Cache(window.localStorage, 'PUBMED', 3);

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
        if (!isNaN(id)) split.set(id, article.serialize());
      }
      return split;
    },
);
async function asyncPubMedGetArticle(id) {
  return cache.lookup(id, () => asyncPubMedGetArticle_Batcher.get(id));
}

function cleanText(text, end = null, otherEnds = null) {
  if (text == null) text = '';
  text = text.trim().replaceAll(/\s+/g, ' ');
  if (text != '' && end != null && !text.endsWith(end) &&
      (otherEnds == null || text.match(otherEnds) == null)) {
    text += end;
  }
  return text;
}

function fixCase(text) {
  return text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase();
}

function maybePrefix(text, pre = ' ') {
  return text == null || text == '' ? '' : pre + text;
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

let domTooltip = null;
let domTooltipTimeout = null;
const kTooltipShowTimeout = 0;
const kTooltipHideTimeout = 0;
function setTooltip(n, text) {
  if (domTooltip == null) {
    domTooltip = newDiv(document.body, ['pub-med-tooltip']);
  }
  n.addEventListener('mouseenter', e => {
    // Only reposition the tooltip if it's currently hidden or the text changed.
    const reposition =
        !domTooltip.classList.contains('shown') || domTooltip.innerText != text;
    if (domTooltipTimeout != null) window.clearTimeout(domTooltipTimeout);
    domTooltipTimeout = window.setTimeout(() => {
      domTooltip.innerText = text;
      domTooltip.classList.add('shown');
      if (reposition) {
        const pageWidth = document.body.getBoundingClientRect().width;
        if (e.pageX < 0.8 * pageWidth) {
          domTooltip.style.left = (e.pageX + 10) + 'px';
          domTooltip.style.right = null;
        } else {
          domTooltip.style.right = (pageWidth - e.pageX + 10) + 'px';
          domTooltip.style.left = null;
        }
        domTooltip.style.top = e.pageY + 'px';
      }
    }, kTooltipShowTimeout);
  });
  n.addEventListener('mouseleave', () => {
    if (domTooltipTimeout != null) window.clearTimeout(domTooltipTimeout);
    domTooltipTimeout = window.setTimeout(() => {
      domTooltip.classList.remove('shown');
    }, kTooltipHideTimeout);
  });
}

function newBtn(
    parent, classes = [], onclick = null, tooltip = null, text = null) {
  const btn = newDiv(parent, classes, text);
  if (onclick != null) btn.addEventListener('click', onclick);
  if (tooltip != null) setTooltip(btn, tooltip);
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

function parseDate(date, includeDay = false, fallbackDate = '') {
  const year = maybePrefix(cleanText(date?.one('Year')?.text));
  if (year == '') {
    const medDate = maybePrefix(cleanText(date?.one('MedlineDate')?.text));
    return medDate != '' ? medDate : fallbackDate;
  }
  const month = maybePrefix(parseMonth(date?.one('Month')?.text));
  if (month == '') return fallbackDate != '' ? fallbackDate : year;
  const day = includeDay ? maybePrefix(date?.one('Day')?.text) : '';
  return `${year}${month}${day}`;
}

function parsePubDates(article) {
  let epubDate = parseDate(
      (article?.all('ArticleDate')
           ?.filter(d => d?.attr('DateType') == 'Electronic') ??
       [])[0],
      true);
  let pubDate = parseDate(
      article?.one('Journal')?.one('JournalIssue')?.one('PubDate'), true,
      epubDate);
  if (pubDate == '') pubDate = epubDate;
  if (epubDate == '') epubDate = pubDate;
  return [pubDate, epubDate];
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
  if (maxAuthors != null && authors.length > maxAuthors) {
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

function parsePreprintStatus(pmd) {
  const status = pmd?.one('PublicationStatus')?.text;
  return status == 'aheadofprint';
}

let allowedAbstractJournals = null;
function shouldAllowAbstract(isoAbbr) {
  if (typeof (kAllowedAbstractJournals) == 'undefined') return true;
  if (allowedAbstractJournals == null) {
    allowedAbstractJournals =
        new Set(kAllowedAbstractJournals.map(x => x.trim().toLowerCase()));
  }
  return allowedAbstractJournals.has(isoAbbr.trim().toLowerCase());
}

function formatEpubInfo(isPreprint, pubDate, epubDate) {
  if (isPreprint) return 'Epub ahead of print';
  if (pubDate == '') return '';
  if (pubDate == epubDate) return '';
  return `Epub ${epubDate}`;
}

let domPma = null;
let domIsThin = false;
class PubMedImpl {
  constructor(node) {
    if (domPma == null) domPma = this._setupAbstract();
    this.node = node;
    emptyDiv(this.node);
    this.node.classList.add('loading');
    this.pmid = parseInt(this.node.getAttribute('pmid'));
    this.allowAbstract = null;
    if (this.node.getAttribute('no-abstract') != null) {
      this.allowAbstract = false;
    } else if (this.node.getAttribute('abstract') != null) {
      this.allowAbstract = true;
    }
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
    const article = data?.one('MedlineCitation')?.one('Article');
    this.title = cleanText(article?.one('ArticleTitle')?.text, '.', /[?!]$/);
    this.abstract = article?.one('Abstract')?.all('AbstractText')?.map(x => {
      return [fixCase(cleanText(x.attr('Label'), ':')), cleanText(x.text, '.')];
    }) ??
        [];
    const isPreprint = parsePreprintStatus(data?.one('PubmedData'));
    const authorText = parseAuthors(article);
    const fullAuthorText = parseAuthors(article, null);
    const [pubDate, epubDate] = parsePubDates(article);
    const journal = article?.one('Journal');
    const isoAbbr = cleanText(journal?.one('ISOAbbreviation')?.text);
    const journalIssue = journal?.one('JournalIssue');
    const volume = cleanText(journalIssue?.one('Volume')?.text);
    const issue =
        maybePrefix(cleanText(journalIssue?.one('Issue')?.text, ')'), '(');
    const page = cleanText(article?.one('Pagination')?.one('MedlinePgn')?.text);
    const pubIssue = `${volume}${issue}${maybePrefix(page, ':')}`;
    const doi = parseDoi(article);
    const epubInfo = formatEpubInfo(isPreprint, pubDate, epubDate);
    this.cite = `${fullAuthorText}. ${this.title} ${cleanText(isoAbbr, '. ')}` +
        cleanText(`${pubDate}${maybePrefix(pubIssue, ';')}`, '. ') +
        `${cleanText(maybePrefix(doi, 'doi: '), '. ')}` +
        `${cleanText(epubInfo, '. ')}PMID: ${this.pmid}.`;
    emptyDiv(this.node);
    this.node.classList.remove('loading');
    if (this.allowAbstract == null) {
      this.allowAbstract = shouldAllowAbstract(isoAbbr);
    }
    if (!this.allowAbstract) this.node.classList.add('no-abstract');
    const addBtn = (classes, text) => {
      newBtn(
          this.node, classes, () => this._showAbstract(),
          this.allowAbstract ? 'View abstract' : 'Open on PubMed', text);
    };
    addBtn(['pub-med-title'], `${this.title} `);
    addBtn(['pub-med-authors'], authorText);
    if (isoAbbr != '') addBtn(['pub-med-journal'], ' - ' + isoAbbr);
    if (pubDate != '') {
      let text = ' -';
      if (!isPreprint) text += pubDate;
      if (isPreprint || epubDate != pubDate) text += ` (Epub ${epubDate})`;
      addBtn(['pub-med-date'], text);
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

    if (!this.allowAbstract) {
      this._openPubMed();
      if (domIsThin) {
        // Don't show the abstract box if we opened pubmed and we're on mobile.
        return;
      }
    }

    newBtn(
        domPma, ['pub-med-abstract-close'], () => this._hideAbstract(),
        'Close');
    newBtn(
        domPma, ['pub-med-abstract-title'], () => this._openPubMed(),
        'Open on PubMed', this.title);
    newDiv(domPma, ['pub-med-abstract-citation'], this.cite);
    if (!this.allowAbstract) {
      const part = newDiv(domPma, ['pub-med-abstract-part']);
      newDiv(
          part, ['pub-med-abstract-text', 'pub-med-abstract-text-no-abstract'],
          'Abstract opened in a new tab.');
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
    if (codeBlock == null) {
      console.log('PUBMED', 'Couldn\'t find abstract code-block');
      return pma;
    }
    codeBlock.classList.add('pub-med-abstract-code-block');

    const col = searchUp(codeBlock, 'col');
    if (col == null) {
      console.log('PUBMED', 'Couldn\'t find abstract column');
      return pma;
    }
    col.classList.add('pub-med-abstract-column');

    const row = searchUp(col, 'row');
    if (row == null) {
      console.log('PUBMED', 'Couldn\'t find abstract row');
      return pma;
    }
    row.classList.add('pub-med-abstract-row');

    // Add the print button at the top of this row.
    newBtn(row, ['print-button'], () => window.print(), 'Print');

    // The first column in the row should be the one containing the pub med
    // tags. We use this to detect thin layouts because the abstract column
    // is laid out differently depending on whether the abstract box is shown,
    // so it would be brittle to try and write the thin detector using it.
    const pmCol = row.children[0];
    if (pmCol == null || pmCol == col || pmCol.classList == null ||
        !pmCol.classList.contains('col')) {
      console.log('PUBMED', 'Couldn\'t find pub med tag column');
      return pma;
    }

    // If we found all the elements, we can detect single column layout by
    // checking whether the pub med tag column is (about) as big as the row,
    // whenever the row changes size.
    const onResize = () => {
      const rowWidth = row.getBoundingClientRect().width;
      const colWidth = pmCol.getBoundingClientRect().width;
      domIsThin = colWidth >= 0.9 * rowWidth;
      if (domIsThin) {
        row.classList.add('pub-med-abstract-row-thin');
      } else {
        row.classList.remove('pub-med-abstract-row-thin');
      }
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(row);
    onResize();

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
    parsePubDates,
    parseAuthors,
    parseDoi,
    parsePreprintStatus,
    PubMedImpl,
    PubMed,
  };
}
})();
