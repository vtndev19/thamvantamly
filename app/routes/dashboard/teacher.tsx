import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { TeacherDashboard } from "../../components/dashboard/TeacherDashboard";

export function meta() {
  return [
    { title: "SafeSchool Hub - Bảng điều khiển Giáo viên" },
  ];
}

export default function TeacherDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TeacherDashboard />
    </ProtectedRoute>
  );
}
