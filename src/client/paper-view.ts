import { containFocus, inertSiblings, moveElement } from './paper-dom';
import {
  PAPER_DEFAULT_MEDIA,
  PAPER_ZOOM_STEPS,
  fitPaperScale,
  stepPaperScale,
} from './paper-scale';

const noop = () => {};

export function mountPaperView(document: Document): () => void {
  document.documentElement.classList.remove('paper-pending');
  const viewer = document.getElementById('paper-viewer');
  if (!viewer) return noop;
  const content = document.getElementById(viewer.dataset.contentId ?? '');
  if (!content) return noop;
  const paper = viewer.querySelector<HTMLElement>('#paper-doc');
  const sheet = viewer.querySelector<HTMLElement>('#paper-sheet');
  const scroll = viewer.querySelector<HTMLElement>('.paper-viewer__scroll');
  if (!paper || !sheet || !scroll) return noop;
  return connectViewer(document, { viewer, content, paper, sheet, scroll });
}

interface Elements {
  viewer: HTMLElement;
  content: HTMLElement;
  paper: HTMLElement;
  sheet: HTMLElement;
  scroll: HTMLElement;
}

function openRequestedView(viewer: HTMLElement, enter: () => void): void {
  const requested = new URLSearchParams(window.location.search).get('view');
  const defaultPaper =
    viewer.dataset.defaultView === 'paper' &&
    matchMedia(PAPER_DEFAULT_MEDIA).matches;
  if (requested === 'paper' || (requested !== 'web' && defaultPaper)) enter();
}

function connectViewer(document: Document, elements: Elements): () => void {
  const { viewer, content, paper, sheet, scroll } = elements;
  const events = new AbortController();
  const options = { signal: events.signal };
  const restoreViewer = moveElement(viewer, document.body);
  const printStyle = document.createElement('style');
  printStyle.textContent = '@page { margin: 25mm 22mm; }';
  const header = viewer.dataset.headerSelector
    ? document.querySelector<HTMLElement>(viewer.dataset.headerSelector)
    : null;
  const exitButton = viewer.querySelector<HTMLButtonElement>('#paper-exit');
  const zoomIn = viewer.querySelector<HTMLButtonElement>('#paper-zoom-in');
  const zoomOut = viewer.querySelector<HTMLButtonElement>('#paper-zoom-out');
  const zoomLabel =
    viewer.querySelector<HTMLOutputElement>('#paper-zoom-level');
  let restoreContent = noop;
  let restoreHeader = noop;
  let restoreInert = noop;
  let previousFocus: HTMLElement | null = null;
  let selectedScale: number | null = null;
  let appliedScale = 1;

  function updateUrl(mode: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('view', mode);
    history.replaceState(history.state, '', url);
  }

  function applyScale() {
    const style = getComputedStyle(scroll);
    const padding =
      Number.parseFloat(style.paddingLeft) +
      Number.parseFloat(style.paddingRight);
    const available = Math.max(0, scroll.clientWidth - padding);
    const width = Number.parseFloat(getComputedStyle(sheet).width);
    appliedScale = selectedScale ?? fitPaperScale(available, width);
    sheet.style.setProperty('--paper-scale', String(appliedScale));
    if (zoomLabel) zoomLabel.textContent = `${Math.round(appliedScale * 100)}%`;
    if (zoomIn)
      zoomIn.disabled =
        appliedScale >= PAPER_ZOOM_STEPS[PAPER_ZOOM_STEPS.length - 1]!;
    if (zoomOut) zoomOut.disabled = appliedScale <= PAPER_ZOOM_STEPS[0];
  }

  function enter() {
    if (!viewer.hidden) return;
    previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    restoreContent = moveElement(content, paper);
    content.classList.add('paper-content');
    if (header) {
      restoreHeader = moveElement(header, viewer);
      viewer.prepend(header);
      header.setAttribute('data-paper-header', '');
    }
    restoreInert = inertSiblings(viewer);
    viewer.hidden = false;
    document.body.classList.add('paper-mode');
    document.head.append(printStyle);
    applyScale();
    exitButton?.focus({ preventScroll: true });
    updateUrl('paper');
  }

  function leave() {
    if (viewer.hidden) return;
    restoreContent();
    restoreHeader();
    header?.removeAttribute('data-paper-header');
    content.classList.remove('paper-content');
    restoreInert();
    viewer.hidden = true;
    document.body.classList.remove('paper-mode');
    printStyle.remove();
    previousFocus?.focus({ preventScroll: true });
  }

  function zoom(direction: 'in' | 'out') {
    selectedScale = stepPaperScale(appliedScale, direction);
    applyScale();
  }

  let resizeFrame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (selectedScale === null && !viewer.hidden) applyScale();
    });
  });
  observer.observe(scroll);
  zoomIn?.addEventListener('click', () => zoom('in'), options);
  zoomOut?.addEventListener('click', () => zoom('out'), options);
  document
    .getElementById('paper-view-toggle')
    ?.addEventListener('click', enter, options);
  exitButton?.addEventListener(
    'click',
    () => {
      leave();
      updateUrl('web');
    },
    options,
  );
  viewer
    .querySelector('#paper-print')
    ?.addEventListener('click', () => window.print(), options);
  document.addEventListener(
    'keydown',
    (event) => {
      if (viewer.hidden) return;
      if (event.key === 'Escape') {
        leave();
        updateUrl('web');
      } else containFocus(event, viewer);
    },
    options,
  );

  openRequestedView(viewer, enter);

  return () => {
    leave();
    observer.disconnect();
    cancelAnimationFrame(resizeFrame);
    events.abort();
    restoreViewer();
  };
}
