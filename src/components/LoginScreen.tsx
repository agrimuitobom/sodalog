"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Sprout, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

function useIsWebView() {
  const [isWebView, setIsWebView] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || "";
    setIsWebView(
      /Line\//i.test(ua) ||
      /FBAN|FBAV/i.test(ua) ||
      /Instagram/i.test(ua) ||
      /Twitter/i.test(ua) ||
      /wv\)/i.test(ua)
    );
  }, []);
  return isWebView;
}

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const isWebView = useIsWebView();
  const [loginError, setLoginError] = useState(false);

  const handleLogin = async () => {
    try {
      setLoginError(false);
      await signInWithGoogle();
    } catch {
      setLoginError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-4">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-green-800">そだログ</h1>
        <p className="text-green-600 mt-2">栽培記録をかんたんに</p>
      </div>

      {(isWebView || loginError) && (
        <div className="mb-4 max-w-xs bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ExternalLink className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">ブラウザで開いてください</p>
          </div>
          <p className="text-xs text-amber-600">
            アプリ内ブラウザではGoogleログインが利用できません。右上の「…」メニューから「ブラウザで開く」を選択してください。
          </p>
        </div>
      )}

      <button
        onClick={handleLogin}
        className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 shadow-sm hover:shadow-md transition-shadow"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span className="text-gray-700 font-medium">Googleでログイン</span>
      </button>
    </div>
  );
}
