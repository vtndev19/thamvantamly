import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // ── Public routes ──────────────────────────────────────────────────────
  index("routes/home.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("unauthorized", "routes/unauthorized.tsx"),

  // ── Protected dashboard routes (guarded by ProtectedRoute) ────────────
  route("dashboard/student", "routes/dashboard/student.tsx"),
  route("dashboard/teacher", "routes/dashboard/teacher.tsx"),
  route("dashboard/admin", "routes/dashboard/admin.tsx"),

  // ── Legacy routes (giữ tương thích) ───────────────────────────────────
  route("admin/dashboard", "routes/admin/dashboard.tsx"),
  route("student/dashboard", "routes/student/dashboard.tsx"),
  route("student/support", "routes/student/support.tsx"),
] satisfies RouteConfig;
