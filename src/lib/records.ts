import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  updateDoc,
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
    createdAt: Timestamp.now(),
    crop: input.crop,
    variety: input.variety,
    plotId: input.plotId,
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

  if (data.crop !== undefined) updateData.crop = data.crop;
  if (data.variety !== undefined) updateData.variety = data.variety;
  if (data.plotId !== undefined) updateData.plotId = data.plotId;
  if (data.memo !== undefined) updateData.memo = data.memo;
  if (data.actions !== undefined) updateData.actions = data.actions;

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
