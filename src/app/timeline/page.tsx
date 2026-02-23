"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  getUserRecordsPaginated,
  getUserFilterOptions,
  PaginatedResult,
  RecordFilters,
} from "@/lib/records";
import { GrowthRecord, GrowthPhase, GROWTH_PHASES } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import RecordCard from "@/components/RecordCard";
import { RecordListSkeleton } from "@/components/Skeleton";
import { Clock, Loader2, Search, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export default function TimelinePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedPlot, setSelectedPlot] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<GrowthPhase | "">("");
  const [crops, setCrops] = useState<string[]>([]);
  const [plots, setPlots] = useState<string[]>([]);

  const activeFilters: RecordFilters = useMemo(() => {
    const f: RecordFilters = {};
    if (selectedCrop) f.crop = selectedCrop;
    if (selectedPlot) f.plotId = selectedPlot;
    return f;
  }, [selectedCrop, selectedPlot]);

  const activeFilterCount =
    (selectedCrop ? 1 : 0) + (selectedPlot ? 1 : 0) + (searchText ? 1 : 0) + (selectedPhase ? 1 : 0);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  // Load filter options
  useEffect(() => {
    if (user) {
      getUserFilterOptions(user.uid).then(({ crops: c, plots: p }) => {
        setCrops(c);
        setPlots(p);
      });
    }
  }, [user]);

  // Load records (reset when filters change)
  useEffect(() => {
    if (!user) return;
    setLoadingRecords(true);
    cursorRef.current = null;
    getUserRecordsPaginated(user.uid, null, activeFilters).then(
      (result: PaginatedResult) => {
        setRecords(result.records);
        cursorRef.current = result.lastDoc;
        setHasMore(result.hasMore);
        setLoadingRecords(false);
      }
    );
  }, [user, activeFilters]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await getUserRecordsPaginated(
        user.uid,
        cursorRef.current,
        activeFilters
      );
      setRecords((prev) => [...prev, ...result.records]);
      cursorRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [user, loadingMore, hasMore, activeFilters]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            loadMore();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, loadMore]
  );

  // Client-side text search + phase filter
  const filteredRecords = useMemo(() => {
    let result = records;
    if (selectedPhase) {
      result = result.filter((r) => r.growthPhase === selectedPhase);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (r) =>
          r.crop.toLowerCase().includes(q) ||
          (r.variety && r.variety.toLowerCase().includes(q)) ||
          (r.memo && r.memo.toLowerCase().includes(q)) ||
          (r.plotId && r.plotId.toLowerCase().includes(q))
      );
    }
    return result;
  }, [records, searchText, selectedPhase]);

  const groupedRecords = filteredRecords.reduce<Record<string, GrowthRecord[]>>(
    (acc, record) => {
      const date = record.createdAt?.toDate?.() ?? new Date();
      const key = format(date, "yyyy-MM-dd");
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    },
    {}
  );

  const clearFilters = () => {
    setSelectedCrop("");
    setSelectedPlot("");
    setSelectedPhase("");
    setSearchText("");
  };

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6" />
          <h1 className="text-lg font-bold">タイムライン</h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded-lg transition-colors relative ${
            showFilters ? "bg-green-700" : "hover:bg-green-700"
          }`}
        >
          <Filter className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </header>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
          {/* Text search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="作物名・メモ・圃場で検索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
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
                  <option key={c} value={c}>
                    {c}
                  </option>
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
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">生育フェーズ</label>
            <div className="flex flex-wrap gap-1">
              {GROWTH_PHASES.map((phase) => (
                <button
                  key={phase.value}
                  type="button"
                  onClick={() => setSelectedPhase(selectedPhase === phase.value ? "" : phase.value)}
                  className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                    selectedPhase === phase.value
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {phase.emoji} {phase.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              フィルターをクリア
            </button>
          )}
        </div>
      )}

      <div className="p-4">
        {loadingRecords ? (
          <RecordListSkeleton count={4} />
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            {activeFilterCount > 0 ? (
              <>
                <p className="text-gray-500">条件に一致する記録がありません</p>
                <button
                  onClick={clearFilters}
                  className="mt-3 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium"
                >
                  フィルターをクリア
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500">まだ記録がありません</p>
                <button
                  onClick={() => router.push("/new")}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  最初の記録を作成
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRecords).map(([dateKey, dayRecords]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-bold text-gray-600 mb-2 sticky top-0 bg-gray-50 py-1">
                  {format(new Date(dateKey), "yyyy年M月d日(E)", { locale: ja })}
                </h3>
                <div className="space-y-2">
                  {dayRecords.map((record) => (
                    <RecordCard key={record.id} record={record} />
                  ))}
                </div>
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              </div>
            )}

            {!hasMore && filteredRecords.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-2">
                すべての記録を表示しました
              </p>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
