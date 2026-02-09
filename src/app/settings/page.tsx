"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { Settings, LogOut, User, Download, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  const handleLogout = async () => {
    if (!confirm("ログアウトしますか？")) return;
    await logout();
    router.replace("/");
  };

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        <h1 className="text-lg font-bold">設定</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="プロフィール"
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{user.displayName || "ユーザー"}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          <Link
            href="/export"
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5 text-green-600" />
            <span className="font-medium flex-1">データエクスポート</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">ログアウト</span>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">そだログ v1.0.0</p>
      </div>

      <BottomNav />
    </div>
  );
}
