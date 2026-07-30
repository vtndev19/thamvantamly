import { Link } from "react-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ROLE_CONFIG } from "../../src/types/user.types";

export function Unauthorized() {
  const { user } = useAuth();

  // Nếu đã đăng nhập → link về dashboard của họ; nếu chưa → về login
  const backTo = user
    ? { path: ROLE_CONFIG[user.role].dashboardPath, label: "Về Dashboard của tôi" }
    : { path: "/auth/login", label: "Đăng nhập" };

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <span className="material-symbols-outlined unauthorized-icon" aria-hidden="true">
          lock
        </span>

        <h1 className="unauthorized-title">Không có quyền truy cập</h1>

        <p className="unauthorized-desc">
          Bạn không có quyền xem trang này.
          {user && (
            <>
              {" "}Vai trò hiện tại của bạn là{" "}
              <strong style={{ color: ROLE_CONFIG[user.role].color }}>
                {ROLE_CONFIG[user.role].label}
              </strong>
              .
            </>
          )}
        </p>

        {/* Role info chips */}
        {user && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            {(["student", "teacher", "admin"] as const).map((role) => (
              <span
                key={role}
                className={`role-pill role-pill--${role}`}
                style={{ padding: "6px 14px", borderRadius: 12, opacity: user.role === role ? 1 : 0.35 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle" }}>
                  {ROLE_CONFIG[role].icon}
                </span>{" "}
                {ROLE_CONFIG[role].label}
              </span>
            ))}
          </div>
        )}

        <Link to={backTo.path} className="unauthorized-btn">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          {backTo.label}
        </Link>
      </div>
    </div>
  );
}
