/**
 * Các vai trò người dùng trong hệ thống SafeSchool Hub
 */
export type UserRole = "student" | "teacher" | "admin";

/**
 * Thông tin người dùng trong ứng dụng (đọc từ Firestore)
 */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  schoolCode?: string;
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
    dashboardPath: "/dashboard/student",
  },
  teacher: {
    label: "Giáo viên",
    icon: "person_4",
    color: "#059669",
    dashboardPath: "/dashboard/teacher",
  },
  admin: {
    label: "Quản trị viên",
    icon: "admin_panel_settings",
    color: "#dc2626",
    dashboardPath: "/dashboard/admin",
  },
};
