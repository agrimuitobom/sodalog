"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getUserRecords } from "@/lib/records";
import { GrowthRecord } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Camera } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type CompareMode = "timeline" | "individual";

export default function ComparePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [mode, setMode] = useState<CompareMode>("timeline");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());

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

  const crops = useMemo(() => {
    const set = new Set(records.map((r) => r.crop));
    return Array.from(set);
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!selectedCrop) return records;
    return records.filter((r) => r.crop === selectedCrop);
  }, [records, selectedCrop]);

  const comparedRecords = useMemo(() => {
    if (mode === "timeline") {
      return filteredRecords.slice().sort(
        (a, b) =>
          (a.createdAt?.toDate?.()?.getTime() ?? 0) -
          (b.createdAt?.toDate?.()?.getTime() ?? 0)
      );
    }
    return records.filter((r) => selectedRecords.has(r.id || ""));
  }, [mode, filteredRecords, records, selectedRecords]);

  const toggleRecord = (id: string) => {
    const next = new Set(selectedRecords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRecords(next);
  };

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">比較表示</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode("timeline")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "timeline" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"
            }`}
          >
            時系列比較
          </button>
          <button
            onClick={() => setMode("individual")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "individual" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"
            }`}
          >
            個体比較
          </button>
        </div>

        {mode === "timeline" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">作物でフィルター</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">すべて</option>
              {crops.map((crop) => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>
        )}

        {mode === "individual" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              比較する記録を選択（{selectedRecords.size}件選択中）
            </label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {records.map((r) => (
                <label key={r.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRecords.has(r.id || "")}
                    onChange={() => toggleRecord(r.id || "")}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 truncate">
                    {r.crop} - {format(r.createdAt?.toDate?.() ?? new Date(), "M/d", { locale: ja })}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {loadingRecords ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
          </div>
        ) : comparedRecords.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            {mode === "individual" ? "記録を選択してください" : "該当する記録がありません"}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {comparedRecords.map((record) => {
              const date = record.createdAt?.toDate?.() ?? new Date();
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/records/${record.id}`)}
                >
                  {record.imageThumbnail || record.imageUrl ? (
                    <img
                      src={record.imageThumbnail || record.imageUrl}
                      alt={record.crop}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 truncate">{record.crop}</p>
                    <p className="text-xs text-gray-500">
                      {format(date, "M/d HH:mm", { locale: ja })}
                    </p>
                    {record.colorAnalysis && (
                      <div className="flex items-center gap-1 mt-1">
                        <div
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{
                            backgroundColor: `rgb(${record.colorAnalysis.r},${record.colorAnalysis.g},${record.colorAnalysis.b})`,
                          }}
                        />
                        <span className="text-xs text-green-600">
                          {record.colorAnalysis.greenRatio}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
