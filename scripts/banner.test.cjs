const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const script = readFileSync(join(__dirname, '../js/banner.js'), 'utf8');

function browser(matches, hidden = false) {
  const events = {};
  const source = {
    dataset: { src: '/video/banner.mp4' },
    hasAttribute: () => Object.hasOwn(source, 'src'),
    removeAttribute: () => { delete source.src; },
  };
  const video = {
    loads: 0, plays: 0, pauses: 0,
    querySelector: () => source,
    load() { this.loads++; },
    play() { this.plays++; return Promise.reject(new Error('Autoplay blocked')); },
    pause() { this.pauses++; },
  };
  const motion = { matches, addEventListener: (_, fn) => { events.motion = fn; } };
  const document = {
    hidden, querySelectorAll: () => [video],
    addEventListener: (name, fn) => { events[name] = fn; },
  };
  runInNewContext(script, { document, matchMedia: () => motion });
  events.DOMContentLoaded();
  return { document, events, motion, source, video };
}

test('no video request on mobile, reduced motion, or a hidden tab', () => {
  for (const [matches, hidden] of [[false, false], [true, true]]) {
    const { source, video } = browser(matches, hidden);
    assert.equal(source.src, undefined);
    assert.equal(video.loads, 0);
    assert.equal(video.plays, 0);
  }
});

test('desktop loads once; hiding releases the source and returning restores it', () => {
  const { document, events, source, video } = browser(true);
  assert.equal(source.src, '/video/banner.mp4');
  events.visibilitychange();
  assert.equal(video.loads, 1);
  document.hidden = true;
  events.visibilitychange();
  assert.equal(source.src, undefined);
  document.hidden = false;
  events.visibilitychange();
  assert.equal(source.src, '/video/banner.mp4');
  assert.equal(video.loads, 3);
});

test('changing screen or motion preference stops and restores playback', () => {
  const { events, motion, source, video } = browser(false);
  motion.matches = true;
  events.motion();
  assert.equal(video.plays, 1);
  motion.matches = false;
  events.motion();
  assert.equal(source.src, undefined);
});
