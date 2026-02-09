"use client";

import { useState, useEffect } from "react";
import { Share } from "@/types/record";
import { createShare, getShareByRecord, deleteShare } from "@/lib/shares";
import { Share2, Link, Check, X, Loader2 } from "lucide-react";

interface ShareButtonProps {
  recordDocId: string;
  userId: string;
}

export default function ShareButton({ recordDocId, userId }: ShareButtonProps) {
  const [share, setShare] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getShareByRecord(recordDocId)
      .then(setShare)
      .finally(() => setLoading(false));
  }, [recordDocId]);

  const handleCreateShare = async () => {
    setCreating(true);
    try {
      const newShare = await createShare(recordDocId, userId, "link_only");
      setShare(newShare);
    } catch (error) {
      console.error("Failed to create share:", error);
      alert("共有リンクの作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShare = async () => {
    if (!share?.id || !confirm("共有を停止しますか？リンクは無効になります。")) return;
    try {
      await deleteShare(share.id);
      setShare(null);
    } catch (error) {
      console.error("Failed to delete share:", error);
    }
  };

  const shareUrl = share
    ? `${window.location.origin}/shared/${share.shareId}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  return (
    <div>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center ${
          share
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        <Share2 className="w-4 h-4" />
        {share ? "共有中" : "共有する"}
      </button>

      {showPanel && (
        <div className="mt-2 bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {share ? (
            <>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs text-gray-500">共有リンク</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600 truncate"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : "コピー"}
                </button>
              </div>
              <button
                onClick={handleDeleteShare}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
              >
                <X className="w-3.5 h-3.5" />
                共有を停止
              </button>
            </>
          ) : (
            <button
              onClick={handleCreateShare}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link className="w-4 h-4" />
              )}
              共有リンクを作成
            </button>
          )}
        </div>
      )}
    </div>
  );
}
