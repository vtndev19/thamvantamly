import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type AuthError,
} from "firebase/auth";
import { auth } from "../../src/config/firebase";
import { getUserProfile, createUserProfile, seedAdminAccount, seedTestAccounts } from "../../src/services/userService";
import { ROLE_CONFIG } from "../../src/types/user.types";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

/** Dịch mã lỗi Firebase → tiếng Việt */
function parseFirebaseError(error: AuthError): string {
  switch (error.code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.";
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ.";
    case "auth/user-disabled":
      return "Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.";
    case "auth/too-many-requests":
      return "Quá nhiều lần thử. Tài khoản tạm thời bị khóa. Thử lại sau ít phút.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
    default:
      return "Đã xảy ra lỗi. Vui lòng thử lại.";
  }
}

/**
 * LoginForm – Trang đăng nhập SafeSchool Hub.
 * Dùng Firebase Authentication (signInWithEmailAndPassword).
 * Layout 2 cột: Brand panel (desktop) + Form panel.
 * Style: app/styles/login.css.
 */
export function LoginForm() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    seedTestAccounts();
  }, []);

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Đọc role từ Firestore để redirect đúng dashboard
      const profile = await getUserProfile(userCredential.user.uid);
      const role = profile?.role ?? "student";
      localStorage.setItem("userRole", role);

      // Kiểm tra xem có redirect param không (từ route guard)
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect");
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate(ROLE_CONFIG[role].dashboardPath);
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
      // Nếu chưa có profile Firestore, tạo mới với role mặc định student
      let profile = await getUserProfile(userCredential.user.uid);
      if (!profile) {
        await createUserProfile(userCredential.user.uid, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          role: "student",
        });
        profile = { uid: userCredential.user.uid, email: userCredential.user.email, displayName: userCredential.user.displayName, role: "student", createdAt: Date.now() };
      }
      const role = profile.role ?? "student";
      localStorage.setItem("userRole", role);
      navigate(ROLE_CONFIG[role].dashboardPath);
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
        <div className="login-brand-panel" aria-hidden="true">
          <div className="login-brand-blob-1" />
          <div className="login-brand-blob-2" />

          <div className="login-brand-content">
            <img
              src={LOGO_URL}
              alt="SafeSchool Hub Logo"
              className="login-brand-logo"
            />
            <h2 className="login-brand-title">Không gian số an toàn của bạn</h2>
            <p className="login-brand-subtitle">
              Nơi kết nối, chia sẻ và nhận hỗ trợ kịp thời.
            </p>

            {/* Trust badges */}
            <div className="login-brand-badges">
              {[
                { icon: "lock", label: "Bảo mật SSL" },
                { icon: "verified_user", label: "Ẩn danh 100%" },
                { icon: "support_agent", label: "Hỗ trợ 24/7" },
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
            <img src={LOGO_URL} alt="SafeSchool Hub Logo" />
          </div>

          {/* Form header */}
          <div className="login-form-header">
            <h1 className="login-form-title">Chào mừng bạn trở lại</h1>
            <p className="login-form-subtitle">
              <span className="material-symbols-outlined">shield_locked</span>
              Đăng nhập bảo mật
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="login-error" role="alert">
              <span className="material-symbols-outlined login-error-icon">
                error
              </span>
              <div style={{ flex: 1 }}>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Resend success notification */}
          {resendSuccess && (
            <div
              role="status"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                borderRadius: "12px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#059669" }}>
                check_circle
              </span>
              Đã gửi lại email xác minh! Vui lòng kiểm tra hộp thư.
            </div>
          )}

          {/* Main form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Input fields */}
            <div className="login-fields">
              {/* Email */}
              <div className="login-field">
                <label htmlFor="identifier" className="login-label">
                  Email
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
                    placeholder="Nhập địa chỉ email của bạn"
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
              id="login-submit"
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  Đăng nhập…
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                  >
                    login
                  </span>
                  Đăng nhập
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
              id="login-google"
              type="button"
              className="login-social-btn"
              aria-label="Đăng nhập bằng Google"
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

          {/* Register row & Doctor Registration CTA */}
          <div className="flex flex-col gap-2 text-center mb-5">
            <p className="login-register-row mb-0">
              Chưa có tài khoản?{" "}
              <Link to="/auth/register" className="login-register-link">
                Đăng ký ngay
              </Link>
            </p>
            <div className="pt-2 border-t border-outline-variant/20">
              <Link
                to="/auth/doctor-register"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all shadow-2xs w-full"
              >
                <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "16px" }}>
                  health_and_safety
                </span>
                Bạn là bác sĩ tâm lý? Đăng ký ngay 🩺
              </Link>
            </div>
          </div>

          {/* Footer links */}
          <div className="login-footer-links">
            <a href="#" className="login-footer-link">
              <span className="material-symbols-outlined">privacy_tip</span>
              Chính sách bảo mật
            </a>
            <a href="#" className="login-forgot-link">
              <span className="material-symbols-outlined">help</span>
              Hỗ trợ
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
