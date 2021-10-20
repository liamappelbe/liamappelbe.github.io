(function() {
async function asyncTextRequest(url, retries = 3) {
  let error = null;
  for (let i = 0; i < retries; ++i) {
    try {
      return await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.type = 'text';
        request.onload = () => resolve(request.responseText);
        request.onerror = reject;
        request.open('GET', url, true);
        request.send();
      });
    } catch (e) {
      error = e;
      const t = 1 << i;
      console.log(`Retrying in ${t} seconds...`, url);
      await new Promise((resolve, reject) => {
        window.setTimeout(resolve, t * 1000);
      });
    }
  }
  console.error('Request failed: ', url, error);
}

class Xml {
  static parse(xml) {
    if (xml == null) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      return new Xml(doc.documentElement);
    } catch (error) {
      console.error(error);
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
}

const kBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const kApis = {
  esummary: 'esummary.fcgi?db=pmc&retmode=json',
  efetch: 'efetch.fcgi?db=pubmed&retmode=xml',
};

async function asyncPubMedRequest(api, id) {
  return asyncTextRequest(`${kBaseUrl}/${api}&id=${id}&${kPubMedApiSuffix}`);
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

function emptyDiv(n) {
  while (n.hasChildNodes()) n.removeChild(n.lastChild);
}

function newDiv(parent, classes = [], text = null, onClick = null) {
  const n = document.createElement('div');
  if (text != null) n.innerText = text;
  if (onClick != null) n.addEventListener('click', onClick);
  for (const cls of classes) n.classList.add(cls);
  parent.appendChild(n);
  return n;
}

class PubMedImpl {
  constructor(node) {
    this.node = node;
    this.pmid = this.node.getAttribute('pmid');
    this.title = null;
    this.abstract = null;
    this.citation = null;
    window.setTimeout(async () => {
      this._fill(Xml.parse(await asyncPubMedRequest(kApis.efetch, this.pmid)));
    }, 0);
  }
  _fill(data) {
    const mc = data?.one('PubmedArticle')?.one('MedlineCitation');
    const article = mc?.one('Article');
    this.title = cleanText(article?.one('ArticleTitle')?.text, '.');
    this.abstract = article?.one('Abstract')?.all('AbstractText')?.map(x => {
      return [fixCase(cleanText(x.attr('Label'), ':')), cleanText(x.text, '.')];
    }) ??
        [];
    let authors = article?.one('AuthorList')?.all('Author')?.map(x => {
      const lastName = cleanText(x?.one('LastName').text);
      const initials = cleanText(x?.one('Initials').text);
      return `${lastName} ${initials}`;
    }) ??
        [];
    const kMaxAuthors = 3;
    if (authors.length > kMaxAuthors) {
      authors = authors.slice(0, kMaxAuthors);
      authors.push('et al');
    }
    const authorText = authors.join(', ');
    const journal = article?.one('Journal');
    const isoAbbr = cleanText(journal?.one('ISOAbbreviation').text, '.');
    const journalIssue = journal?.one('JournalIssue');
    const volume = cleanText(journalIssue?.one('Volume').text);
    const issue = cleanText(journalIssue?.one('Issue').text);
    const pubDate = journalIssue?.one('PubDate');
    const pubYear = cleanText(pubDate?.one('Year').text);
    const pubMonth = cleanText(pubDate?.one('Month').text);
    const page = cleanText(article?.one('Pagination')?.one('MedlinePgn').text);
    this.cite = `${authorText}. ${this.title} ${isoAbbr} ${pubYear} ` +
        `${pubMonth};${volume}(${issue}):${page}`;
    emptyDiv(this.node);
    this.node.classList.add('loaded');
    newDiv(this.node, ['pub-med-citation'], this.cite, () => this._click());
    const kCopy = String.fromCodePoint(0x0001F5D0);
    const btn = newDiv(this.node, ['pub-med-copy'], kCopy, () => this._copy());
    btn.title = 'Copy';
  }
  _click() {
    const pma = document.getElementById('pub-med-abstract');
    if (pma == null) return;
    emptyDiv(pma);
    newDiv(pma, ['pub-med-abstract-title'], this.title);
    for (const [label, text] of this.abstract) {
      const part = newDiv(pma, ['pub-med-abstract-part']);
      if (label.length > 0) newDiv(part, ['pub-med-abstract-label'], label);
      newDiv(part, ['pub-med-abstract-text'], text);
    }
  }
  _copy() {
    navigator.clipboard.writeText(this.cite);
  }
}

class PubMed extends HTMLElement {
  constructor() {
    super();
    this.innerText = 'Loading...';
    this.impl = new PubMedImpl(this);
  }
}

window.addEventListener('load', () => customElements.define('pub-med', PubMed));
})();
