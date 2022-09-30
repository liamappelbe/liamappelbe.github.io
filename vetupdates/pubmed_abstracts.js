(function() {
const kBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const kApis = {
  efetchPmid: 'efetch.fcgi?db=pubmed&retmode=xml',
  efetchPmcid: 'efetch.fcgi?db=pmc&retmode=xml',
};
const kIdConvUrl = 'https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/';
const kRetries = 10;
const kLink = 'https://pubmed.ncbi.nlm.nih.gov/';
const kBatchDelay = 300;
const kBatchLimit = 100;
const kCacheFreshTimeSec = 60 * 60 * 24 * 7;  // 1 week in seconds.

const kDoiUrl = 'https://doi.org/';

const kIdKind_DOI = 0;
const kIdKind_PMID = 1;
const kIdKind_PMCID = 2;
const kIdKindNames = ['DOI', 'PMID', 'PMCID'];

const kRegexDoi = /^.+\/.+$/;
const kRegexPmid = /^[0-9]+$/;
const kRegexPmcid = /^pmc[0-9]+$/;

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
const cache = new Cache(window.localStorage, 'PUBMED', 4);

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
  get tag() {
    return this.node.tagName;
  }
  get text() {
    return this.node.textContent;
  }
  * _children() {
    for (const n of this.node.children) {
      yield new Xml(n);
    }
  }
  get children() {
    return this._children();
  }
  attr(name) {
    return this.node.getAttribute(name);
  }
  all(type) {
    const a = [];
    for (const n of this.children) {
      if (n.tag == type) a.push(n);
    }
    return a;
  }
  one(type, i = 0) {
    for (const n of this.children) {
      if (n.tag == type) {
        if (i == 0) return n;
        --i;
      }
    }
    return null;
  }
  hasAllAttr(attr) {
    for (const [name, val] of attr) {
      if (this.attr(name) != val) return false;
    }
    return true;
  }
  oneWithAttr(type, attr, i = 0) {
    for (const n of this.children) {
      if (n.tag == type && n.hasAllAttr(attr)) {
        if (i == 0) return n;
        --i;
      }
    }
    return null;
  }
  allWithAttr(type, attr) {
    const a = [];
    for (const n of this.children) {
      if (n.tag == type && n.hasAllAttr(attr)) a.push(n);
    }
    return a;
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
    const splitResults =
        response == null ? new Map() : this.splitResponse(response);
    console.log('PUBMED', 'Batch response', Array.from(splitResults.keys()));
    for (const [id, resolve, reject] of promises) {
      const result = splitResults.get(id);
      if (result == null) {
        reject(err);
      } else {
        resolve(result);
      }
    }
  }
}

async function asyncRequest(url) {
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
      console.log('PUBMED', `Retrying in ${t} seconds...`, url);
      await new Promise((resolve, reject) => {
        window.setTimeout(resolve, t * 1000);
      });
    }
  }
  console.error('PUBMED', 'Request failed: ', url, errorCode, errorResponse);
  throw errorCode == 400 ? 'Bad request (A)' :
                           'Network Error. Try reloading the page.';
}

async function asyncPubMedRequest(api, ids) {
  return await asyncRequest(
      `${kBaseUrl}/${api}&id=${ids.join(',')}&${kPubMedApiSuffix}`);
}

async function asyncPubMedIdConv(ids) {
  return await asyncRequest(
      `${kIdConvUrl}?ids=${ids.join(',')}&${kPubMedApiSuffix}`);
}

function invertMap(m) {
  return new Map(Array.from(m.entries()).map(x => [x[1], x[0]]));
}

const kEscapeChar = '\\';
const kDelim1 = '\n';
const kDelim2 = '\t';
const kEscapes = new Map([
  [kEscapeChar, kEscapeChar],
  [kDelim1, 'n'],
  [kDelim2, 't'],
]);
const kUnescapes = invertMap(kEscapes);
function escapeString(str) {
  o = '';
  for (const c of str) {
    if (kEscapes.has(c)) {
      o += kEscapeChar;
      o += kEscapes.get(c);
    } else {
      o += c;
    }
  }
  return o;
}
function unescapeString(str) {
  o = '';
  e = false;
  for (const c of str) {
    if (e) {
      if (kUnescapes.has(c)) {
        o += kUnescapes.get(c);
      } else {
        // Probably a bug, but handle gracefully.
        o += kEscapeChar;
        o += c;
      }
      e = false;
    } else {
      if (c == kEscapeChar) {
        e = true;
      } else {
        o += c;
      }
    }
  }
  if (e) {
    // Probably a bug, but handle gracefully.
    o += kEscapeChar;
  }
  return o;
}

const kArticleTypeCodes = new Map([
  [kIdKind_PMID, 'p'],
  [kIdKind_PMCID, 'c'],
]);
const kInvArticleTypeCodes = invertMap(kArticleTypeCodes);
class Article {
  constructor(
      type, isPreprint, id, doi, title, authors, journalAbbr, issue, pubDate,
      epubDate, citeAuthor, abstract) {
    // In each string field, '' is the same as null.
    this.type = type ?? kIdKind_PMID;
    this.isPreprint = isPreprint ?? false;
    this.id = id ?? '';
    this.doi = doi ?? '';
    this.title = title ?? '';
    this.authors = authors ?? '';  // authorText
    this.journalAbbr = journalAbbr ?? '';  // isoAbbr
    this.issue = issue ?? '';  // pubIssue
    this.pubDate = pubDate ?? '';
    this.epubDate = epubDate ?? '';
    this.citeAuthor = citeAuthor ?? '';  // fullAuthorText
    this.abstract = abstract ?? [];  // [[label, text]...]
  }

  getCiteNoId() {
    const epubInfo =
        formatEpubInfo(this.isPreprint, this.pubDate, this.epubDate);
    return `${this.citeAuthor}. ${this.title} ${
               cleanText(this.journalAbbr, '. ')}` +
        cleanText(`${this.pubDate}${maybePrefix(this.issue, ';')}`, '. ') +
        `${cleanText(maybePrefix(this.doi, 'doi: '), '. ')}` +
        `${cleanText(epubInfo, '. ')}`;
  }

  getCite() {
    return `${this.getCiteNoId()}${kIdKindNames[this.type]}: ${
        this.getPrefixedId()}.`;
  }

  getDateText() {
    let text = '';
    if (!this.isPreprint) text += this.pubDate;
    if (this.isPreprint || this.epubDate != this.pubDate) {
      text += ` (Epub ${this.epubDate})`;
    }
    return text;
  }

  getPrefixedId() {
    return this.type == kIdKind_PMCID ? 'PMC' + this.id : this.id;
  }

  getLink() {
    return kLink + this.getPrefixedId();
  }

  serialize() {
    return this.abstract.reduce((a, x) => {
      a.push(x[0]);
      a.push(x[1]);
      return a;
    }, [
      kArticleTypeCodes.get(this.type) + (this.isPreprint ? 'b' : 'a'),
      this.id,
      this.doi,
      this.title,
      this.authors,
      this.journalAbbr,
      this.issue,
      this.pubDate,
      this.epubDate,
      this.citeAuthor,
    ]).map(escapeString).join(kDelim2);
  }
}

function deserializeArticle(s) {
  const f = s.split(kDelim2).map(unescapeString);
  const n = 10;
  console.assert(f.length >= n);
  console.assert((f.length - n) % 2 == 0);
  console.assert(f[0].length >= 2);
  const head = f[0];
  const type = kInvArticleTypeCodes.get(head[0]);
  console.assert(type != null);
  const abstract = [];
  for (let i = n; i < f.length; i += 2) {
    abstract.push([f[i], f[i + 1]]);
  }
  return new Article(type, head[1] == 'b', ...f.slice(1, n), abstract);
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

function maybeStripPrefix(text, pre) {
  if (text.startsWith(pre)) return text.substring(pre.length);
  return text;
}

function parsePMIDPreprintStatus(pmd) {
  const status = pmd?.one('PublicationStatus')?.text;
  return status == 'aheadofprint';
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
  // return month.split('-')
  //     .map(m => fixCase(m.slice(0, kMonthNameLen)))
  //     .filter(m => kMonthNames.indexOf(m) != -1)
  //     .join('-');
  return month.split('-')
      .map(m => fixCase(m.slice(0, kMonthNameLen)))
      .filter(m => kMonthNames.indexOf(m) != -1)[0];
}

function formatDate(
    mdate, year, month, day, includeDay = false, fallbackDate = '') {
  const y = maybePrefix(cleanText(year));
  if (y == '') {
    const medDate = maybePrefix(cleanText(mdate));
    return medDate != '' ? medDate : fallbackDate;
  }
  const m = maybePrefix(parseMonth(month));
  if (m == '') return fallbackDate != '' ? fallbackDate : y;
  const d = includeDay ? maybePrefix(removeCommonPrefix(day ?? '', '0')) : '';
  return `${y}${m}${d}`;
}

function parsePMIDDate(date, includeDay = false, fallbackDate = '') {
  return formatDate(
      date?.one('MedlineDate')?.text, date?.one('Year')?.text,
      date?.one('Month')?.text, date?.one('Day')?.text, includeDay,
      fallbackDate);
}

function parsePMIDPubDates(article, pmd) {
  let epubDate = parsePMIDDate(
      article?.oneWithAttr('ArticleDate', [['DateType', 'Electronic']]) ??
          pmd?.one('History')?.oneWithAttr(
              'PubMedPubDate', [['PubStatus', 'entrez']]),
      true);
  let pubDate = parsePMIDDate(
      article?.one('Journal')?.one('JournalIssue')?.one('PubDate'), true,
      epubDate);
  // console.log('OLD', epubDate, pubDate);
  if (pubDate == '') pubDate = epubDate;
  if (epubDate == '') epubDate = pubDate;
  return [pubDate, epubDate];
}

function parsePMIDAuthors(article) {
  return article?.one('AuthorList')
             ?.all('Author')
             ?.map(x => {
               const lastName = cleanText(x?.one('LastName')?.text);
               if (lastName == '') return null;
               const initials = cleanText(x?.one('Initials')?.text);
               return [lastName, initials];
             })
             ?.filter(x => x != null) ??
      [];
}

function formatAuthors(rawAuthors, maxAuthors) {
  let authors = rawAuthors.map(x => {
    const [lastName, initials] = x;
    if (initials == '') return lastName;
    return `${lastName} ${initials}`;
  });
  if (maxAuthors >= 0 && authors.length > maxAuthors) {
    authors = authors.slice(0, maxAuthors);
    authors.push('et al');
  }
  return authors.join(', ');
}

function parsePMIDDoi(article) {
  return (article?.all('ELocationID')?.filter(loc => {
           if (loc?.attr('EIdType') != 'doi') return false;
           return (loc?.attr('ValidYN') ?? 'Y').toUpperCase() == 'Y';
         }) ??
          [])[0]
      ?.text;
}

function formatIssue(volume, issue, page) {
  if ((volume ?? '') == '' && (issue ?? '') == '') return '';
  return `${cleanText(volume)}${maybePrefix(cleanText(issue, ')'), '(')}${
      maybePrefix(cleanText(page), ':')}`;
}

function pmidXmlToArticle(data) {
  // console.log('OLD', data.serialize());
  const mc = data?.one('MedlineCitation');
  const id = mc?.one('PMID')?.text;
  if (id == null) return null;
  const article = mc?.one('Article');
  if (article == null) return null;
  const title = cleanText(article.one('ArticleTitle')?.text, '.', /[?!]$/);
  const abstract = article?.one('Abstract')?.all('AbstractText')?.map(x => {
    return [fixCase(cleanText(x.attr('Label'), ':')), cleanText(x.text, '.')];
  });
  const isPreprint = parsePMIDPreprintStatus(data?.one('PubmedData'));
  const rawAuthors = parsePMIDAuthors(article);
  const authors = formatAuthors(rawAuthors, 3);
  const citeAuthor = formatAuthors(rawAuthors, -1);
  const [pubDate, epubDate] =
      parsePMIDPubDates(article, data?.one('PubmedData'));
  const journal = article?.one('Journal');
  const journalAbbr = cleanText(journal?.one('ISOAbbreviation')?.text);
  const journalIssue = journal?.one('JournalIssue');
  const issue = formatIssue(
      journalIssue?.one('Volume')?.text, journalIssue?.one('Issue')?.text,
      article?.one('Pagination')?.one('MedlinePgn')?.text ??
          article
              ?.oneWithAttr(
                  'ELocationID', [['EIdType', 'pii'], ['ValidYN', 'Y']])
              ?.text);
  const doi = parsePMIDDoi(article)?.toLowerCase();
  return new Article(
      kIdKind_PMID, isPreprint, id, doi, title, authors, journalAbbr, issue,
      pubDate, epubDate, citeAuthor, abstract);
}

function pmidXmlToArrayOfArticles(data) {
  const articles = [];
  for (const articleData of data?.all('PubmedArticle')) {
    const article = pmidXmlToArticle(articleData);
    if (article != null) articles.push(article);
  }
  return articles;
}

function parsePMCIDAuthors(articleMeta) {
  return articleMeta?.one('contrib-group')
             ?.allWithAttr('contrib', [['contrib-type', 'author']])
             ?.map(x => {
               const name = x?.one('name');
               const lastName = cleanText(name?.one('surname')?.text);
               if (lastName == '') return null;
               const givenNames = cleanText(name?.one('given-names')?.text);
               const initials = givenNames.split(/[ .-]/)
                                    .map(x => x.slice(0, 1).toUpperCase())
                                    .join('');
               return [lastName, initials];
             })
             ?.filter(x => x != null) ??
      [];
}

function removeCommonPrefix(a, p) {
  const n = Math.min(a.length, p.length);
  for (let i = 0; i < n; ++i) {
    if (a.charCodeAt(i) != p.charCodeAt(i)) return a.slice(i);
  }
  return a.slice(n);
}

function parsePMCIDPage(articleMeta) {
  const fp = cleanText(articleMeta?.one('fpage')?.text);
  let lp = cleanText(articleMeta?.one('lpage')?.text);
  const eloid = cleanText(articleMeta?.one('elocation-id')?.text);
  if (fp == '' && lp == '') return eloid;
  if (fp == '') return lp;
  if (lp == '') return fp;
  if (fp == lp) return fp;
  /*if (fp.length == lp.length) {
    const fn = parseInt(fp);
    const ln = parseInt(lp);
    if (!isNaN(fn) && !isNaN(ln) && ln > fn) {
      lp = removeCommonPrefix(lp, fp);  // 1234-1267  =>  1234-67
    }
  }*/
  return fp + '-' + lp;
}

function parsePMCIDDate(
    date, includeDay = false, fallbackDate = '', fallbackMonth = null) {
  return formatDate(
      date?.one('medline-date')?.text, date?.one('year')?.text,
      date?.one('month')?.text ?? date?.one('season')?.text ?? fallbackMonth,
      date?.one('day')?.text, includeDay, fallbackDate);
}

function parsePMCIDPubDates(am) {
  let epubDate =
      parsePMCIDDate(am?.oneWithAttr('pub-date', [['pub-type', 'epub']]), true);
  let pubDate = parsePMCIDDate(
      am?.oneWithAttr('pub-date', [['pub-type', 'ppub']]), true, epubDate,
      am?.one('issue')?.text);
  // console.log('NEW', epubDate, pubDate);
  if (pubDate == '') pubDate = epubDate;
  if (epubDate == '') epubDate = pubDate;
  return [pubDate, epubDate];
}

function parsePMCIDPreprintStatus(am) {
  let hasEpubDate = am?.oneWithAttr('pub-date', [['pub-type', 'epub']]) != null;
  let hasPubDate = am?.oneWithAttr('pub-date', [['pub-type', 'ppub']]) != null;
  let hasCollectionDate =
      am?.oneWithAttr('pub-date', [['pub-type', 'collection']]) != null;
  return hasEpubDate && !hasPubDate && !hasCollectionDate;
}

function parsePMCIDJournalAbbr(jm) {
  return (jm?.oneWithAttr('journal-id', [['journal-id-type', 'nlm-ta']]) ??
          jm?.oneWithAttr('journal-id', [['journal-id-type', 'iso-abbrev']]))
      ?.text;
}

function parsePMCIDAbstract(abstractNode) {
  const a = [];
  const parse = n => {
    let anyAdded = false;
    for (const c of n.children) {
      if (c.tag == 'title') {
        let title = c?.text ?? '';
        if (title.toLowerCase() == 'abstract') title = '';
        if (title != '') {
          a.push([fixCase(cleanText(title, ':')), '']);
          anyAdded = true;
        }
      } else if (c.tag == 'p') {
        if (!anyAdded) {
          a.push(['', '']);
          anyAdded = true;
        }
        if (a[a.length - 1][1] != '') a[a.length - 1][1] += '\n';
        a[a.length - 1][1] += cleanText(c?.text, '.');
      } else if (c.tag == 'sec') {
        parse(c);
        anyAdded = false;
      }
    }
  };
  if (abstractNode != null) parse(abstractNode);
  return a;
}

function pmcidXmlToArticle(data) {
  const article = data?.one('front');
  if (article == null) return null;
  // console.log('NEW', data.serialize());
  const journalAbbr = parsePMCIDJournalAbbr(article?.one('journal-meta'));
  const am = article?.one('article-meta');
  const id = am?.oneWithAttr('article-id', [['pub-id-type', 'pmc']])?.text;
  const doi = am?.oneWithAttr('article-id', [
                  ['pub-id-type', 'doi']
                ])?.text?.toLowerCase();
  const title = cleanText(
      am?.one('title-group')?.one('article-title')?.text, '.', /[?!]$/);
  const rawAuthors = parsePMCIDAuthors(am);
  const authors = formatAuthors(rawAuthors, 3);
  const citeAuthor = formatAuthors(rawAuthors, -1);
  const issue = formatIssue(
      am?.one('volume')?.text, am?.one('issue')?.text, parsePMCIDPage(am));
  const [pubDate, epubDate] = parsePMCIDPubDates(am);
  const isPreprint = parsePMCIDPreprintStatus(am);
  const abstract = parsePMCIDAbstract(am?.one('abstract'));
  return new Article(
      kIdKind_PMCID, isPreprint, id, doi, title, authors, journalAbbr, issue,
      pubDate, epubDate, citeAuthor, abstract);
}

function pmcidXmlToArrayOfArticles(data) {
  const articles = [];
  for (const articleData of data?.all('article')) {
    const article = pmcidXmlToArticle(articleData);
    if (article != null) articles.push(article);
  }
  return articles;
}

class ArticleId {
  constructor(pmid, pmcid, doi) {
    this.pmid = pmid;
    this.pmcid =
        pmcid == null ? null : maybeStripPrefix(pmcid.toLowerCase(), 'pmc');
    this.doi =
        doi == null ? null : maybeStripPrefix(doi.toLowerCase(), kDoiUrl);
  }

  prefixedPmcid() {
    return this.pmcid == null ? null : 'PMC' + this.pmcid;
  }
}

function xmlToMapOfArticleIds(data) {
  const m = new Map();
  for (const r of data.all('record')) {
    const rid = r.attr('requested-id').toLowerCase();
    m.set(rid, new ArticleId(r.attr('pmid'), r.attr('pmcid'), r.attr('doi')));
  }
  return m;
}

function identifyIdKind(id) {
  id = id.toLowerCase();
  if (id.match(kRegexDoi)) return kIdKind_DOI;
  if (id.match(kRegexPmcid)) return kIdKind_PMCID;
  if (id.match(kRegexPmid)) return kIdKind_PMID;
  return null;
}

async function cacheAndBatch(batcher, id) {
  return deserializeArticle(await cache.lookup(id, () => batcher.get(id)));
}

function makeBatcher(api, xmlToArrayOfArticles) {
  return new RequestBatcher(
      ids => asyncPubMedRequest(api, ids),
      response => {
        const articles = xmlToArrayOfArticles(Xml.parse(response));
        const split = new Map();
        for (const article of articles) {
          split.set(article.getPrefixedId(), article.serialize());
        }
        return split;
      },
  );
}

const asyncPubMedGetArticleFromPmid_Batcher =
    makeBatcher(kApis.efetchPmid, pmidXmlToArrayOfArticles);
function asyncPubMedGetArticleFromPmid(id) {
  return cacheAndBatch(asyncPubMedGetArticleFromPmid_Batcher, id);
}

const asyncPubMedGetArticleFromPmcid_Batcher =
    makeBatcher(kApis.efetchPmcid, pmcidXmlToArrayOfArticles);
function asyncPubMedGetArticleFromPmcid(id) {
  return cacheAndBatch(asyncPubMedGetArticleFromPmcid_Batcher, id);
}

function makeConvBatcher() {
  return new RequestBatcher(
      asyncPubMedIdConv, response => xmlToMapOfArticleIds(Xml.parse(response)));
}
const asyncPubMedConvertIds_Batchers =
    [makeConvBatcher(), makeConvBatcher(), makeConvBatcher()];
function asyncPubMedConvertId(id) {
  id = id.toLowerCase();
  const idKind = identifyIdKind(id);
  if (idKind == null) throw 'Bad ID (C)';
  return asyncPubMedConvertIds_Batchers[idKind].get(id);
}

function asyncGetFilledArticleId(aid) {
  if (aid.pmid != null && aid.pmcid != null && aid.doi != null) return aid;
  const get = async (id) => {
    try {
      return await asyncPubMedConvertId(id);
    } catch (e) {
      return aid;
    }
  };
  if (aid.pmid != null) return get(aid.pmid);
  if (aid.pmcid != null) return get(aid.prefixedPmcid());
  if (aid.doi != null) return get(aid.doi);
  return aid;
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

let allowedAbstractJournals = null;
function shouldAllowAbstract(journalAbbr) {
  if (typeof (kAllowedAbstractJournals) == 'undefined') return true;
  if (allowedAbstractJournals == null) {
    allowedAbstractJournals =
        new Set(kAllowedAbstractJournals.map(x => x.trim().toLowerCase()));
  }
  return allowedAbstractJournals.has(journalAbbr.trim().toLowerCase());
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
    const pmid = this.node.getAttribute('pmid');
    const pmcid = this.node.getAttribute('pmcid');
    this.allowAbstract = null;
    if (this.node.getAttribute('no-abstract') != null) {
      this.allowAbstract = false;
    } else if (this.node.getAttribute('abstract') != null) {
      this.allowAbstract = true;
    }
    this.article = null;
    window.setTimeout(async () => {
      try {
        if (pmid != null) {
          this.article = await asyncPubMedGetArticleFromPmid(pmid);
        } else if (pmcid != null) {
          this.article = await asyncPubMedGetArticleFromPmcid(pmcid);
        } else {
          this._fillError('Bad ID (B)');
          return;
        }
      } catch (e) {
        this._fillError(e);
        return;
      }
      this._fill();
    }, 0);
  }

  _fillError(error) {
    emptyDiv(this.node);
    this.node.classList.remove('loading');
    this.node.classList.add('loaded');
    this.node.classList.add('error');
    this.node.innerText = error + ': ' + this.node.getAttribute('pmid');
  }

  _fill() {
    emptyDiv(this.node);
    this.node.classList.remove('loading');
    this.node.classList.add('loaded');
    if (this.allowAbstract == null) {
      this.allowAbstract = shouldAllowAbstract(this.article.journalAbbr);
    }
    if (!this.allowAbstract) this.node.classList.add('no-abstract');
    const addBtn = (classes, text) => {
      newBtn(
          this.node, classes, () => this._showAbstract(),
          this.allowAbstract ? 'View abstract' : 'Open on PubMed', text);
    };
    addBtn(['pub-med-title'], `${this.article.title} `);
    addBtn(['pub-med-authors'], this.article.authors);
    if (this.article.journalAbbr != '') {
      addBtn(['pub-med-journal'], ' - ' + this.article.journalAbbr);
    }
    if (this.article.pubDate != '') {
      addBtn(['pub-med-date'], ' -' + this.article.getDateText());
    }
    newBtn(this.node, ['pub-med-copy'], e => this._copy(e), 'Copy citation');
  }

  _openPubMed() {
    newLink(null, [], this.article.getLink()).click();
  }

  _hideAbstract() {
    domTooltip.classList.remove('shown');
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
        'Open on PubMed', this.article.title);
    newDiv(domPma, ['pub-med-abstract-citation'], this.article.getCite());
    if (!this.allowAbstract) {
      const part = newDiv(domPma, ['pub-med-abstract-part']);
      newDiv(
          part, ['pub-med-abstract-text', 'pub-med-abstract-text-no-abstract'],
          'Abstract opened in a new tab.');
    } else if (this.article.abstract.length == 0) {
      const part = newDiv(domPma, ['pub-med-abstract-part']);
      newDiv(
          part,
          ['pub-med-abstract-text', 'pub-med-abstract-text-not-available'],
          'Abstract not available.');
    } else {
      for (const [label, text] of this.article.abstract) {
        const part = newDiv(domPma, ['pub-med-abstract-part']);
        if (label.length > 0) newDiv(part, ['pub-med-abstract-label'], label);
        newDiv(part, ['pub-med-abstract-text'], text);
      }
    }
  }

  _copy(e) {
    navigator.clipboard.writeText(this.article.getCite());
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
    kIdKind_DOI,
    kIdKind_PMID,
    kIdKind_PMCID,

    Cache,
    Xml,
    RequestBatcher,
    Article,
    ArticleId,
    PubMed,

    asyncPubMedRequest,
    asyncPubMedGetArticleFromPmid,
    asyncPubMedGetArticleFromPmcid,
    asyncPubMedConvertId,
    asyncGetFilledArticleId,
    identifyIdKind,
    invertMap,
    escapeString,
    unescapeString,
    deserializeArticle,
    emptyDiv,
    newElement,
    newDiv,
    setTooltip,
    newBtn,
    newLink,
    cleanText,
    maybePrefix,
    // TODO: What functions does pubmednews etc need?
  };
}
})();
