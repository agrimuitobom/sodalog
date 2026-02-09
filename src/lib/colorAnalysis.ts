export interface ColorAnalysisResult {
  r: number;
  g: number;
  b: number;
  greenRatio: number;
}

export function analyzeImageColor(imageUrl: string): Promise<ColorAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      const maxSize = 200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const totalPixels = data.length / 4;

      let totalR = 0;
      let totalG = 0;
      let totalB = 0;
      let greenPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalR += r;
        totalG += g;
        totalB += b;

        // Green detection: G channel dominant and above threshold
        if (g > 60 && g > r * 1.2 && g > b * 1.2) {
          greenPixels++;
        }
      }

      resolve({
        r: Math.round(totalR / totalPixels),
        g: Math.round(totalG / totalPixels),
        b: Math.round(totalB / totalPixels),
        greenRatio: Math.round((greenPixels / totalPixels) * 1000) / 10,
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}
