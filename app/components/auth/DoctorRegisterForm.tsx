import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  type AuthError,
} from "firebase/auth";
import { auth } from "../../src/config/firebase";
import { createUserProfile } from "../../src/services/userService";

const DOCTOR_LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

function parseFirebaseError(error: AuthError): string {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Email bác sĩ này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.";
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng nhập tối thiểu 8 ký tự bao gồm chữ và số.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
    default:
      return "Đã xảy ra lỗi đăng ký. Vui lòng thử lại.";
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

      // 3. Create User Profile with Doctor Role in Firestore (users collection)
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email,
        displayName: formattedTitle,
        role: "doctor",
        schoolCode: hospital.trim(),
        phone: phone.trim() || undefined,
        photoURL: userCredential.user.photoURL || DOCTOR_LOGO_URL,
        licenseNumber: licenseNumber.trim(),
        hospital: hospital.trim(),
        specialization,
        proofUrl: proofUrl.trim() || undefined,
      });

      // 4. Success -> Display confirmation banner and redirect to Doctor Login
      setSuccess(true);
      setTimeout(() => {
        navigate("/auth/doctor-login?registered=success");
      }, 2000);
    } catch (err) {
      setError(parseFirebaseError(err as AuthError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-page">
      <main className="login-card max-w-[1000px]" role="main">
        {/* ── Brand Panel (Left side - Doctor specialized) ── */}
        <div
          className="login-brand-panel"
          aria-hidden="true"
          style={{ background: "linear-gradient(135deg, #003884 0%, #002255 100%)", color: "#ffffff" }}
        >
          <div className="login-brand-blob-1" style={{ background: "#059669", opacity: 0.15 }} />
          <div className="login-brand-blob-2" style={{ background: "#3b82f6", opacity: 0.2 }} />

          <div className="login-brand-content text-white">
            <div className="relative mb-3">
              <img
                src={DOCTOR_LOGO_URL}
                alt="SafeSchool Doctor Registration"
                className="login-brand-logo bg-white p-2 rounded-2xl shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  health_and_safety
                </span>
              </span>
            </div>

            <h2 className="login-brand-title text-white" style={{ color: "#ffffff" }}>
              Đăng Ký Tài Khoản Bác Sĩ Tâm Lý
            </h2>
            <p className="login-brand-subtitle" style={{ color: "#dbeafe" }}>
              Trở thành chuyên gia tư vấn xác thực trong mạng lưới bảo vệ sức khỏe tinh thần học đường SafeSchool Hub.
            </p>

            {/* Verification Features */}
            <div className="flex flex-col gap-3.5 text-left text-xs bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/20 mt-4">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-400 mt-0.5" style={{ fontSize: "18px" }}>
                  verified
                </span>
                <div>
                  <strong className="block text-white font-bold">Xác minh danh tính y tế</strong>
                  <span className="text-blue-100">Hồ sơ bác sĩ được kiểm duyệt bởi Hội đồng Y tế SafeSchool.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-400 mt-0.5" style={{ fontSize: "18px" }}>
                  encrypted
                </span>
                <div>
                  <strong className="block text-white font-bold">Bảo mật ca tham vấn</strong>
                  <span className="text-blue-100">Được trang bị công cụ tư vấn bảo mật chuẩn Y khoa.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form Panel (Right side) ── */}
        <div className="login-form-panel py-8 px-6 sm:px-10">
          {/* Mobile Header */}
          <div className="login-mobile-logo">
            <img src={DOCTOR_LOGO_URL} alt="SafeSchool Doctor Registration" />
          </div>

          {success ? (
            <div className="text-center py-10 animate-fade-in flex flex-col items-center">
              <span
                className="material-symbols-outlined text-emerald-600 mb-3"
                style={{ fontSize: "64px" }}
              >
                check_circle
              </span>
              <h2 className="text-xl font-bold text-on-surface">Đăng ký tài khoản Bác sĩ thành công!</h2>
              <p className="text-xs text-on-surface-variant mt-2 max-w-[400px] mx-auto">
                Thông tin xác minh của bạn đã được ghi nhận. Đang chuyển hướng sang trang đăng nhập bác sĩ...
              </p>
            </div>
          ) : (
            <>
              {/* Form Header */}
              <div className="login-form-header mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
                  <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "16px" }}>
                    badge
                  </span>
                  Xác Minh Hồ Sơ Bác Sĩ & Chuyên Gia
                </div>
                <h1 className="login-form-title text-2xl">Đăng Ký Chuyên Gia Tâm Lý</h1>
                <p className="login-form-subtitle text-xs">
                  Vui lòng cung cấp đầy đủ thông tin chuyên môn để được cấp quyền tư vấn.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="login-error mb-4" role="alert">
                  <span className="material-symbols-outlined login-error-icon">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Doctor Registration Form */}
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                {/* Section 1: Professional Information */}
                <div className="border-b border-outline-variant/30 pb-4 flex flex-col gap-3">
                  <h3 className="text-xs font-extrabold uppercase text-[#0058bd] tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>medical_information</span>
                    Thông Tin Chuyên Môn Bác Sĩ
                  </h3>

                  {/* Full Name & Title */}
                  <div className="login-field">
                    <label htmlFor="doc-fullname" className="login-label">
                      Họ và tên Bác sĩ / Chuyên gia *
                    </label>
                    <div className="login-input-wrap">
                      <span className="material-symbols-outlined login-input-icon">person</span>
                      <input
                        id="doc-fullname"
                        type="text"
                        placeholder="Ví dụ: BS. Nguyễn Văn Minh hoặc ThS. Trần Mai"
                        className="login-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* License Number & Hospital / Work Institution */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="login-field">
                      <label htmlFor="doc-license" className="login-label">
                        Số thẻ / Mã CCHN y tế *
                      </label>
                      <div className="login-input-wrap">
                        <span className="material-symbols-outlined login-input-icon">verified</span>
                        <input
                          id="doc-license"
                          type="text"
                          placeholder="Ví dụ: CCHN-109283"
                          className="login-input text-xs"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="login-field">
                      <label htmlFor="doc-hospital" className="login-label">
                        Bệnh viện / Cơ sở công tác *
                      </label>
                      <div className="login-input-wrap">
                        <span className="material-symbols-outlined login-input-icon">domain</span>
                        <input
                          id="doc-hospital"
                          type="text"
                          placeholder="Ví dụ: BV Tâm Thần / Phòng TV Trường"
                          className="login-input text-xs"
                          value={hospital}
                          onChange={(e) => setHospital(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specialization & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="login-field">
                      <label htmlFor="doc-special" className="login-label">
                        Lĩnh vực tư vấn chính
                      </label>
                      <div className="login-input-wrap">
                        <span className="material-symbols-outlined login-input-icon">psychology</span>
                        <select
                          id="doc-special"
                          className="login-input text-xs appearance-none bg-white cursor-pointer"
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
                      </div>
                    </div>

                    <div className="login-field">
                      <label htmlFor="doc-phone" className="login-label">
                        Số điện thoại liên hệ
                      </label>
                      <div className="login-input-wrap">
                        <span className="material-symbols-outlined login-input-icon">phone</span>
                        <input
                          id="doc-phone"
                          type="tel"
                          placeholder="0912 345 678"
                          className="login-input text-xs"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Proof Link (Optional) */}
                  <div className="login-field">
                    <label htmlFor="doc-proof" className="login-label">
                      Đường dẫn tài liệu / Chứng chỉ minh chứng (Tùy chọn)
                    </label>
                    <div className="login-input-wrap">
                      <span className="material-symbols-outlined login-input-icon">link</span>
                      <input
                        id="doc-proof"
                        type="url"
                        placeholder="https://drive.google.com/..."
                        className="login-input text-xs"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Account Login Credentials */}
                <div className="flex flex-col gap-3 pt-1">
                  <h3 className="text-xs font-extrabold uppercase text-[#0058bd] tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>lock</span>
                    Thông Tin Tài Khoản Đăng Nhập
                  </h3>

                  {/* Professional Email */}
                  <div className="login-field">
                    <label htmlFor="doc-reg-email" className="login-label">
                      Email làm việc *
                    </label>
                    <div className="login-input-wrap">
                      <span className="material-symbols-outlined login-input-icon">mail</span>
                      <input
                        id="doc-reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="doctor@safeschool.edu.vn"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="login-field">
                      <label htmlFor="doc-reg-pass" className="login-label">
                        Mật khẩu *
                      </label>
                      <div className="login-input-wrap">
                        <span className="material-symbols-outlined login-input-icon">lock</span>
                        <input
                          id="doc-reg-pass"
                          type={showPassword ? "text" : "password"}
                          placeholder="Tối thiểu 8 ký tự"
                          className="login-input text-xs login-input--password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="login-toggle-visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {showPassword ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="login-field">
                      <label htmlFor="doc-reg-confirm" className="login-label">
                        Xác nhận mật khẩu *
                      </label>
                      <div className="login-input-wrap">
                        <span className="material-symbols-outlined login-input-icon">lock_reset</span>
                        <input
                          id="doc-reg-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu"
                          className={`login-input text-xs login-input--password ${
                            passwordMismatch ? "border-red-500" : ""
                          }`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="login-toggle-visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {showConfirmPassword ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Ethics Terms Agreement */}
                <label className="login-remember items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    className="login-checkbox mt-0.5"
                    checked={agreedToMedicalTerms}
                    onChange={(e) => setAgreedToMedicalTerms(e.target.checked)}
                    required
                    disabled={isLoading}
                  />
                  <span className="login-remember-label text-[11px] leading-relaxed">
                    Tôi cam kết thông tin bác sĩ cung cấp là chính xác và đồng ý tuân thủ{" "}
                    <a href="#" className="text-primary font-bold hover:underline">
                      Quy chuẩn Đạo đức Tư vấn & Bảo mật Y tế
                    </a>{" "}
                    của SafeSchool Hub.
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="login-submit-btn mt-2"
                  style={{ backgroundColor: "#0058bd" }}
                  disabled={isLoading || !agreedToMedicalTerms || passwordMismatch}
                >
                  {isLoading ? (
                    <>
                      <span className="login-spinner" aria-hidden="true" />
                      Đang đăng ký hồ sơ bác sĩ...
                    </>
                  ) : (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                      >
                        how_to_reg
                      </span>
                      Hoàn Tất Đăng Ký Hồ Sơ Bác Sĩ
                    </>
                  )}
                </button>
              </form>

              {/* Login Redirect Row */}
              <div className="text-center pt-5 mt-4 border-t border-outline-variant/20 text-xs text-on-surface-variant">
                Đã có tài khoản chuyên gia?{" "}
                <Link to="/auth/doctor-login" className="login-register-link font-bold text-emerald-600 hover:text-emerald-700">
                  Đăng nhập Cổng Bác sĩ ngay 🩺
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
