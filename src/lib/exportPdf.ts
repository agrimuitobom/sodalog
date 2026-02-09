import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { GrowthRecord, FertilizerDetail } from "@/types/record";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const actionTypeLabels: Record<string, string> = {
  fertilizer: "施肥",
  pruning: "剪定",
  watering: "灌水",
  other: "その他",
};

function formatActions(record: GrowthRecord): string {
  return record.actions
    .map((a) => {
      const label = actionTypeLabels[a.type] || a.type;
      if (a.type === "fertilizer") {
        const d = a.detail as FertilizerDetail;
        return `${label}: ${d.name} ${d.amount}${d.unit}`;
      }
      if (a.type === "pruning") return `${label}: ${(a.detail as { method: string }).method}`;
      if (a.type === "watering") return `${label}: ${(a.detail as { amount: string }).amount}`;
      return `${label}: ${(a.detail as { description: string }).description}`;
    })
    .join("; ");
}

// Extend jsPDF type for autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

export function exportRecordsToPdf(records: GrowthRecord[], title: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  doc.setFontSize(10);
  doc.text(
    `Export: ${format(new Date(), "yyyy/MM/dd HH:mm", { locale: ja })}  |  ${records.length} records`,
    14,
    22
  );

  // Table data
  const headers = [
    "Date",
    "Crop",
    "Variety",
    "Plot",
    "Memo",
    "Actions",
    "Green%",
  ];

  const rows = records.map((r) => {
    const date = r.createdAt?.toDate?.() ?? new Date();
    return [
      format(date, "MM/dd HH:mm"),
      r.crop,
      r.variety,
      r.plotId,
      r.memo.length > 30 ? r.memo.substring(0, 30) + "..." : r.memo,
      formatActions(r),
      r.colorAnalysis?.greenRatio?.toString() ?? "-",
    ];
  });

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [22, 163, 74] },
    alternateRowStyles: { fillColor: [245, 250, 245] },
    columnStyles: {
      0: { cellWidth: 25 },
      4: { cellWidth: 45 },
      5: { cellWidth: 50 },
    },
  });

  doc.save(`${title}.pdf`);
}
