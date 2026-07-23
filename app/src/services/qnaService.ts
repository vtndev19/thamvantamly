/**
 * qnaService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Dịch vụ xử lý câu hỏi Q&A học sinh ↔ Firebase Realtime Database
 *
 * Cấu trúc node trong Realtime Database:
 *
 * student_questions/
 *   {questionId}/
 *     id             : string   – ID tự sinh (push key)
 *     question       : string   – Nội dung câu hỏi
 *     category       : string   – Chủ đề (Tâm lý / Học tập / ...)
 *     isAnonymous    : boolean  – Hỏi ẩn danh hay không
 *     status         : string   – "Đang chờ duyệt" | "Đang xử lý" | "Đã trả lời"
 *     createdAt      : number   – Unix timestamp (ms)
 *     answer         : string | null  – Phản hồi từ chuyên gia
 *     answeredAt     : number | null  – Timestamp khi chuyên gia trả lời
 *     answeredBy     : string | null  – Tên / UID chuyên gia
 *     // Chỉ có khi isAnonymous = false:
 *     senderUid      : string | null
 *     senderName     : string | null
 *     senderEmail    : string | null
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  ref,
  push,
  set,
  get,
  query,
  orderByChild,
  equalTo,
  onValue,
  off,
  type DataSnapshot,
} from "firebase/database";
import { database } from "../config/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Dữ liệu một câu hỏi lưu trên Realtime Database */
export interface QuestionRecord {
  id: string;
  question: string;
  category: string;
  isAnonymous: boolean;
  status: "Đang xử lý" | "Đã trả lời";
  createdAt: number;
  answer: string | null;
  answeredAt: number | null;
  answeredBy: string | null;
  senderUid: string | null;
  senderName: string | null;
  senderEmail: string | null;
}

/** Payload gửi câu hỏi mới */
export interface SubmitQuestionPayload {
  question: string;
  category: string;
  isAnonymous: boolean;
  sender: {
    uid: string | null;
    displayName: string | null;
    email: string | null;
  } | null;
}

/** Node gốc lưu tất cả câu hỏi */
const QUESTIONS_NODE = "student_questions";

// ─────────────────────────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gửi một câu hỏi mới lên Realtime Database.
 * @returns ID (push key) của bản ghi vừa tạo
 */
export async function submitQuestion({
  question,
  category,
  isAnonymous,
  sender,
}: SubmitQuestionPayload): Promise<string> {
  const questionsRef = ref(database, QUESTIONS_NODE);
  const newQuestionRef = push(questionsRef);
  const questionId = newQuestionRef.key as string;

  /** Dữ liệu cơ bản – luôn ghi, bất kể ẩn danh hay không */
  const baseData: Omit<QuestionRecord, "senderUid" | "senderName" | "senderEmail"> = {
    id: questionId,
    question: question.trim(),
    category,
    isAnonymous,
    status: "Đang xử lý",
    createdAt: Date.now(),
    answer: null,
    answeredAt: null,
    answeredBy: null,
  };

  /** Chỉ đính kèm thông tin người dùng khi KHÔNG ẩn danh */
  const senderData: Pick<QuestionRecord, "senderUid" | "senderName" | "senderEmail"> =
    !isAnonymous && sender
      ? {
          senderUid: sender.uid ?? null,
          senderName: sender.displayName ?? "Học sinh",
          senderEmail: sender.email ?? null,
        }
      : {
          senderUid: null,
          senderName: null,
          senderEmail: null,
        };

  await set(newQuestionRef, { ...baseData, ...senderData });
  return questionId;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ (one-time)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lấy toàn bộ câu hỏi của một người dùng (theo UID), sắp xếp mới nhất trước.
 * Chỉ trả về câu hỏi KHÔNG ẩn danh (vì câu ẩn danh không lưu UID).
 */
export async function getQuestionsByUser(uid: string): Promise<QuestionRecord[]> {
  const questionsRef = ref(database, QUESTIONS_NODE);
  const userQuery = query(questionsRef, orderByChild("senderUid"), equalTo(uid));

  const snapshot: DataSnapshot = await get(userQuery);
  if (!snapshot.exists()) return [];

  const items: QuestionRecord[] = [];
  snapshot.forEach((child) => {
    items.push(child.val() as QuestionRecord);
  });

  return items.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Lấy một câu hỏi theo ID.
 */
export async function getQuestionById(questionId: string): Promise<QuestionRecord | null> {
  const snapshot = await get(ref(database, `${QUESTIONS_NODE}/${questionId}`));
  return snapshot.exists() ? (snapshot.val() as QuestionRecord) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REALTIME LISTENER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lắng nghe realtime câu hỏi của một user cụ thể.
 * Gọi `callback` mỗi khi có thay đổi (ví dụ chuyên gia trả lời).
 * @returns Hàm unsubscribe – gọi để tắt listener
 */
export function subscribeToUserQuestions(
  uid: string,
  callback: (questions: QuestionRecord[]) => void
): () => void {
  const questionsRef = ref(database, QUESTIONS_NODE);
  const userQuery = query(questionsRef, orderByChild("senderUid"), equalTo(uid));

  const handler = (snapshot: DataSnapshot): void => {
    const items: QuestionRecord[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        items.push(child.val() as QuestionRecord);
      });
    }
    callback(items.sort((a, b) => b.createdAt - a.createdAt));
  };

  onValue(userQuery, handler);

  return () => off(userQuery, "value", handler);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format Unix timestamp (ms) → chuỗi "HH:mm DD/MM/YYYY" tiếng Việt.
 * Ví dụ: "14:30 21/07/2026"
 */
export function formatQuestionDate(timestamp: number): string {
  const d = new Date(timestamp);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("vi-VN");
  return `${time} ${date}`;
}
