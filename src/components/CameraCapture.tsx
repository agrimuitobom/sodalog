"use client";

import { useRef, useState } from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  preview?: string | null;
  onClear?: () => void;
}

export default function CameraCapture({ onCapture, preview, onClear }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onCapture(file);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear?.();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img
            src={previewUrl}
            alt="撮影プレビュー"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
              }
            }}
            className="flex-1 flex flex-col items-center justify-center py-8 border-2 border-dashed border-green-300 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          >
            <Camera className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">カメラで撮影</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute("capture");
                fileInputRef.current.click();
              }
            }}
            className="flex-1 flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">ギャラリーから</span>
          </button>
        </div>
      )}
    </div>
  );
}
