export function hasNoHorizontalOverflow(root: HTMLElement, target: HTMLElement) {
  const rootFits = root.scrollWidth <= root.clientWidth + 1;
  const targetFits = target.scrollWidth <= target.clientWidth + 1;
  const rootRect = root.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const contained = targetRect.left >= rootRect.left - 1 && targetRect.right <= rootRect.right + 1;

  return rootFits && targetFits && contained;
}
