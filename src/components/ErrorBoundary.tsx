"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-orange-400 mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            予期しないエラーが発生しました。再読み込みをお試しください。
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
