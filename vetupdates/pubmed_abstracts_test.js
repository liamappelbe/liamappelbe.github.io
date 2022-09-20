(function() {

console.log(module);
const {
  kLink,
  escapeString,
  unescapeString,
  Article,
  ArticleId,
  deserializeArticle,
  identifyIdKind,
  kIdKind_PMID,
  kIdKind_PMCID,
  kIdKind_DOI,
  asyncPubMedGetArticleFromPmid,
  asyncPubMedGetArticleFromPmcid,
  asyncGetFilledArticleId,
} = module.exports;

let domLog = null;
const logImpl = (fn, cls, ...args) => {
  const row = document.createElement('div');
  row.classList.add('log-row');
  const tag = document.createElement('div');
  tag.classList.add('log-tag');
  tag.classList.add(cls);
  row.appendChild(tag);
  const msg = document.createElement('div');
  msg.classList.add('log-msg');
  msg.innerText = args.join(' ');
  row.appendChild(msg);
  domLog.appendChild(row);
  fn(...args);
};

const win = (...args) => logImpl(console.log, 'win', ...args);
const log = (...args) => logImpl(console.log, 'info', ...args);
const warn = (...args) => logImpl(console.warn, 'warn', ...args);
const error = (...args) => logImpl(console.error, 'error', ...args);

let allPassed = true;
const test = (act, exp, ...args) => {
  if (act !== exp) {
    allPassed = false;
    error('Test failed. Expected', exp, 'but found', act, '\t\t\t', ...args);
  }
};

const group = async (name, fn) => {
  allPassed = true;

  const t = performance.now();
  await fn();
  const dt = performance.now() - t;

  if (allPassed) {
    win(`All ${name} tests passed :) (${(dt / 1000).toFixed(2)} sec)`);
  } else {
    error(`Some ${name} tests failed :(`);
  }
};

const stringEscapingTest = () => {
  // Basics.
  test(escapeString('abc\tdef\nghi\t\\\\\\'), 'abc\\tdef\\nghi\\t\\\\\\\\\\\\');
  test(
      unescapeString('abc\\tdef\\nghi\\t\\\\\\\\\\\\'),
      'abc\tdef\nghi\t\\\\\\');

  // Edge cases.
  test(unescapeString('\\'), '\\');
  test(unescapeString('n'), 'n');
  test(unescapeString('t'), 't');
  test(unescapeString('\\a'), '\\a');
  test(unescapeString('\\a\n\t\\'), '\\a\n\t\\');

  // Fuzz tests.
  const fuzzChars = ['\\', '\n', '\t', 'n', 't', 'a'];
  for (let i = 0; i < 1000; ++i) {
    let s = '';
    for (let j = 0; j < 1000; ++j) {
      s += fuzzChars[Math.floor(Math.random() * fuzzChars.length)];
    }
    const e = escapeString(s);
    test(e.indexOf('\n'), -1);
    test(e.indexOf('\t'), -1);
    test(unescapeString(e), s);
  }
};

const articleSerializationTest = () => {
  const runTest = (...args) => {
    const article = new Article(...args);
    const s = article.serialize();
    const article2 = deserializeArticle(s);
    test(JSON.stringify(article2), JSON.stringify(article));
  };
  runTest(
      kIdKind_PMID, false, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author', []);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMID, true, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author',
      [['a', 'b'], ['c', 'd']]);
  runTest(
      kIdKind_PMCID, false, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author',
      [['a', 'b'], ['c', 'd'], ['e', 'f']]);
  runTest(
      null, true, 'id', 'doi', 'title', 'authors', 'journal abbr', 'issue',
      'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, null, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, null, 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', null, 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', null, 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', 'title', null, 'journal abbr', 'issue',
      'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', 'title', 'authors', null, 'issue',
      'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', 'title', 'authors', 'journal abbr',
      null, 'pub\tdate', 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', null, 'epud\ndate', 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', null, 'cite\\author', [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', null, [['a', 'b']]);
  runTest(
      kIdKind_PMCID, true, 'id', 'doi', 'title', 'authors', 'journal abbr',
      'issue', 'pub\tdate', 'epud\ndate', 'cite\\author', null);
  runTest(
      null, null, null, null, null, null, null, null, null, null, null, null);
};

const identifyIdKindTest = () => {
  test(identifyIdKind('1234'), kIdKind_PMID);
  test(identifyIdKind('PMC1234'), kIdKind_PMCID);
  test(identifyIdKind('pmc1234'), kIdKind_PMCID);
  test(identifyIdKind('123/456'), kIdKind_DOI);
  test(identifyIdKind('abc/def'), kIdKind_DOI);
  test(identifyIdKind('asdlkjf'), null);
  test(identifyIdKind('9283\\2033'), null);
  test(identifyIdKind('12.34'), null);
};

const runUnitTests = async () => await group('unit', () => {
  stringEscapingTest();
  articleSerializationTest();
  identifyIdKindTest();
});

const allArticleIds = [
  // new ArticleId('20137004', '7167204', '10.1111/j.1748-5827.2009.00820.x'),
  // new ArticleId('24773159', '4857933', '10.1111/jvim.12364'),
  // new ArticleId('26806261', '4913655', '10.1111/jvim.13823'),
  // new ArticleId('27461721', '5108445', '10.1111/jvim.14357'),
  // new ArticleId('30244674', '6151903', '10.1186/s13054-018-2155-1'),
  // new ArticleId('31025713', '6849757', '10.1111/jsap.13000'),
  // new ArticleId('31681643', '6820433', '10.4103/jfmpc.jfmpc_669_19'),
  // new ArticleId('31758868', '6979111', '10.1111/jvim.15638'),
  // new ArticleId('34213593', '8249842', '10.1007/s00134-021-06454-7'),
  // new ArticleId('34446092', '8390082', '10.1186/s13054-021-03736-w'),
  // new ArticleId('35337333', '8957137', '10.1186/s13054-022-03908-2'),
  // new ArticleId('35337346', '8957156', '10.1186/s13054-022-03911-7'),
  // new ArticleId('35358303', '9202732', '10.1210/clinem/dgac201'),
  // new ArticleId('35505424', '9066729', '10.1186/s40575-022-00119-4'),
  // new ArticleId('35690953', '9188674', '10.1007/s00134-022-06749-3'),
  // new ArticleId('35759009', '9244137', '10.1007/s00134-022-06762-6'),

  new ArticleId('35513707', '9205826', '10.1007/s00134-022-06698-x'),
  new ArticleId('34232336', '8261815', '10.1007/s00134-021-06459-2'),
  new ArticleId('32157357', '7095206', '10.1007/s00134-020-05980-0'),
  new ArticleId('25586014', '4858088', '10.1111/jvim.12514'),
  new ArticleId('35118150', '8803749', '10.3389/fvets.2021.769588'),
  new ArticleId('33557078', '7913839', '10.3390/pathogens10020165'),
  new ArticleId('35546513', '9151489', '10.1111/jvim.16437'),
  new ArticleId('34751442', '8692219', '10.1111/jvim.16292'),
  new ArticleId('31471995', '6766526', '10.1111/jvim.15607'),
  new ArticleId('34307515', '8299062', '10.3389/fvets.2021.643800'),
  new ArticleId('33324703', '7725764', '10.3389/fvets.2020.596059'),
  new ArticleId('33263015', '7686579', '10.3389/fvets.2020.583342'),
  new ArticleId('33195623', '7642913', '10.3389/fvets.2020.588338'),
  new ArticleId('33195591', '7593405', '10.3389/fvets.2020.579933'),
  new ArticleId('33134360', '7572860', '10.3389/fvets.2020.579025'),
  new ArticleId('32668077', '7517852', '10.1111/jvim.15855'),
  new ArticleId('28557061', '5508344', '10.1111/jvim.14771'),
  new ArticleId('27527382', '5032886', '10.1111/jvim.14557'),
  new ArticleId('33959654', '8093391', '10.3389/fvets.2021.659960'),
  new ArticleId('33889604', '8056939', '10.3389/fvets.2021.623671'),
  new ArticleId('35209770', '9099157', '10.1177/1098612x221079708'),
  new ArticleId('35054400', '8778861', '10.3390/life12010007'),
  new ArticleId('32039252', '6985277', '10.3389/fvets.2019.00513'),
  new ArticleId('31297880', '6766487', '10.1111/jvim.15568'),
  new ArticleId('34777198', '8586553', '10.3389/fneur.2021.727569'),
  new ArticleId('34746284', '8563835', '10.3389/fvets.2021.744080'),
  new ArticleId('34434982', '8380830', '10.3389/fvets.2021.624833'),
  new ArticleId('34414228', '8368984', '10.3389/fvets.2021.701377'),
  new ArticleId('34395568', '8357988', '10.3389/fvets.2021.638104'),
  new ArticleId('34268347', '8275824', '10.3389/fvets.2021.668688'),
  new ArticleId('34124213', '8193042', '10.3389/fvets.2021.630643'),
  new ArticleId('34055944', '8155248', '10.3389/fvets.2021.625708'),
  new ArticleId('34026896', '8137965', '10.3389/fvets.2021.661660'),
  new ArticleId('33869319', '8044465', '10.3389/fvets.2021.639848'),
  new ArticleId('33778035', '7987676', '10.3389/fvets.2021.621696'),
  new ArticleId('33718468', '7947228', '10.3389/fvets.2021.622127'),
  new ArticleId('33553287', '7859481', '10.3389/fvets.2020.623227'),
  new ArticleId('30713845', '6345713', '10.3389/fvets.2018.00336'),
  new ArticleId('33159358', '7694857', '10.1111/jvim.15961'),
  new ArticleId('28553642', '5427076', '10.3389/fvets.2017.00068'),
  new ArticleId('34693806', '8723176', '10.1177/1098612x211021819'),
  new ArticleId('34693811', '8642168', '10.1177/1098612x211020162'),
  new ArticleId('34693805', '8723175', '10.1177/1098612x211030218'),
  new ArticleId('32676505', '7333565', '10.3389/fvets.2020.00320'),
  new ArticleId('30709617', '7185536', '10.1016/j.jvc.2018.12.003'),
  new ArticleId('36038712', '9422935', '10.1007/s00134-022-06850-7'),
  new ArticleId('25520834', '4267600', '10.1186/2052-0492-2-20'),
  new ArticleId('34705079', '8548866', '10.1007/s00134-021-06548-2'),
  new ArticleId('33585610', '7876065', '10.3389/fvets.2020.625361'),
  new ArticleId('34422108', '8373284', '10.1177/1751143720961245'),
  new ArticleId('30806496', '6430926', '10.1111/jvim.15454'),
  new ArticleId('35932335', '9362613', '10.1007/s00134-022-06761-7'),
  new ArticleId('31993446', '6971114', '10.3389/fvets.2019.00498'),
  new ArticleId('31313372', '6766488', '10.1111/jvim.15554'),
  new ArticleId('29171095', '5787212', '10.1111/jvim.14875'),
  new ArticleId('35054993', '8776148', '10.3390/ijms23020803'),
  new ArticleId('30547040', '6280561', '10.3389/fvets.2018.00291'),
  new ArticleId('35437786', '9321991', '10.1111/vsu.13810'),
  new ArticleId('34917673', '8669569', '10.3389/fvets.2021.792720'),
  new ArticleId('33521075', '7841008', '10.3389/fvets.2020.571368'),
  new ArticleId('34026881', '8138582', '10.3389/fvets.2021.571370'),
  new ArticleId('34018618', '8519146', '10.1111/jsap.13356'),
  new ArticleId('31275952', '6594359', '10.3389/fvets.2019.00197'),
  new ArticleId('32891439', '7467068', '10.1016/j.cvsm.2020.07.008'),
  new ArticleId('32851047', '7427442', '10.3389/fvets.2020.00487'),
  new ArticleId('30102417', '7166581', '10.1111/jsap.12911'),
  new ArticleId('29560359', '5845710', '10.3389/fvets.2018.00043'),
  new ArticleId('30071148', null, null),
  new ArticleId(null, '123456789', null),
  new ArticleId(null, null, '10.2460/ajvr.21.02.0030'),
];

const idConversionTest = async () => {
  const tests = [];
  const subtest = (inpAid, expAid) => {
    tests.push((async () => {
      const actAid = await asyncGetFilledArticleId(inpAid);
      test(actAid.pmid, expAid.pmid);
      test(actAid.pmcid, expAid.pmcid);
      test(actAid.doi, expAid.doi);
    })());
  };
  for (const aid of allArticleIds) {
    subtest(aid, aid);
    if (aid.pmid != null) subtest(new ArticleId(aid.pmid, null, null), aid);
    if (aid.pmcid != null) subtest(new ArticleId(null, aid.pmcid, null), aid);
    if (aid.doi != null) subtest(new ArticleId(null, null, aid.doi), aid);
  }
  await Promise.all(tests);
};

const kCharReplace = [
  ['\u2010', '-'],
  ['\u2012', '-'],
  ['\u2013', '-'],
  ['\u2014', '-'],
  ['\u2212', '-'],
  ['\u201c', '"'],
  ['\u201d', '"'],
  ['\u2018', '\''],
  ['\u2019', '\''],
];
const normalizeText = s => {
  s = s.toLowerCase();
  for (const [from, to] of kCharReplace) s = s.replaceAll(from, to);
  return s;
};

const textToArray = s => {
  const a = [];
  for (const c of s) a.push(c.charCodeAt(0));
  return a;
};

const compareText = (a, b) => {
  msg = '';
  a = normalizeText(a);
  b = normalizeText(b);
  if (a.length != b.length) {
    msg += `\n    Different lengths: ${a.length} vs ${b.length}`;
  }
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; ++i) {
    const ca = a.charCodeAt(i);
    const cb = b.charCodeAt(i);
    if (ca != cb) {
      msg += `\n    Mismatch at ${i}: ${a.charAt(i)} (\\u${
          ca.toString(16)}) vs ${b.charAt(i)} (\\u${cb.toString(16)})`;
    }
  }
  return msg;
};

const articleParsingTest = async () => {
  const tests = [];
  let total = 0;
  let preprint = 0;
  let diffDate = 0;
  let multiSect = 0;
  let sectTitle = 0;
  for (const aid of allArticleIds) {
    if (aid.pmid != null && aid.pmcid != null) {
      const t = (...args) => test(...args, 'PMID:', aid.pmid);
      const tt = (a, b) =>
          t(normalizeText(a), normalizeText(b), compareText(a, b));
      tests.push((async () => {
        const artPmid = await asyncPubMedGetArticleFromPmid(aid.pmid);
        t(artPmid.type, kIdKind_PMID);
        t(artPmid.id, aid.pmid);
        t(artPmid.doi, aid.doi);
        t(artPmid.getPrefixedId(), '' + aid.pmid);
        t(artPmid.getLink(), kLink + aid.pmid);
        t(artPmid.getCite(), artPmid.getCiteNoId() + `PMID: ${aid.pmid}.`);

        const artPmcid = await asyncPubMedGetArticleFromPmcid(aid.pmcid);
        t(artPmcid.type, kIdKind_PMCID);
        t(artPmcid.id, aid.pmcid);
        t(artPmcid.doi, aid.doi);
        t(artPmcid.getPrefixedId(), 'PMC' + aid.pmcid);
        t(artPmcid.getPrefixedId(), aid.prefixedPmcid());
        t(artPmcid.getLink(), kLink + aid.prefixedPmcid());
        t(artPmcid.getCite(),
          artPmcid.getCiteNoId() + `PMCID: PMC${aid.pmcid}.`);

        t(artPmcid.isPreprint, artPmid.isPreprint);
        tt(artPmcid.title, artPmid.title);
        tt(artPmcid.authors, artPmid.authors);
        t(artPmcid.journalAbbr, artPmid.journalAbbr);
        t(artPmcid.issue, artPmid.issue);
        t(artPmcid.pubDate, artPmid.pubDate);
        t(artPmcid.epubDate, artPmid.epubDate);
        tt(artPmcid.citeAuthor, artPmid.citeAuthor);
        tt(artPmcid.getCiteNoId(), artPmid.getCiteNoId());
        t(artPmcid.getDateText(), artPmid.getDateText());

        t(artPmcid.abstract.length, artPmid.abstract.length);
        const len = Math.min(artPmcid.abstract.length, artPmid.abstract.length);
        let hasSectionTitles = false;
        for (let i = 0; i < len; ++i) {
          tt(artPmcid.abstract[i][0], artPmid.abstract[i][0]);
          tt(artPmcid.abstract[i][1], artPmid.abstract[i][1]);
          if (artPmid.abstract[i][0].length > 0) hasSectionTitles = true;
        }

        total += 1;
        if (artPmid.isPreprint) preprint += 1;
        if (artPmid.pubDate != artPmid.epubDate) diffDate += 1;
        if (len > 1) multiSect += 1;
        if (hasSectionTitles) sectTitle += 1;
      })());
    }
  }
  await Promise.all(tests);
  let poorCoverage = false;
  const l = (n, desc) => {
    (n == 0 ? warn : log)(`Tested ${n} ${desc}.`);
    if (n == 0) poorCoverage = true;
  };
  l(total, 'articles');
  l(preprint, 'preprint articles');
  l(diffDate, 'articles with different pub and epub dates');
  l(multiSect, 'articles with multiple abstract sections');
  l(sectTitle, 'articles with abstract section titles');
  if (poorCoverage) {
    warn(`Test coverage needs to be improved.`);
  } else {
    log(`Test coverage is good.`);
  }
};

const runIntegrationTests = async () => await group('integration', async () => {
  await idConversionTest();
  await articleParsingTest();
});

const wait = () => new Promise(resolve => window.setTimeout(resolve, 0));

const runAllTests = async () => {
  domLog = document.getElementById('log');

  log('Clearing cache');
  await wait();
  window.localStorage.clear();
  await wait();

  log('Running unit tests');
  await wait();
  await runUnitTests();
  await wait();

  log('Running integration tests');
  await wait();
  await runIntegrationTests();
  await wait();

  log('Running integration tests again, with caching');
  await wait();
  await runIntegrationTests();
  await wait();
};

window.addEventListener('load', runAllTests);
})();
