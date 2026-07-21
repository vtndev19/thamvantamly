import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // ── Public routes ──────────────────────────────────────────────────────
  index("routes/home.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("unauthorized", "routes/unauthorized.tsx"),

<<<<<<< HEAD
  // ── Protected dashboard routes (guarded by ProtectedRoute) ────────────
  route("dashboard/student", "routes/dashboard/student.tsx"),
  route("dashboard/teacher", "routes/dashboard/teacher.tsx"),
  route("dashboard/admin", "routes/dashboard/admin.tsx"),

  // ── Legacy routes (giữ tương thích) ───────────────────────────────────
  route("admin/dashboard", "routes/admin/dashboard.tsx"),
  route("student/dashboard", "routes/student/dashboard.tsx"),
  route("student/support", "routes/student/support.tsx"),
=======
  // ── Admin routes ───────────────────────────────────────────────────────
  route("admin/dashboard", "routes/admin/dashboard.tsx"),
  route("admin/users", "routes/admin/users.tsx"),
  route("admin/reports", "routes/admin/reports.tsx"),
  route("admin/settings", "routes/admin/settings.tsx"),

  // ── Teacher routes ─────────────────────────────────────────────────────
  route("teacher/dashboard", "routes/teacher/dashboard.tsx"),
  route("teacher/classes", "routes/teacher/classes.tsx"),
  route("teacher/students", "routes/teacher/students.tsx"),
  route("teacher/support", "routes/teacher/support.tsx"),

  // ── Student routes ─────────────────────────────────────────────────────
  route("student/dashboard", "routes/student/dashboard.tsx"),
  route("student/support", "routes/student/support.tsx"),
  route("student/profile", "routes/student/profile.tsx"),
  route("student/history", "routes/student/history.tsx"),
>>>>>>> 6abb79401787d0ec16d282da741b5bb2f028ca2d
] satisfies RouteConfig;
