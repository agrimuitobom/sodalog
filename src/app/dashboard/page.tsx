"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getUserRecordsByMonth } from "@/lib/records";
import { GrowthRecord } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import RecordCard from "@/components/RecordCard";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sprout, GitCompare, MapPin, CloudSun, Search, X } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ja } from "date-fns/locale";

const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Filter state
  const [filterCrop, setFilterCrop] = useState("");
  const [filterPlot, setFilterPlot] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setLoadingRecords(true);
      getUserRecordsByMonth(user.uid, currentMonth.getFullYear(), currentMonth.getMonth())
        .then((recs) => {
          setRecords(recs);
        })
        .catch((err) => {
          console.error("Failed to load records:", err);
        })
        .finally(() => {
          setLoadingRecords(false);
        });
    }
  }, [user, currentMonth]);

  // Unique crops/plots from current month records
  const crops = useMemo(
    () => Array.from(new Set(records.map((r) => r.crop))).sort(),
    [records]
  );
  const plots = useMemo(
    () => Array.from(new Set(records.filter((r) => r.plotId).map((r) => r.plotId))).sort(),
    [records]
  );

  const activeFilterCount =
    (filterCrop ? 1 : 0) + (filterPlot ? 1 : 0) + (searchText ? 1 : 0);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Filter records for calendar dots (show dots based on filters)
  const filteredRecords = useMemo(() => {
    let result = records;
    if (filterCrop) result = result.filter((r) => r.crop === filterCrop);
    if (filterPlot) result = result.filter((r) => r.plotId === filterPlot);
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
  }, [records, filterCrop, filterPlot, searchText]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, GrowthRecord[]>();
    filteredRecords.forEach((r) => {
      const date = r.createdAt?.toDate?.() ?? new Date();
      const key = format(date, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [filteredRecords]);

  const selectedRecords = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return recordsByDate.get(key) || [];
  }, [selectedDate, recordsByDate]);

  const startPadding = getDay(startOfMonth(currentMonth));

  const clearFilters = () => {
    setFilterCrop("");
    setFilterPlot("");
    setSearchText("");
  };

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <Sprout className="w-6 h-6" />
        <h1 className="text-lg font-bold">そだログ</h1>
      </header>

      <div className="p-4">
        {/* Search & filters */}
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="記録を検索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-xs bg-white"
            >
              <option value="">全作物</option>
              {crops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterPlot}
              onChange={(e) => setFilterPlot(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-xs bg-white"
            >
              <option value="">全圃場</option>
              {plots.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 -ml-2 rounded-full hover:bg-gray-100" aria-label="前の月">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 -mr-2 rounded-full hover:bg-gray-100" aria-label="次の月">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-4">
          {dayLabels.map((label) => (
            <div key={label} className="text-center text-xs font-medium text-gray-500 py-1">
              {label}
            </div>
          ))}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const hasRecords = recordsByDate.has(key);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[44px] flex flex-col items-center justify-center rounded-lg text-sm relative ${
                  isSelected
                    ? "bg-green-600 text-white"
                    : isToday
                    ? "bg-green-50 text-green-700 font-bold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {format(day, "d")}
                {hasRecords && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${
                      isSelected ? "bg-white" : "bg-green-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick access */}
        <div className="flex gap-2 mb-4">
          <Link
            href="/compare"
            className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <GitCompare className="w-4 h-4 text-green-600" />
            比較
          </Link>
          <Link
            href="/plots"
            className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <MapPin className="w-4 h-4 text-green-600" />
            圃場
          </Link>
          <Link
            href="/weather"
            className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <CloudSun className="w-4 h-4 text-blue-500" />
            天気
          </Link>
        </div>

        {loadingRecords ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
          </div>
        ) : selectedDate ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {format(selectedDate, "M月d日(E)", { locale: ja })}の記録
              {activeFilterCount > 0 && (
                <span className="text-xs text-orange-500 ml-2">
                  (フィルター適用中)
                </span>
              )}
            </h3>
            {selectedRecords.length > 0 ? (
              <div className="space-y-2">
                {selectedRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4 text-sm">記録がありません</p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4 text-sm">
            日付をタップして記録を確認
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
