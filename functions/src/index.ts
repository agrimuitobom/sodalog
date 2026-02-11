import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {defineSecret} from "firebase-functions/params";
import {GoogleGenerativeAI} from "@google/generative-ai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

setGlobalOptions({maxInstances: 10});

interface RecordData {
  crop: string;
  variety: string;
  memo: string;
  actions: Array<{type: string; detail: Record<string, string>}>;
  colorAnalysis?: {r: number; g: number; b: number; greenRatio: number};
  weather?: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
  };
  createdAt: string;
}

// AI cultivation advice based on growth records
export const getAiAdvice = onCall(
  {secrets: [geminiApiKey], region: "asia-northeast1"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const {records, crop, variety} = request.data as {
      records: RecordData[];
      crop: string;
      variety: string;
    };

    if (!crop) {
      throw new HttpsError("invalid-argument", "作物名が必要です");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

    const recordsSummary = (records || []).map((r) => {
      const parts = [`日付: ${r.createdAt}`, `メモ: ${r.memo || "なし"}`];
      if (r.actions?.length) {
        const actionTexts = r.actions.map((a) => {
          if (a.type === "fertilizer") {
            return `施肥(${a.detail.name || ""} ${a.detail.amount || ""}${a.detail.unit || ""})`;
          }
          if (a.type === "watering") return `水やり(${a.detail.amount || ""})`;
          if (a.type === "pruning") return `剪定(${a.detail.method || ""})`;
          return `その他(${a.detail.description || ""})`;
        });
        parts.push(`作業: ${actionTexts.join(", ")}`);
      }
      if (r.colorAnalysis) {
        parts.push(`緑色率: ${r.colorAnalysis.greenRatio}%`);
      }
      if (r.weather) {
        parts.push(`気温: ${r.weather.temperature}°C, 湿度: ${r.weather.humidity}%`);
      }
      return parts.join(" / ");
    }).join("\n");

    const prompt = `あなたは経験豊富な農業アドバイザーです。
以下の栽培記録に基づいて、「${crop}${variety ? `（品種: ${variety}）` : ""}」の栽培アドバイスを日本語で提供してください。

【栽培記録】
${recordsSummary || "記録なし"}

以下の点についてアドバイスしてください：
1. 現在の生育状況の評価
2. 今後の管理作業の推奨（水やり、施肥、剪定など）
3. 注意すべき病害虫
4. 季節に応じたアドバイス

簡潔に、実用的なアドバイスをお願いします（300文字以内）。`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      logger.info("AI advice generated", {crop, variety});
      return {advice: text};
    } catch (error) {
      logger.error("AI advice generation failed", error);
      throw new HttpsError("internal", "AIアドバイスの生成に失敗しました");
    }
  }
);

// AI pest/disease diagnosis from image
export const diagnosePest = onCall(
  {secrets: [geminiApiKey], region: "asia-northeast1"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const {imageUrl, crop, variety, memo} = request.data as {
      imageUrl: string;
      crop: string;
      variety?: string;
      memo?: string;
    };

    if (!imageUrl || !crop) {
      throw new HttpsError("invalid-argument", "画像URLと作物名が必要です");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new HttpsError("internal", "画像の取得に失敗しました");
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const prompt = `あなたは植物病理学の専門家です。
この画像は「${crop}${variety ? `（品種: ${variety}）` : ""}」の写真です。
${memo ? `ユーザーメモ: ${memo}` : ""}

この画像を分析して、以下の形式でJSON形式で回答してください（JSON以外のテキストは不要です）：
{
  "diagnosis": "診断結果（病害虫名または「健康」）",
  "confidence": 0.0～1.0の信頼度,
  "details": "詳しい説明（症状の特徴など）",
  "treatment": "対処法・推奨される処置",
  "prevention": "予防策"
}

もし病害虫が見つからなければ、「健康」と診断し、一般的な管理アドバイスを提供してください。`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
      ]);
      const response = result.response;
      const text = response.text();

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error("Failed to parse AI diagnosis response", {text});
        throw new HttpsError("internal", "診断結果の解析に失敗しました");
      }

      const diagnosis = JSON.parse(jsonMatch[0]);
      logger.info("Pest diagnosis completed", {crop, diagnosis: diagnosis.diagnosis});

      return {
        result: diagnosis.diagnosis,
        confidence: diagnosis.confidence,
        details: diagnosis.details,
        treatment: diagnosis.treatment,
        prevention: diagnosis.prevention,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Pest diagnosis failed", error);
      throw new HttpsError("internal", "病害虫診断に失敗しました");
    }
  }
);
