import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  deleteDoc,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "./firebase";
import { GrowthRecord, GrowthRecordInput } from "@/types/record";
import imageCompression from "browser-image-compression";

const RECORDS_COLLECTION = "records";

export async function compressImage(file: File): Promise<{ full: File; thumbnail: File }> {
  const fullOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  const thumbnailOptions = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 300,
    useWebWorker: true,
  };

  const [full, thumbnail] = await Promise.all([
    imageCompression(file, fullOptions),
    imageCompression(file, thumbnailOptions),
  ]);

  return { full, thumbnail };
}

export async function uploadImage(
  userId: string,
  recordId: string,
  file: File,
  path: string
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), `users/${userId}/records/${recordId}/${path}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function createRecord(
  userId: string,
  input: GrowthRecordInput
): Promise<string> {
  const recordId = crypto.randomUUID();
  let imageUrl = "";
  let imageThumbnail = "";

  if (input.imageFile) {
    const { full, thumbnail } = await compressImage(input.imageFile);
    const [fullUrl, thumbUrl] = await Promise.all([
      uploadImage(userId, recordId, full, "image.jpg"),
      uploadImage(userId, recordId, thumbnail, "thumbnail.jpg"),
    ]);
    imageUrl = fullUrl;
    imageThumbnail = thumbUrl;
  }

  const record: Omit<GrowthRecord, "id"> = {
    userId,
    recordId,
    createdAt: input.createdAt ? Timestamp.fromDate(input.createdAt) : Timestamp.now(),
    crop: input.crop,
    variety: input.variety,
    plotId: input.plotId,
    ...(input.growthPhase ? { growthPhase: input.growthPhase } : {}),
    imageUrl,
    imageThumbnail,
    memo: input.memo,
    actions: input.actions,
    ...(input.weather ? { weather: input.weather } : {}),
  };

  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, RECORDS_COLLECTION), record);
  return docRef.id;
}

export async function getUserRecords(userId: string): Promise<GrowthRecord[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GrowthRecord));
}

export async function getUserCropOptions(userId: string): Promise<{ crop: string; variety: string }[]> {
  const records = await getUserRecords(userId);
  const seen = new Set<string>();
  const options: { crop: string; variety: string }[] = [];
  for (const r of records) {
    const key = `${r.crop}||${r.variety || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      options.push({ crop: r.crop, variety: r.variety || "" });
    }
  }
  return options;
}

export async function getRecord(docId: string): Promise<GrowthRecord | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, RECORDS_COLLECTION, docId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as GrowthRecord;
}

export async function deleteRecord(docId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, RECORDS_COLLECTION, docId));
}

export async function updateRecord(
  docId: string,
  userId: string,
  data: Partial<GrowthRecordInput>
): Promise<void> {
  const db = getFirebaseDb();
  const updateData: Record<string, unknown> = {};

  if (data.createdAt !== undefined) updateData.createdAt = Timestamp.fromDate(data.createdAt);
  if (data.crop !== undefined) updateData.crop = data.crop;
  if (data.variety !== undefined) updateData.variety = data.variety;
  if (data.plotId !== undefined) updateData.plotId = data.plotId;
  if (data.memo !== undefined) updateData.memo = data.memo;
  if (data.actions !== undefined) updateData.actions = data.actions;
  if (data.growthPhase !== undefined) updateData.growthPhase = data.growthPhase;

  // Handle image upload
  if (data.imageFile) {
    const { full, thumbnail } = await compressImage(data.imageFile);
    const recordId = docId;
    const [fullUrl, thumbUrl] = await Promise.all([
      uploadImage(userId, recordId, full, "image.jpg"),
      uploadImage(userId, recordId, thumbnail, "thumbnail.jpg"),
    ]);
    updateData.imageUrl = fullUrl;
    updateData.imageThumbnail = thumbUrl;
  }

  await updateDoc(doc(db, RECORDS_COLLECTION, docId), updateData);
}

export async function updateRecordColorAnalysis(
  docId: string,
  colorAnalysis: { r: number; g: number; b: number; greenRatio: number }
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, RECORDS_COLLECTION, docId), { colorAnalysis });
}

export async function getUserRecordsByCrop(
  userId: string,
  crop: string
): Promise<GrowthRecord[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("userId", "==", userId),
    where("crop", "==", crop),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GrowthRecord));
}

export async function getUserRecordsByPlot(
  userId: string,
  plotId: string
): Promise<GrowthRecord[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("userId", "==", userId),
    where("plotId", "==", plotId),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GrowthRecord));
}

export interface PaginatedResult {
  records: GrowthRecord[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export interface RecordFilters {
  crop?: string;
  plotId?: string;
}

const PAGE_SIZE = 20;

export async function getUserRecordsPaginated(
  userId: string,
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
  filters?: RecordFilters
): Promise<PaginatedResult> {
  const db = getFirebaseDb();
  const col = collection(db, RECORDS_COLLECTION);
  const constraints = [where("userId", "==", userId)];
  if (filters?.crop) constraints.push(where("crop", "==", filters.crop));
  if (filters?.plotId) constraints.push(where("plotId", "==", filters.plotId));

  const q = cursor
    ? query(col, ...constraints, orderBy("createdAt", "desc"), startAfter(cursor), limit(PAGE_SIZE + 1))
    : query(col, ...constraints, orderBy("createdAt", "desc"), limit(PAGE_SIZE + 1));
  const snapshot = await getDocs(q);
  const hasMore = snapshot.docs.length > PAGE_SIZE;
  const docs = hasMore ? snapshot.docs.slice(0, PAGE_SIZE) : snapshot.docs;
  const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
  const records = docs.map((d) => ({ id: d.id, ...d.data() } as GrowthRecord));
  return { records, lastDoc, hasMore };
}

export async function getUserFilterOptions(
  userId: string
): Promise<{ crops: string[]; plots: string[] }> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  const cropSet = new Set<string>();
  const plotSet = new Set<string>();
  for (const d of snapshot.docs) {
    const data = d.data();
    if (data.crop) cropSet.add(data.crop);
    if (data.plotId) plotSet.add(data.plotId);
  }
  return {
    crops: Array.from(cropSet).sort(),
    plots: Array.from(plotSet).sort(),
  };
}

export interface UserStats {
  totalRecords: number;
  totalCrops: number;
  totalPlots: number;
  cropCounts: { name: string; count: number }[];
  recentStreak: number; // consecutive days with records ending today/yesterday
  thisMonthCount: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const records = await getUserRecords(userId);
  const cropMap = new Map<string, number>();
  const plotSet = new Set<string>();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let thisMonthCount = 0;

  const recordDates = new Set<string>();

  for (const r of records) {
    cropMap.set(r.crop, (cropMap.get(r.crop) || 0) + 1);
    if (r.plotId) plotSet.add(r.plotId);
    const date = r.createdAt?.toDate?.() ?? new Date();
    if (date >= thisMonthStart) thisMonthCount++;
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    recordDates.add(dayKey);
  }

  // Calculate streak
  let streak = 0;
  const check = new Date(now);
  // Start from today
  for (let i = 0; i < 365; i++) {
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (recordDates.has(key)) {
      streak++;
    } else if (i === 0) {
      // today has no record, that's ok, keep checking yesterday
    } else {
      break;
    }
    check.setDate(check.getDate() - 1);
  }

  const cropCounts = Array.from(cropMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRecords: records.length,
    totalCrops: cropMap.size,
    totalPlots: plotSet.size,
    cropCounts,
    recentStreak: streak,
    thisMonthCount,
  };
}

export async function getUserPlotOptions(userId: string): Promise<string[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  const plotSet = new Set<string>();
  for (const d of snapshot.docs) {
    const plotId = d.data().plotId;
    if (plotId) plotSet.add(plotId);
  }
  return Array.from(plotSet).sort();
}

export async function getLastRecordDefaults(userId: string): Promise<{ plotId: string } | null> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  return { plotId: data.plotId || "" };
}

export async function getUserRecordsByMonth(
  userId: string,
  year: number,
  month: number
): Promise<GrowthRecord[]> {
  const db = getFirebaseDb();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 1);
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("userId", "==", userId),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<", Timestamp.fromDate(endDate)),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GrowthRecord));
}
