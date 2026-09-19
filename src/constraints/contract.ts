export interface ConstraintContract {
  version: number;
  accessibility: {
    minimumContrast: number;
    maxSelectedViolations: number;
  };
  brand: {
    protectedPrimaryColor: string;
    protectedPrimaryRgb: string;
  };
  responsive: {
    viewportWidth: number;
    allowHorizontalOverflow: boolean;
  };
  autonomy: {
    lowRiskRepair: 'auto';
    protectedConstraintChange: 'ask';
    ambiguousTradeoff: 'ask';
  };
}

export const DEFAULT_CONSTRAINT_CONTRACT: ConstraintContract = {
  version: 1,
  accessibility: {
    minimumContrast: 4.5,
    maxSelectedViolations: 0,
  },
  brand: {
    protectedPrimaryColor: '#60A5FA',
    protectedPrimaryRgb: 'rgb(96, 165, 250)',
  },
  responsive: {
    viewportWidth: 375,
    allowHorizontalOverflow: false,
  },
  autonomy: {
    lowRiskRepair: 'auto',
    protectedConstraintChange: 'ask',
    ambiguousTradeoff: 'ask',
  },
};

export function cloneConstraintContract(contract: ConstraintContract): ConstraintContract {
  return {
    version: contract.version,
    accessibility: { ...contract.accessibility },
    brand: { ...contract.brand },
    responsive: { ...contract.responsive },
    autonomy: { ...contract.autonomy },
  };
}
