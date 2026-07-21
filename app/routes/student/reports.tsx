import { useEffect, useState } from "react";
import { Link, redirect } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../../src/config/firebase";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getReportsByStudentId,
  type IncidentReport,
  type UrgencyLevel,
} from "../../src/services/reportService";
import { IncidentReportModal } from "../../components/student/IncidentReportModal";

export function meta() {
  return [
    { title: "Quản lý Báo cáo & Phản ánh – SafeSchool Hub" },
    {
      name: "description",
      content: "Theo dõi tiến độ và trạng thái xử lý các phản ánh bạo lực học đường đã gửi.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader() {
  const auth = getAuth(getApp());

  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    }
  );

  if (!user) {
    throw redirect("/auth/login?redirect=/student/reports");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "student") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}

const STATUS_MAP: Record<
  "pending" | "processing" | "resolved",
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: {
    label: "Chờ tiếp nhận",
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

const URGENCY_MAP: Record<UrgencyLevel, { label: string; color: string }> = {
  low: { label: "Thấp", color: "#059669" },
  medium: { label: "Trung bình", color: "#d97706" },
  high: { label: "Khẩn cấp", color: "#dc2626" },
  critical: { label: "Rất nguy hiểm", color: "#7f1d1d" },
};

export default function StudentReportsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);

  const userSchoolCode = user?.schoolCode || "THPT001";

  async function loadStudentReports() {
    if (!user) return;
    try {
      setLoading(true);
      const userReports = await getReportsByStudentId(user.uid);
      setReports(userReports);
    } catch (err) {
      console.error("Lỗi khi tải báo cáo:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudentReports();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>

            <Link
              to="/student/dashboard"
              className="flex items-center gap-2 text-primary font-serif font-extrabold text-[17px] tracking-tight select-none"
            >
              <Icon name="shield" filled size={22} />
              An Toàn Trường Học
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Reports navigation">
              <Link
                to="/student/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="home" size={18} />
                Trang chủ
              </Link>
              <Link
                to="/student/support"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="emergency" size={18} />
                Hỗ trợ khẩn cấp
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="assignment" size={18} filled />
                Báo cáo của tôi
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Icon name="add" size={18} />
              TẠO PHẢN ÁNH MỚI
            </button>
            <button className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 cursor-pointer flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 animate-fade-in space-y-6 max-w-[1000px] w-full mx-auto">
          {/* Header Title + CTA Button */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-serif font-bold text-on-surface">
                Theo dõi phản ánh bạo lực học đường
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Danh sách các vụ việc bạn đã báo cáo tới Giáo viên trường THPT:{" "}
                <span className="font-bold text-primary">{userSchoolCode}</span>
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-bold px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <Icon name="report_problem" size={20} filled />
              TẠO PHẢN ÁNH MỚI
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Icon name="pending_actions" size={22} filled />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-semibold">Chờ tiếp nhận</p>
                <p className="text-xl font-extrabold text-on-surface">
                  {reports.filter((r) => r.status === "pending").length}
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Icon name="published_with_changes" size={22} filled />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-semibold">Đang xử lý</p>
                <p className="text-xl font-extrabold text-on-surface">
                  {reports.filter((r) => r.status === "processing").length}
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Icon name="task_alt" size={22} filled />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-semibold">Đã giải quyết</p>
                <p className="text-xl font-extrabold text-on-surface">
                  {reports.filter((r) => r.status === "resolved").length}
                </p>
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white border border-[#e8eaf0] rounded-3xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#e8eaf0] flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name="assignment" size={20} filled style={{ color: "#0058bd" }} />
                Danh sách phản ánh của bạn
              </h2>
              <span className="text-xs text-on-surface-variant font-mono">
                Tổng số: {reports.length}
              </span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs text-on-surface-variant">
                Đang tải dữ liệu phản ánh…
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/40 flex-shrink-0">
                  <Icon name="assignment_turned_in" size={36} />
                </div>
                <div className="w-full text-center" style={{ width: "100%", maxWidth: "450px" }}>
                  <p className="text-sm font-bold text-on-surface mb-1 text-center" style={{ width: "100%", display: "block" }}>
                    Bạn chưa có phản ánh nào
                  </p>
                  <p className="text-xs text-on-surface-variant text-center" style={{ width: "100%", display: "block" }}>
                    Nếu xảy ra vụ việc bạo lực hoặc cảm thấy không an toàn, hãy tạo phản ánh để Giáo viên thuộc trường bạn kịp thời can thiệp.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-2 bg-primary text-on-primary text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  <Icon name="add" size={16} />
                  Tạo phản ánh ngay
                </button>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20">
                {reports.map((report) => {
                  const statusInfo = STATUS_MAP[report.status] || STATUS_MAP.pending;
                  const urgencyInfo = URGENCY_MAP[report.urgency] || URGENCY_MAP.medium;

                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="p-5 md:p-6 hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                          >
                            <Icon name={statusInfo.icon} size={14} filled />
                            {statusInfo.label}
                          </span>
                          <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                            Mã THPT: {report.schoolCode}
                          </span>
                          {report.isAnonymous && (
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                              🔒 Ẩn danh
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-on-surface truncate">
                          {report.title}
                        </h3>

                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-on-surface-variant/80 pt-1">
                          <span>📍 Địa điểm: {report.location || "Chưa rõ"}</span>
                          <span>
                            🚨 Mức độ:{" "}
                            <strong style={{ color: urgencyInfo.color }}>
                              {urgencyInfo.label}
                            </strong>
                          </span>
                          <span>
                            🕒 {new Date(report.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>

                      <button className="flex items-center gap-1 text-xs font-bold text-primary hover:underline self-start md:self-center flex-shrink-0">
                        Chi tiết <Icon name="chevron_right" size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Incident Report Modal */}
      <IncidentReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadStudentReports}
      />

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-[550px] w-full p-6 md:p-8 shadow-2xl border border-[#e8eaf0] relative overflow-y-auto max-h-[90vh] no-scrollbar">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-5 right-5 p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>

            <h3 className="text-lg font-serif font-bold text-on-surface mb-2">
              Chi tiết phản ánh bạo lực
            </h3>

            <div className="space-y-4 text-xs text-on-surface mt-4">
              <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-2xl">
                <span className="font-semibold">Trạng thái xử lý:</span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                  style={{
                    backgroundColor: STATUS_MAP[selectedReport.status].bg,
                    color: STATUS_MAP[selectedReport.status].color,
                  }}
                >
                  {STATUS_MAP[selectedReport.status].label}
                </span>
              </div>

              <div>
                <p className="font-bold text-on-surface-variant">Tiêu đề vụ việc:</p>
                <p className="text-sm font-bold text-on-surface mt-0.5">{selectedReport.title}</p>
              </div>

              <div>
                <p className="font-bold text-on-surface-variant">Mô tả chi tiết:</p>
                <p className="bg-surface-container/40 p-3 rounded-xl mt-1 leading-relaxed text-on-surface">
                  {selectedReport.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/20 text-[11px]">
                <div>
                  <span className="font-semibold">Mã trường THPT:</span> {selectedReport.schoolCode}
                </div>
                <div>
                  <span className="font-semibold">Địa điểm:</span> {selectedReport.location || "Chưa rõ"}
                </div>
                <div>
                  <span className="font-semibold">Hình thức:</span>{" "}
                  {selectedReport.isAnonymous ? "🔒 Gửi ẩn danh" : "👤 Công khai"}
                </div>
                <div>
                  <span className="font-semibold">Thời gian:</span>{" "}
                  {new Date(selectedReport.createdAt).toLocaleString("vi-VN")}
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
