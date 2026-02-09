import { Timestamp } from "firebase/firestore";

export type ActionType = "fertilizer" | "pruning" | "watering" | "other";

export interface FertilizerDetail {
  name: string;
  amount: string;
  unit: string;
}

export interface PruningDetail {
  method: string;
}

export interface WateringDetail {
  amount: string;
}

export interface OtherDetail {
  description: string;
}

export interface CultivationAction {
  type: ActionType;
  detail: FertilizerDetail | PruningDetail | WateringDetail | OtherDetail;
}

export interface GrowthRecord {
  id?: string;
  userId: string;
  recordId: string;
  createdAt: Timestamp;

  crop: string;
  variety: string;
  plotId: string;

  imageUrl: string;
  imageThumbnail: string;

  memo: string;

  actions: CultivationAction[];

  // Phase 2
  colorAnalysis?: { r: number; g: number; b: number; greenRatio: number };
  aiDiagnosis?: { result: string; confidence: number };
}

export type ShareVisibility = "public" | "link_only";

export interface Share {
  id?: string;
  recordDocId: string;
  userId: string;
  shareId: string;
  visibility: ShareVisibility;
  createdAt: Timestamp;
}

export interface Comment {
  id?: string;
  recordDocId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: Timestamp;
}

export interface GrowthRecordInput {
  crop: string;
  variety: string;
  plotId: string;
  memo: string;
  actions: CultivationAction[];
  imageFile?: File | null;
}
