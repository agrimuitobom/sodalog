"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSharedRecord } from "@/lib/shares";
import { GrowthRecord, FertilizerDetail } from "@/types/record";
import ColorAnalysisDisplay from "@/components/ColorAnalysisDisplay";
import CommentSection from "@/components/CommentSection";
import { Sprout, Calendar, MapPin, Leaf } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const actionTypeLabels: Record<string, string> = {
  fertilizer: "施肥",
  pruning: "剪定",
  watering: "灌水",
  other: "その他",
};

export default function SharedRecordPage() {
  const params = useParams();
  const [record, setRecord] = useState<GrowthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const shareId = params.shareId as string;
    if (!shareId) return;

    getSharedRecord(shareId)
      .then((result) => {
        if (result) {
          setRecord(result.record as GrowthRecord);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (notFound || !record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Sprout className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-lg font-medium">記録が見つかりません</p>
        <p className="text-gray-400 text-sm mt-1">
          この共有リンクは無効か、削除された可能性があります
        </p>
      </div>
    );
  }

  const date = record.createdAt?.toDate?.() ?? new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <Sprout className="w-6 h-6" />
        <h1 className="text-lg font-bold">そだログ</h1>
        <span className="text-green-200 text-xs ml-auto">共有された記録</span>
      </header>

      {record.imageUrl && (
        <img
          src={record.imageUrl}
          alt={record.crop}
          className="w-full max-h-80 object-cover"
        />
      )}

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">
            {record.crop}
            {record.variety && (
              <span className="text-base font-normal text-gray-500 ml-2">
                {record.variety}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(date, "yyyy年M月d日(E) HH:mm", { locale: ja })}
          </div>
          {record.plotId && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {record.plotId}
            </div>
          )}
        </div>

        {record.memo && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">メモ</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{record.memo}</p>
          </div>
        )}

        {record.actions.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">栽培作業</h3>
            <div className="space-y-3">
              {record.actions.map((action, i) => (
                <div key={i} className="bg-green-50 rounded-md p-3">
                  <span className="text-sm font-medium text-green-700">
                    {actionTypeLabels[action.type]}
                  </span>
                  {action.type === "fertilizer" && (
                    <p className="text-sm text-gray-600 mt-1">
                      {(action.detail as FertilizerDetail).name}
                      {(action.detail as FertilizerDetail).amount &&
                        ` - ${(action.detail as FertilizerDetail).amount}${(action.detail as FertilizerDetail).unit}`}
                    </p>
                  )}
                  {action.type === "pruning" && (
                    <p className="text-sm text-gray-600 mt-1">
                      {(action.detail as { method: string }).method}
                    </p>
                  )}
                  {action.type === "watering" && (
                    <p className="text-sm text-gray-600 mt-1">
                      {(action.detail as { amount: string }).amount}
                    </p>
                  )}
                  {action.type === "other" && (
                    <p className="text-sm text-gray-600 mt-1">
                      {(action.detail as { description: string }).description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {record.colorAnalysis && (
          <ColorAnalysisDisplay analysis={record.colorAnalysis} />
        )}

        {/* Comments - read-only for non-logged-in, writable for logged-in */}
        {record.id && <CommentSection recordDocId={record.id} />}

        <p className="text-center text-xs text-gray-400 pt-4">
          そだログ - 栽培記録アプリ
        </p>
      </div>
    </div>
  );
}
