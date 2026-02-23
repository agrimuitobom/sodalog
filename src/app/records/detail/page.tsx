"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { getRecord, deleteRecord, updateRecordColorAnalysis, getUserRecordsByCrop } from "@/lib/records";
import { GrowthRecord, GROWTH_PHASES } from "@/types/record";
import { FertilizerDetail } from "@/types/record";
import { analyzeImageColor, ColorAnalysisResult } from "@/lib/colorAnalysis";
import ColorAnalysisDisplay from "@/components/ColorAnalysisDisplay";
import ShareButton from "@/components/ShareButton";
import CommentSection from "@/components/CommentSection";
import AiAdvicePanel from "@/components/AiAdvicePanel";
import PestDiagnosisPanel from "@/components/PestDiagnosisPanel";
import RecordWeatherBadge from "@/components/RecordWeatherBadge";
import { getWeatherLabel, getWeatherEmoji } from "@/lib/weather";
import { DetailSkeleton } from "@/components/Skeleton";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { ArrowLeft, Trash2, Pencil, Calendar, MapPin, Leaf, Palette, Loader2, CloudSun, Droplets, Wind, Thermometer } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";

const actionTypeLabels: Record<string, string> = {
  fertilizer: "施肥",
  pruning: "剪定",
  watering: "灌水",
  other: "その他",
};

function RecordDetailContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get("id");

  const { toast } = useToast();
  const [record, setRecord] = useState<GrowthRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [colorAnalysis, setColorAnalysis] = useState<ColorAnalysisResult | null>(null);
  const [cropRecords, setCropRecords] = useState<GrowthRecord[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (recordId) {
      getRecord(recordId)
        .then((r) => {
          setRecord(r);
          if (r?.colorAnalysis) setColorAnalysis(r.colorAnalysis);
          if (r && user) {
            getUserRecordsByCrop(user.uid, r.crop).then(setCropRecords).catch(() => {});
          }
        })
        .catch((err) => {
          console.error("Failed to load record:", err);
        })
        .finally(() => {
          setLoadingRecord(false);
        });
    } else {
      setLoadingRecord(false);
    }
  }, [recordId, user]);

  const handleDeleteClick = () => {
    if (!record?.id) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!record?.id) return;
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await deleteRecord(record.id);
      toast("記録を削除しました");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast("削除に失敗しました", "error");
      setDeleting(false);
    }
  }, [record?.id, toast, router]);

  const handleAnalyzeColor = async () => {
    if (!record?.imageUrl || !record.id) return;
    setAnalyzing(true);
    try {
      const result = await analyzeImageColor(record.imageUrl);
      setColorAnalysis(result);
      await updateRecordColorAnalysis(record.id, result);
    } catch (error) {
      console.error("Color analysis failed:", error);
      toast("色解析に失敗しました", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading || !user) return null;

  if (loadingRecord) {
    return (
      <div className="pb-8">
        <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">記録詳細</h1>
        </header>
        <div className="w-full h-48 skeleton" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">記録が見つかりません</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
        >
          ダッシュボードに戻る
        </button>
      </div>
    );
  }

  const date = record.createdAt?.toDate?.() ?? new Date();

  return (
    <div className="pb-8">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">記録詳細</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/records/edit?id=${record.id}`)}
            className="p-1 hover:bg-green-700 rounded"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="p-1 hover:bg-green-700 rounded"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {record.imageUrl && (
        <img
          src={record.imageUrl}
          alt={record.crop}
          className="w-full max-h-80 object-cover"
        />
      )}

      <div className="p-4 space-y-4">
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

        {record.growthPhase && (() => {
          const phase = GROWTH_PHASES.find((p) => p.value === record.growthPhase);
          return phase ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-sm rounded-full border border-amber-200 w-fit">
              {phase.emoji} {phase.label}
            </span>
          ) : null;
        })()}

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

        {/* Weather at recording time */}
        {record.weather && (
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
              <CloudSun className="w-4 h-4" />
              記録時の天気
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getWeatherEmoji(record.weather.weatherCode)}</span>
              <span className="font-medium text-gray-700">
                {getWeatherLabel(record.weather.weatherCode)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-gray-600">{record.weather.temperature}°C</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-gray-600">{record.weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600">{record.weather.precipitation}mm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-gray-600">{record.weather.windSpeed}m/s</span>
              </div>
            </div>
          </div>
        )}

        {/* Color Analysis Section */}
        {colorAnalysis ? (
          <ColorAnalysisDisplay analysis={colorAnalysis} />
        ) : record.imageUrl ? (
          <button
            onClick={handleAnalyzeColor}
            disabled={analyzing}
            className="w-full flex items-center justify-center gap-2 bg-white border border-green-300 text-green-700 py-3 rounded-lg font-medium hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <Palette className="w-5 h-5" />
                色を解析する
              </>
            )}
          </button>
        ) : null}

        {/* AI Advice */}
        <AiAdvicePanel record={record} allRecords={cropRecords} />

        {/* Pest Diagnosis */}
        {record.imageUrl && (
          <PestDiagnosisPanel
            imageUrl={record.imageUrl}
            crop={record.crop}
            variety={record.variety}
            memo={record.memo}
          />
        )}

        {/* Share */}
        {record.id && user && (
          <ShareButton recordDocId={record.id} userId={user.uid} />
        )}

        {/* Comments */}
        {record.id && <CommentSection recordDocId={record.id} />}
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="記録を削除"
        message="この記録を削除しますか？この操作は取り消せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export default function RecordDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    }>
      <RecordDetailContent />
    </Suspense>
  );
}
