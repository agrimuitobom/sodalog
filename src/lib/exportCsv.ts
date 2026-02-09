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

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportRecordsToCsv(records: GrowthRecord[]): string {
  const headers = [
    "日付",
    "作物",
    "品種",
    "圃場",
    "メモ",
    "作業内容",
    "R値",
    "G値",
    "B値",
    "緑色面積率(%)",
    "画像URL",
  ];

  const rows = records.map((r) => {
    const date = r.createdAt?.toDate?.() ?? new Date();
    return [
      format(date, "yyyy/MM/dd HH:mm", { locale: ja }),
      r.crop,
      r.variety,
      r.plotId,
      r.memo,
      formatActions(r),
      r.colorAnalysis?.r?.toString() ?? "",
      r.colorAnalysis?.g?.toString() ?? "",
      r.colorAnalysis?.b?.toString() ?? "",
      r.colorAnalysis?.greenRatio?.toString() ?? "",
      r.imageUrl,
    ].map(escapeCsvField);
  });

  // BOM for Excel compatibility with Japanese characters
  const bom = "\uFEFF";
  return bom + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
