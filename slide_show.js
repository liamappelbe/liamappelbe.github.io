(function() {
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

function newBtn(parent, classes = [], text = null, onclick = null) {
  const btn = newDiv(parent, classes, text);
  if (onclick != null) btn.addEventListener('click', onclick);
  return btn;
}

function emptyDiv(n) {
  while (n.hasChildNodes()) n.removeChild(n.lastChild);
}

class Slide {
  constructor(wrap, dot) {
    this.wrap = wrap;
    this.dot = dot;
  }
}

class SlideShowImpl {
  constructor(node) {
    this.node = node;
    this.index = 0;
    this.slides = [];
    this.lowButtons = (node.getAttribute('button-layout') == 'low');
    this.loop = (node.getAttribute('loop') != 'false');
    const next = node.getAttribute('next');
    const prev = node.getAttribute('prev');

    // Copy the children and remove them.
    const ch = [];
    for (const n of node.children) {
      ch.push(n);
    }
    emptyDiv(node);

    // Layout elements.
    const slideRow = newDiv(node, ['slide-show-slide-row']);
    const dotRow = newDiv(node, ['slide-show-dot-row']);
    const btnWrap = this.lowButtons ? dotRow : slideRow;

    // Previous button.
    this.prevBtn =
        newBtn(btnWrap, ['slide-show-button'], prev, () => this.prevSlide());

    // Wrap the children in some divs and re-add them.
    const slideWrap = newDiv(slideRow, ['slide-show-slides']);
    for (let i = 0; i < ch.length; ++i) {
      const wrap = newDiv(slideWrap, ['slide-show-slide-wrap']);
      wrap.appendChild(ch[i]);

      // The progress dot.
      const dot =
          newBtn(dotRow, ['slide-show-dot'], null, () => this.setSlide(i));

      this.slides.push(new Slide(wrap, dot));
    }

    // Next button.
    this.nextBtn =
        newBtn(btnWrap, ['slide-show-button'], next, () => this.nextSlide());

    this.setSlide(0);

    window.setTimeout(() => node.classList.add('loaded'), 0);
  }

  setSlide(index) {
    this.index = index;
    for (let i = 0; i < this.slides.length; ++i) {
      const slide = this.slides[i];
      if (i == index) {
        slide.wrap.style.display = '';
        slide.dot.classList.add('active');
      } else {
        slide.wrap.style.display = 'none';
        slide.dot.classList.remove('active');
      }
    }
    if (!this.loop) {
      const setBtn = (btn, enabled) => {
        if (enabled) {
          btn.classList.remove('disabled');
        } else {
          btn.classList.add('disabled');
        }
      };
      setBtn(this.prevBtn, index > 0);
      setBtn(this.nextBtn, index < (this.slides.length - 1));
    }
    this.node.dispatchEvent(new CustomEvent('change', {detail: index}));
  }

  nextSlide() {
    this.setSlide((this.index + 1) % this.slides.length);
  }

  prevSlide() {
    this.setSlide((this.index + this.slides.length - 1) % this.slides.length);
  }
}

class SlideShow extends HTMLElement {
  constructor() {
    super();
    this.impl = new SlideShowImpl(this);
  }
}

window.addEventListener(
    'load', () => customElements.define('slide-show', SlideShow));
})();
