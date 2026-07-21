import { useEffect, useState } from "react";
import { TeacherSidebar } from "../../components/teacher/TeacherSidebar";
import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getTeacherNotifications,
  getReportsBySchoolCode,
  updateReportStatus,
  type TeacherNotification,
  type IncidentReport,
  type UrgencyLevel,
} from "../../src/services/reportService";

export function meta() {
  return [
    { title: "Dashboard Giáo viên – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Tổng quan hoạt động lớp học, quản lý phản ánh bạo lực học đường và hỗ trợ học sinh của giáo viên trên SafeSchool Hub.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const STATUS_CONFIG: Record<
  "pending" | "processing" | "resolved",
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: {
    label: "Chờ xử lý",
    color: "#d97706",
    bg: "#fef3c7",
    icon: "pending_actions",
  },
  processing: {
    label: "Đang xử lý",
    color: "#0058bd",
    bg: "#e8f0fe",
    icon: "published_with_changes",
  },
  resolved: {
    label: "Đã giải quyết",
    color: "#059669",
    bg: "#d1fae5",
    icon: "task_alt",
  },
};

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; bg: string }> = {
  low: { label: "Thấp", color: "#059669", bg: "#d1fae5" },
  medium: { label: "Trung bình", color: "#d97706", bg: "#fef3c7" },
  high: { label: "Khẩn cấp", color: "#dc2626", bg: "#fee2e2" },
  critical: { label: "🚨 Rất nguy hiểm", color: "#7f1d1d", bg: "#fca5a5" },
};

export default function TeacherDashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const teacherSchoolCode = user?.schoolCode || "THPT001";

  async function loadTeacherData() {
    if (!user) return;
    try {
      setLoadingData(true);
      // Load notifications for this teacher
      const notifs = await getTeacherNotifications(user.uid);
      setNotifications(notifs);

      // Load reports matching the teacher's schoolCode (hoặc THPT001 mặc định)
      const targetSchoolCode = user?.schoolCode?.trim() || "THPT001";
      const schoolReports = await getReportsBySchoolCode(targetSchoolCode);
      setReports(schoolReports.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Error loading teacher dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadTeacherData();
  }, [user]);

  async function handleStatusChange(
    reportId: string,
    newStatus: "pending" | "processing" | "resolved"
  ) {
    try {
      setUpdatingId(reportId);
      await updateReportStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái báo cáo:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = [
    { label: "Mã trường THPT", value: teacherSchoolCode, icon: "school", color: "#0058bd", bg: "#e8f0fe" },
    { label: "Phản ánh cùng trường", value: reports.length.toString(), icon: "report_problem", color: "#994100", bg: "#fff2e8" },
    { label: "Vụ việc đang xử lý", value: reports.filter((r) => r.status === "processing").length.toString(), icon: "published_with_changes", color: "#0058bd", bg: "#e8f0fe" },
    { label: "Đã giải quyết", value: reports.filter((r) => r.status === "resolved").length.toString(), icon: "task_alt", color: "#059669", bg: "#d1fae5" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-[#059669] tracking-tight">
              SafeSchool Hub
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Icon name="notifications" size={22} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
              )}
            </button>
            <button
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Trợ giúp"
            >
              <Icon name="help" size={22} />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1100px] w-full mx-auto animate-fade-in">
          {/* Greeting */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-serif font-bold text-on-surface">
                Xin chào, {user?.displayName || "Giáo viên"} 👋
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Quản lý an toàn học đường và phản ánh vụ việc cho trường THPT:{" "}
                <span className="font-bold text-primary">{teacherSchoolCode}</span>
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-2xl flex items-center gap-2">
              <Icon name="verified" size={18} style={{ color: "#059669" }} />
              Đã kết nối mã trường: <span className="font-mono font-bold">{teacherSchoolCode}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: s.bg }}
                >
                  <Icon name={s.icon} size={20} filled style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-extrabold text-on-surface">{s.value}</p>
                <p className="text-xs text-on-surface-variant font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Incident Reports Management Section */}
          <div className="bg-white border border-[#e8eaf0] rounded-3xl overflow-hidden shadow-xs space-y-0">
            <div className="px-6 py-4 border-b border-[#e8eaf0] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Icon name="report_problem" size={20} filled />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    Danh sách Phản ánh Bạo lực Học đường (Trường {teacherSchoolCode})
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Dữ liệu được tự động đồng bộ từ Firebase theo Mã THPT trùng khớp với Giáo viên.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-3 py-1 rounded-lg">
                Tổng cộng: {reports.length} phản ánh
              </span>
            </div>

            {loadingData ? (
              <div className="p-10 text-center text-xs text-on-surface-variant">
                Đang tải dữ liệu phản ánh từ Firebase…
              </div>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center text-xs text-on-surface-variant space-y-2">
                <Icon name="verified_user" size={32} style={{ color: "#059669", margin: "0 auto" }} />
                <p className="font-bold text-sm text-on-surface">Chưa có phản ánh bạo lực nào</p>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Hiện chưa có học sinh nào thuộc trường [{teacherSchoolCode}] gửi phản ánh vụ việc.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20">
                {reports.map((report) => {
                  const statusInfo = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
                  const urgencyInfo = URGENCY_CONFIG[report.urgency] || URGENCY_CONFIG.medium;
                  const isUpdating = updatingId === report.id;

                  return (
                    <div
                      key={report.id}
                      className="p-5 md:p-6 hover:bg-surface-container-low transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: Content */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Urgency Badge */}
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: urgencyInfo.bg, color: urgencyInfo.color }}
                          >
                            Mức độ: {urgencyInfo.label}
                          </span>

                          {/* Status Badge */}
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                          >
                            <Icon name={statusInfo.icon} size={13} filled />
                            {statusInfo.label}
                          </span>

                          {/* Anonymous Tag */}
                          {report.isAnonymous ? (
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                              🔒 Học sinh ẩn danh
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                              👤 {report.studentName}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-on-surface">{report.title}</h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                          {report.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-on-surface-variant/80 pt-1">
                          <span>📍 Địa điểm: {report.location || "Chưa rõ"}</span>
                          <span>🕒 {new Date(report.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                        {/* Status Update Buttons */}
                        <div className="flex items-center gap-1.5 bg-surface-container/60 p-1 rounded-xl border border-outline-variant/20">
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(report.id, "pending")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              report.status === "pending"
                                ? "bg-amber-500 text-white shadow-xs"
                                : "text-on-surface-variant hover:bg-surface-container"
                            }`}
                          >
                            Chờ xử lý
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(report.id, "processing")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              report.status === "processing"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-on-surface-variant hover:bg-surface-container"
                            }`}
                          >
                            Đang xử lý
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(report.id, "resolved")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              report.status === "resolved"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-on-surface-variant hover:bg-surface-container"
                            }`}
                          >
                            Đã giải quyết
                          </button>
                        </div>

                        {/* View Detail Button */}
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer"
                        >
                          <Icon name="visibility" size={16} />
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lower Grid: Notifications + Quick Actions */}
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Recent Notifications & Alerts */}
            <div className="flex-[2] bg-white rounded-2xl border border-[#e8eaf0] shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e8eaf0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="notifications" size={18} filled style={{ color: "#0058bd" }} />
                  <h2 className="text-sm font-bold text-on-surface">
                    Thông báo khẩn cấp hệ thống
                  </h2>
                </div>
                <span className="text-xs text-on-surface-variant font-mono">
                  {notifications.length} thông báo
                </span>
              </div>

              {loadingData ? (
                <div className="p-6 text-center text-xs text-on-surface-variant">
                  Đang tải thông báo từ Firebase…
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-on-surface-variant">
                  Chưa có thông báo vụ việc bạo lực học đường nào mới cho mã trường này.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/20">
                  {notifications.map((n, i) => (
                    <div
                      key={n.id || i}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-surface-container-low transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          n.urgency === "critical" || n.urgency === "high"
                            ? "bg-[#dc2626]"
                            : "bg-[#f59e0b]"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface">{n.title}</p>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">
                          {new Date(n.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex-1 bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-on-surface mb-1">Thao tác nhanh</h2>
              {[
                { label: "Xem danh sách học sinh", icon: "groups", to: "/teacher/students" },
                { label: "Quản lý lớp học", icon: "class", to: "/teacher/classes" },
                { label: "Hỗ trợ tâm lý", icon: "psychology", to: "/teacher/support" },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.to}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-sm font-semibold text-on-surface transition-colors cursor-pointer"
                >
                  <Icon name={action.icon} size={18} filled style={{ color: "#059669" }} />
                  {action.label}
                  <Icon name="chevron_right" size={16} style={{ color: "#727785", marginLeft: "auto" }} />
                </a>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-[600px] w-full p-6 md:p-8 shadow-2xl border border-[#e8eaf0] relative overflow-y-auto max-h-[90vh] no-scrollbar">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-5 right-5 p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <Icon name="report_problem" size={24} filled />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-on-surface">
                  Chi tiết phản ánh bạo lực
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Phản ánh từ trường THPT: <span className="font-bold text-primary">{selectedReport.schoolCode}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-on-surface">
              {/* Urgency & Status Badges */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-surface-container-low p-3.5 rounded-2xl">
                <div>
                  <span className="font-bold text-on-surface-variant block mb-1">Mức độ khẩn cấp:</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: URGENCY_CONFIG[selectedReport.urgency].bg,
                      color: URGENCY_CONFIG[selectedReport.urgency].color,
                    }}
                  >
                    {URGENCY_CONFIG[selectedReport.urgency].label}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-on-surface-variant block mb-1">Trạng thái xử lý:</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                    style={{
                      backgroundColor: STATUS_CONFIG[selectedReport.status].bg,
                      color: STATUS_CONFIG[selectedReport.status].color,
                    }}
                  >
                    <Icon name={STATUS_CONFIG[selectedReport.status].icon} size={14} filled />
                    {STATUS_CONFIG[selectedReport.status].label}
                  </span>
                </div>
              </div>

              <div>
                <p className="font-bold text-on-surface-variant">Tiêu đề vụ việc:</p>
                <p className="text-base font-bold text-on-surface mt-0.5">{selectedReport.title}</p>
              </div>

              <div>
                <p className="font-bold text-on-surface-variant">Mô tả chi tiết từ người báo cáo:</p>
                <div className="bg-surface-container/40 p-4 rounded-2xl mt-1 leading-relaxed text-on-surface whitespace-pre-line border border-outline-variant/20">
                  {selectedReport.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/20 text-xs">
                <div>
                  <span className="font-semibold text-on-surface-variant">Người gửi:</span>{" "}
                  {selectedReport.isAnonymous ? "🔒 Học sinh ẩn danh" : selectedReport.studentName}
                </div>
                <div>
                  <span className="font-semibold text-on-surface-variant">Địa điểm:</span>{" "}
                  {selectedReport.location || "Chưa rõ"}
                </div>
                <div>
                  <span className="font-semibold text-on-surface-variant">Mã THPT:</span>{" "}
                  {selectedReport.schoolCode}
                </div>
                <div>
                  <span className="font-semibold text-on-surface-variant">Thời gian:</span>{" "}
                  {new Date(selectedReport.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>

              {/* Status Change Buttons inside Modal */}
              <div className="pt-3 border-t border-outline-variant/20">
                <p className="font-bold text-xs text-on-surface mb-2">Cập nhật trạng thái xử lý vụ việc này:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedReport.id, "pending")}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedReport.status === "pending"
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container"
                    }`}
                  >
                    Chờ xử lý
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReport.id, "processing")}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedReport.status === "processing"
                        ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                        : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container"
                    }`}
                  >
                    Đang xử lý
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReport.id, "resolved")}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedReport.status === "resolved"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                        : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container"
                    }`}
                  >
                    Đã giải quyết
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
