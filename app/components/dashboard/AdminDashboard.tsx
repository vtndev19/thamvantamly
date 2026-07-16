import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { updateUserRole } from "../../src/services/userService";
import type { UserRole } from "../../src/types/user.types";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

type MockUser = { uid: string; name: string; email: string; role: UserRole; joined: string };

const MOCK_USERS: MockUser[] = [
  { uid: "uid-001", name: "Nguyễn Văn An", email: "an.nguyen@student.edu.vn", role: "student", joined: "01/07/2026" },
  { uid: "uid-002", name: "Trần Thị Bình", email: "binh.tran@teacher.edu.vn", role: "teacher", joined: "28/06/2026" },
  { uid: "uid-003", name: "Lê Minh Cường", email: "cuong.le@student.edu.vn", role: "student", joined: "25/06/2026" },
  { uid: "uid-004", name: "Phạm Thu Hà", email: "ha.pham@teacher.edu.vn", role: "teacher", joined: "20/06/2026" },
  { uid: "uid-005", name: "Võ Đức Hải", email: "hai.vo@student.edu.vn", role: "student", joined: "15/06/2026" },
];

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    setUpdatingUid(uid);
    try {
      await updateUserRole(uid, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      );
    } catch {
      alert("Lỗi cập nhật role. Vui lòng thử lại.");
    } finally {
      setUpdatingUid(null);
    }
  };

  const stats = [
    { value: String(users.length), label: "Tổng người dùng", icon: "group", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    { value: String(users.filter((u) => u.role === "student").length), label: "Học sinh", icon: "school", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { value: String(users.filter((u) => u.role === "teacher").length), label: "Giáo viên", icon: "person_4", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { value: "18", label: "Báo cáo tháng này", icon: "assessment", color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  ];

  const features = [
    { icon: "manage_accounts", title: "Quản lý Người dùng", desc: "Xem, phân quyền và quản lý toàn bộ tài khoản trong hệ thống.", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    { icon: "analytics", title: "Thống kê Hệ thống", desc: "Báo cáo và phân tích dữ liệu hoạt động của toàn hệ thống.", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { icon: "security", title: "Bảo mật & Kiểm toán", desc: "Nhật ký truy cập, cảnh báo bảo mật và lịch sử thay đổi quyền.", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { icon: "settings", title: "Cài đặt Hệ thống", desc: "Cấu hình nền tảng, thông báo, và tích hợp dịch vụ bên thứ ba.", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  ];

  const roleBadgeClass: Record<UserRole, string> = {
    student: "role-pill role-pill--student",
    teacher: "role-pill role-pill--teacher",
    admin: "role-pill role-pill--admin",
  };

  const roleLabel: Record<UserRole, string> = {
    student: "Học sinh",
    teacher: "Giáo viên",
    admin: "Admin",
  };

  return (
    <div className="dashboard-page w-full">
      {/* Topbar */}
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-brand">
          <img src={LOGO_URL} alt="SafeSchool Hub" className="dashboard-topbar-logo" />
          <span className="dashboard-topbar-title">SafeSchool Hub</span>
        </div>
        <div className="dashboard-topbar-actions">
          <span className="dashboard-role-badge dashboard-role-badge--admin">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>admin_panel_settings</span>
            Admin
          </span>
          <button className="dashboard-logout-btn" onClick={handleLogout}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Hero */}
        <div
          className="dashboard-hero"
          style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)", color: "#fff" }}
        >
          <p className="dashboard-hero-greeting">Bảng điều khiển Quản trị 🛡️</p>
          <h1 className="dashboard-hero-title">
            Xin chào, {user?.displayName ?? "Admin"}!
          </h1>
          <p className="dashboard-hero-subtitle">
            Quản lý toàn bộ hệ thống SafeSchool Hub — người dùng, quyền hạn, báo cáo và cài đặt nền tảng.
          </p>
        </div>

        {/* Stats */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {stats.map((s, i) => (
            <div key={s.label} className="dashboard-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="dashboard-stat-icon" style={{ background: s.bg, color: s.color }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <div className="dashboard-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="dashboard-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="dashboard-section-title">Quản lý Hệ thống</h2>
        <div className="dashboard-grid">
          {features.map((f, i) => (
            <a key={f.title} href="#" className="dashboard-feature-card" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
              <div className="dashboard-feature-icon-wrap" style={{ background: f.bg }}>
                <span className="material-symbols-outlined" style={{ color: f.color, fontVariationSettings: "'FILL' 1", fontSize: 26 }}>{f.icon}</span>
              </div>
              <div>
                <p className="dashboard-feature-title">{f.title}</p>
                <p className="dashboard-feature-desc">{f.desc}</p>
              </div>
              <div className="dashboard-feature-arrow" style={{ color: f.color }}>
                Quản lý
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </div>
            </a>
          ))}
        </div>

        {/* User Management Table */}
        <h2 className="dashboard-section-title">Phân quyền Người dùng</h2>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò hiện tại</th>
                <th>Ngày tham gia</th>
                <th>Thay đổi quyền</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: "var(--color-on-surface-variant, #a0a0b0)", fontFamily: "monospace", fontSize: 12 }}>{u.email}</td>
                  <td>
                    <span className={roleBadgeClass[u.role]}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td style={{ color: "var(--color-on-surface-variant, #a0a0b0)" }}>{u.joined}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={updatingUid === u.uid}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        color: "var(--color-on-surface, #e8e8f0)",
                        padding: "6px 10px",
                        fontSize: 13,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="student">Học sinh</option>
                      <option value="teacher">Giáo viên</option>
                      <option value="admin">Admin</option>
                    </select>
                    {updatingUid === u.uid && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: "#818cf8" }}>Đang lưu…</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
