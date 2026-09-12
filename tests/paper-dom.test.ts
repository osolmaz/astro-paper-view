import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  containFocus,
  inertSiblings,
  moveElement,
} from '../src/client/paper-dom';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('paper DOM operations', () => {
  it('restores the same node at its exact sibling position', () => {
    const original = document.createElement('div');
    const before = document.createElement('p');
    const content = document.createElement('p');
    const after = document.createElement('p');
    original.append(before, content, after);
    const paper = document.createElement('div');
    const restore = moveElement(content, paper);
    expect(paper.firstChild).toBe(content);
    restore();
    expect([...original.childNodes]).toEqual([before, content, after]);
  });

  it('does not change a viewer with no parent', () => {
    const viewer = document.createElement('div');
    inertSiblings(viewer)();
    expect(viewer.inert).toBe(false);
  });

  it('ignores non-HTML siblings and preserves existing inert state', () => {
    const viewer = document.createElement('section');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const sibling = document.createElement('div');
    sibling.inert = true;
    document.body.append(viewer, svg, sibling);
    const restore = inertSiblings(viewer);
    expect(viewer.inert).toBe(false);
    restore();
    expect(sibling.inert).toBe(true);
    expect(svg.hasAttribute('inert')).toBe(false);
  });

  it('wraps keyboard focus at both ends while leaving ordinary keys alone', () => {
    const viewer = document.createElement('section');
    const first = document.createElement('button');
    const middle = document.createElement('button');
    const last = document.createElement('button');
    viewer.append(first, middle, last);
    document.body.append(viewer);
    for (const button of [first, middle, last])
      vi.spyOn(button, 'checkVisibility').mockReturnValue(true);
    first.focus();
    const previous = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });
    containFocus(previous, viewer);
    expect(document.activeElement).toBe(last);
    expect(previous.defaultPrevented).toBe(true);
    const next = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    containFocus(next, viewer);
    expect(document.activeElement).toBe(first);
    middle.focus();
    containFocus(new KeyboardEvent('keydown', { key: 'Tab' }), viewer);
    containFocus(new KeyboardEvent('keydown', { key: 'ArrowDown' }), viewer);
    expect(document.activeElement).toBe(middle);
    containFocus(
      new KeyboardEvent('keydown', { key: 'Tab' }),
      document.createElement('div'),
    );
    vi.restoreAllMocks();
  });
});
