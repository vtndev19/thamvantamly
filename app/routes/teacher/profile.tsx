import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { TeacherSidebar } from "../../components/teacher/TeacherSidebar";
import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import { getUserProfile } from "../../src/services/userService";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../../src/config/firebase";
import { compressImageToBase64 } from "../../src/utils/imageCompress";

export function meta() {
  return [
    { title: "Hồ sơ giáo viên – SafeSchool Hub" },
    {
      name: "description",
      content: "Quản lý thông tin cá nhân và tài khoản giáo viên trên SafeSchool Hub.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop";

export default function TeacherProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* data states */
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* form states */
  const [editName, setEditName] = useState("");
  const [editSchoolCode, setEditSchoolCode] = useState("");
  const [editManagedClass, setEditManagedClass] = useState("");
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
          setEditManagedClass((p as any).managedClass || "");
          setEditPhone((p as any).phoneNumber || (p as any).phone || "");
        }
      } catch (err) {
        console.error("Lỗi tải thông tin giáo viên:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      setIsSaving(true);
      const base64 = await compressImageToBase64(file, 150, 150);

      // 1. Update Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: base64 });

      // 2. Update Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: base64 });
      }

      // 3. Update local state
      setProfile((prev: any) => ({ ...prev, photoURL: base64 }));
      setToast({ type: "success", message: "Cập nhật ảnh đại diện thành công!" });
    } catch (err: any) {
      console.error(err);
      setToast({ type: "error", message: "Lỗi khi tải ảnh lên: " + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updateData = {
        displayName: editName.trim(),
        schoolCode: editSchoolCode.trim(),
        managedClass: editManagedClass.trim(),
        phone: editPhone.trim(),
        phoneNumber: editPhone.trim(),
      };

      await updateDoc(userRef, updateData);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: editName.trim() });
      }

      setProfile((prev: any) => ({ ...prev, ...updateData }));
      setIsEditing(false);
      setToast({ type: "success", message: "Cập nhật thông tin thành công!" });
    } catch (err: any) {
      console.error(err);
      setToast({ type: "error", message: "Lỗi cập nhật hồ sơ: " + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "GV";
    return name.split(" ").pop()?.substring(0, 2).toUpperCase() || "GV";
  };

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      {/* Sidebar */}
      <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header toolbar */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b border-[#e2e8f0] flex-shrink-0"
          style={{ background: "white" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer border-none"
            >
              <Icon name="menu" size={20} />
            </button>
            <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase px-2.5 py-1 bg-emerald-50 rounded-full">
              Giáo viên
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/teacher/dashboard")}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-emerald-700 px-3 py-1.5 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border-none font-bold"
            >
              <Icon name="dashboard" size={16} />
              Quay lại Dashboard
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-md border ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              {toast.message}
            </div>
          </div>
        )}

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[800px] w-full mx-auto animate-fade-in space-y-6">
          <div>
            <h1 className="text-xl font-serif font-bold text-on-surface">Hồ sơ cá nhân</h1>
            <p className="text-xs text-on-surface-variant mt-1">Quản lý thông tin tài khoản giáo viên</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-3xl border border-[#e8eaf0] shadow-xs overflow-hidden">
            {/* Cover Banner */}
            <div className="h-28 bg-gradient-to-r from-emerald-600 to-teal-500" />

            {/* Avatar + Action */}
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-5">
                <div className="flex items-end gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden shadow-md relative cursor-pointer group flex-shrink-0 bg-white"
                    title="Nhấn để tải lên ảnh đại diện mới"
                  >
                    <img
                      src={profile?.photoURL || user?.photoURL || DEFAULT_AVATAR}
                      alt="Avatar"
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="photo_camera" size={18} style={{ color: "white" }} />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200/50 transition-colors shadow-xs cursor-pointer mb-1 h-[32px]"
                  >
                    <Icon name="cloud_upload" size={14} />
                    Tải ảnh từ thiết bị
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isEditing && profile) {
                      setEditName(profile.displayName || "");
                      setEditSchoolCode(profile.schoolCode || "");
                      setEditManagedClass(profile.managedClass || "");
                      setEditPhone(profile.phone || "");
                    }
                    setIsEditing(!isEditing);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isEditing
                      ? "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                  }`}
                >
                  <Icon name={isEditing ? "close" : "edit"} size={16} />
                  {isEditing ? "Hủy" : "Chỉnh sửa"}
                </button>
              </div>

              {/* Loader */}
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-semibold">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Họ và tên */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        Họ và tên giáo viên
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs font-semibold focus:outline-none focus:border-emerald-500 disabled:bg-[#f8fafd] disabled:text-gray-500 transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        Địa chỉ Email (Không thể sửa)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ""}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs font-semibold bg-[#f8fafd] text-gray-400 focus:outline-none"
                      />
                    </div>

                    {/* Lớp phụ trách */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        Lớp phụ trách
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editManagedClass}
                        onChange={(e) => setEditManagedClass(e.target.value)}
                        placeholder="Ví dụ: 10A1, 12 chuyên Toán"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs font-semibold focus:outline-none focus:border-emerald-500 disabled:bg-[#f8fafd] disabled:text-gray-500 transition-colors"
                      />
                    </div>

                    {/* Mã trường học */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        Mã trường học
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editSchoolCode}
                        onChange={(e) => setEditSchoolCode(e.target.value)}
                        placeholder="Mã trường học THPT"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs font-semibold focus:outline-none focus:border-emerald-500 disabled:bg-[#f8fafd] disabled:text-gray-500 transition-colors"
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        Số điện thoại liên hệ
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs font-semibold focus:outline-none focus:border-emerald-500 disabled:bg-[#f8fafd] disabled:text-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-3 border-t border-[#f1f3f9] mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          if (profile) {
                            setEditName(profile.displayName || "");
                            setEditSchoolCode(profile.schoolCode || "");
                            setEditManagedClass(profile.managedClass || "");
                            setEditPhone(profile.phone || "");
                          }
                          setIsEditing(false);
                        }}
                        className="px-4 py-2 border border-gray-200 text-xs font-bold text-gray-500 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isSaving && (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        Lưu thay đổi
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
