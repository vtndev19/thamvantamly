import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getUsersBySchoolCode } from "./userService";

// ── Collections ────────────────────────────────────────────────────────────────
const NEWS_POSTS_COLLECTION = "news_posts";
const STUDENT_NOTIFICATIONS_COLLECTION = "student_notifications";

// ── Types ──────────────────────────────────────────────────────────────────────

export type NewsCategory = "news" | "event";

export interface NewsPostInput {
  teacherUid: string;
  teacherName: string;
  schoolCode: string;
  title: string;
  content: string;
  category: NewsCategory;
  isBroadcast: boolean; // ← Checkbox "Thông báo chung"
}

export interface NewsPost extends NewsPostInput {
  id: string;
  createdAt: number;
}

export interface StudentNotification {
  id?: string;
  studentUid: string;
  schoolCode: string;
  newsPostId: string;
  title: string;
  message: string;
  category: NewsCategory;
  senderName: string;
  isRead: boolean;
  createdAt: number;
}

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  news: "Tin tức",
  event: "Sự kiện",
};

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Tạo bài viết Tin tức & Sự kiện mới.
 * Nếu `isBroadcast === true`, tự động gửi thông báo đến tất cả học sinh
 * có cùng mã THPT (schoolCode) với giáo viên.
 */
export async function createNewsPost(
  input: NewsPostInput
): Promise<string> {
  try {
    const postsRef = collection(db, NEWS_POSTS_COLLECTION);
    const newPost = {
      teacherUid: input.teacherUid,
      teacherName: input.teacherName,
      schoolCode: input.schoolCode.trim(),
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
      isBroadcast: input.isBroadcast,
      createdAt: Date.now(),
    };

    const docRef = await addDoc(postsRef, newPost);
    const postId = docRef.id;

    // ── Gửi thông báo chung nếu checkbox được tick ──────────────────────────
    if (input.isBroadcast && input.schoolCode.trim()) {
      try {
        const students = await getUsersBySchoolCode(
          input.schoolCode.trim(),
          "student"
        );
        const notifsRef = collection(db, STUDENT_NOTIFICATIONS_COLLECTION);

        for (const student of students) {
          await addDoc(notifsRef, {
            studentUid: student.uid,
            schoolCode: input.schoolCode.trim(),
            newsPostId: postId,
            title: `📢 [${CATEGORY_LABELS[input.category]}] ${input.title.trim()}`,
            message: input.content.trim().slice(0, 200) +
              (input.content.trim().length > 200 ? "…" : ""),
            category: input.category,
            senderName: input.teacherName,
            isRead: false,
            createdAt: Date.now(),
          } satisfies Omit<StudentNotification, "id">);
        }

        console.log(
          `✅ Đã gửi thông báo chung đến ${students.length} học sinh (${input.schoolCode.trim()})`
        );
      } catch (err) {
        console.warn(
          "Không thể gửi thông báo chung cho học sinh do quy tắc Firestore:",
          err
        );
      }
    }

    return postId;
  } catch (error: any) {
    console.error("Lỗi Firestore khi tạo bài viết:", error);
    if (
      error?.code === "permission-denied" ||
      error?.message?.includes("permissions")
    ) {
      throw new Error(
        "Lỗi phân quyền Firebase. Vui lòng cập nhật Rules trong Firebase Console để cho phép ghi dữ liệu vào 'news_posts' và 'student_notifications'."
      );
    }
    throw error;
  }
}

/**
 * Lấy danh sách bài viết Tin tức & Sự kiện theo mã THPT.
 * Trả về kết quả sắp xếp mới nhất trước.
 */
export async function getNewsBySchoolCode(
  schoolCode: string
): Promise<NewsPost[]> {
  const targetCode = schoolCode?.trim() || "";
  if (!targetCode) return [];

  const postsRef = collection(db, NEWS_POSTS_COLLECTION);

  try {
    const q = query(
      postsRef,
      where("schoolCode", "==", targetCode)
    );
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<NewsPost, "id">),
    }));

    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Lỗi getNewsBySchoolCode:", err);
    return [];
  }
}

/**
 * Lấy danh sách thông báo của học sinh (theo UID).
 * Trả về sắp xếp mới nhất trước.
 */
export async function getStudentNotifications(
  studentUid: string
): Promise<StudentNotification[]> {
  if (!studentUid) return [];

  const notifsRef = collection(db, STUDENT_NOTIFICATIONS_COLLECTION);
  const q = query(notifsRef, where("studentUid", "==", studentUid));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<StudentNotification, "id">),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Lắng nghe realtime danh sách thông báo của học sinh.
 * Trả về hàm unsubscribe để hủy listener.
 */
export function listenStudentNotifications(
  studentUid: string,
  callback: (notifications: StudentNotification[]) => void
): Unsubscribe {
  const notifsRef = collection(db, STUDENT_NOTIFICATIONS_COLLECTION);
  const q = query(notifsRef, where("studentUid", "==", studentUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<StudentNotification, "id">),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      callback(results);
    },
    (error) => {
      console.error("Lỗi lắng nghe student_notifications:", error);
    }
  );
}

/**
 * Đánh dấu thông báo là đã đọc.
 */
export async function markNotificationAsRead(
  notifId: string
): Promise<void> {
  if (!notifId) return;
  const notifRef = doc(db, STUDENT_NOTIFICATIONS_COLLECTION, notifId);
  await updateDoc(notifRef, { isRead: true });
}

/**
 * Đánh dấu tất cả thông báo của học sinh là đã đọc.
 */
export async function markAllNotificationsAsRead(
  studentUid: string
): Promise<void> {
  if (!studentUid) return;

  const notifsRef = collection(db, STUDENT_NOTIFICATIONS_COLLECTION);
  const q = query(
    notifsRef,
    where("studentUid", "==", studentUid),
    where("isRead", "==", false)
  );
  const snapshot = await getDocs(q);

  const updates = snapshot.docs.map((docSnap) =>
    updateDoc(doc(db, STUDENT_NOTIFICATIONS_COLLECTION, docSnap.id), {
      isRead: true,
    })
  );

  await Promise.all(updates);
}
