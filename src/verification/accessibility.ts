import type { AxeResults } from "axe-core";
import type { AccessibilityIssue } from "@/agent/types";

export async function runAxeAudit(root: HTMLElement): Promise<AccessibilityIssue[]> {
  const { default: axe } = await import("axe-core");
  const result: AxeResults = await axe.run(root, {
    runOnly: {
      type: "rule",
      // The CTA's foreground/background pair is measured independently below.
      // This keeps the axe audit focused on the safe semantic repair in the fixture.
      values: ["button-name", "label"],
    },
  });

  return result.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? null,
    help: violation.help,
    nodes: violation.nodes.length,
  }));
}
