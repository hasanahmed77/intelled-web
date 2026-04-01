"use client";

import type { QuestionDiagram } from "@/lib/worksheet/types";

function VennTwoSetDiagram({
  labels,
  regions
}: {
  labels: [string, string];
  regions: {
    A_only: string;
    intersection: string;
    B_only: string;
    outside?: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-[radial-gradient(circle_at_top,rgba(255,214,10,0.08),transparent_55%),linear-gradient(180deg,rgba(10,10,10,0.96),rgba(17,17,17,0.92))] p-4">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
        <span>Venn Diagram</span>
        {regions.outside ? <span>Outside: {regions.outside}</span> : <span>&nbsp;</span>}
      </div>
      <svg viewBox="0 0 320 190" className="mx-auto w-full max-w-sm overflow-visible">
        <rect x="18" y="20" width="284" height="150" rx="20" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
        <circle cx="132" cy="95" r="56" fill="rgba(255,214,10,0.14)" stroke="rgba(255,214,10,0.85)" strokeWidth="2.5" />
        <circle cx="188" cy="95" r="56" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
        <text x="104" y="43" fill="rgba(255,214,10,0.95)" fontSize="14" fontWeight="600">{labels[0]}</text>
        <text x="208" y="43" fill="rgba(255,255,255,0.9)" fontSize="14" fontWeight="600">{labels[1]}</text>
        <text x="92" y="100" fill="white" fontSize="20" fontWeight="600">{regions.A_only}</text>
        <text x="154" y="100" fill="rgb(255 214 10)" fontSize="20" fontWeight="700">{regions.intersection}</text>
        <text x="214" y="100" fill="white" fontSize="20" fontWeight="600">{regions.B_only}</text>
      </svg>
    </div>
  );
}

function VennThreeSetDiagram({
  labels,
  regions
}: {
  labels: [string, string, string];
  regions: {
    A_only: string;
    B_only: string;
    C_only: string;
    AB?: string;
    AC?: string;
    BC?: string;
    ABC?: string;
    A_B?: string;
    A_C?: string;
    B_C?: string;
    A_B_C?: string;
    outside?: string;
  };
}) {
  const ab = regions.AB ?? regions.A_B ?? "";
  const ac = regions.AC ?? regions.A_C ?? "";
  const bc = regions.BC ?? regions.B_C ?? "";
  const abc = regions.ABC ?? regions.A_B_C ?? "";

  return (
    <div className="rounded-2xl border border-ink-700 bg-[radial-gradient(circle_at_top,rgba(255,214,10,0.08),transparent_55%),linear-gradient(180deg,rgba(10,10,10,0.96),rgba(17,17,17,0.92))] p-4">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
        <span>Venn Diagram</span>
        {regions.outside ? <span>Outside: {regions.outside}</span> : <span>&nbsp;</span>}
      </div>
      <svg viewBox="0 0 360 260" className="mx-auto w-full max-w-md overflow-visible">
        <rect x="20" y="20" width="320" height="210" rx="24" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
        <circle cx="145" cy="105" r="64" fill="rgba(255,214,10,0.14)" stroke="rgba(255,214,10,0.85)" strokeWidth="2.5" />
        <circle cx="215" cy="105" r="64" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
        <circle cx="180" cy="155" r="64" fill="rgba(255,214,10,0.08)" stroke="rgba(255,214,10,0.55)" strokeWidth="2.5" />

        <text x="110" y="45" fill="rgba(255,214,10,0.95)" fontSize="14" fontWeight="600">{labels[0]}</text>
        <text x="235" y="45" fill="rgba(255,255,255,0.92)" fontSize="14" fontWeight="600">{labels[1]}</text>
        <text x="177" y="228" textAnchor="middle" fill="rgba(255,214,10,0.92)" fontSize="14" fontWeight="600">{labels[2]}</text>

        <text x="108" y="103" fill="white" fontSize="17" fontWeight="600">{regions.A_only}</text>
        <text x="244" y="103" fill="white" fontSize="17" fontWeight="600">{regions.B_only}</text>
        <text x="180" y="196" textAnchor="middle" fill="white" fontSize="17" fontWeight="600">{regions.C_only}</text>
        <text x="180" y="86" textAnchor="middle" fill="rgb(255 214 10)" fontSize="16" fontWeight="700">{ab}</text>
        <text x="145" y="146" textAnchor="middle" fill="rgb(255 214 10)" fontSize="16" fontWeight="700">{ac}</text>
        <text x="216" y="146" textAnchor="middle" fill="rgb(255 214 10)" fontSize="16" fontWeight="700">{bc}</text>
        <text x="180" y="124" textAnchor="middle" fill="rgb(255 214 10)" fontSize="18" fontWeight="800">{abc}</text>
      </svg>
    </div>
  );
}

export function QuestionDiagramView({ diagram }: { diagram: QuestionDiagram }) {
  if (diagram.type === "venn2") {
    const labels = [
      diagram.data.setLabels[0] ?? "A",
      diagram.data.setLabels[1] ?? "B"
    ] as [string, string];

    return <VennTwoSetDiagram labels={labels} regions={diagram.data.regions} />;
  }

  if (diagram.type === "venn3") {
    const labels = [
      diagram.data.setLabels[0] ?? "A",
      diagram.data.setLabels[1] ?? "B",
      diagram.data.setLabels[2] ?? "C"
    ] as [string, string, string];

    return <VennThreeSetDiagram labels={labels} regions={diagram.data.regions} />;
  }

  return null;
}
