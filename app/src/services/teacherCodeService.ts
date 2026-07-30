import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";

const TEACHER_CODES_COLLECTION = "teacherCodes";
const DEFAULT_FALLBACK_CODE = "GV-SAFESCHOOL-2026";

export interface TeacherCodeDoc {
  code: string;
  isUsed: boolean;
  assignedTo?: string | null;
  createdAt: number;
}

/**
 * Kiểm tra xem mã Giáo viên có hợp lệ hay không.
 * Hỗ trợ kiểm tra từ Firestore và tự động chấp nhận định dạng mã chuẩn (GV001 - GV999).
 */
export async function verifyTeacherCode(code: string): Promise<boolean> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return false;

  // 1. Kiểm tra định dạng chuẩn GV001 -> GV999 hoặc mã dự phòng
  const isStandardPattern =
    /^GV\d{3,4}$/.test(cleanCode) ||
    cleanCode === DEFAULT_FALLBACK_CODE.toUpperCase();

  try {
    const codeRef = doc(db, TEACHER_CODES_COLLECTION, cleanCode);
    const snapshot = await getDoc(codeRef);

    if (snapshot.exists()) {
      return true;
    }
  } catch (err) {
    console.warn("Chưa đăng nhập hoặc bị giới hạn Firestore, kiểm tra theo định dạng mã:", err);
  }

  // Nếu là mã định dạng chuẩn GV001, GV002... thì luôn cho phép đăng ký
  if (isStandardPattern) {
    return true;
  }

  return false;
}

/**
 * Khởi tạo danh sách mã Giáo viên tăng dần (GV001, GV002, GV003...) trên Firebase Firestore.
 * Nêu mã đã tồn tại sẽ không ghi đè.
 * @param count Số lượng mã cần tạo (mặc định 50 mã từ GV001 đến GV050)
 */
export async function seedTeacherCodes(count: number = 50): Promise<number> {
  let createdCount = 0;
  try {
    for (let i = 1; i <= count; i++) {
      const numStr = i.toString().padStart(3, "0");
      const code = `GV${numStr}`;

      const codeRef = doc(db, TEACHER_CODES_COLLECTION, code);
      try {
        const snap = await getDoc(codeRef);
        if (!snap.exists()) {
          await setDoc(codeRef, {
            code,
            isUsed: false,
            assignedTo: null,
            createdAt: Date.now(),
          });
          createdCount++;
        }
      } catch (err: any) {
        if (err?.code === "permission-denied" || err?.message?.includes("permissions")) {
          throw new Error(
            "Lỗi phân quyền Firestore (Missing or insufficient permissions). Bạn cần mở thêm Rule cho 'teacherCodes' trên Firebase Console."
          );
        }
      }
    }
  } catch (error: any) {
    console.error("Lỗi khi tạo mã giáo viên:", error);
    throw error;
  }
  return createdCount;
}

/**
 * Lấy tất cả các mã Giáo viên đang có trên Firebase Firestore
 */
export async function getAllTeacherCodes(): Promise<TeacherCodeDoc[]> {
  try {
    const codesRef = collection(db, TEACHER_CODES_COLLECTION);
    const snapshot = await getDocs(codesRef);
    return snapshot.docs.map((doc) => doc.data() as TeacherCodeDoc);
  } catch (err) {
    console.error("Lỗi lấy danh sách mã giáo viên:", err);
    return [];
  }
}
