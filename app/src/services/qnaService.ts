/**
 * qnaService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Dịch vụ xử lý câu hỏi và bình luận Q&A học sinh ↔ Firebase Firestore
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Dữ liệu một câu hỏi (bài viết Q&A) trên Firestore */
export interface QuestionRecord {
  id: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  senderUid: string;
  senderName: string;
  senderRole: string;
  createdAt: number;
  commentCount: number;
}

/** Dữ liệu một bình luận trên Firestore */
export interface QnaComment {
  id: string;
  postId: string;
  content: string;
  senderUid: string;
  senderName: string;
  senderRole: string;
  senderPhotoURL?: string;
  createdAt: number;
}

/** Payload gửi câu hỏi mới */
export interface SubmitQuestionPayload {
  question: string;
  category: string;
  isAnonymous: boolean;
  sender: {
    uid: string;
    displayName: string | null;
    role: string;
  };
}

const QNA_COLLECTION = "qna_posts";

// ─────────────────────────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gửi một câu hỏi mới lên Firestore.
 * @returns ID của bản ghi vừa tạo
 */
export async function submitQuestion({
  question,
  category,
  isAnonymous,
  sender,
}: SubmitQuestionPayload): Promise<string> {
  const qnaRef = collection(db, QNA_COLLECTION);
  const newDocRef = doc(qnaRef);
  const postId = newDocRef.id;

  const postData: QuestionRecord = {
    id: postId,
    content: question.trim(),
    category,
    isAnonymous,
    senderUid: sender.uid,
    senderName: isAnonymous ? "Người dùng ẩn danh" : (sender.displayName || "Học sinh"),
    senderRole: isAnonymous ? "student" : sender.role,
    createdAt: Date.now(),
    commentCount: 0,
  };

  await setDoc(newDocRef, postData);
  return postId;
}

/**
 * Thêm bình luận giải đáp mới vào bài đăng câu hỏi.
 */
export async function addQnaComment(
  postId: string,
  data: {
    content: string;
    senderUid: string;
    senderName: string;
    senderRole: string;
    senderPhotoURL?: string;
  }
): Promise<string> {
  const commentsRef = collection(db, QNA_COLLECTION, postId, "comments");
  const newCommentRef = doc(commentsRef);
  const commentId = newCommentRef.id;

  const commentData: QnaComment = {
    id: commentId,
    postId,
    content: data.content.trim(),
    senderUid: data.senderUid,
    senderName: data.senderName,
    senderRole: data.senderRole,
    senderPhotoURL: data.senderPhotoURL || "",
    createdAt: Date.now(),
  };

  // 1. Ghi nhận bình luận
  await setDoc(newCommentRef, commentData);

  // 2. Tăng số lượng bình luận ở bài viết gốc
  const postRef = doc(db, QNA_COLLECTION, postId);
  await updateDoc(postRef, {
    commentCount: increment(1),
  });

  return commentId;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ & LISTENERS (realtime)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lắng nghe realtime danh sách toàn bộ câu hỏi cộng đồng.
 */
export function subscribeToAllQuestions(
  category: string,
  callback: (questions: QuestionRecord[]) => void
): () => void {
  const qnaRef = collection(db, QNA_COLLECTION);
  let q = query(qnaRef, orderBy("createdAt", "desc"));
  
  if (category && category !== "Tất cả") {
    q = query(qnaRef, where("category", "==", category), orderBy("createdAt", "desc"));
  }

  return onSnapshot(q, (snapshot) => {
    const items: QuestionRecord[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as QuestionRecord);
    });
    callback(items);
  }, (err) => {
    console.error("Lỗi realtime subscribeToAllQuestions:", err);
  });
}

/**
 * Lắng nghe realtime câu hỏi của một user cụ thể (chỉ dành cho lịch sử cá nhân).
 */
export function subscribeToUserQuestions(
  uid: string,
  callback: (questions: QuestionRecord[]) => void
): () => void {
  const qnaRef = collection(db, QNA_COLLECTION);
  const q = query(
    qnaRef, 
    where("senderUid", "==", uid), 
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const items: QuestionRecord[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as QuestionRecord);
    });
    callback(items);
  }, (err) => {
    console.error("Lỗi realtime subscribeToUserQuestions:", err);
  });
}

/**
 * Lắng nghe realtime danh sách bình luận của một bài viết.
 */
export function subscribeToQnaComments(
  postId: string,
  callback: (comments: QnaComment[]) => void
): () => void {
  const commentsRef = collection(db, QNA_COLLECTION, postId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const items: QnaComment[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as QnaComment);
    });
    callback(items);
  }, (err) => {
    console.error("Lỗi realtime subscribeToQnaComments:", err);
  });
}

/**
 * Lấy một câu hỏi theo ID.
 */
export async function getQuestionById(questionId: string): Promise<QuestionRecord | null> {
  const docRef = doc(db, QNA_COLLECTION, questionId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as QuestionRecord) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format Unix timestamp (ms) → chuỗi "HH:mm DD/MM/YYYY" tiếng Việt.
 */
export function formatQuestionDate(timestamp: number): string {
  const d = new Date(timestamp);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("vi-VN");
  return `${time} ${date}`;
}
