const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const script = readFileSync(join(__dirname, '../js/modal.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function browser(lang = 'pl', libraryAvailable = true) {
  const document = { documentElement: { lang } };
  function element(tag) {
    return {
      tag, children: [], style: {}, events: {}, attrs: {}, inert: false,
      addEventListener(name, fn) { this.events[name] = fn; },
      setAttribute(name, value) { this.attrs[name] = value; },
      getAttribute(name) { return this.attrs[name]; },
      focus() { document.activeElement = this; },
      contains(child) { return this === child || this.children.some(item => item.contains(child)); },
      replaceChildren(...children) { this.children = children; },
      insertBefore(child, before) { this.children.splice(this.children.indexOf(before), 0, child); },
      querySelectorAll(tag) { return this.children.filter(child => child.tag === tag); },
      getBoundingClientRect() { return { top: 2000, bottom: 800 }; },
      getContext() { return { canvas: this }; },
    };
  }
  const [modal, viewer, close, parent, opener, background, preInert] =
    ['div', 'div', 'span', 'div', 'a', 'main', 'aside'].map(element);
  preInert.inert = true;
  opener.attrs['data-pdf'] = '/document.pdf';
  modal.querySelector = () => close;
  modal.children = [parent];
  parent.children = [close, viewer];
  viewer.parentNode = parent;
  document.body = element('body');
  document.body.style.overflow = 'scroll';
  document.body.children = [background, preInert, modal];
  document.createElement = element;
  document.getElementById = id => id === 'pdfModal' ? modal : viewer;
  document.querySelectorAll = () => [opener];
  document.addEventListener = (_, fn) => fn();
  const tasks = [], observers = [], calls = [];
  const pdfjsLib = { GlobalWorkerOptions: {}, getDocument(options) {
    const task = { ...deferred(), options, destroyed: false,
      destroy() { this.destroyed = true; this.reject(new Error('Aborted')); return Promise.resolve(); } };
    tasks.push(task);
    return task;
  } };
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  runInNewContext(script, { document, pdfjsLib: libraryAvailable ? pdfjsLib : undefined, IntersectionObserver });
  const fire = (target, name, extra = {}) => target.events[name]({ target, preventDefault() {}, ...extra });
  const page = number => ({
    getViewport: () => ({ width: 600, height: 800 }), cleanup() {},
    render({ canvasContext }) {
      canvasContext.canvas.page = number;
      return { promise: Promise.resolve(), cancel() {} };
    },
  });
  const pdf = { numPages: 9, getPage(number) { calls.push(number); return Promise.resolve(page(number)); } };
  return { document, modal, viewer, close, opener, background, preInert, tasks, observers, calls, pdf, page,
    link: parent.children[1], open: () => fire(opener, 'click'),
    key: (key, shiftKey = false) => fire(modal, 'keydown', { key, shiftKey, target: document.activeElement }),
    nearEnd: () => observers.at(-1).callback([{ isIntersecting: true }]),
    canvases: () => viewer.querySelectorAll('canvas') };
}

test('renders in order near the viewport, ignoring duplicate observer callbacks', async () => {
  const b = browser(); b.open(); b.tasks[0].resolve(b.pdf); await tick();
  assert.deepEqual(b.calls, [1]);
  assert.equal(b.tasks[0].options.isEvalSupported, false);
  b.nearEnd(); b.nearEnd(); await tick();
  assert.deepEqual(b.calls, [1, 2]);
  assert.deepEqual(b.canvases().map(canvas => canvas.page), [1, 2]);
  for (let page = 3; page <= 9; page++) { b.nearEnd(); await tick(); }
  assert.equal(b.canvases().length, 9);
  assert.equal(b.observers[0].disconnected, true);
});

test('Escape clears canvases, destroys the document and restores focus and prior background state', async () => {
  const b = browser(); b.open(); b.tasks[0].resolve(b.pdf); await tick();
  const canvas = b.canvases()[0];
  assert.equal(b.document.activeElement, b.close);
  assert.equal(b.background.inert, true);
  b.key('Tab'); assert.equal(b.document.activeElement, b.link);
  b.key('Tab', true); assert.equal(b.document.activeElement, b.close);
  b.key('Tab', true); assert.equal(b.document.activeElement, b.viewer);
  b.key('Escape');
  assert.equal(b.tasks[0].destroyed, true);
  assert.equal(b.canvases().length, 0);
  assert.equal(canvas.width * canvas.height, 0);
  assert.equal(b.document.body.style.overflow, 'scroll');
  assert.equal(b.background.inert, false);
  assert.equal(b.preInert.inert, true);
  assert.equal(b.document.activeElement, b.opener);
});

test('late pages from a closed document cannot appear in a reopened preview', async () => {
  const b = browser(), oldPage = deferred();
  b.open(); b.tasks[0].resolve({ numPages: 1, getPage: () => oldPage.promise }); await tick();
  b.key('Escape'); b.open(); b.tasks[1].resolve(b.pdf); await tick();
  oldPage.resolve(b.page(99)); await tick();
  assert.deepEqual(b.canvases().map(canvas => canvas.page), [1]);
  assert.equal(b.tasks[0].destroyed, true);
  assert.equal(b.tasks[1].destroyed, false);
});

test('closing cancels an active render and handles its rejection', async () => {
  const b = browser(), pending = deferred(); let cancelled = false;
  const page = b.page(1);
  page.render = () => ({ promise: pending.promise, cancel() { cancelled = true; pending.reject(new Error('Cancelled')); } });
  b.open(); b.tasks[0].resolve({ numPages: 1, getPage: async () => page }); await tick();
  b.key('Escape'); await tick();
  assert.equal(cancelled, true);
  assert.equal(b.tasks[0].destroyed, true);
  assert.equal(b.viewer.children.length, 0);
});

test('load failure offers the original PDF; a pending load can be closed and reopened', async () => {
  const b = browser('en'); b.open(); b.tasks[0].reject(new Error('Missing PDF')); await tick();
  assert.match(b.viewer.children[0].textContent, /Preview unavailable/);
  assert.equal(b.link.href, '/document.pdf');
  assert.equal(b.link.textContent, 'Open PDF');
  b.key('Escape'); b.open(); b.key('Escape'); b.open();
  b.tasks[2].resolve(b.pdf); await tick();
  assert.equal(b.tasks[1].destroyed, true);
  assert.deepEqual(b.canvases().map(canvas => canvas.page), [1]);
});

test('missing library still gives a closeable dialog and a direct PDF link', async () => {
  const b = browser('pl', false); await b.open();
  assert.match(b.viewer.children[0].textContent, /Podgląd niedostępny/);
  assert.equal(b.link.href, '/document.pdf');
  b.key('Enter');
  assert.equal(b.modal.style.display, 'none');
  assert.equal(b.document.activeElement, b.opener);
});

test('render failure preserves completed pages and stops requesting more', async () => {
  const b = browser(); b.open(); b.tasks[0].resolve(b.pdf); await tick();
  const page = b.page(2);
  page.render = () => ({ promise: Promise.reject(new Error('Render failed')), cancel() {} });
  let requests = 0;
  b.pdf.getPage = async () => { requests++; return page; };
  b.nearEnd(); await tick(); b.nearEnd(); await tick();
  assert.deepEqual(b.canvases().map(canvas => canvas.page), [1]);
  assert.equal(b.observers[0].disconnected, true);
  assert.equal(requests, 1);
  assert.match(b.viewer.children.at(-1).textContent, /Podgląd niedostępny/);
});
