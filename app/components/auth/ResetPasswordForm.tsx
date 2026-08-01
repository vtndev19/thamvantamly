/**
 * ResetPasswordForm.tsx
 * Trang đặt lại mật khẩu khi người dùng click link từ email Firebase.
 *
 * Firebase gửi link dạng:
 *   https://yourapp.com/auth/reset-password?mode=resetPassword&oobCode=xxxx&apiKey=...
 *
 * Component này đọc oobCode từ URL, cho phép nhập mật khẩu mới,
 * rồi gọi confirmPasswordReset(auth, oobCode, newPassword).
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
  type AuthError,
} from "firebase/auth";
import { auth } from "../../src/config/firebase";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

function parseAuthError(error: AuthError): string {
  switch (error.code) {
    case "auth/expired-action-code":
      return "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.";
    case "auth/invalid-action-code":
      return "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.";
    case "auth/user-disabled":
      return "Tài khoản này đã bị vô hiệu hóa.";
    case "auth/user-not-found":
      return "Không tìm thấy tài khoản với email này.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng dùng ít nhất 6 ký tự.";
    default:
      return "Đã xảy ra lỗi. Vui lòng thử lại hoặc yêu cầu đặt lại mật khẩu mới.";
  }
}

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oobCode = searchParams.get("oobCode") || "";
  const mode = searchParams.get("mode") || "";

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Verify the oobCode on mount
  useEffect(() => {
    if (!oobCode || mode !== "resetPassword") {
      setError("Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại.");
      setIsVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((emailFromCode) => {
        setEmail(emailFromCode);
        setIsVerifying(false);
      })
      .catch((err) => {
        setError(parseAuthError(err as AuthError));
        setIsVerifying(false);
      });
  }, [oobCode, mode]);

  // Countdown after success
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate("/auth/login");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
    } catch (err) {
      setError(parseAuthError(err as AuthError));
    } finally {
      setIsLoading(false);
    }
  }

  const passwordScore = (() => {
    const len = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNum = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*]/.test(newPassword);
    return [len, hasUpper, hasNum, hasSpecial].filter(Boolean).length;
  })();
  const strengthLabel = passwordScore <= 1 ? "Yếu" : passwordScore === 2 ? "Trung bình" : passwordScore === 3 ? "Mạnh" : "Rất mạnh";
  const strengthCls = passwordScore <= 1 ? "weak" : passwordScore === 2 ? "medium" : passwordScore === 3 ? "strong" : "very-strong";

  return (
    <div className="login-page">
      <main className="login-card forgot-card" role="main">
        {/* ── Brand Panel ── */}
        <div className="login-brand-panel" aria-hidden="true">
          <div className="login-brand-blob-1" />
          <div className="login-brand-blob-2" />
          <div className="login-brand-content">
            <img src={LOGO_URL} alt="SafeSchool Hub Logo" className="login-brand-logo" />
            <h2 className="login-brand-title">Tạo mật khẩu mới</h2>
            <p className="login-brand-subtitle">
              Bảo vệ tài khoản với mật khẩu mạnh và khó đoán.
            </p>
            <div className="login-brand-badges">
              {[
                { icon: "lock_reset", label: "Đặt lại mật khẩu" },
                { icon: "verified_user", label: "Đã xác minh" },
                { icon: "security", label: "Bảo mật cao" },
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
          <div className="login-mobile-logo">
            <img src={LOGO_URL} alt="SafeSchool Hub Logo" />
          </div>

          <div className="login-form-header" style={{ marginBottom: "24px" }}>
            <h1 className="login-form-title" style={{ fontSize: "clamp(20px, 3.5vw, 28px)" }}>
              {isSuccess ? "Đặt lại thành công! 🎉" : "Tạo mật khẩu mới"}
            </h1>
            <p className="login-form-subtitle">
              <span className="material-symbols-outlined">
                {isSuccess ? "check_circle" : "lock_reset"}
              </span>
              {isSuccess
                ? `Chuyển về đăng nhập sau ${countdown} giây…`
                : email
                ? `Đang đặt lại cho: ${email}`
                : "Xác minh liên kết…"}
            </p>
          </div>

          {/* Loading state */}
          {isVerifying && (
            <div className="otp-success" style={{ justifyContent: "center" }}>
              <span className="login-spinner" style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10b981" }} />
              <span>Đang xác minh liên kết đặt lại mật khẩu…</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="login-error" role="alert">
              <span className="material-symbols-outlined login-error-icon">error</span>
              <div>
                <span>{error}</span>
                <Link
                  to="/auth/forgot-password"
                  style={{ display: "block", marginTop: "8px", fontSize: "12px", fontWeight: 600, color: "inherit" }}
                >
                  → Yêu cầu liên kết mới
                </Link>
              </div>
            </div>
          )}

          {/* Success state */}
          {isSuccess && (
            <div className="otp-success">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>Mật khẩu đã được đặt lại thành công!</strong>
                <p style={{ margin: "4px 0 0", opacity: 0.85 }}>
                  Bạn có thể đăng nhập bằng mật khẩu mới. Đang chuyển hướng sau {countdown}s…
                </p>
              </div>
            </div>
          )}

          {/* Form (only show when verified and not success) */}
          {!isVerifying && !error && !isSuccess && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="login-fields">
                {/* New password */}
                <div className="login-field">
                  <label htmlFor="reset-new-password" className="login-label">
                    Mật khẩu mới
                  </label>
                  <div className="login-input-wrap">
                    <span className="material-symbols-outlined login-input-icon">lock</span>
                    <input
                      id="reset-new-password"
                      type={showNewPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Tối thiểu 6 ký tự"
                      className="login-input login-input--password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="login-toggle-visibility"
                      aria-label={showNewPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShowNewPw((v) => !v)}
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined">
                        {showNewPw ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                  {newPassword && (
                    <div className="otp-pw-strength">
                      <div className="otp-pw-bars">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`otp-pw-bar${i < passwordScore ? ` otp-pw-bar--${strengthCls}` : ""}`}
                          />
                        ))}
                      </div>
                      <span className={`otp-pw-label otp-pw-label--${strengthCls}`}>{strengthLabel}</span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="login-field">
                  <label htmlFor="reset-confirm-password" className="login-label">
                    Xác nhận mật khẩu
                  </label>
                  <div className="login-input-wrap">
                    <span className="material-symbols-outlined login-input-icon">lock_clock</span>
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      className={`login-input login-input--password${
                        confirmPassword && confirmPassword !== newPassword ? " login-input--error" : ""
                      }${
                        confirmPassword && confirmPassword === newPassword ? " login-input--success" : ""
                      }`}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="login-toggle-visibility"
                      aria-label={showConfirmPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShowConfirmPw((v) => !v)}
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined">
                        {showConfirmPw ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="otp-field-hint otp-field-hint--error">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                      Mật khẩu không khớp
                    </p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="otp-field-hint otp-field-hint--success">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check</span>
                      Mật khẩu khớp
                    </p>
                  )}
                </div>
              </div>

              <button
                id="reset-password-submit"
                type="submit"
                className="login-submit-btn"
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                style={{ marginTop: "16px" }}
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner" aria-hidden="true" />
                    Đang đặt lại…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                      lock_reset
                    </span>
                    Xác nhận đặt lại mật khẩu
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to login */}
          {isSuccess && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Link to="/auth/login" className="login-submit-btn" style={{ display: "inline-flex", textDecoration: "none" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>login</span>
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {!isSuccess && (
            <div className="login-register-row" style={{ marginTop: "24px" }}>
              <Link to="/auth/login" className="otp-back-login">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
