import { useState, useEffect, useRef } from "react";
import { getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../src/contexts/AuthContext";
import { DoctorSidebar } from "../../components/doctor/DoctorSidebar";
import { Icon } from "../../components/ui/Icon";
import { compressImageToBase64 } from "../../src/utils/imageCompress";
import { getAuth } from "firebase/auth";
import { redirect } from "react-router";
import "../../src/config/firebase";

export async function clientLoader() {
  const authInstance = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsubscribe = authInstance.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    }
  );

  if (!user) {
    throw redirect("/auth/login?redirect=/doctor/profile");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "doctor" && role !== "admin") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}


export function meta() {
  return [
    { title: "Hồ sơ Chuyên gia - SafeSchool Hub" },
    { name: "description", content: "Quản lý và chỉnh sửa thông tin chuyên môn của bác sĩ tâm lý." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

interface DoctorProfileData {
  uid: string;
  displayName: string;
  specialization: string;
  hospital: string;
  licenseNumber: string;
  phone: string;
  email: string;
  photoURL: string;
  bio: string;
  experience?: string;
  achievements?: string;
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=250&auto=format&fit=crop";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const db = getFirestore(getApp());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<DoctorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSpec, setFormSpec] = useState("Tâm lý học đường");
  const [formHospital, setFormHospital] = useState("");
  const [formLicense, setFormLicense] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formAchievements, setFormAchievements] = useState("");

  useEffect(() => {
    async function loadDoctorProfile() {
      if (!user) return;
      try {
        const docRef = doc(db, "doctors", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as DoctorProfileData;
          const loadedData = {
            uid: user.uid,
            displayName: data.displayName || user.displayName || "Bác sĩ tâm lý",
            specialization: data.specialization || "Tâm lý học đường",
            hospital: data.hospital || "",
            licenseNumber: data.licenseNumber || "",
            phone: data.phone || "",
            email: data.email || user.email || "",
            photoURL: data.photoURL || user.photoURL || DEFAULT_AVATAR,
            bio: data.bio || "",
            experience: data.experience || "",
            achievements: data.achievements || "",
          };
          setProfile(loadedData);
          resetForm(loadedData);
        } else {
          // Tạo dữ liệu mặc định ban đầu
          const defaultData: DoctorProfileData = {
            uid: user.uid,
            displayName: user.displayName || "Bác sĩ tâm lý",
            specialization: "Tâm lý học đường",
            hospital: "",
            licenseNumber: "",
            phone: "",
            email: user.email || "",
            photoURL: user.photoURL || DEFAULT_AVATAR,
            bio: "Chưa có lời giới thiệu bản thân.",
            experience: "",
            achievements: "",
          };
          setProfile(defaultData);
          resetForm(defaultData);
        }
      } catch (err) {
        console.error("Lỗi tải hồ sơ bác sĩ:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctorProfile();
  }, [user, db]);

  const resetForm = (data: DoctorProfileData) => {
    setFormName(data.displayName);
    setFormSpec(data.specialization);
    setFormHospital(data.hospital);
    setFormLicense(data.licenseNumber);
    setFormPhone(data.phone);
    setFormEmail(data.email);
    setFormPhoto(data.photoURL);
    setFormBio(data.bio);
    setFormExperience(data.experience || "");
    setFormAchievements(data.achievements || "");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    try {
      setSaveSuccess(true);
      const base64 = await compressImageToBase64(file, 160, 160);
      setFormPhoto(base64);
      
      // Auto save avatar to firestore
      const docRef = doc(db, "doctors", user.uid);
      await setDoc(docRef, { photoURL: base64 }, { merge: true });

      if (profile) {
        setProfile({ ...profile, photoURL: base64 });
      }
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Lỗi cập nhật ảnh đại diện bác sĩ:", err);
      alert("Không thể tải ảnh này lên.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedData: DoctorProfileData = {
      uid: user.uid,
      displayName: formName.trim() || "Bác sĩ tâm lý",
      specialization: formSpec,
      hospital: formHospital.trim(),
      licenseNumber: formLicense.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      photoURL: formPhoto.trim() || DEFAULT_AVATAR,
      bio: formBio.trim() || "Chưa có lời giới thiệu bản thân.",
      experience: formExperience.trim(),
      achievements: formAchievements.trim(),
    };

    try {
      const docRef = doc(db, "doctors", user.uid);
      await setDoc(docRef, updatedData, { merge: true });
      setProfile(updatedData);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ bác sĩ:", err);
      alert("Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-on-surface-variant">Đang tải hồ sơ chuyên gia...</p>
        </div>
      </div>
    );
  }

  const mockStats = {
    sessions: 42,
    rating: "4.9/5",
    reviews: 18,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <DoctorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <div className="text-base font-extrabold text-primary font-serif select-none flex items-center gap-2">
              <Icon name="shield" filled size={22} />
              PsycheCare Professional
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1 animate-pulse">
                <Icon name="check_circle" size={14} filled /> Đã lưu thành công!
              </span>
            )}
            <button
              onClick={() => {
                if (isEditing && profile) resetForm(profile);
                setIsEditing(!isEditing);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isEditing
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/10"
              }`}
            >
              <Icon name={isEditing ? "close" : "edit"} size={16} />
              {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa hồ sơ"}
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#f8f9ff]">
          <div className="max-w-[1100px] w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT PROFILE CARD (Sticky look) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 shadow-[0_4px_20px_rgba(0,51,102,0.03)] flex flex-col items-center text-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-full overflow-hidden mb-3 border-4 border-blue-50 shadow-md relative group cursor-pointer"
                  title="Nhấn để tải lên ảnh đại diện mới"
                >
                  <img
                    src={formPhoto || DEFAULT_AVATAR}
                    alt="Doctor avatar"
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="photo_camera" size={20} style={{ color: "white" }} />
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-[11px] font-bold rounded-xl border border-blue-200/50 transition-colors shadow-xs cursor-pointer mb-4"
                >
                  <Icon name="cloud_upload" size={14} />
                  Tải ảnh từ thiết bị
                </button>
                
                <h2 className="text-xl font-serif font-black text-[#001a41] mt-4">{formName || profile?.displayName}</h2>
                <span className="px-3 py-1.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-600 tracking-wide uppercase mt-2">
                  {formSpec}
                </span>
                <div className="h-[1px] bg-gray-100 w-full my-4" />

                <div className="w-full space-y-2.5 text-left text-xs">
                  {[
                    { icon: "verified", text: formLicense || "Chưa cập nhật CCHN", label: "Chứng chỉ hành nghề" },
                    { icon: "domain", text: formHospital || "Chưa cập nhật đơn vị", label: "Nơi công tác" },
                    { icon: "phone", text: formPhone || "Chưa cập nhật SĐT", label: "Số điện thoại" },
                    { icon: "mail", text: formEmail || "Chưa cập nhật email", label: "Email" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                      <Icon name={item.icon} size={16} className="text-blue-600" />
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
                        <p className="font-semibold text-gray-700 truncate mt-0.5">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Box */}
              <div className="bg-gradient-to-br from-[#1e40af] to-[#1d4ed8] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
                  <Icon name="psychology" size={120} filled />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-4">Thống kê tư vấn</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xl font-black">{mockStats.sessions}</p>
                    <p className="text-[10px] text-blue-100 font-semibold mt-1">Lượt hỗ trợ</p>
                  </div>
                  <div>
                    <p className="text-xl font-black">{mockStats.rating}</p>
                    <p className="text-[10px] text-blue-100 font-semibold mt-1">Đánh giá</p>
                  </div>
                  <div>
                    <p className="text-xl font-black">{mockStats.reviews}</p>
                    <p className="text-[10px] text-blue-100 font-semibold mt-1">Phản hồi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT WORKPLACE & DETAILS (Dynamic between edit & view modes) */}
            <div className="lg:col-span-2 space-y-6">
              
              {isEditing ? (
                /* EDIT FORM */
                <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[#e2e8f0] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,51,102,0.03)] space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800">Cập Nhật Hồ Sơ Chuyên Chuyên Gia</h3>
                    <p className="text-xs text-gray-400 mt-1">Thay đổi thông tin chuyên môn của bạn để phục vụ tốt hơn cho việc kết nối hỗ trợ học sinh.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Họ và tên */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và tên bác sĩ</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="ThS. Nguyễn Văn A..."
                        required
                        className="bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Chuyên ngành */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chuyên ngành tư vấn</label>
                      <select
                        value={formSpec}
                        onChange={(e) => setFormSpec(e.target.value)}
                        className="bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                      >
                        <option value="Tâm lý học đường">Tâm lý học đường</option>
                        <option value="Tư vấn hướng nghiệp">Tư vấn hướng nghiệp</option>
                        <option value="Phát triển kỹ năng mềm">Phát triển kỹ năng mềm</option>
                      </select>
                    </div>

                    {/* Nơi công tác */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đơn vị công tác</label>
                      <input
                        type="text"
                        value={formHospital}
                        onChange={(e) => setFormHospital(e.target.value)}
                        placeholder="Bệnh viện tâm thần, phòng khám..."
                        className="bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Chứng chỉ hành nghề */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mã chứng chỉ hành nghề (CCHN)</label>
                      <input
                        type="text"
                        value={formLicense}
                        onChange={(e) => setFormLicense(e.target.value)}
                        placeholder="CCHN-001..."
                        className="bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Điện thoại */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại liên hệ</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="0901234567..."
                        className="bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Email chuyên nghiệp */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ email liên hệ</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="dr.name@safeschool.vn..."
                        className="bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Đường dẫn ảnh đại diện */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đường dẫn ảnh chân dung (Photo URL)</label>
                      <input
                        type="url"
                        value={formPhoto}
                        onChange={(e) => setFormPhoto(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Giới thiệu bản thân */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lời giới thiệu bản thân (Bio)</label>
                      <textarea
                        value={formBio}
                        onChange={(e) => setFormBio(e.target.value)}
                        placeholder="Chia sẻ về quan điểm tư vấn, sứ mệnh hỗ trợ học sinh..."
                        rows={4}
                        className="w-full bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                      />
                    </div>

                    {/* Kinh nghiệm làm việc */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kinh nghiệm lâm sàng & làm việc</label>
                      <textarea
                        value={formExperience}
                        onChange={(e) => setFormExperience(e.target.value)}
                        placeholder="Mô tả kinh nghiệm công tác nổi bật của bạn... (Ví dụ:&#10;- Chuyên gia tham vấn trưởng tại SafeSchool Hub (2024 - Nay)&#10;- Chuyên viên tư vấn tâm lý học đường tại THPT Chuyên (2018 - 2024))"
                        rows={5}
                        className="w-full bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                      />
                    </div>

                    {/* Học vấn & Thành tích */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Học vấn & Thành tích nổi bật</label>
                      <textarea
                        value={formAchievements}
                        onChange={(e) => setFormAchievements(e.target.value)}
                        placeholder="Mô tả bằng cấp, học vị và các thành tựu nghiên cứu... (Ví dụ:&#10;- Thạc sĩ Tâm lý học lâm sàng (Đại học Quốc gia)&#10;- Chứng nhận hoàn thành khoá học trị liệu nhận thức hành vi CBT)"
                        rows={5}
                        className="w-full bg-[#f8fafc] border border-gray-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (profile) resetForm(profile);
                        setIsEditing(false);
                      }}
                      className="px-6 py-3 rounded-2xl text-xs font-bold bg-[#f1f5f9] hover:bg-gray-200 text-gray-700 transition-colors border-none cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/10 transition-all cursor-pointer border-none flex items-center gap-1.5"
                    >
                      {isSaving ? (
                        <><Icon name="sync" size={16} className="animate-spin" /> Đang lưu...</>
                      ) : (
                        <><Icon name="save" size={16} /> Lưu hồ sơ</>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW PROFILE DETAILS */
                <div className="space-y-6">
                  {/* Bio Card */}
                  <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,51,102,0.03)] space-y-4">
                    <h3 className="text-base font-extrabold text-gray-800">Giới thiệu bản thân</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {profile?.bio || "Bác sĩ chưa cập nhật giới thiệu chi tiết."}
                    </p>
                  </div>

                  {/* Specialties Bento Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Clinical Experience list */}
                    <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 shadow-[0_4px_20px_rgba(0,51,102,0.03)] space-y-4">
                      <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                        <Icon name="medical_services" size={18} className="text-blue-600" />
                        Kinh nghiệm lâm sàng & làm việc
                      </h4>
                      <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100 min-h-[120px]">
                        {profile?.experience || "Chưa cập nhật thông tin về kinh nghiệm làm việc."}
                      </div>
                    </div>

                    {/* Academic Credentials list */}
                    <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 shadow-[0_4px_20px_rgba(0,51,102,0.03)] space-y-4">
                      <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                        <Icon name="school" size={18} className="text-blue-600" />
                        Học vấn & Thành tích nổi bật
                      </h4>
                      <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100 min-h-[120px]">
                        {profile?.achievements || "Chưa cập nhật thông tin về học vấn, thành tích nổi bật."}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
