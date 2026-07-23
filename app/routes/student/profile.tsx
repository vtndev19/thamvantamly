import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import { getUserProfile } from "../../src/services/userService";
import { PsychChatService } from "../../src/services/psychChatService";
import { getReportsByStudentId } from "../../src/services/reportService";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../../src/config/firebase";

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

export default function StudentProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  /* data states */
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);

  /* form states */
  const [editName, setEditName] = useState("");
  const [editSchoolCode, setEditSchoolCode] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editBirth, setEditBirth] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user?.uid) return;
    const loadProfileData = async () => {
      try {
        const p = await getUserProfile(user.uid);
        if (p) {
          setProfile(p);
          setEditName(p.displayName || user.displayName || "");
          setEditSchoolCode(p.schoolCode || "");
          setEditClass((p as any).className || "");
          setEditBirth((p as any).birthDate || "");
          setEditPhone((p as any).phone || "");
        }

        // Fetch counts
        const sess = await PsychChatService.getUserSessions(user.uid);
        setSessionCount(sess.length);

        const reps = await getReportsByStudentId(user.uid);
        setReportCount(reps.length);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu hồ sơ cá nhân:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (e) {
      console.error("Lỗi đăng xuất:", e);
    }
  };

  const handleSave = async () => {
    if (!user?.uid || isSaving) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updateData = {
        displayName: editName.trim(),
        schoolCode: editSchoolCode.trim(),
        className: editClass.trim(),
        birthDate: editBirth.trim(),
        phone: editPhone.trim(),
      };
      await updateDoc(userRef, updateData);

      // Cập nhật Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: editName.trim(),
        });
      }

      setProfile((prev: any) => ({
        ...prev,
        ...updateData,
      }));

      setIsEditing(false);
      setToast({ type: "success", message: "Cập nhật thông tin thành công! 🌟" });
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      setToast({ type: "error", message: "Đã xảy ra lỗi khi lưu thông tin." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-on-surface-variant">Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
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

              <h2 className="text-lg font-serif font-bold text-on-surface">
                {profile?.displayName || user?.displayName || "Học sinh"}
              </h2>
              <p className="text-sm text-on-surface-variant">
                Học sinh {profile?.className ? `· Lớp ${profile.className}` : ""}
              </p>

              {/* Stats Row */}
              <div className="flex gap-4 mt-5 flex-wrap">
                {[
                  { label: "Buổi tư vấn", value: String(sessionCount), icon: "psychology", color: "#0058bd" },
                  { label: "Báo cáo đã gửi", value: String(reportCount), icon: "flag", color: "#ba1a1a" },
                  { label: "Điểm chia sẻ", value: String(sessionCount * 20 + reportCount * 30), icon: "star", color: "#994100" },
                ].map((s) => (
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
              {/* Họ và tên */}
              <div className="flex items-center gap-4 py-3.5 first:pt-0">
                <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
                  <Icon name="badge" size={18} filled style={{ color: "#0058bd" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-on-surface-variant">Họ và tên</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-sm font-semibold text-on-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-on-surface">
                      {profile?.displayName || user?.displayName || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
                  <Icon name="mail" size={18} filled style={{ color: "#0058bd" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-on-surface-variant">Email (Không thể thay đổi)</p>
                  <p className="text-sm font-semibold text-on-surface-variant">
                    {profile?.email || user?.email || ""}
                  </p>
                </div>
              </div>

              {/* Mã trường học */}
              <div className="flex items-center gap-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
                  <Icon name="domain" size={18} filled style={{ color: "#0058bd" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-on-surface-variant">Mã trường học</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editSchoolCode}
                      onChange={(e) => setEditSchoolCode(e.target.value)}
                      className="w-full text-sm font-semibold text-on-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-on-surface">
                      {profile?.schoolCode || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>

              {/* Lớp */}
              <div className="flex items-center gap-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
                  <Icon name="school" size={18} filled style={{ color: "#0058bd" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-on-surface-variant">Lớp</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editClass}
                      onChange={(e) => setEditClass(e.target.value)}
                      className="w-full text-sm font-semibold text-on-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-on-surface">
                      {profile?.className || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>

              {/* Ngày sinh */}
              <div className="flex items-center gap-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
                  <Icon name="cake" size={18} filled style={{ color: "#0058bd" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-on-surface-variant">Ngày sinh</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editBirth}
                      onChange={(e) => setEditBirth(e.target.value)}
                      placeholder="VD: 15/03/2009"
                      className="w-full text-sm font-semibold text-on-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-on-surface">
                      {profile?.birthDate || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="flex items-center gap-4 py-3.5 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
                  <Icon name="phone" size={18} filled style={{ color: "#0058bd" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-on-surface-variant">Số điện thoại</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full text-sm font-semibold text-on-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 mt-0.5 focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-on-surface">
                      {profile?.phone || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {isEditing && (
              <button
                id="btn-save-profile"
                onClick={handleSave}
                disabled={isSaving}
                className="mt-5 w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-bold py-3 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            )}
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-6">
            <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <Icon name="settings" size={18} style={{ color: "#727785" }} />
              Tài khoản & Thiết lập
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Đăng xuất khỏi thiết bị hiện tại của bạn.
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Icon name="logout" size={18} />
              Đăng xuất tài khoản
            </button>
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

      {/* ========== TOAST NOTIFICATION ========== */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "white",
            padding: "12px 24px",
            borderRadius: 16,
            boxShadow: "0 10px 25px rgba(0,88,189,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "toastFadeIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <Icon name={toast.type === "success" ? "check_circle" : "error"} size={18} filled />
          <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
