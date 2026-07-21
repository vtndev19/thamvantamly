import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // ── Public routes ──────────────────────────────────────────────────────
  index("routes/home.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("unauthorized", "routes/unauthorized.tsx"),

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
  route("student/reports", "routes/student/reports.tsx"),
  route("student/profile", "routes/student/profile.tsx"),
  route("student/history", "routes/student/history.tsx"),
  route("student/qna", "routes/student/qna.tsx"),
] satisfies RouteConfig;
