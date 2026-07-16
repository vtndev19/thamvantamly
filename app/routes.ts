import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
<<<<<<< HEAD
  route("student/dashboard", "routes/student/dashboard.tsx"),
=======
  route("auth/register", "routes/auth/register.tsx"),
>>>>>>> f3190dc59cad31921c43168efb47de439199bf06
] satisfies RouteConfig;
