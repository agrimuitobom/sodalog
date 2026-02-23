"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getUserRecords } from "@/lib/records";
import { GrowthRecord, GrowthPhase, GROWTH_PHASES } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock, ImageIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface CropSummary {
  crop: string;
  variety: string;
  plotId: string;
  totalRecords: number;
  latestPhase: GrowthPhase | null;
  latestPhaseIndex: number;
  latestRecord: GrowthRecord;
  firstRecord: GrowthRecord;
  phaseCounts: Map<GrowthPhase, number>;
  daysSinceFirst: number;
}

function getPhaseIndex(phase: GrowthPhase | undefined): number {
  if (!phase) return -1;
  return GROWTH_PHASES.findIndex((p) => p.value === phase);
}

function groupRecordsByCrop(records: GrowthRecord[]): CropSummary[] {
  const groups = new Map<string, GrowthRecord[]>();

  for (const r of records) {
    const key = `${r.crop}||${r.variety || ""}||${r.plotId || ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const summaries: CropSummary[] = [];

  for (const [key, recs] of groups) {
    const [crop, variety, plotId] = key.split("||");
    // Sort by createdAt ascending
    const sorted = [...recs].sort((a, b) => {
      const da = a.createdAt?.toDate?.() ?? new Date();
      const db = b.createdAt?.toDate?.() ?? new Date();
      return da.getTime() - db.getTime();
    });

    const phaseCounts = new Map<GrowthPhase, number>();
    let latestPhase: GrowthPhase | null = null;
    let latestPhaseIndex = -1;

    for (const r of sorted) {
      if (r.growthPhase) {
        phaseCounts.set(r.growthPhase, (phaseCounts.get(r.growthPhase) || 0) + 1);
        const idx = getPhaseIndex(r.growthPhase);
        if (idx >= latestPhaseIndex) {
          latestPhase = r.growthPhase;
          latestPhaseIndex = idx;
        }
      }
    }

    const firstDate = sorted[0].createdAt?.toDate?.() ?? new Date();
    const daysSinceFirst = Math.floor(
      (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    summaries.push({
      crop,
      variety,
      plotId,
      totalRecords: recs.length,
      latestPhase,
      latestPhaseIndex,
      latestRecord: sorted[sorted.length - 1],
      firstRecord: sorted[0],
      phaseCounts,
      daysSinceFirst,
    });
  }

  // Sort by latest record date descending
  summaries.sort((a, b) => {
    const da = a.latestRecord.createdAt?.toDate?.() ?? new Date();
    const db = b.latestRecord.createdAt?.toDate?.() ?? new Date();
    return db.getTime() - da.getTime();
  });

  return summaries;
}

function PhaseTimeline({ summary }: { summary: CropSummary }) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-1">
      {GROWTH_PHASES.map((phase, idx) => {
        const count = summary.phaseCounts.get(phase.value) || 0;
        const isCurrent = phase.value === summary.latestPhase;
        const isPast = idx < summary.latestPhaseIndex;
        const isFuture = idx > summary.latestPhaseIndex;

        return (
          <div key={phase.value} className="flex items-center">
            {idx > 0 && (
              <div
                className={`w-3 h-0.5 flex-shrink-0 ${
                  isPast || isCurrent ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
            <div
              className={`flex flex-col items-center flex-shrink-0 ${
                isFuture ? "opacity-40" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  isCurrent
                    ? "bg-green-100 ring-2 ring-green-500 ring-offset-1"
                    : isPast
                    ? "bg-green-50"
                    : "bg-gray-100"
                }`}
                title={`${phase.label}: ${count}件`}
              >
                {phase.emoji}
              </div>
              <span
                className={`text-[9px] mt-0.5 whitespace-nowrap ${
                  isCurrent ? "text-green-700 font-bold" : "text-gray-400"
                }`}
              >
                {phase.label}
              </span>
              {count > 0 && (
                <span className="text-[8px] text-gray-400">{count}件</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CropCard({ summary }: { summary: CropSummary }) {
  const lastDate = summary.latestRecord.createdAt?.toDate?.() ?? new Date();
  const relativeTime = formatDistanceToNow(lastDate, { locale: ja, addSuffix: true });
  const currentPhase = summary.latestPhase
    ? GROWTH_PHASES.find((p) => p.value === summary.latestPhase)
    : null;

  return (
    <Link
      href={`/timeline?crop=${encodeURIComponent(summary.crop)}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-800 truncate">
              {summary.crop}
            </h3>
            {currentPhase && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                {currentPhase.emoji} {currentPhase.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {summary.variety && <span>{summary.variety}</span>}
            {summary.plotId && (
              <span className="flex items-center gap-0.5">
                {summary.plotId}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>

      <PhaseTimeline summary={summary} />

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            {summary.totalRecords}件
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {summary.daysSinceFirst}日目
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {relativeTime}
        </span>
      </div>
    </Link>
  );
}

export default function ProgressPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setLoadingRecords(true);
      getUserRecords(user.uid)
        .then(setRecords)
        .catch(console.error)
        .finally(() => setLoadingRecords(false));
    }
  }, [user]);

  const summaries = useMemo(() => groupRecordsByCrop(records), [records]);

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1 rounded-full hover:bg-green-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">作物の進捗</h1>
      </header>

      <div className="p-4">
        {loadingRecords ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-24 skeleton rounded" />
                  <div className="h-5 w-14 skeleton rounded-full" />
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="flex items-center">
                      {j > 0 && <div className="w-3 h-0.5 skeleton" />}
                      <div className="w-8 h-8 skeleton rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className="h-3 w-12 skeleton" />
                  <div className="h-3 w-16 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm mb-4">まだ記録がありません</p>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              最初の記録を作成
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {summaries.length}種の作物を栽培中
            </p>
            <div className="space-y-3">
              {summaries.map((s, i) => (
                <CropCard key={`${s.crop}-${s.variety}-${s.plotId}-${i}`} summary={s} />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
