"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getUserRecords } from "@/lib/records";
import { GrowthRecord } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import RecordCard from "@/components/RecordCard";
import { ChevronLeft, ChevronRight, Sprout } from "lucide-react";
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

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, GrowthRecord[]>();
    records.forEach((r) => {
      const date = r.createdAt?.toDate?.() ?? new Date();
      const key = format(date, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [records]);

  const selectedRecords = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return recordsByDate.get(key) || [];
  }, [selectedDate, recordsByDate]);

  const startPadding = getDay(startOfMonth(currentMonth));

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <Sprout className="w-6 h-6" />
        <h1 className="text-lg font-bold">そだログ</h1>
      </header>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
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
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
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

        {loadingRecords ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
          </div>
        ) : selectedDate ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {format(selectedDate, "M月d日(E)", { locale: ja })}の記録
            </h3>
            {selectedRecords.length > 0 ? (
              <div className="space-y-2">
                {selectedRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4 text-sm">記録がありません</p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-4 text-sm">
            日付をタップして記録を確認
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
