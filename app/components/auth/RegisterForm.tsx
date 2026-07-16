import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  type AuthError,
} from "firebase/auth";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Tính độ mạnh mật khẩu: 0–4 */
function calcStrength(pwd: string): number {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_LABEL = ["", "Yếu", "Trung bình", "Tốt", "Mạnh"] as const;
const STRENGTH_COLOR = [
  "",
  "#ef4444",
  "#f97316",
  "#3b82f6",
  "#22c55e",
] as const;

/** Dịch mã lỗi Firebase sang tiếng Việt */
function parseFirebaseError(error: AuthError): string {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.";
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng dùng ít nhất 6 ký tự.";
    case "auth/operation-not-allowed":
      return "Đăng ký bằng email chưa được bật. Vui lòng liên hệ quản trị viên.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
    case "auth/too-many-requests":
      return "Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.";
    default:
      return "Đã xảy ra lỗi. Vui lòng thử lại.";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * RegisterForm – Trang đăng ký SafeSchool Hub.
 * Dùng Firebase Authentication (createUserWithEmailAndPassword).
 * Layout 2 cột: Brand panel (desktop) + Form panel.
 * Style: app/styles/register.css.
 */
export function RegisterForm() {
  const navigate = useNavigate();

  // Lấy auth từ Firebase app đã được khởi tạo trong firebase.js
  const auth = getAuth(getApp());

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "parent" | "teacher">(
    "student"
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation
  const strength = calcStrength(password);
  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const roles = [
    { value: "student", label: "Học sinh", icon: "school" },
    { value: "parent", label: "Phụ huynh", icon: "family_restroom" },
    { value: "teacher", label: "Giáo viên", icon: "person_4" },
  ] as const;

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!fullName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (strength < 2) {
      setError("Mật khẩu quá yếu. Hãy thêm chữ hoa, số hoặc ký tự đặc biệt.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Tạo tài khoản bằng Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2. Cập nhật displayName và photoURL role
      await updateProfile(userCredential.user, {
        displayName: fullName.trim(),
        // Lưu role vào photoURL tạm thời; production nên dùng Firestore
        photoURL: `role:${role}`,
      });

      // 3. Thành công
      setSuccess(true);

      // Chuyển sang trang đăng nhập sau 1.8 giây
      setTimeout(() => {
        navigate("/auth/login");
      }, 1800);
    } catch (err) {
      setError(parseFirebaseError(err as AuthError));
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="register-page">
      <main className="register-card" role="main">

        {/* ── Brand Panel (Desktop only) ── */}
        <div className="register-brand-panel" aria-hidden="true">
          <div className="register-brand-blob-1" />
          <div className="register-brand-blob-2" />

          <div className="register-brand-content">
            <img
              src={LOGO_URL}
              alt="SafeSchool Hub Logo"
              className="register-brand-logo"
            />
            <h2 className="register-brand-title">
              Tham gia cộng đồng an toàn
            </h2>
            <p className="register-brand-subtitle">
              Hàng nghìn học sinh, phụ huynh và giáo viên đang kết nối để xây
              dựng môi trường học đường lành mạnh.
            </p>

            <div className="register-brand-stats">
              {[
                { value: "10K+", label: "Thành viên" },
                { value: "500+", label: "Trường học" },
                { value: "24/7", label: "Hỗ trợ" },
              ].map((s) => (
                <div key={s.label} className="register-brand-stat">
                  <span className="register-brand-stat-value">{s.value}</span>
                  <span className="register-brand-stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="register-brand-badges">
              {[
                { icon: "lock", label: "Bảo mật SSL" },
                { icon: "verified_user", label: "Ẩn danh 100%" },
                { icon: "support_agent", label: "Hỗ trợ 24/7" },
              ].map((b) => (
                <span key={b.label} className="register-brand-badge">
                  <span className="material-symbols-outlined">{b.icon}</span>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Form Panel ── */}
        <div className="register-form-panel">
          {/* Mobile logo */}
          <div className="register-mobile-logo">
            <img src={LOGO_URL} alt="SafeSchool Hub Logo" />
          </div>

          {/* ── Success state ── */}
          {success ? (
            <div className="register-success">
              <span
                className="material-symbols-outlined register-success-icon"
                aria-hidden="true"
              >
                check_circle
              </span>
              <h2 className="register-success-title">Đăng ký thành công!</h2>
              <p className="register-success-desc">
                Tài khoản của bạn đã được tạo. Đang chuyển hướng đến trang đăng
                nhập…
              </p>
            </div>
          ) : (
            <>
              {/* Form header */}
              <div className="register-form-header">
                <h1 className="register-form-title">Tạo tài khoản mới</h1>
                <p className="register-form-subtitle">
                  <span className="material-symbols-outlined">
                    shield_locked
                  </span>
                  Đăng ký miễn phí &amp; bảo mật
                </p>
              </div>

              {/* Role selector */}
              <div className="register-role-selector" role="group" aria-label="Chọn vai trò">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`register-role-btn${
                      role === r.value ? " register-role-btn--active" : ""
                    }`}
                    onClick={() => setRole(r.value)}
                    aria-pressed={role === r.value}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontVariationSettings:
                          role === r.value ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {r.icon}
                    </span>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Error banner */}
              {error && (
                <div className="register-error" role="alert">
                  <span className="material-symbols-outlined register-error-icon">
                    error
                  </span>
                  <span>{error}</span>
                </div>
              )}

              {/* Main form */}
              <form onSubmit={handleSubmit} noValidate>
                <input type="hidden" name="role" value={role} />

                <div className="register-fields">
                  {/* Họ và tên */}
                  <div className="register-field">
                    <label htmlFor="full-name" className="register-label">
                      Họ và tên
                    </label>
                    <div className="register-input-wrap">
                      <span className="material-symbols-outlined register-input-icon">
                        badge
                      </span>
                      <input
                        id="full-name"
                        name="full-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Nhập họ và tên của bạn"
                        className="register-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="register-field">
                    <label htmlFor="reg-email" className="register-label">
                      Email
                    </label>
                    <div className="register-input-wrap">
                      <span className="material-symbols-outlined register-input-icon">
                        mail
                      </span>
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Nhập địa chỉ email"
                        className="register-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Mật khẩu */}
                  <div className="register-field">
                    <label htmlFor="reg-password" className="register-label">
                      Mật khẩu
                    </label>
                    <div className="register-input-wrap">
                      <span className="material-symbols-outlined register-input-icon">
                        lock
                      </span>
                      <input
                        id="reg-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Tối thiểu 8 ký tự"
                        className="register-input register-input--password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="register-toggle-visibility"
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {password.length > 0 && (
                      <div className="register-strength-wrap" aria-live="polite">
                        <div className="register-password-strength">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className="register-strength-bar"
                              style={{
                                backgroundColor:
                                  strength >= level
                                    ? STRENGTH_COLOR[strength]
                                    : undefined,
                              }}
                            />
                          ))}
                        </div>
                        <span
                          className="register-strength-label"
                          style={{ color: STRENGTH_COLOR[strength] }}
                        >
                          {STRENGTH_LABEL[strength]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div className="register-field">
                    <label
                      htmlFor="reg-confirm-password"
                      className="register-label"
                    >
                      Xác nhận mật khẩu
                    </label>
                    <div className="register-input-wrap">
                      <span className="material-symbols-outlined register-input-icon">
                        lock_reset
                      </span>
                      <input
                        id="reg-confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu"
                        className={`register-input register-input--password${
                          passwordMismatch ? " register-input--error" : ""
                        }`}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="register-toggle-visibility"
                        aria-label={
                          showConfirmPassword
                            ? "Ẩn mật khẩu"
                            : "Hiện mật khẩu"
                        }
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        <span className="material-symbols-outlined">
                          {showConfirmPassword
                            ? "visibility"
                            : "visibility_off"}
                        </span>
                      </button>
                    </div>
                    {passwordMismatch && (
                      <p className="register-field-error" role="alert">
                        Mật khẩu không khớp.
                      </p>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <label className="register-terms">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    className="register-checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                    disabled={isLoading}
                  />
                  <span className="register-terms-label">
                    Tôi đồng ý với{" "}
                    <a href="#" className="register-terms-link">
                      Điều khoản sử dụng
                    </a>{" "}
                    và{" "}
                    <a href="#" className="register-terms-link">
                      Chính sách bảo mật
                    </a>
                  </span>
                </label>

                {/* Submit */}
                <button
                  id="register-submit"
                  type="submit"
                  className="register-submit-btn"
                  disabled={!agreedToTerms || isLoading || passwordMismatch}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="register-spinner"
                        aria-hidden="true"
                      />
                      Đang tạo tài khoản…
                    </>
                  ) : (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "18px",
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        how_to_reg
                      </span>
                      Tạo tài khoản
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="register-divider">
                <span className="register-divider-text">Hoặc đăng ký với</span>
              </div>

              {/* Social sign-up */}
              <div className="register-social-grid">
                <button
                  id="register-google"
                  type="button"
                  className="register-social-btn"
                  aria-label="Đăng ký bằng Google"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#DB4437" }}
                  >
                    g_translate
                  </span>
                  Google
                </button>
                <button
                  id="register-school"
                  type="button"
                  className="register-social-btn"
                  aria-label="Đăng ký bằng tài khoản trường"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: "var(--color-primary)",
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    school
                  </span>
                  Tài khoản trường
                </button>
              </div>

              {/* Login redirect */}
              <p className="register-login-row">
                Đã có tài khoản?{" "}
                <Link to="/auth/login" className="register-login-link">
                  Đăng nhập ngay
                </Link>
              </p>

              {/* Footer links */}
              <div className="register-footer-links">
                <a href="#" className="register-footer-link">
                  <span className="material-symbols-outlined">privacy_tip</span>
                  Chính sách bảo mật
                </a>
                <a href="#" className="register-footer-link">
                  <span className="material-symbols-outlined">help</span>
                  Hỗ trợ
                </a>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
