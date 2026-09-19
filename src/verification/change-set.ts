import { runAxeAudit } from './accessibility';
import { getContrastRatio } from './contrast';
import { hasNoHorizontalOverflow } from './layout';
import { PROTECTED_BRAND_COLOR } from './constraints';
import { aggregateVerification, files, type FixtureVerification } from '@/transactions/change-set';

/** Sequential axe runs avoid axe's global concurrent-run restriction. */
export async function verifyChangeSet(root: HTMLElement) {
  const results: FixtureVerification[] = [];
  for (const file of files) {
    const surface = root.querySelector<HTMLElement>(`[data-verifier="${file.id}"]`);
    const content = surface?.querySelector<HTMLElement>('[data-fixture-content]');
    const cta = surface?.querySelector<HTMLElement>('[data-contract-cta]');
    if (!surface || !content || !cta) throw new Error(`Missing rendered fixture: ${file.name}`);
    const width = surface.getBoundingClientRect().width;
    if (Math.abs(width - 375) > 1) throw new Error(`Verification surface must be exactly 375px (${file.name}: ${width}).`);
    const axeViolations = await runAxeAudit(surface);
    const style = getComputedStyle(cta);
    const ratio = getContrastRatio(style.color, style.backgroundColor);
    results.push({ fixture: file.id, width, scrollWidth: surface.scrollWidth, axeViolations,
      semanticsPass: axeViolations.length === 0, accessibilityPass: axeViolations.length === 0 && ratio >= 4.5,
      contrastPass: ratio >= 4.5, contrastRatio: ratio,
      brandColor: style.backgroundColor, brandPass: style.backgroundColor === PROTECTED_BRAND_COLOR,
      layoutPass: hasNoHorizontalOverflow(surface, content),
    });
  }
  return aggregateVerification(results);
}
