import type { ConstraintContract } from '@/constraints/contract';

export interface PolicyMeasurements {
  contrastRatio: number;
  selectedViolationCount: number;
  brandColor: string;
  viewportWidth: number;
  horizontalOverflow: boolean;
}

export interface PolicyEvaluation {
  semanticsPass: boolean;
  contrastPass: boolean;
  accessibilityPass: boolean;
  brandPass: boolean;
  viewportPass: boolean;
  overflowPass: boolean;
  layoutPass: boolean;
}

/** Pure policy comparison: browser measurement happens before this boundary. */
export function evaluatePolicyMeasurements(
  measurements: PolicyMeasurements,
  contract: ConstraintContract,
): PolicyEvaluation {
  const semanticsPass = measurements.selectedViolationCount <= contract.accessibility.maxSelectedViolations;
  const contrastPass = measurements.contrastRatio >= contract.accessibility.minimumContrast;
  const viewportPass = Math.abs(measurements.viewportWidth - contract.responsive.viewportWidth) <= 1;
  const overflowPass = contract.responsive.allowHorizontalOverflow || !measurements.horizontalOverflow;

  return {
    semanticsPass,
    contrastPass,
    accessibilityPass: semanticsPass && contrastPass,
    brandPass: measurements.brandColor === contract.brand.protectedPrimaryRgb,
    viewportPass,
    overflowPass,
    layoutPass: viewportPass && overflowPass,
  };
}
