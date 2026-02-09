"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getUserRecords } from "@/lib/records";
import { GrowthRecord } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, MapPin, Leaf, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface PlotSummary {
  plotId: string;
  recordCount: number;
  crops: string[];
  latestRecord: Date;
}

export default function PlotsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

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

  const plots = useMemo(() => {
    const map = new Map<string, PlotSummary>();
    records.forEach((r) => {
      const plotId = r.plotId || "未設定";
      if (!map.has(plotId)) {
        map.set(plotId, {
          plotId,
          recordCount: 0,
          crops: [],
          latestRecord: new Date(0),
        });
      }
      const plot = map.get(plotId)!;
      plot.recordCount++;
      if (!plot.crops.includes(r.crop)) plot.crops.push(r.crop);
      const date = r.createdAt?.toDate?.() ?? new Date();
      if (date > plot.latestRecord) plot.latestRecord = date;
    });
    return Array.from(map.values()).sort(
      (a, b) => b.latestRecord.getTime() - a.latestRecord.getTime()
    );
  }, [records]);

  const plotRecords = useMemo(() => {
    if (!selectedPlot) return [];
    return records
      .filter((r) => (r.plotId || "未設定") === selectedPlot)
      .sort(
        (a, b) =>
          (b.createdAt?.toDate?.()?.getTime() ?? 0) -
          (a.createdAt?.toDate?.()?.getTime() ?? 0)
      );
  }, [records, selectedPlot]);

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => (selectedPlot ? setSelectedPlot(null) : router.back())}
          className="p-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">
          {selectedPlot ? selectedPlot : "圃場管理"}
        </h1>
      </header>

      <div className="p-4">
        {loadingRecords ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
          </div>
        ) : selectedPlot ? (
          <div className="space-y-4">
            {/* Plot summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-gray-900">{selectedPlot}</h2>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{plotRecords.length}件の記録</span>
                <span>
                  {Array.from(new Set(plotRecords.map((r) => r.crop))).join(", ")}
                </span>
              </div>
            </div>

            {/* Records in this plot */}
            <div className="space-y-2">
              {plotRecords.map((record) => {
                const date = record.createdAt?.toDate?.() ?? new Date();
                return (
                  <div
                    key={record.id}
                    onClick={() => router.push(`/records/${record.id}`)}
                    className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    {record.imageThumbnail || record.imageUrl ? (
                      <img
                        src={record.imageThumbnail || record.imageUrl}
                        alt={record.crop}
                        className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {record.crop}
                        {record.variety && ` (${record.variety})`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(date, "yyyy/MM/dd HH:mm", { locale: ja })}
                      </p>
                      {record.memo && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{record.memo}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : plots.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">圃場データがありません</p>
            <p className="text-gray-400 text-sm mt-1">
              記録作成時に圃場・区画を入力してください
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {plots.map((plot) => (
              <button
                key={plot.plotId}
                onClick={() => setSelectedPlot(plot.plotId)}
                className="w-full bg-white rounded-lg border border-gray-200 p-4 text-left hover:shadow-sm transition-shadow flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{plot.plotId}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                    <span>{plot.recordCount}件</span>
                    <span>{plot.crops.join(", ")}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    最終: {format(plot.latestRecord, "M/d", { locale: ja })}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
