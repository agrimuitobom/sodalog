import {
  collection,
  addDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { Comment } from "@/types/record";

const COMMENTS_COLLECTION = "comments";

export async function addComment(
  recordDocId: string,
  userId: string,
  userName: string,
  userPhoto: string,
  text: string
): Promise<Comment> {
  const db = getFirebaseDb();
  const comment: Omit<Comment, "id"> = {
    recordDocId,
    userId,
    userName,
    userPhoto,
    text,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), comment);
  return { id: docRef.id, ...comment };
}

export async function getCommentsByRecord(recordDocId: string): Promise<Comment[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where("recordDocId", "==", recordDocId),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
}

export async function deleteComment(commentDocId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COMMENTS_COLLECTION, commentDocId));
}
