import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../src/contexts/AuthContext";
import type { UserRole } from "../../src/types/user.types";

interface ProtectedRouteProps {
  /** Nội dung cần bảo vệ */
  children: ReactNode;
  /** Danh sách role được phép vào. Nếu không truyền → chỉ cần đăng nhập. */
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute – Bọc route để bảo vệ theo trạng thái đăng nhập & role.
 *
 * - Chưa đăng nhập  → redirect về /auth/login (kèm ?redirect=...)
 * - Đã đăng nhập nhưng role không phù hợp → redirect về /unauthorized
 * - OK → render children
 */
export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Đang tải trạng thái auth → hiển thị màn hình chờ
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Chưa đăng nhập → về trang login
  if (!user) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Kiểm tra role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// ── Loading Screen ─────────────────────────────────────────────────────────────

function AuthLoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background, #0f0f1a)",
        gap: "16px",
      }}
    >
      <div className="auth-loading-spinner" />
      <p
        style={{
          color: "var(--color-on-surface-variant, #a0a0b0)",
          fontSize: "14px",
        }}
      >
        Đang xác thực…
      </p>
    </div>
  );
}
