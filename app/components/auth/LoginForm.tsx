import { useState } from "react";
import { Link } from "react-router";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

/**
 * LoginForm – Trang đăng nhập SafeSchool Hub.
 * Layout 2 cột: Brand panel (desktop) + Form panel.
 * Style được viết trong app/styles/login.css (external CSS).
 */
export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: gọi Firebase Auth / API đăng nhập ở đây
    const data = new FormData(e.currentTarget);
    console.log("Login attempt:", {
      identifier: data.get("identifier"),
      rememberMe: data.get("remember-me"),
    });
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

          {/* Main form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Input fields */}
            <div className="login-fields">
              {/* Email / ID */}
              <div className="login-field">
                <label htmlFor="identifier" className="login-label">
                  Email hoặc Mã học sinh
                </label>
                <div className="login-input-wrap">
                  <span className="material-symbols-outlined login-input-icon">
                    person
                  </span>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Nhập email hoặc mã của bạn"
                    className="login-input"
                    required
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
                    required
                  />
                  <button
                    type="button"
                    className="login-toggle-visibility"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((v) => !v)}
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
                />
                <span className="login-remember-label">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="login-forgot-link">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit */}
            <button id="login-submit" type="submit" className="login-submit-btn">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                login
              </span>
              Đăng nhập
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
              id="login-school"
              type="button"
              className="login-social-btn"
              aria-label="Đăng nhập bằng tài khoản trường"
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--color-primary)", fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
              Tài khoản trường
            </button>
          </div>

          {/* Register row */}
          <p className="login-register-row">
            Chưa có tài khoản?{" "}
            <Link to="/auth/register" className="login-register-link">
              Đăng ký ngay
            </Link>
          </p>

          {/* Footer links */}
          <div className="login-footer-links">
            <a href="#" className="login-footer-link">
              <span className="material-symbols-outlined">privacy_tip</span>
              Chính sách bảo mật
            </a>
            <a href="#" className="login-footer-link">
              <span className="material-symbols-outlined">help</span>
              Hỗ trợ
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
