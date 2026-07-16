import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { AdminDashboard } from "../../components/dashboard/AdminDashboard";

export function meta() {
  return [
    { title: "SafeSchool Hub - Bảng điều khiển Quản trị" },
  ];
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
