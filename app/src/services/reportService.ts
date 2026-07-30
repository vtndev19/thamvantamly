import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getUsersBySchoolCode } from "./userService";

const REPORTS_COLLECTION = "reports";
const NOTIFICATIONS_COLLECTION = "notifications";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export interface IncidentReportInput {
  studentId: string;
  studentName: string;
  schoolCode: string;
  title: string;
  description: string;
  location?: string;
  urgency: UrgencyLevel;
  isAnonymous: boolean;
}

export interface IncidentReport extends IncidentReportInput {
  id: string;
  status: "pending" | "processing" | "resolved";
  createdAt: number;
}

export interface TeacherNotification {
  id?: string;
  teacherUid: string;
  schoolCode: string;
  reportId: string;
  title: string;
  message: string;
  urgency: UrgencyLevel;
  isRead: boolean;
  createdAt: number;
}

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Rất nguy hiểm",
};

/**
 * Tạo báo cáo vụ việc bạo lực học đường.
 * Tự động gửi thông báo đến tất cả giáo viên có cùng mã THPT trong hệ thống.
 */
export async function createIncidentReport(
  input: IncidentReportInput
): Promise<string> {
  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
    const newReport = {
      studentId: input.studentId,
      studentName: input.isAnonymous ? "Học sinh ẩn danh" : input.studentName,
      schoolCode: input.schoolCode.trim(),
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location?.trim() || "Chưa rõ",
      urgency: input.urgency,
      isAnonymous: input.isAnonymous,
      status: "pending",
      createdAt: Date.now(),
    };

    const docRef = await addDoc(reportsRef, newReport);
    const reportId = docRef.id;

    // Lấy danh sách tất cả giáo viên thuộc cùng trường (schoolCode)
    if (input.schoolCode.trim()) {
      try {
        const teachers = await getUsersBySchoolCode(input.schoolCode.trim(), "teacher");
        const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);

        for (const teacher of teachers) {
          await addDoc(notificationsRef, {
            teacherUid: teacher.uid,
            schoolCode: input.schoolCode.trim(),
            reportId,
            title: `⚠️ Báo cáo bạo lực học đường [${input.schoolCode.trim()}]`,
            message: `Có phản ánh mới về: "${input.title}". Người gửi: ${
              input.isAnonymous ? "Học sinh ẩn danh" : input.studentName
            }. Mức độ: ${URGENCY_LABELS[input.urgency]}`,
            urgency: input.urgency,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn("Không thể tự động gửi thông báo cho giáo viên do quy tắc Firestore:", err);
      }
    }

    return reportId;
  } catch (error: any) {
    console.error("Lỗi Firestore khi tạo báo cáo:", error);
    if (error?.code === "permission-denied" || error?.message?.includes("permissions")) {
      throw new Error(
        "Lỗi phân quyền Firebase (Missing or insufficient permissions). Vui lòng cập nhật Rules trong Firebase Console để cho phép ghi dữ liệu."
      );
    }
    throw error;
  }
}

/**
 * Lấy danh sách báo cáo thuộc trường học (cho Giáo viên/Admin)
 * Tự động chuẩn hóa chuỗi và fallback nếu không khớp tuyệt đối.
 */
export async function getReportsBySchoolCode(
  schoolCode: string
): Promise<IncidentReport[]> {
  const targetCode = schoolCode?.trim() || "THPT001";
  const reportsRef = collection(db, REPORTS_COLLECTION);

  try {
    const q = query(reportsRef, where("schoolCode", "==", targetCode));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<IncidentReport, "id">),
    }));

    // Nếu không tìm thấy bằng so sánh chính xác, lấy tất cả và lọc không phân biệt hoa thường
    if (results.length === 0) {
      const allSnap = await getDocs(reportsRef);
      results = allSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<IncidentReport, "id">),
        }))
        .filter(
          (r) =>
            r.schoolCode?.trim().toUpperCase() === targetCode.toUpperCase() ||
            !r.schoolCode
        );
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Lỗi getReportsBySchoolCode:", err);
    return [];
  }
}

/**
 * Lấy danh sách báo cáo do một học sinh cụ thể gửi (dựa theo studentId/uid)
 */
export async function getReportsByStudentId(
  studentId: string
): Promise<IncidentReport[]> {
  if (!studentId) return [];
  const reportsRef = collection(db, REPORTS_COLLECTION);
  const q = query(reportsRef, where("studentId", "==", studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<IncidentReport, "id">),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Lấy danh sách thông báo dành cho Giáo viên theo UID
 */
export async function getTeacherNotifications(
  teacherUid: string
): Promise<TeacherNotification[]> {
  if (!teacherUid) return [];
  const notifsRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(
    notifsRef,
    where("teacherUid", "==", teacherUid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TeacherNotification, "id">),
  }));
}

/**
 * Cập nhật trạng thái xử lý phản ánh bạo lực (pending | processing | resolved)
 */
export async function updateReportStatus(
  reportId: string,
  status: "pending" | "processing" | "resolved"
): Promise<void> {
  if (!reportId) return;
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(reportRef, { status });
}
