import { useNavigate } from "react-router";
import { useAuth } from "../../src/contexts/AuthContext";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

const recentReports = [
  { id: "RPT-001", student: "Ẩn danh", type: "Bắt nạt học đường", date: "15/07/2026", status: "Đang xử lý", urgency: "high" },
  { id: "RPT-002", student: "Ẩn danh", type: "Bạo lực thể chất", date: "14/07/2026", status: "Đã giải quyết", urgency: "resolved" },
  { id: "RPT-003", student: "Ẩn danh", type: "Cô lập, xa lánh", date: "13/07/2026", status: "Chờ xem xét", urgency: "medium" },
];

export function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  const stats = [
    { value: "32", label: "Học sinh trong lớp", icon: "groups", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { value: "5", label: "Báo cáo cần xử lý", icon: "report", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { value: "12", label: "Tư vấn đã thực hiện", icon: "psychology", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    { value: "98%", label: "Tỷ lệ hài lòng", icon: "thumb_up", color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  ];

  const features = [
    {
      icon: "assignment", title: "Quản lý Báo cáo", desc: "Xem xét và xử lý các báo cáo sự cố từ học sinh trong lớp bạn.",
      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",
    },
    {
      icon: "groups", title: "Danh sách Lớp", desc: "Quản lý thông tin, theo dõi tiến độ và hoạt động của học sinh.",
      color: "#10b981", bg: "rgba(16,185,129,0.12)",
    },
    {
      icon: "edit_note", title: "Ghi chú Tình huống", desc: "Lưu trữ ghi chú về các tình huống đặc biệt cần theo dõi.",
      color: "#6366f1", bg: "rgba(99,102,241,0.12)",
    },
    {
      icon: "volunteer_activism", title: "Tài nguyên Hỗ trợ", desc: "Thư viện tài liệu và hướng dẫn xử lý các tình huống bạo lực học đường.",
      color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",
    },
  ];

  const urgencyStyle: Record<string, React.CSSProperties> = {
    high: { background: "rgba(239,68,68,0.15)", color: "#f87171" },
    medium: { background: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    resolved: { background: "rgba(16,185,129,0.15)", color: "#34d399" },
  };

  const urgencyLabel: Record<string, string> = {
    high: "Khẩn cấp",
    medium: "Trung bình",
    resolved: "Hoàn thành",
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
          <span className="dashboard-role-badge dashboard-role-badge--teacher">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_4</span>
            Giáo viên
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
          style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%)", color: "#fff" }}
        >
          <p className="dashboard-hero-greeting">Bảng điều khiển Giáo viên 🎓</p>
          <h1 className="dashboard-hero-title">
            Chào, {user?.displayName ?? "Giáo viên"}!
          </h1>
          <p className="dashboard-hero-subtitle">
            Theo dõi và hỗ trợ học sinh của bạn. Hãy tạo ra môi trường học đường an toàn và thân thiện.
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

        {/* Features */}
        <h2 className="dashboard-section-title">Công cụ Giảng dạy</h2>
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
                Truy cập
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </div>
            </a>
          ))}
        </div>

        {/* Recent Reports */}
        <h2 className="dashboard-section-title">Báo cáo Gần đây</h2>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Mã báo cáo</th>
                <th>Loại sự cố</th>
                <th>Ngày báo cáo</th>
                <th>Mức độ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, fontFamily: "monospace", color: "#818cf8" }}>{r.id}</td>
                  <td>{r.type}</td>
                  <td style={{ color: "var(--color-on-surface-variant, #a0a0b0)" }}>{r.date}</td>
                  <td>
                    <span
                      className="role-pill"
                      style={{ ...urgencyStyle[r.urgency], borderRadius: 8 }}
                    >
                      {urgencyLabel[r.urgency]}
                    </span>
                  </td>
                  <td style={{ color: "var(--color-on-surface-variant, #a0a0b0)" }}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
