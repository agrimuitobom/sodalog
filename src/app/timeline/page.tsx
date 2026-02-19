"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { getUserRecordsPaginated, PaginatedResult } from "@/lib/records";
import { GrowthRecord } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import RecordCard from "@/components/RecordCard";
import { Clock, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserRecordsPaginated(user.uid).then((result: PaginatedResult) => {
        setRecords(result.records);
        cursorRef.current = result.lastDoc;
        setHasMore(result.hasMore);
        setLoadingRecords(false);
      });
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await getUserRecordsPaginated(user.uid, cursorRef.current);
      setRecords((prev) => [...prev, ...result.records]);
      cursorRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [user, loadingMore, hasMore]);

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

  const groupedRecords = records.reduce<Record<string, GrowthRecord[]>>((acc, record) => {
    const date = record.createdAt?.toDate?.() ?? new Date();
    const key = format(date, "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {});

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <Clock className="w-6 h-6" />
        <h1 className="text-lg font-bold">タイムライン</h1>
      </header>

      <div className="p-4">
        {loadingRecords ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">まだ記録がありません</p>
            <button
              onClick={() => router.push("/new")}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
            >
              最初の記録を作成
            </button>
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

            {!hasMore && records.length > 0 && (
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
