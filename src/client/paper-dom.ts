export function moveElement(
  element: HTMLElement,
  parent: HTMLElement,
): () => void {
  const marker = element.ownerDocument.createComment('paper-view position');
  element.before(marker);
  parent.append(element);
  return () => {
    marker.replaceWith(element);
  };
}

export function inertSiblings(viewer: HTMLElement): () => void {
  const previous = new Map<HTMLElement, boolean>();
  for (const sibling of viewer.parentElement?.children ?? []) {
    if (!(sibling instanceof HTMLElement) || sibling === viewer) continue;
    previous.set(sibling, sibling.inert);
    sibling.inert = true;
  }
  return () => {
    for (const [element, inert] of previous) element.inert = inert;
  };
}

export function containFocus(event: KeyboardEvent, viewer: HTMLElement): void {
  if (event.key !== 'Tab') return;
  const candidates = viewer.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
  );
  const elements = [...candidates].filter((element) =>
    element.checkVisibility(),
  );
  const first = elements[0];
  const last = elements.at(-1);
  const active = viewer.ownerDocument.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first?.focus();
  }
}
