import { Download, FileCheck2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { serializeConstraintReceipt } from "@/transactions/contract";
import type { ConstraintReceipt as ConstraintReceiptData } from "@/transactions/types";

interface ConstraintReceiptProps {
  receipt: ConstraintReceiptData;
}

function sourceLabel(source: ConstraintReceiptData["source"]) {
  if (source === "codex_live") return "OpenAI live";
  if (source === "codex_replay") return "OpenAI replay";
  return source;
}

export function ConstraintReceipt({ receipt }: ConstraintReceiptProps) {
  const hasException = receipt.transactionStatus === "approved_exception";
  const [exported, setExported] = useState(false);

  const exportReceipt = () => {
    const file = new Blob([serializeConstraintReceipt(receipt)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `constraint-receipt-${receipt.runId.toLowerCase()}-${receipt.transactionId.slice(0, 8)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setExported(true);
  };

  return (
    <section className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className={hasException ? "constraint-icon text-amber-300" : "constraint-icon text-emerald-300"}>
          {hasException ? <ShieldAlert size={15} /> : <FileCheck2 size={15} />}
        </span>
        <div>
          <div className="section-kicker">CONSTRAINT RECEIPT</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-zinc-100">
            <span>{receipt.receiptId}</span>
            <span className="text-zinc-700">·</span>
            <span className={hasException ? "text-amber-300" : "text-emerald-300"}>{hasException ? "Approved exception" : "Accepted and verified"}</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {receipt.component} · source {sourceLabel(receipt.source)} · transaction {receipt.transactionId.slice(0, 8)} · {receipt.candidateHistory.length} candidates · {receipt.rollbackCount} automatic rollback · {receipt.humanIntervention.choice ? `human choice: ${receipt.humanIntervention.choice.replaceAll("_", " ")}` : "no human override"}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            Run eval · {receipt.evaluation.attempts} attempted · {receipt.evaluation.rejectedCandidates} rejected · {receipt.evaluation.rollbacks} rolled back · {receipt.evaluation.modelCalls} model call{receipt.evaluation.modelCalls === 1 ? "" : "s"} · {receipt.evaluation.liveThreadUsed ? "live thread reused" : "no live thread"} · final constraints {receipt.evaluation.finalConstraints}
          </p>
        </div>
      </div>
      <button type="button" onClick={exportReceipt} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-zinc-200 transition hover:border-sky-300/30 hover:bg-sky-300/[0.07]">
        <Download size={14} /> {exported ? "JSON exported" : "Export JSON"}
      </button>
    </section>
  );
}
