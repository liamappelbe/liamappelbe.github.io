(function() {
const kBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const kApis = {
  esummary: 'esummary.fcgi?db=pmc&retmode=json',
  efetch: 'efetch.fcgi?db=pubmed&retmode=xml',
};
const kRetries = 3;
const kLink = 'https://pubmed.ncbi.nlm.nih.gov/';

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
              // Special case 400 errors, because it means that the id was bad,
              // so don't bother retrying.
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
      const t = 1 << i;
      console.log(`Retrying in ${t} seconds...`, url);
      await new Promise((resolve, reject) => {
        window.setTimeout(resolve, t * 1000);
      });
    }
  }
  console.error('Request failed: ', url, errorCode, errorResponse);
  throw errorCode == 400 ? 'Bad PMID (A)' : 'Network Error';
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

function newElement(type, parent, classes = [], text = null) {
  const n = document.createElement(type);
  if (text != null) n.innerText = text;
  for (const cls of classes) n.classList.add(cls);
  parent.appendChild(n);
  return n;
}

function newDiv(parent, classes = [], text = null) {
  return newElement('div', parent, classes, text);
}

function newLink(parent, classes = [], url = null, text = null) {
  const n = newElement('a', parent, classes, text);
  if (url != null) n.href = url;
  return n;
}

class PubMedImpl {
  constructor(node) {
    this.node = node;
    this.pmid = parseInt(this.node.getAttribute('pmid'));
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
          data = Xml.parse(await asyncPubMedRequest(kApis.efetch, this.pmid));
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
    this.node.classList.add('error');
    this.node.innerText = error + ': ' + this.node.getAttribute('pmid');
  }
  _fill(data) {
    const mc = data?.one('PubmedArticle')?.one('MedlineCitation');
    if (mc == null) {
      this._fillError('Bad PMID (C)');
      return;
    }
    const article = mc?.one('Article');
    this.title = cleanText(article?.one('ArticleTitle')?.text, '.');
    this.abstract = article?.one('Abstract')?.all('AbstractText')?.map(x => {
      return [fixCase(cleanText(x.attr('Label'), ':')), cleanText(x.text, '.')];
    }) ??
        [];
    let authors = article?.one('AuthorList')?.all('Author')?.map(x => {
      const lastName = cleanText(x?.one('LastName')?.text);
      const initials = cleanText(x?.one('Initials')?.text);
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
    const isoAbbr = cleanText(journal?.one('ISOAbbreviation')?.text, '.');
    const journalIssue = journal?.one('JournalIssue');
    const volume = cleanText(journalIssue?.one('Volume')?.text);
    const issue = cleanText(journalIssue?.one('Issue')?.text);
    const pubDate = journalIssue?.one('PubDate');
    const pubYear = cleanText(pubDate?.one('Year')?.text);
    const pubMonth = cleanText(pubDate?.one('Month')?.text);
    const page = cleanText(article?.one('Pagination')?.one('MedlinePgn')?.text);
    this.cite = `${authorText}. ${this.title} ${isoAbbr} ${pubYear} ` +
        `${pubMonth};${volume}(${issue}):${page}`;
    emptyDiv(this.node);
    this.node.classList.add('loaded');
    newDiv(this.node, ['pub-med-article'], `${this.title} ${authorText}`)
        .addEventListener('mouseover', () => this._showAbstract());
    const btn = newDiv(this.node, ['pub-med-copy'], '[]');
    btn.addEventListener('click', () => this._copy());
    btn.title = 'Copy citation';
  }
  _showAbstract() {
    const pma = document.getElementById('pub-med-abstract');
    if (pma == null) return;
    emptyDiv(pma);
    newLink(pma, ['pub-med-abstract-title'], kLink + this.pmid, this.title);
    newDiv(pma, ['pub-med-abstract-citation'], this.cite);
    if (this.abstract.length == 0) {
      const part = newDiv(pma, ['pub-med-abstract-part']);
      newDiv(part, ['pub-med-abstract-text'], 'Abstract not available.');
    } else {
      for (const [label, text] of this.abstract) {
        const part = newDiv(pma, ['pub-med-abstract-part']);
        if (label.length > 0) newDiv(part, ['pub-med-abstract-label'], label);
        newDiv(part, ['pub-med-abstract-text'], text);
      }
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
