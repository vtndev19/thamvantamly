import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { StudentDashboard } from "../../components/dashboard/StudentDashboard";

export function meta() {
  return [
    { title: "SafeSchool Hub - Tổng quan Học sinh" },
    { name: "description", content: "Bảng điều khiển học sinh SafeSchool Hub" },
  ];
}

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboard />
    </ProtectedRoute>
  );
}
