/**
 * Các vai trò người dùng trong hệ thống SafeSchool Hub
 */
export type UserRole = "student" | "teacher" | "doctor" | "admin";

/**
 * Thông tin người dùng trong ứng dụng (đọc từ Firestore)
 */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  schoolCode?: string;
  phone?: string;
  photoURL?: string;
  licenseNumber?: string;
  hospital?: string;
  specialization?: string;
  proofUrl?: string;
  createdAt: number; // Unix timestamp (ms)
}

/**
 * Dữ liệu profile lưu vào Firestore collection `users/{uid}`
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  schoolCode?: string;
  phone?: string;
  photoURL?: string;
  licenseNumber?: string;
  hospital?: string;
  specialization?: string;
  proofUrl?: string;
  createdAt: number;
}

/**
 * Cấu hình hiển thị cho từng role
 */
export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; icon: string; color: string; dashboardPath: string }
> = {
  student: {
    label: "Học sinh",
    icon: "school",
    color: "#4f46e5",
    dashboardPath: "/student/dashboard",
  },
  teacher: {
    label: "Giáo viên",
    icon: "person_4",
    color: "#059669",
    dashboardPath: "/teacher/dashboard",
  },
  doctor: {
    label: "Bác sĩ tâm lý",
    icon: "health_and_safety",
    color: "#0058bd",
    dashboardPath: "/doctor/dashboard",
  },
  admin: {
    label: "Quản trị viên",
    icon: "admin_panel_settings",
    color: "#dc2626",
    dashboardPath: "/admin/dashboard",
  },
};
