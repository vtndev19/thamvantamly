/** Payload gửi câu hỏi lên Realtime Database */
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

/** Dữ liệu một câu hỏi trả về từ Realtime Database */
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

/**
 * Gửi câu hỏi mới lên Firebase Realtime Database.
 * @returns ID (push key) của bản ghi vừa tạo
 */
export function submitQuestion(payload: SubmitQuestionPayload): Promise<string>;

/**
 * One-time fetch: lấy tất cả câu hỏi của một user (theo UID).
 */
export function getQuestionsByUser(uid: string): Promise<QuestionRecord[]>;

/**
 * One-time fetch: lấy một câu hỏi theo ID.
 */
export function getQuestionById(questionId: string): Promise<QuestionRecord | null>;

/**
 * Listener realtime: lắng nghe câu hỏi của user, gọi callback mỗi khi có thay đổi.
 * @returns Hàm unsubscribe – gọi để tắt listener
 */
export function subscribeToUserQuestions(
  uid: string,
  callback: (questions: QuestionRecord[]) => void
): () => void;

/**
 * Format Unix timestamp (ms) sang chuỗi "HH:mm DD/MM/YYYY" tiếng Việt.
 */
export function formatQuestionDate(timestamp: number): string;
