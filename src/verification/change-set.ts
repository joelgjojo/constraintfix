import { runAxeAudit } from './accessibility';
import { getContrastRatio } from './contrast';
import { hasNoHorizontalOverflow } from './layout';
import type { ConstraintContract } from '@/constraints/contract';
import { evaluatePolicyMeasurements } from './policy';
import { aggregateVerification, files, type FixtureVerification } from '@/transactions/change-set';

/** Sequential axe runs avoid axe's global concurrent-run restriction. */
export async function verifyChangeSet(root: HTMLElement, contract: ConstraintContract) {
  const results: FixtureVerification[] = [];
  for (const file of files) {
    const surface = root.querySelector<HTMLElement>(`[data-verifier="${file.id}"]`);
    const content = surface?.querySelector<HTMLElement>('[data-fixture-content]');
    const cta = surface?.querySelector<HTMLElement>('[data-contract-cta]');
    if (!surface || !content || !cta) throw new Error(`Missing rendered fixture: ${file.name}`);
    const width = surface.getBoundingClientRect().width;
    const axeViolations = await runAxeAudit(surface);
    const style = getComputedStyle(cta);
    const ratio = getContrastRatio(style.color, style.backgroundColor);
    const policy = evaluatePolicyMeasurements({
      contrastRatio: ratio,
      selectedViolationCount: axeViolations.length,
      brandColor: style.backgroundColor,
      viewportWidth: width,
      horizontalOverflow: !hasNoHorizontalOverflow(surface, content),
    }, contract);
    results.push({ fixture: file.id, width, scrollWidth: surface.scrollWidth, axeViolations,
      semanticsPass: policy.semanticsPass, accessibilityPass: policy.accessibilityPass,
      contrastPass: policy.contrastPass, contrastRatio: ratio,
      brandColor: style.backgroundColor, brandPass: policy.brandPass,
      layoutPass: policy.layoutPass,
    });
  }
  return aggregateVerification(results);
}
