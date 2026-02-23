"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getUserRecords } from "@/lib/records";
import { GrowthRecord } from "@/types/record";
import { exportRecordsToCsv, downloadCsv } from "@/lib/exportCsv";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/contexts/ToastContext";
import {
  ArrowLeft,
  FileSpreadsheet,
  Filter,
  Download,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type DateRange = "all" | "month" | "week";

export default function ExportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Filters
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedPlot, setSelectedPlot] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");

  // Export state
  const [exported, setExported] = useState<"csv" | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserRecords(user.uid).then((recs) => {
        setRecords(recs);
        setLoadingRecords(false);
      });
    }
  }, [user]);

  const crops = useMemo(
    () => Array.from(new Set(records.map((r) => r.crop))).sort(),
    [records]
  );
  const plots = useMemo(
    () => Array.from(new Set(records.filter((r) => r.plotId).map((r) => r.plotId))).sort(),
    [records]
  );

  const filteredRecords = useMemo(() => {
    let result = records;

    if (selectedCrop) {
      result = result.filter((r) => r.crop === selectedCrop);
    }
    if (selectedPlot) {
      result = result.filter((r) => r.plotId === selectedPlot);
    }

    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === "week") cutoff.setDate(now.getDate() - 7);
      if (dateRange === "month") cutoff.setMonth(now.getMonth() - 1);
      result = result.filter((r) => {
        const date = r.createdAt?.toDate?.() ?? new Date();
        return date >= cutoff;
      });
    }

    return result.sort(
      (a, b) =>
        (a.createdAt?.toDate?.()?.getTime() ?? 0) -
        (b.createdAt?.toDate?.()?.getTime() ?? 0)
    );
  }, [records, selectedCrop, selectedPlot, dateRange]);

  const handleExportCsv = () => {
    const csv = exportRecordsToCsv(filteredRecords);
    const dateStr = format(new Date(), "yyyyMMdd", { locale: ja });
    downloadCsv(csv, `sodalog_${dateStr}.csv`);
    toast("CSVをダウンロードしました");
    setExported("csv");
    setTimeout(() => setExported(null), 2000);
  };

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">データエクスポート</h1>
      </header>

      <div className="p-4 space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            フィルター
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">期間</label>
            <div className="flex gap-2">
              {([
                ["all", "すべて"],
                ["month", "直近1ヶ月"],
                ["week", "直近1週間"],
              ] as [DateRange, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setDateRange(value)}
                  className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${
                    dateRange === value
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">作物</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="">すべて</option>
                {crops.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">圃場</label>
              <select
                value={selectedPlot}
                onChange={(e) => setSelectedPlot(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="">すべて</option>
                {plots.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-green-50 rounded-lg p-3 text-center">
          {loadingRecords ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mx-auto" />
          ) : (
            <p className="text-sm text-green-700">
              <span className="font-bold text-lg">{filteredRecords.length}</span>
              <span className="ml-1">件の記録をエクスポート</span>
            </p>
          )}
        </div>

        {/* Preview */}
        {filteredRecords.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500">プレビュー（先頭5件）</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-3 py-1.5 text-gray-500">日付</th>
                    <th className="text-left px-3 py-1.5 text-gray-500">作物</th>
                    <th className="text-left px-3 py-1.5 text-gray-500">圃場</th>
                    <th className="text-left px-3 py-1.5 text-gray-500">メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.slice(0, 5).map((r) => {
                    const date = r.createdAt?.toDate?.() ?? new Date();
                    return (
                      <tr key={r.id} className="border-b border-gray-50">
                        <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">
                          {format(date, "M/d", { locale: ja })}
                        </td>
                        <td className="px-3 py-1.5 text-gray-700">{r.crop}</td>
                        <td className="px-3 py-1.5 text-gray-600">{r.plotId || "-"}</td>
                        <td className="px-3 py-1.5 text-gray-500 truncate max-w-[120px]">
                          {r.memo || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredRecords.length > 5 && (
              <p className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-50">
                他 {filteredRecords.length - 5} 件...
              </p>
            )}
          </div>
        )}

        {/* Export buttons */}
        <div className="space-y-3">
          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {exported === "csv" ? (
              <>
                <Check className="w-5 h-5" />
                ダウンロード完了
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                CSV でエクスポート
                <Download className="w-4 h-4 opacity-50" />
              </>
            )}
          </button>

        </div>

        <p className="text-xs text-gray-400 text-center">
          CSVはExcelやGoogleスプレッドシートで開けます。
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
