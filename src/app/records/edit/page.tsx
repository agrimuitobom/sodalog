"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getRecord, updateRecord } from "@/lib/records";
import { GrowthRecord, CultivationAction } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import CameraCapture from "@/components/CameraCapture";
import ActionInput from "@/components/ActionInput";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

function EditRecordContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get("id");

  const [record, setRecord] = useState<GrowthRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);

  const [crop, setCrop] = useState("");
  const [variety, setVariety] = useState("");
  const [plotId, setPlotId] = useState("");
  const [memo, setMemo] = useState("");
  const [actions, setActions] = useState<CultivationAction[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (recordId) {
      getRecord(recordId)
        .then((r) => {
          if (r) {
            setRecord(r);
            setCrop(r.crop);
            setVariety(r.variety || "");
            setPlotId(r.plotId || "");
            setMemo(r.memo || "");
            setActions(r.actions || []);
            if (r.imageUrl) setExistingImageUrl(r.imageUrl);
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
  }, [recordId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !record?.id || !crop) return;

    setSaving(true);
    try {
      await updateRecord(record.id, user.uid, {
        crop,
        variety,
        plotId,
        memo,
        actions,
        imageFile,
      });
      router.push(`/records/detail?id=${record.id}`);
    } catch (error) {
      console.error("Failed to update record:", error);
      alert("記録の更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  if (loadingRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
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

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">記録を編集</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {existingImageUrl && !imageFile ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">現在の写真</label>
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img
                src={existingImageUrl}
                alt={crop}
                className="w-full h-48 object-cover"
              />
            </div>
            <p className="text-xs text-gray-400">新しい写真を選択すると差し替えられます</p>
          </div>
        ) : null}

        <CameraCapture
          onCapture={setImageFile}
          onClear={() => setImageFile(null)}
        />
        {imageFile && (
          <p className="text-xs text-green-600">新しい写真が選択されています</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作物名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="例：トマト、イネ、キュウリ"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">品種</label>
          <input
            type="text"
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            placeholder="例：桃太郎、コシヒカリ"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">圃場・区画</label>
          <input
            type="text"
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
            placeholder="例：A棟1号ハウス、露地3番"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="観察内容や気づいたことを記録..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          />
        </div>

        <ActionInput actions={actions} onChange={setActions} />

        <button
          type="submit"
          disabled={saving || !crop}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              変更を保存
            </>
          )}
        </button>
      </form>

      <BottomNav />
    </div>
  );
}

export default function EditRecordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    }>
      <EditRecordContent />
    </Suspense>
  );
}
