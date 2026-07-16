import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("admin/dashboard", "routes/admin/dashboard.tsx"),
  route("student/dashboard", "routes/student/dashboard.tsx"),
  route("student/support", "routes/student/support.tsx"),
] satisfies RouteConfig;