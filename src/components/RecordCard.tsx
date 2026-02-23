"use client";

import Link from "next/link";
import { GrowthRecord, GROWTH_PHASES } from "@/types/record";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Camera, Leaf } from "lucide-react";
import RecordWeatherBadge from "@/components/RecordWeatherBadge";

interface RecordCardProps {
  record: GrowthRecord;
}

const actionTypeLabels: Record<string, string> = {
  fertilizer: "施肥",
  pruning: "剪定",
  watering: "灌水",
  other: "その他",
};

export default function RecordCard({ record }: RecordCardProps) {
  const date = record.createdAt?.toDate?.() ?? new Date();

  return (
    <Link href={`/records/detail?id=${record.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          {record.imageThumbnail || record.imageUrl ? (
            <img
              src={record.imageThumbnail || record.imageUrl}
              alt={record.crop}
              className="w-24 h-24 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Camera className="w-8 h-8 text-gray-300" />
            </div>
          )}
          <div className="p-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">
                {record.crop}
                {record.variety && ` (${record.variety})`}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">
              {format(date, "yyyy/MM/dd HH:mm", { locale: ja })}
            </p>
            {record.memo && (
              <p className="text-sm text-gray-600 line-clamp-1">{record.memo}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {record.growthPhase && (() => {
                const phase = GROWTH_PHASES.find((p) => p.value === record.growthPhase);
                return phase ? (
                  <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">
                    {phase.emoji} {phase.label}
                  </span>
                ) : null;
              })()}
              {record.actions.map((action, i) => (
                <span
                  key={i}
                  className="inline-block px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded"
                >
                  {actionTypeLabels[action.type] || action.type}
                </span>
              ))}
              {record.weather && (
                <RecordWeatherBadge weather={record.weather} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
