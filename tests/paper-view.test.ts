import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountPaperView } from '../src/client/paper-view';

let dispose = () => {};
let resize = () => {};
let frame = () => {};
let wide = false;
const disconnect = vi.fn();
const print = vi.fn();

function element(id: string): HTMLElement {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing fixture element ${id}`);
  return result;
}
function click(id: string) {
  element(id).click();
}
function paperMode() {
  return document.body.classList.contains('paper-mode');
}

beforeEach(() => {
  wide = false;
  history.replaceState({ navigation: 'preserved' }, '', '/?keep=yes#section');
  document.documentElement.className = 'paper-pending';
  document.body.innerHTML = `
    <header id="site-header"><a href="/">Home</a></header>
    <main id="main">
      <button id="paper-view-toggle">Paper view</button>
      <div id="content"><button id="counter">Counter</button><input id="input" /></div>
    </main>
    <aside id="already-inert" inert></aside>
    <section id="paper-viewer" hidden data-content-id="content" data-default-view="paper" data-header-selector="#site-header">
      <div class="paper-viewer__toolbar">
        <button id="paper-exit">Web view</button>
        <button id="paper-zoom-out">Out</button><output id="paper-zoom-level"></output>
        <button id="paper-zoom-in">In</button><button id="paper-print">Print</button>
      </div>
      <div class="paper-viewer__scroll" style="padding: 16px">
        <div id="paper-sheet" style="width: 816px"><div id="paper-doc"></div></div>
      </div>
    </section>`;
  const scroll = document.querySelector('.paper-viewer__scroll');
  Object.defineProperty(scroll, 'clientWidth', {
    value: 392,
    configurable: true,
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: wide })),
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: () => void) => {
      frame = callback;
      return 17;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('print', print);
});

afterEach(() => {
  dispose();
  document.head.querySelectorAll('style').forEach((style) => style.remove());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  disconnect.mockClear();
  print.mockClear();
});

describe('paper view', () => {
  it('keeps the web view on small screens and clears the loading marker', () => {
    dispose = mountPaperView(document);
    expect(paperMode()).toBe(false);
    expect(document.documentElement.classList.contains('paper-pending')).toBe(
      false,
    );
  });

  it('moves one live content node and preserves state across repeated switches', () => {
    dispose = mountPaperView(document);
    const content = element('content');
    const callback = vi.fn();
    element('counter').addEventListener('click', callback);
    const input = document.querySelector<HTMLInputElement>('#input');
    if (input) input.value = 'Keep this';
    for (let i = 0; i < 2; i++) {
      element('paper-view-toggle').focus();
      click('paper-view-toggle');
      expect(paperMode()).toBe(true);
      expect(element('paper-doc').firstElementChild).toBe(content);
      expect(element('paper-viewer').firstElementChild).toBe(
        element('site-header'),
      );
      expect(document.activeElement).toBe(element('paper-exit'));
      expect(element('main').inert).toBe(true);
      expect(element('content').classList.contains('paper-content')).toBe(true);
      click('counter');
      expect(location.search).toBe('?keep=yes&view=paper');
      expect(location.hash).toBe('#section');
      expect(history.state).toEqual({ navigation: 'preserved' });
      click('paper-exit');
      expect(paperMode()).toBe(false);
      expect(element('main').contains(content)).toBe(true);
      expect(element('site-header').parentElement).toBe(document.body);
      expect(element('site-header').hasAttribute('data-paper-header')).toBe(
        false,
      );
      expect(element('main').inert).toBe(false);
      expect(element('already-inert').inert).toBe(true);
      expect(document.activeElement).toBe(element('paper-view-toggle'));
      expect(input?.value).toBe('Keep this');
      expect(location.search).toBe('?keep=yes&view=web');
      expect(document.head.textContent).not.toContain('@page');
    }
    expect(callback).toHaveBeenCalledTimes(2);
    expect(document.querySelectorAll('#content')).toHaveLength(1);
  });

  it('honors explicit paper on mobile and explicit web on desktop', () => {
    history.replaceState(null, '', '/?view=paper');
    dispose = mountPaperView(document);
    expect(paperMode()).toBe(true);
    dispose();
    wide = true;
    history.replaceState(null, '', '/?view=web');
    dispose = mountPaperView(document);
    expect(paperMode()).toBe(false);
  });

  it('uses the desktop default but respects pages without that default', () => {
    wide = true;
    dispose = mountPaperView(document);
    expect(paperMode()).toBe(true);
    dispose();
    history.replaceState(null, '', '/');
    element('paper-viewer').dataset.defaultView = 'web';
    dispose = mountPaperView(document);
    expect(paperMode()).toBe(false);
  });

  it('fits the page then keeps manually selected zoom across resize', () => {
    dispose = mountPaperView(document);
    click('paper-view-toggle');
    expect(element('paper-zoom-level').textContent).toBe('44%');
    resize();
    frame();
    click('paper-zoom-in');
    expect(element('paper-zoom-level').textContent).toBe('50%');
    resize();
    frame();
    expect(element('paper-zoom-level').textContent).toBe('50%');
    click('paper-zoom-out');
    expect(element('paper-zoom-level').textContent).toBe('33%');
    for (let i = 0; i < 15; i++) click('paper-zoom-in');
    expect(element('paper-zoom-in').hasAttribute('disabled')).toBe(true);
    for (let i = 0; i < 15; i++) click('paper-zoom-out');
    expect(element('paper-zoom-out').hasAttribute('disabled')).toBe(true);
  });

  it('fits resized content on the next frame without a ResizeObserver feedback loop', () => {
    dispose = mountPaperView(document);
    click('paper-view-toggle');
    Object.defineProperty(
      document.querySelector('.paper-viewer__scroll'),
      'clientWidth',
      { value: 600 },
    );
    resize();
    resize();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
    expect(element('paper-zoom-level').textContent).toBe('44%');
    frame();
    expect(element('paper-zoom-level').textContent).toBe('70%');
    click('paper-exit');
    resize();
    frame();
    expect(paperMode()).toBe(false);
    dispose();
    expect(cancelAnimationFrame).toHaveBeenLastCalledWith(17);
    dispose = () => {};
  });

  it('prints only while paper view is active and closes with Escape', () => {
    dispose = mountPaperView(document);
    click('paper-view-toggle');
    expect(document.head.textContent).toContain('@page');
    click('paper-print');
    expect(print).toHaveBeenCalledOnce();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(paperMode()).toBe(false);
    expect(location.search).toContain('view=web');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(paperMode()).toBe(false);
  });

  it('restores the page and removes listeners on navigation cleanup', () => {
    dispose = mountPaperView(document);
    click('paper-view-toggle');
    dispose();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(paperMode()).toBe(false);
    expect(element('main').contains(element('content'))).toBe(true);
    click('paper-view-toggle');
    expect(paperMode()).toBe(false);
    dispose = () => {};
  });

  it('works without a host header or optional controls', () => {
    delete element('paper-viewer').dataset.headerSelector;
    element('paper-zoom-level').remove();
    element('paper-print').remove();
    dispose = mountPaperView(document);
    click('paper-view-toggle');
    click('paper-view-toggle');
    expect(paperMode()).toBe(true);
    click('paper-exit');
    expect(paperMode()).toBe(false);
  });

  it.each(['paper-viewer', 'content', 'paper-doc', 'paper-sheet'])(
    'fails open without %s',
    (id) => {
      element(id).remove();
      dispose = mountPaperView(document);
      expect(paperMode()).toBe(false);
      expect(document.documentElement.classList.contains('paper-pending')).toBe(
        false,
      );
    },
  );
});
