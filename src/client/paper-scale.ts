export const PAPER_DEFAULT_MEDIA = '(min-width: 1240px)';

export const PAPER_ZOOM_STEPS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2,
] as const;

export type PaperZoomDirection = 'in' | 'out';

export function fitPaperScale(
  availableWidth: number,
  paperWidth: number,
): number {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(paperWidth))
    return 1;
  if (availableWidth <= 0 || paperWidth <= 0) return 1;
  return Math.min(1, availableWidth / paperWidth);
}

export function stepPaperScale(
  currentScale: number,
  direction: PaperZoomDirection,
): number {
  if (direction === 'in') {
    const nextScale = PAPER_ZOOM_STEPS.find((scale) => scale > currentScale);
    return nextScale ?? Math.max(currentScale, PAPER_ZOOM_STEPS.at(-1) ?? 1);
  }

  const nextScale = [...PAPER_ZOOM_STEPS]
    .reverse()
    .find((scale) => scale < currentScale);
  return nextScale ?? Math.min(currentScale, PAPER_ZOOM_STEPS[0]);
}
