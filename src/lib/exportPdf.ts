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

// Japanese font cache
let fontCache: string | null = null;

async function loadJapaneseFont(doc: InstanceType<typeof import("jspdf").jsPDF>): Promise<boolean> {
  if (!fontCache) {
    // Try loading a Japanese TTF font
    const urls = [
      "/fonts/NotoSansJP-Regular.ttf",
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(
            null,
            Array.from(bytes.subarray(i, i + chunkSize))
          );
        }
        fontCache = btoa(binary);
        break;
      } catch {
        continue;
      }
    }
  }

  if (fontCache) {
    doc.addFileToVFS("NotoSansJP-Regular.ttf", fontCache);
    doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
    doc.setFont("NotoSansJP");
    return true;
  }
  return false;
}

export async function exportRecordsToPdf(records: GrowthRecord[], title: string) {
  // Dynamic imports to avoid Next.js bundling issues with jspdf-autotable
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default ?? autoTableModule.autoTable;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Try loading Japanese font
  const hasJapaneseFont = await loadJapaneseFont(doc);

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  doc.setFontSize(10);
  doc.text(
    `${format(new Date(), "yyyy/MM/dd HH:mm", { locale: ja })}  |  ${records.length} 件`,
    14,
    22
  );

  const headers = hasJapaneseFont
    ? ["日付", "作物", "品種", "圃場", "メモ", "作業", "緑%"]
    : ["Date", "Crop", "Variety", "Plot", "Memo", "Actions", "Green%"];

  const rows = records.map((r) => {
    const date = r.createdAt?.toDate?.() ?? new Date();
    return [
      format(date, "MM/dd HH:mm"),
      r.crop,
      r.variety || "",
      r.plotId || "",
      r.memo.length > 30 ? r.memo.substring(0, 30) + "..." : r.memo,
      formatActions(r),
      r.colorAnalysis?.greenRatio?.toString() ?? "-",
    ];
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      ...(hasJapaneseFont ? { font: "NotoSansJP" } : {}),
    },
    headStyles: { fillColor: [22, 163, 74] },
    alternateRowStyles: { fillColor: [245, 250, 245] },
    columnStyles: {
      0: { cellWidth: 25 },
      4: { cellWidth: 45 },
      5: { cellWidth: 50 },
    },
  });

  // Use Blob download for better mobile compatibility
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
