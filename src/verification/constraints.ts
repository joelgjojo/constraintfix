import type { VerificationResult } from "@/agent/types";
import { runAxeAudit } from "@/verification/accessibility";
import { getContrastRatio } from "@/verification/contrast";
import { hasNoHorizontalOverflow } from "@/verification/layout";

export const PROTECTED_BRAND_COLOR = "rgb(96, 165, 250)";

export async function verifyInterface(
  root: HTMLElement,
  card: HTMLElement,
  cta: HTMLElement,
): Promise<VerificationResult> {
  const axeViolations = await runAxeAudit(root);
  const style = window.getComputedStyle(cta);
  const brandColor = style.backgroundColor;
  const contrastRatio = getContrastRatio(style.color, style.backgroundColor);
  const contrastPass = contrastRatio >= 4.5;
  const accessibilityPass = axeViolations.length === 0 && contrastPass;
  const brandPass = brandColor === PROTECTED_BRAND_COLOR;
  const layoutPass = hasNoHorizontalOverflow(root, card);

  return {
    accessibilityPass,
    axeViolations,
    contrastRatio,
    contrastPass,
    brandPass,
    layoutPass,
    brandColor,
  };
}
