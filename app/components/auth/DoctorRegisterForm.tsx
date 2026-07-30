import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type AuthError,
} from "firebase/auth";
import { auth } from "../../src/config/firebase";
import { createUserProfile, createDoctorRecord } from "../../src/services/userService";

const DOCTOR_LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

function parseFirebaseError(error: any): string {
  console.error("Lỗi đăng ký bác sĩ chi tiết:", error);
  const code = error.code || error.message;
  switch (code) {
    case "auth/email-already-in-use":
      return "Email bác sĩ này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.";
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng nhập tối thiểu 8 ký tự bao gồm chữ và số.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
    case "permission-denied":
      return "Lỗi Firestore: Bị từ chối ghi dữ liệu (Permission Denied). Vui lòng cập nhật Rules của Firestore để cho phép ghi vào collection 'doctors'.";
    default:
      return `Đã xảy ra lỗi đăng ký: ${error.message || error} (Mã lỗi: ${code}).`;
  }
}

/**
 * DoctorRegisterForm – Trang đăng ký tài khoản xác minh riêng cho Bác sĩ & Chuyên gia tư vấn tâm lý.
 */
export function DoctorRegisterForm() {
  const navigate = useNavigate();

  // Personal & Professional Verification state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [hospital, setHospital] = useState("");
  const [specialization, setSpecialization] = useState("Tâm lý học đường");
  const [proofUrl, setProofUrl] = useState("");

  // Account Credentials state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToMedicalTerms, setAgreedToMedicalTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Form verification validations
    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên bác sĩ / chuyên gia.");
      return;
    }
    if (!licenseNumber.trim()) {
      setError("Vui lòng nhập Số thẻ / Mã chứng chỉ hành nghề để xác minh.");
      return;
    }
    if (!hospital.trim()) {
      setError("Vui lòng nhập Đơn vị / Cơ sở y tế / Trường học công tác.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!agreedToMedicalTerms) {
      setError("Bạn cần đồng ý với Quy chuẩn đạo đức & Bảo mật y tế.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create User via Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2. Update Display Name with Doctor Title
      const formattedTitle = fullName.startsWith("BS.") || fullName.startsWith("TS.") || fullName.startsWith("ThS.")
        ? fullName.trim()
        : `BS. ${fullName.trim()}`;

      await updateProfile(userCredential.user, {
        displayName: formattedTitle,
      });

      // 3. Prepare Doctor Data
      const doctorData = {
        email: userCredential.user.email,
        displayName: formattedTitle,
        role: "doctor" as const,
        schoolCode: hospital.trim(), // Use hospital as schoolCode
        phone: phone.trim() || undefined,
        photoURL: userCredential.user.photoURL || DOCTOR_LOGO_URL,
        licenseNumber: licenseNumber.trim(),
        hospital: hospital.trim(),
        specialization,
        proofUrl: proofUrl.trim() || undefined,
      };

      // 4. Create User Profile in Firestore users collection
      await createUserProfile(userCredential.user.uid, doctorData);

      // 5. Create Doctor Record in Firestore doctors collection
      await createDoctorRecord(userCredential.user.uid, doctorData);

      // 6. Hiển thị thông báo thành công và chuyển hướng
      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-surface dark:bg-surface-container-high">
      <main className="w-full max-w-[800px] bg-white dark:bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 overflow-hidden my-4 flex flex-col transition-all duration-300">
        
        {/* Header Panel */}
        <div className="relative bg-gradient-to-r from-[#003884] to-[#059669] px-6 py-10 sm:px-10 text-white flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex-shrink-0">
            <img
              src={DOCTOR_LOGO_URL}
              alt="SafeSchool Doctor Registration"
              className="w-20 h-20 sm:w-24 sm:h-24 bg-white p-2 rounded-2xl shadow-lg object-contain"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                health_and_safety
              </span>
            </span>
          </div>
          
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white">
              Đăng Ký Chuyên Gia Tâm Lý
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 leading-relaxed">
              Trở thành chuyên gia tư vấn trong mạng lưới bảo vệ sức khỏe tinh thần học đường SafeSchool Hub.
            </p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs text-[10px] sm:text-xs font-semibold text-emerald-300 border border-emerald-400/20">
                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>verified</span>
                Xác thực y tế
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs text-[10px] sm:text-xs font-semibold text-blue-300 border border-blue-400/20">
                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>encrypted</span>
                Bảo mật chuẩn y khoa
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 flex-1">
          {success ? (
            <div className="text-center py-12 flex flex-col items-center animate-fade-in">
              <span className="material-symbols-outlined text-emerald-600 mb-4" style={{ fontSize: "72px" }}>
                check_circle
              </span>
              <h2 className="text-2xl font-bold text-on-surface">Đăng ký thành công!</h2>
              <p className="text-sm text-on-surface-variant mt-2 max-w-[450px]">
                Chào mừng bạn đến với SafeSchool Hub.
                Hệ thống đang tự động chuyển hướng bạn vào trang chủ...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
              
              {/* Form Sub-Header */}
              <div className="border-b border-outline-variant/30 pb-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Vui lòng cung cấp đầy đủ thông tin chuyên môn để Hội đồng kiểm duyệt SafeSchool Hub tiến hành xác minh và cấp quyền tư vấn.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-start gap-3 animate-fade-in" role="alert">
                  <span className="material-symbols-outlined text-error" style={{ fontSize: "20px" }}>error</span>
                  <span className="text-xs font-medium">{error}</span>
                </div>
              )}

              {/* Section 1: Professional Info */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-extrabold uppercase text-[#003884] dark:text-blue-400 tracking-wide flex items-center gap-1.5 border-b border-outline-variant/20 pb-2">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>medical_information</span>
                  1. Thông tin chuyên môn & Xác minh
                </h3>

                {/* Họ tên */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="doc-fullname" className="text-xs font-bold text-on-surface">
                    Họ và tên Bác sĩ / Chuyên gia <span className="text-error">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>person</span>
                    <input
                      id="doc-fullname"
                      type="text"
                      placeholder="Ví dụ: BS. Nguyễn Văn Minh hoặc ThS. Trần Mai"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline hover:border-on-surface-variant focus:border-primary focus:outline-none text-sm transition-colors dark:bg-surface-container-high text-on-surface bg-transparent"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* License Number & Hospital / Work Institution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doc-license" className="text-xs font-bold text-on-surface">
                      Số thẻ / Mã CCHN y tế <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>verified</span>
                      <input
                        id="doc-license"
                        type="text"
                        placeholder="Ví dụ: CCHN-109283"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline hover:border-on-surface-variant focus:border-primary focus:outline-none text-sm transition-colors dark:bg-surface-container-high text-on-surface bg-transparent"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doc-hospital" className="text-xs font-bold text-on-surface">
                      Bệnh viện / Cơ sở công tác <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>domain</span>
                      <input
                        id="doc-hospital"
                        type="text"
                        placeholder="Ví dụ: BV Bạch Mai / Tổ tư vấn THPT..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline hover:border-on-surface-variant focus:border-primary focus:outline-none text-sm transition-colors dark:bg-surface-container-high text-on-surface bg-transparent"
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Specialization & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doc-special" className="text-xs font-bold text-on-surface">
                      Lĩnh vực tư vấn chính
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>psychology</span>
                      <select
                        id="doc-special"
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-outline hover:border-on-surface-variant focus:border-primary focus:outline-none text-sm transition-colors bg-white dark:bg-surface-container-high cursor-pointer appearance-none text-on-surface"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="Tâm lý học đường">Tâm lý học đường</option>
                        <option value="Tâm thần học vị thành niên">Tâm thần học vị thành niên</option>
                        <option value="Khủng hoảng & Áp lực thi cử">Khủng hoảng & Áp lực thi cử</option>
                        <option value="Tư vấn phòng chống bạo lực">Tư vấn phòng chống bạo lực</option>
                        <option value="Tư vấn gia đình & ứng xử">Tư vấn gia đình & ứng xử</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 pointer-events-none text-on-surface-variant">arrow_drop_down</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doc-phone" className="text-xs font-bold text-on-surface">
                      Số điện thoại liên hệ
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>phone</span>
                      <input
                        id="doc-phone"
                        type="tel"
                        placeholder="Ví dụ: 0912 345 678"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline hover:border-on-surface-variant focus:border-primary focus:outline-none text-sm transition-colors dark:bg-surface-container-high text-on-surface bg-transparent"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Proof link */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="doc-proof" className="text-xs font-bold text-on-surface">
                    Đường dẫn tài liệu / Chứng chỉ minh chứng (Không bắt buộc)
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>link</span>
                    <input
                      id="doc-proof"
                      type="url"
                      placeholder="Ví dụ: Đường dẫn Drive chứa chứng chỉ..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline hover:border-on-surface-variant focus:border-primary focus:outline-none text-sm transition-colors dark:bg-surface-container-high text-on-surface bg-transparent"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Account Login Credentials */}
              <div className="flex flex-col gap-4 mt-2">
                <h3 className="text-xs font-extrabold uppercase text-[#003884] dark:text-blue-400 tracking-wide flex items-center gap-1.5 border-b border-outline-variant/20 pb-2">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>lock</span>
                  2. Thông tin tài khoản đăng nhập
                </h3>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="doc-reg-email" className="text-xs font-bold text-on-surface">
                    Email làm việc <span className="text-error">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>mail</span>
                    <input
                      id="doc-reg-email"
                      type="email"
                      placeholder="doctor@safeschool.edu.vn"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline hover:border-on-surface-variant focus:border-primary focus:outline-none text-sm transition-colors dark:bg-surface-container-high text-on-surface bg-transparent"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doc-reg-pass" className="text-xs font-bold text-on-surface">
                      Mật khẩu <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>lock</span>
                      <input
                        id="doc-reg-pass"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tối thiểu 8 ký tự"
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-outline hover:border-on-surface-variant focus:border-primary focus:outline-none text-sm transition-colors dark:bg-surface-container-high text-on-surface bg-transparent"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 hover:text-on-surface text-on-surface-variant focus:outline-none cursor-pointer bg-transparent border-none"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          {showPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doc-reg-confirm" className="text-xs font-bold text-on-surface">
                      Xác nhận mật khẩu <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant" style={{ fontSize: "20px" }}>lock_reset</span>
                      <input
                        id="doc-reg-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border ${
                          passwordMismatch ? "border-error focus:border-error" : "border-outline hover:border-on-surface-variant focus:border-primary"
                        } focus:outline-none text-sm transition-colors dark:bg-surface-container-high text-on-surface bg-transparent`}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 hover:text-on-surface text-on-surface-variant focus:outline-none cursor-pointer bg-transparent border-none"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          {showConfirmPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ethics Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-outline text-primary focus:ring-primary mt-0.5"
                  checked={agreedToMedicalTerms}
                  onChange={(e) => setAgreedToMedicalTerms(e.target.checked)}
                  required
                  disabled={isLoading}
                />
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  Tôi cam kết thông tin bác sĩ cung cấp là chính xác và đồng ý tuân thủ{" "}
                  <a href="#" className="text-primary font-bold hover:underline" onClick={(e) => e.preventDefault()}>
                    Quy chuẩn Đạo đức Tư vấn & Bảo mật Y tế
                  </a>{" "}
                  của SafeSchool Hub.
                </span>
              </label>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#003884] to-[#059669] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none"
                disabled={isLoading || !agreedToMedicalTerms || passwordMismatch}
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi thông tin đăng ký...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                      how_to_reg
                    </span>
                    Đăng Ký Tài Khoản Chuyên Gia
                  </>
                )}
              </button>
            </form>
          )}

          {/* Redirect to Login */}
          {!success && (
            <div className="text-center pt-5 mt-6 border-t border-outline-variant/30 text-xs text-on-surface-variant">
              Đã có tài khoản chuyên gia?{" "}
              <Link to="/auth/login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                Đăng nhập tại đây 🩺
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
