(function() {
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

function newLink(parent, classes = [], url = null, text = null) {
  const n = newElement('a', parent, classes, text);
  if (url != null) n.href = url;
  return n;
}

let _idCounter = 0;
function setUniqueDomId(node) {
  if (node.id != '') return node.id;
  while (true) {
    const id = `heading_${_idCounter}`;
    ++_idCounter;
    if (document.getElementById(id) == null) {
      node.id = id;
      return id;
    }
  }
}

class TableOfContentsImpl {
  constructor(node) {
    this.node = node;
    this.topBtn = null;
    window.setTimeout(() => {
      emptyDiv(this.node);
      const ol = newElement('ol', this.node, ['contents_list']);
      for (const h of document.getElementsByClassName(kTableOfContentsClass)) {
        const id = setUniqueDomId(h);
        const li = newElement('li', ol, ['contents_list_item']);
        newLink(li, ['contents_link'], `#${id}`, h.innerText);
      }
      this.topBtn = newElement('div', document.body, ['scroll_to_top_button']);
      this.topBtn.onclick = () => {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
      };
      window.addEventListener('scroll', () => {
        if (this.node.getBoundingClientRect().bottom < 0) {
          this.topBtn.classList.add('enabled');
        } else {
          this.topBtn.classList.remove('enabled');
        }
      });
    }, 0);
  }
}

class TableOfContents extends HTMLElement {
  constructor() {
    super();
    this.impl = new TableOfContentsImpl(this);
  }
}

window.addEventListener(
    'load', () => customElements.define('table-of-contents', TableOfContents));
})();
