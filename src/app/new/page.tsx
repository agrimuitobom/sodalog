"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createRecord } from "@/lib/records";
import { CultivationAction } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import CameraCapture from "@/components/CameraCapture";
import ActionInput from "@/components/ActionInput";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function NewRecordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [crop, setCrop] = useState("");
  const [variety, setVariety] = useState("");
  const [plotId, setPlotId] = useState("");
  const [memo, setMemo] = useState("");
  const [actions, setActions] = useState<CultivationAction[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !crop) return;

    setSaving(true);
    try {
      await createRecord(user.uid, {
        crop,
        variety,
        plotId,
        memo,
        actions,
        imageFile,
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create record:", error);
      alert("記録の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">新しい記録</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <CameraCapture
          onCapture={setImageFile}
          onClear={() => setImageFile(null)}
        />

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
              記録を保存
            </>
          )}
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
