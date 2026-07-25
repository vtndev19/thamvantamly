import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type AuthError,
} from "firebase/auth";
import { auth } from "../../src/config/firebase";
import { getUserProfile, createUserProfile } from "../../src/services/userService";
import { ROLE_CONFIG, type UserRole } from "../../src/types/user.types";

const DOCTOR_LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

/** Dịch mã lỗi Firebase → tiếng Việt dành riêng cho Bác sĩ & Chuyên gia */
function parseFirebaseError(error: AuthError): string {
  switch (error.code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Tài khoản hoặc mật khẩu chuyên gia không đúng. Vui lòng kiểm tra lại.";
    case "auth/invalid-email":
      return "Địa chỉ email chuyên gia không hợp lệ.";
    case "auth/user-disabled":
      return "Tài khoản bác sĩ này tạm thời bị khóa hoặc đang chờ duyệt xác minh.";
    case "auth/too-many-requests":
      return "Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau ít phút.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
    default:
      return "Đã xảy ra lỗi đăng nhập. Vui lòng thử lại.";
  }
}

/**
 * DoctorLoginForm – Trang đăng nhập chuyên biệt dành cho Bác sĩ & Chuyên gia tư vấn tâm lý.
 */
export function DoctorLoginForm() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Đọc role từ Firestore để redirect đúng dashboard
      const profile = await getUserProfile(userCredential.user.uid);
      const role: UserRole = profile?.role ?? "doctor";
      localStorage.setItem("userRole", role);

      // Kiểm tra xem có redirect param không
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect");
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        const targetPath = ROLE_CONFIG[role]?.dashboardPath ?? "/doctor/dashboard";
        navigate(targetPath);
      }
    } catch (err) {
      setError(parseFirebaseError(err as AuthError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      let profile = await getUserProfile(userCredential.user.uid);
      if (!profile) {
        await createUserProfile(userCredential.user.uid, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          role: "doctor",
          photoURL: userCredential.user.photoURL || undefined,
        });
        profile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          role: "doctor",
          createdAt: Date.now(),
        };
      }
      const role: UserRole = profile.role ?? "doctor";
      localStorage.setItem("userRole", role);
      navigate(ROLE_CONFIG[role]?.dashboardPath ?? "/doctor/dashboard");
    } catch (err) {
      setError(parseFirebaseError(err as AuthError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-page">
      <main className="login-card" role="main">
        {/* ── Brand Panel (Desktop only) ── */}
        <div className="login-brand-panel bg-emerald-900" aria-hidden="true">
          <div className="login-brand-blob-1" />
          <div className="login-brand-blob-2" />

          <div className="login-brand-content">
            <img
              src={DOCTOR_LOGO_URL}
              alt="SafeSchool Hub Doctor Portal Logo"
              className="login-brand-logo"
            />
            <h2 className="login-brand-title">Cổng Chuyên Gia & Bác Sĩ Tâm Lý</h2>
            <p className="login-brand-subtitle">
              Nơi tư vấn, chẩn đoán và đồng hành cùng sức khỏe tinh thần học đường.
            </p>

            {/* Trust badges */}
            <div className="login-brand-badges">
              {[
                { icon: "health_and_safety", label: "Xác minh y tế" },
                { icon: "verified_user", label: "Bảo mật chuẩn HIPAA/Bệnh án" },
                { icon: "clinical_notes", label: "Hồ sơ tư vấn chuyên môn" },
              ].map((b) => (
                <span key={b.label} className="login-brand-badge">
                  <span className="material-symbols-outlined">{b.icon}</span>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Form Panel ── */}
        <div className="login-form-panel">
          {/* Mobile logo */}
          <div className="login-mobile-logo">
            <img src={DOCTOR_LOGO_URL} alt="SafeSchool Hub Logo" />
          </div>

          {/* Form header */}
          <div className="login-form-header">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "16px" }}>
                stethoscope
              </span>
              Cổng Bác Sĩ & Chuyên Gia
            </div>
            <h1 className="login-form-title">Đăng nhập tài khoản Bác sĩ</h1>
            <p className="login-form-subtitle">
              <span className="material-symbols-outlined">shield_locked</span>
              Xác thực thông tin y tế bảo mật
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="login-error" role="alert">
              <span className="material-symbols-outlined login-error-icon">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Main form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Input fields */}
            <div className="login-fields">
              {/* Email */}
              <div className="login-field">
                <label htmlFor="identifier" className="login-label">
                  Email chuyên gia / bác sĩ
                </label>
                <div className="login-input-wrap">
                  <span className="material-symbols-outlined login-input-icon">
                    mail
                  </span>
                  <input
                    id="identifier"
                    name="identifier"
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

              {/* Password */}
              <div className="login-field">
                <label htmlFor="password" className="login-label">
                  Mật khẩu
                </label>
                <div className="login-input-wrap">
                  <span className="material-symbols-outlined login-input-icon">
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="login-input login-input--password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="login-toggle-visibility"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="login-options">
              <label className="login-remember">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="login-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="login-remember-label">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="login-forgot-link">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit */}
            <button
              id="doctor-login-submit"
              type="submit"
              className="login-submit-btn bg-emerald-600 hover:bg-emerald-700 text-white border-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  Đang đăng nhập…
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                  >
                    login
                  </span>
                  Đăng nhập Cổng Bác Sĩ
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span className="login-divider-text">Hoặc tiếp tục với</span>
          </div>

          {/* Social logins */}
          <div className="login-social-grid">
            <button
              id="doctor-login-google"
              type="button"
              className="login-social-btn"
              aria-label="Đăng nhập bác sĩ bằng Google"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "#DB4437" }}
              >
                g_translate
              </span>
              <span>Đăng nhập với Google</span>
            </button>
          </div>

          {/* Registration Links */}
          <div className="flex flex-col gap-2 text-center mb-5">
            <p className="login-register-row mb-0">
              Chưa có tài khoản Bác sĩ?{" "}
              <Link to="/auth/doctor-register" className="login-register-link text-emerald-600 font-bold">
                Đăng ký xác minh Bác sĩ
              </Link>
            </p>
            <div className="pt-2 border-t border-outline-variant/20">
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium transition-all w-full"
              >
                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: "16px" }}>
                  arrow_back
                </span>
                Quay lại Đăng nhập Học sinh & Giáo viên
              </Link>
            </div>
          </div>

          {/* Footer links */}
          <div className="login-footer-links">
            <a href="#" className="login-footer-link">
              <span className="material-symbols-outlined">privacy_tip</span>
              Chính sách y tế & bảo mật
            </a>
            <a href="#" className="login-forgot-link">
              <span className="material-symbols-outlined">help</span>
              Hỗ trợ Kỹ thuật
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
