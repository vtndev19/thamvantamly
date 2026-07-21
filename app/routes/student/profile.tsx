import { useState } from "react";
import { Link } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Hồ sơ cá nhân – SafeSchool Hub" },
    {
      name: "description",
      content: "Quản lý thông tin cá nhân và tài khoản của bạn trên SafeSchool Hub.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const INFO_ITEMS = [
  { label: "Họ và tên", value: "Nguyễn Văn Nam", icon: "badge" },
  { label: "Email", value: "nam.nguyen@school.edu.vn", icon: "mail" },
  { label: "Lớp", value: "10A1 – Trường THPT An Toàn", icon: "school" },
  { label: "Ngày sinh", value: "15/03/2009", icon: "cake" },
  { label: "Số điện thoại", value: "0912 345 678", icon: "phone" },
];

const STATS = [
  { label: "Buổi tư vấn", value: "8", icon: "psychology", color: "#0058bd" },
  { label: "Báo cáo đã gửi", value: "3", icon: "flag", color: "#ba1a1a" },
  { label: "Điểm chia sẻ", value: "240", icon: "star", color: "#994100" },
];

export default function StudentProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
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
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Icon name="notifications" size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>
            <button
              className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-95 transition-opacity focus:outline-none cursor-pointer flex-shrink-0"
              aria-label="Hồ sơ cá nhân"
            >
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop"
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[900px] w-full mx-auto animate-fade-in space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-xl font-serif font-bold text-on-surface">Hồ sơ cá nhân</h1>
            <p className="text-xs text-on-surface-variant mt-1">Quản lý thông tin tài khoản của bạn</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-3xl border border-[#e8eaf0] shadow-xs overflow-hidden">
            {/* Cover Banner */}
            <div className="h-28 bg-gradient-to-r from-[#0058bd] to-[#1a80f8]" />

            {/* Avatar + Edit */}
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-5">
                <div className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  id="btn-edit-profile"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/40 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <Icon name={isEditing ? "close" : "edit"} size={16} />
                  {isEditing ? "Hủy" : "Chỉnh sửa"}
                </button>
              </div>

              <h2 className="text-lg font-serif font-bold text-on-surface">Nguyễn Văn Nam</h2>
              <p className="text-sm text-on-surface-variant">Học sinh · 10A1</p>

              {/* Stats Row */}
              <div className="flex gap-4 mt-5 flex-wrap">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-2.5 bg-surface-container-low rounded-xl px-4 py-2.5 flex-1 min-w-[100px]"
                  >
                    <Icon name={s.icon} size={20} filled style={{ color: s.color }} />
                    <div>
                      <p className="text-base font-extrabold text-on-surface leading-none">{s.value}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info Fields */}
          <div className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-6">
            <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <Icon name="person" size={18} filled style={{ color: "#0058bd" }} />
              Thông tin cá nhân
            </h2>
            <div className="flex flex-col divide-y divide-outline-variant/20">
              {INFO_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon} size={18} filled style={{ color: "#0058bd" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-on-surface-variant">{item.label}</p>
                    {isEditing ? (
                      <input
                        defaultValue={item.value}
                        className="w-full text-sm font-semibold text-on-surface border border-outline-variant/40 rounded-lg px-2 py-1 mt-0.5 focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-on-surface">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isEditing && (
              <button
                id="btn-save-profile"
                className="mt-5 w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-bold py-3 rounded-xl transition-all duration-200 cursor-pointer"
              >
                Lưu thay đổi
              </button>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl border border-[#ffdad6] shadow-xs p-6">
            <h2 className="text-sm font-bold text-[#ba1a1a] mb-3 flex items-center gap-2">
              <Icon name="warning" size={18} filled style={{ color: "#ba1a1a" }} />
              Vùng nguy hiểm
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Các thao tác này không thể hoàn tác. Hãy cân nhắc kỹ trước khi thực hiện.
            </p>
            <button
              id="btn-delete-account"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ffdad6] text-sm font-semibold text-[#ba1a1a] hover:bg-[#fff0f0] transition-colors cursor-pointer"
            >
              <Icon name="delete_forever" size={18} />
              Xóa tài khoản
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
