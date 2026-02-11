"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <WifiOff className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-xl font-bold text-gray-700 mb-2">オフラインです</h1>
      <p className="text-gray-500 mb-6">
        インターネットに接続されていません。
        <br />
        接続を確認してもう一度お試しください。
      </p>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
        再読み込み
      </button>
    </div>
  );
}
