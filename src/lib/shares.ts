import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { Share, ShareVisibility } from "@/types/record";

const SHARES_COLLECTION = "shares";

export async function createShare(
  recordDocId: string,
  userId: string,
  visibility: ShareVisibility = "link_only"
): Promise<Share> {
  const db = getFirebaseDb();

  // Check if share already exists for this record
  const existing = await getShareByRecord(recordDocId);
  if (existing) return existing;

  const shareId = crypto.randomUUID().replace(/-/g, "").substring(0, 12);
  const share: Omit<Share, "id"> = {
    recordDocId,
    userId,
    shareId,
    visibility,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, SHARES_COLLECTION), share);

  // Mark the record as shared for Firestore security rules
  await updateDoc(doc(db, "records", recordDocId), { shared: true });

  return { id: docRef.id, ...share };
}

export async function getShareByShareId(shareId: string): Promise<Share | null> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, SHARES_COLLECTION),
    where("shareId", "==", shareId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Share;
}

export async function getShareByRecord(recordDocId: string): Promise<Share | null> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, SHARES_COLLECTION),
    where("recordDocId", "==", recordDocId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Share;
}

export async function deleteShare(shareDocId: string): Promise<void> {
  const db = getFirebaseDb();

  // Get the share to find the recordDocId
  const shareDoc = await getDoc(doc(db, SHARES_COLLECTION, shareDocId));
  if (shareDoc.exists()) {
    const recordDocId = shareDoc.data().recordDocId;
    // Unmark the record as shared
    await updateDoc(doc(db, "records", recordDocId), { shared: false });
  }

  await deleteDoc(doc(db, SHARES_COLLECTION, shareDocId));
}

export async function getSharedRecord(shareId: string) {
  const share = await getShareByShareId(shareId);
  if (!share) return null;

  const db = getFirebaseDb();
  const recordDoc = await getDoc(doc(db, "records", share.recordDocId));
  if (!recordDoc.exists()) return null;

  return {
    share,
    record: { id: recordDoc.id, ...recordDoc.data() },
  };
}
