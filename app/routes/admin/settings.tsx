import { useEffect, useState } from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { Icon } from "../../components/ui/Icon";
import {
  seedTeacherCodes,
  getAllTeacherCodes,
  type TeacherCodeDoc,
} from "../../src/services/teacherCodeService";

export function meta() {
  return [
    { title: "Cài đặt hệ thống – SafeSchool Hub Admin" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const SETTING_SECTIONS = [
  {
    id: "general",
    label: "Chung",
    icon: "tune",
    settings: [
      { key: "siteName", label: "Tên hệ thống", type: "text", value: "SafeSchool Hub" },
      { key: "contactEmail", label: "Email liên hệ", type: "email", value: "support@safeschool.vn" },
      { key: "maxAppointments", label: "Tối đa cuộc hẹn / ngày", type: "number", value: "20" },
    ],
  },
  {
    id: "teachercodes",
    label: "Mã Giáo viên",
    icon: "badge",
    settings: [],
  },
  {
    id: "notifications",
    label: "Thông báo",
    icon: "notifications_active",
    settings: [
      { key: "emailNotify", label: "Gửi email thông báo", type: "toggle", value: "true" },
      { key: "urgentAlert", label: "Cảnh báo khẩn cấp tức thì", type: "toggle", value: "true" },
      { key: "weeklyReport", label: "Gửi báo cáo hàng tuần", type: "toggle", value: "false" },
    ],
  },
  {
    id: "security",
    label: "Bảo mật",
    icon: "security",
    settings: [
      { key: "twoFactor", label: "Yêu cầu xác thực 2 bước (Admin)", type: "toggle", value: "true" },
      { key: "sessionTimeout", label: "Thời gian hết phiên (phút)", type: "number", value: "60" },
      { key: "anonymousReport", label: "Cho phép báo cáo ẩn danh", type: "toggle", value: "true" },
    ],
  },
];

export default function AdminSettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [saved, setSaved] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    emailNotify: true,
    urgentAlert: true,
    weeklyReport: false,
    twoFactor: true,
    anonymousReport: true,
  });

  const [teacherCodes, setTeacherCodes] = useState<TeacherCodeDoc[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [seedingMsg, setSeedingMsg] = useState<string | null>(null);

  const currentSection = SETTING_SECTIONS.find((s) => s.id === activeSection)!;

  async function loadCodes() {
    setLoadingCodes(true);
    const codes = await getAllTeacherCodes();
    setTeacherCodes(codes);
    setLoadingCodes(false);
  }

  useEffect(() => {
    if (activeSection === "teachercodes") {
      loadCodes();
    }
  }, [activeSection]);

  async function handleSeedCodes() {
    setSeedingMsg("Đang tạo danh sách mã GV trên Firebase...");
    try {
      const created = await seedTeacherCodes(50);
      setSeedingMsg(`Thành công! Đã tạo thêm ${created} mã mới trên Firebase.`);
      await loadCodes();
    } catch (err: any) {
      console.error(err);
      setSeedingMsg(`🚨 Lỗi: ${err?.message || "Có lỗi xảy ra khi tạo mã trên Firebase."}`);
    } finally {
      setTimeout(() => setSeedingMsg(null), 3000);
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex min-h-screen bg-surface-container-low">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-primary tracking-tight">
              SafeSchool Hub
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1000px] w-full mx-auto animate-fade-in space-y-6">
          <div>
            <h1 className="text-base font-semibold text-on-surface">Cài đặt hệ thống</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Quản lý cấu hình, mã xác thực Giáo viên và tuỳ chỉnh SafeSchool Hub
            </p>
          </div>

          {/* Save banner */}
          {saved && (
            <div className="flex items-center gap-3 bg-[#d1fae5] border border-[#6ee7b7] rounded-xl px-4 py-3 text-[#059669] font-semibold text-sm animate-fade-in">
              <Icon name="check_circle" size={18} filled />
              Đã lưu thay đổi thành công!
            </div>
          )}

          <div className="flex gap-6 flex-col md:flex-row">
            {/* Left Nav */}
            <nav className="flex md:flex-col gap-2 flex-row flex-wrap md:w-44 flex-shrink-0" aria-label="Cài đặt navigation">
              {SETTING_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  id={`settings-nav-${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                    activeSection === s.id
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container bg-white border border-[#e8eaf0]"
                  }`}
                >
                  <Icon name={s.icon} size={18} filled={activeSection === s.id} />
                  {s.label}
                </button>
              ))}
            </nav>

            {/* Settings Panel */}
            <div className="flex-1 bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-6 space-y-5">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name={currentSection.icon} size={18} filled style={{ color: "#0058bd" }} />
                {currentSection.label}
              </h2>

              {activeSection === "teachercodes" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3 bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900">
                    <div>
                      <p className="font-bold text-sm">Quản lý Mã xác thực Giáo viên (GV001 đến GV050)</p>
                      <p className="mt-0.5 text-blue-700">
                        Danh sách các mã được cấp cho Giáo viên khi tạo tài khoản trên hệ thống.
                      </p>
                    </div>

                    <button
                      onClick={handleSeedCodes}
                      className="flex items-center gap-2 bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-lg shadow-xs hover:bg-primary-container cursor-pointer"
                    >
                      <Icon name="add_task" size={16} />
                      Khởi tạo 50 mã GV (GV001 - GV050)
                    </button>
                  </div>

                  {seedingMsg && (
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                      {seedingMsg}
                    </div>
                  )}

                  {loadingCodes ? (
                    <p className="text-xs text-on-surface-variant py-4 text-center">Đang tải mã...</p>
                  ) : teacherCodes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-on-surface-variant">
                      Chưa có mã GV nào trên Firebase. Hãy bấm nút khởi tạo ở trên!
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto p-2 bg-surface-container-low rounded-xl border border-outline-variant/20">
                      {teacherCodes.map((tc) => (
                        <div
                          key={tc.code}
                          className="bg-white border border-outline-variant/30 rounded-lg p-2 text-center text-xs font-mono font-bold text-primary shadow-xs"
                        >
                          {tc.code}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col divide-y divide-outline-variant/20">
                    {currentSection.settings.map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                        <label htmlFor={`setting-${setting.key}`} className="text-sm font-semibold text-on-surface cursor-pointer">
                          {setting.label}
                        </label>
                        {setting.type === "toggle" ? (
                          <button
                            id={`setting-${setting.key}`}
                            role="switch"
                            aria-checked={toggles[setting.key] ?? false}
                            onClick={() => setToggles((t) => ({ ...t, [setting.key]: !t[setting.key] }))}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer focus:outline-none ${
                              (toggles[setting.key] ?? false) ? "bg-primary" : "bg-outline-variant"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                (toggles[setting.key] ?? false) ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        ) : (
                          <input
                            id={`setting-${setting.key}`}
                            type={setting.type}
                            defaultValue={setting.value}
                            className="w-40 text-sm text-on-surface border border-outline-variant/40 rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-right"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    id="btn-save-settings"
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-bold py-3 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    Lưu thay đổi
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
