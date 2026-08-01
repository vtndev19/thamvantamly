/**
 * ForgotPasswordForm.tsx
 * Tính năng lấy lại mật khẩu với OTP qua email.
 *
 * Step 1 – Nhập email → kiểm tra tồn tại → gửi EMAIL CHỨA MÃ OTP 6 SỐ qua EmailJS
 * Step 2 – Nhập mã OTP 6 số nhận từ email → xác minh với Firestore
 * Step 3 – Nhập mật khẩu mới → Firebase sendPasswordResetEmail (handleCodeInApp: true)
 *           → Email Firebase gửi link → link mở trong app tại /auth/reset-password
 *           → confirmPasswordReset hoàn tất
 *
 * ❌ KHÔNG gửi link ở bước 1/2 – chỉ gửi MÃ OTP số
 * ✅ Link chỉ được gửi ở bước 3 để Firebase thực tế cập nhật mật khẩu (không có backend)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  sendPasswordResetEmail,
  type AuthError,
} from "firebase/auth";
import { auth } from "../../src/config/firebase";
import {
  sendOTPEmail,
  verifyOTP,
  checkEmailExistsInUsers,
  isEmailJSConfigured,
} from "../../src/services/otpService";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

type Step = 1 | 2 | 3;

const STEPS = [
  { label: "Xác nhận email", icon: "mail" },
  { label: "Nhập mã OTP",   icon: "pin" },
  { label: "Mật khẩu mới",  icon: "lock_reset" },
];

function parseAuthError(error: AuthError): string {
  switch (error.code) {
    case "auth/user-not-found":
      return "Không tìm thấy tài khoản với email này.";
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ.";
    case "auth/too-many-requests":
      return "Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
    default:
      return "Đã xảy ra lỗi. Vui lòng thử lại.";
  }
}

// ── Countdown hook ────────────────────────────────────────────
function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setSeconds(initial);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  }, [initial]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(0);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return { seconds, start, reset, isActive: seconds > 0 };
}

// ── Main Component ────────────────────────────────────────────
export function ForgotPasswordForm() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // DEV mode: hiển thị OTP khi EmailJS chưa cấu hình
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const countdown = useCountdown(300); // 5 phút
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailJSReady = isEmailJSConfigured();
  // ID debug – hiển thị trong thông báo lỗi để dễ trace
  const EMAILJS_IDS = `serviceId=${import.meta.env.VITE_EMAILJS_SERVICE_ID ?? "?"}, templateId=${import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "?"}`;

  // ── Step 1: Gửi OTP ──────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDevOtpHint(null);
    setIsLoading(true);

    let userInfo = null;
    try {
      console.info("[OTP Flow] 1. Đang kiểm tra email trong Firestore...");
      userInfo = await checkEmailExistsInUsers(email);
    } catch (err: any) {
      console.error("[OTP Flow] ❌ Lỗi khi kiểm tra email (users collection):", err);
      setError(`Lỗi truy cập dữ liệu người dùng (${err?.code || "error"}): ${err?.message || "Vui lòng kiểm tra lại Firestore Rules của collection 'users'."}`);
      setIsLoading(false);
      return;
    }

    if (!userInfo) {
      setError("Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại.");
      setIsLoading(false);
      return;
    }
    setDisplayName(userInfo.displayName || "");

    try {
      console.info("[OTP Flow] 2. Email hợp lệ. Đang tạo OTP và gửi email...");
      await sendOTPEmail(email, userInfo.displayName);

      // DEV mode: Đọc OTP từ Firestore để hiển thị hint
      if (!emailJSReady) {
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../../src/config/firebase");
        const docId = email.toLowerCase().trim().replace(/[@.]/g, "_");
        const snap = await getDoc(doc(db, "otpRequests", docId));
        if (snap.exists()) {
          setDevOtpHint(snap.data().otp);
        }
      }

      setSuccessMsg("Mã OTP đã được gửi về email");
      countdown.start();
      setStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      console.error("[OTP Flow] ❌ Lỗi khi tạo/gửi OTP (otpRequests collection hoặc EmailJS):", err);
      
      const status  = err?.status  ?? err?.code  ?? "unknown";
      const errText = err?.text    ?? err?.message ?? String(err);

      if (status === "permission-denied") {
        setError("Lỗi quyền ghi Firestore (permission-denied). Vui lòng đảm bảo bạn đã deploy thành công Firestore Rules cho collection 'otpRequests'.");
      } else if (status === 400) {
        setError(`EmailJS lỗi 400: Template sai hoặc thiếu biến. Kiểm tra EmailJS Template Dashboard. (${errText})`);
      } else if (status === 401 || status === 403) {
        setError(`EmailJS lỗi ${status}: Public Key hoặc Service ID không hợp lệ. Kiểm tra lại trong .env.`);
      } else if (status === 404) {
        setError(`EmailJS lỗi 404: Service ID hoặc Template ID không tồn tại. (${EMAILJS_IDS})`);
      } else if (status === 422) {
        setError(`EmailJS lỗi 422: Dữ liệu không hợp lệ – có thể "To Email" chưa được set trong template. (${errText})`);
      } else {
        setError(`Không thể gửi OTP (${status}): ${errText}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────
  async function handleResendOTP() {
    if (countdown.isActive) return;
    setError(null);
    setDevOtpHint(null);
    setIsLoading(true);
    try {
      await sendOTPEmail(email, displayName);

      if (!emailJSReady) {
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../../src/config/firebase");
        const docId = email.toLowerCase().trim().replace(/[@.]/g, "_");
        const snap = await getDoc(doc(db, "otpRequests", docId));
        if (snap.exists()) setDevOtpHint(snap.data().otp);
      }

      setSuccessMsg("Mã OTP đã được gửi lại về email");
      setOtpDigits(["", "", "", "", "", ""]);
      countdown.start();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Không thể gửi lại OTP. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── OTP Input Handlers ─────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const next = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      setOtpDigits(next);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  }

  // ── Step 2: Xác minh OTP ──────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Vui lòng nhập đủ 6 chữ số OTP."); return; }
    setError(null);
    setIsLoading(true);

    try {
      const result = await verifyOTP(email, otp);
      if (!result.valid) {
        setError(
          result.reason === "not_found" ? "Mã OTP không tồn tại. Vui lòng gửi lại." :
          result.reason === "expired"   ? "Mã OTP đã hết hạn (5 phút). Vui lòng gửi lại mã mới." :
                                          "Mã OTP không chính xác. Vui lòng kiểm tra lại."
        );
        setIsLoading(false);
        return;
      }

      // OTP đúng → chuyển bước 3
      setDevOtpHint(null);
      setSuccessMsg("✅ Xác minh OTP thành công! Hãy đặt mật khẩu mới.");
      countdown.reset();
      setStep(3);
    } catch {
      setError("Không thể xác minh OTP. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 3: Gửi Firebase Reset (handleCodeInApp: true → mở /auth/reset-password) ──
  async function handleSendFinalReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      // Sau khi OTP đã xác minh, gửi Firebase reset email.
      // Với handleCodeInApp: true, link mở tại /auth/reset-password trong app.
      // Tại đó, confirmPasswordReset(oobCode, newPassword) đổi mật khẩu thật sự.
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth/reset-password`,
        handleCodeInApp: true,
      });
      setResetSent(true);
      setSuccessMsg(null);
    } catch (err) {
      setError(parseAuthError(err as AuthError));
    } finally {
      setIsLoading(false);
    }
  }

  const otpFull = otpDigits.join("").length === 6;

  // ── Password strength ──────────────────────────────────────────
  const pwScore = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /\d/.test(newPassword),
    /[!@#$%^&*]/.test(newPassword),
  ].filter(Boolean).length;
  const pwLabel = pwScore <= 1 ? "Yếu" : pwScore === 2 ? "Trung bình" : pwScore === 3 ? "Mạnh" : "Rất mạnh";
  const pwCls   = pwScore <= 1 ? "weak" : pwScore === 2 ? "medium" : pwScore === 3 ? "strong" : "very-strong";

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="login-page">
      <main className="login-card forgot-card" role="main">
        {/* ── Brand Panel ── */}
        <div className="login-brand-panel" aria-hidden="true">
          <div className="login-brand-blob-1" />
          <div className="login-brand-blob-2" />
          <div className="login-brand-content">
            <img src={LOGO_URL} alt="SafeSchool Hub Logo" className="login-brand-logo" />
            <h2 className="login-brand-title">Đặt lại mật khẩu</h2>
            <p className="login-brand-subtitle">
              Xác minh danh tính qua mã OTP gửi về email của bạn.
            </p>
            <div className="login-brand-badges">
              {[
                { icon: "mark_email_read", label: "OTP qua email" },
                { icon: "timer",           label: "Hết hạn 5 phút" },
                { icon: "verified_user",   label: "Bảo mật cao" },
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

          {/* Step Indicator */}
          <div className="otp-steps">
            {STEPS.map((s, i) => {
              const num = (i + 1) as Step;
              const active = step === num;
              const done   = step > num;
              return (
                <div key={s.label} className={`otp-step${active ? " otp-step--active" : ""}${done ? " otp-step--done" : ""}`}>
                  <div className="otp-step-circle">
                    {done
                      ? <span className="material-symbols-outlined">check</span>
                      : <span className="material-symbols-outlined">{s.icon}</span>
                    }
                  </div>
                  <span className="otp-step-label">{s.label}</span>
                  {i < STEPS.length - 1 && (
                    <div className={`otp-step-line${done ? " otp-step-line--done" : ""}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form header */}
          <div className="login-form-header" style={{ marginBottom: "20px" }}>
            <h1 className="login-form-title" style={{ fontSize: "clamp(20px, 3.5vw, 26px)" }}>
              {step === 1 && "Quên mật khẩu?"}
              {step === 2 && "Nhập mã xác minh OTP"}
              {step === 3 && "Đặt lại mật khẩu"}
            </h1>
            <p className="login-form-subtitle">
              <span className="material-symbols-outlined">
                {step === 1 ? "help_outline" : step === 2 ? "mark_email_read" : "lock_reset"}
              </span>
              {step === 1 && "Nhập email để nhận mã OTP 6 số"}
              {step === 2 && `Kiểm tra email ${email} để lấy mã OTP`}
              {step === 3 && "Nhấn nút bên dưới để nhận link đặt mật khẩu mới"}
            </p>
          </div>

          {/* ── DEV Warning (EmailJS chưa cấu hình) ── */}
          {!emailJSReady && step >= 1 && (
            <div className="otp-dev-banner" role="note">
              <span className="material-symbols-outlined">bug_report</span>
              <div>
                <strong>Chế độ DEV</strong> – EmailJS chưa được cấu hình.
                Mã OTP sẽ hiển thị ngay trên màn hình thay vì gửi qua email thật.
                {" "}<a href="https://www.emailjs.com/" target="_blank" rel="noreferrer" className="otp-dev-link">
                  Cài đặt EmailJS →
                </a>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              <span className="material-symbols-outlined login-error-icon">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="otp-success" role="status">
              <span className="material-symbols-outlined">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── DEV OTP Hint Box ── */}
          {devOtpHint && (
            <div className="otp-dev-code" role="note" aria-label="Mã OTP dành cho dev">
              <span className="material-symbols-outlined" style={{ color: "#f59e0b" }}>terminal</span>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#92400e", marginBottom: "4px" }}>
                  Mã OTP (DEV – không hiển thị trong production):
                </div>
                <div className="otp-dev-code-value">{devOtpHint}</div>
              </div>
              <button
                type="button"
                className="otp-dev-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(devOtpHint);
                  // Paste OTP tự động
                  const next = devOtpHint.split("").slice(0, 6);
                  setOtpDigits([...next]);
                }}
                title="Sao chép và tự điền OTP"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>content_copy</span>
                Copy & điền
              </button>
            </div>
          )}

          {/* ── STEP 1: Email form ── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} noValidate>
              <div className="login-fields">
                <div className="login-field">
                  <label htmlFor="forgot-email" className="login-label">Địa chỉ email</label>
                  <div className="login-input-wrap">
                    <span className="material-symbols-outlined login-input-icon">mail</span>
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Nhập email đã đăng ký"
                      className="login-input"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); setSuccessMsg(null); }}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <button
                id="forgot-send-otp"
                type="submit"
                className="login-submit-btn"
                disabled={isLoading || !email.trim()}
                style={{ marginTop: "16px" }}
              >
                {isLoading ? (
                  <><span className="login-spinner" aria-hidden="true" />Đang gửi mã OTP…</>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                      mark_email_unread
                    </span>
                    Gửi mã OTP về email
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP form ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} noValidate>

              {/* OTP boxes */}
              <div className="otp-boxes" role="group" aria-label="Nhập mã OTP 6 chữ số">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    id={`otp-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-box${digit ? " otp-box--filled" : ""}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    disabled={isLoading}
                    aria-label={`Chữ số OTP thứ ${i + 1}`}
                  />
                ))}
              </div>

              {/* Countdown + resend */}
              <div className="otp-resend-row">
                {countdown.isActive ? (
                  <span className="otp-countdown">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>timer</span>
                    Gửi lại sau {Math.floor(countdown.seconds / 60)}:{String(countdown.seconds % 60).padStart(2, "0")}
                  </span>
                ) : (
                  <button type="button" className="otp-resend-btn" onClick={handleResendOTP} disabled={isLoading}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>refresh</span>
                    Gửi lại mã OTP
                  </button>
                )}
              </div>

              <button
                id="forgot-verify-otp"
                type="submit"
                className="login-submit-btn"
                disabled={isLoading || !otpFull}
              >
                {isLoading
                  ? <><span className="login-spinner" aria-hidden="true" />Đang xác minh…</>
                  : <><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>verified</span>Xác minh OTP</>
                }
              </button>

              <button type="button" className="otp-back-btn"
                onClick={() => { setStep(1); setError(null); setSuccessMsg(null); setDevOtpHint(null); countdown.reset(); }}
                disabled={isLoading}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
                Quay lại nhập email
              </button>
            </form>
          )}

          {/* ── STEP 3: Gửi link đổi mật khẩu Firebase ── */}
          {step === 3 && !resetSent && (
            <form onSubmit={handleSendFinalReset} noValidate>
              <div className="otp-step3-info">
                <div className="otp-step3-icon">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <p className="otp-step3-title">Danh tính đã xác minh!</p>
                  <p className="otp-step3-desc">
                    Nhấn nút bên dưới để nhận email đặt lại mật khẩu. Link trong email sẽ
                    mở thẳng vào trang đặt mật khẩu của ứng dụng – không phải trang Firebase mặc định.
                  </p>
                </div>
              </div>

              <button
                id="forgot-reset-password"
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
                style={{ marginTop: "8px" }}
              >
                {isLoading
                  ? <><span className="login-spinner" aria-hidden="true" />Đang gửi…</>
                  : <>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                        lock_reset
                      </span>
                      Gửi email đặt mật khẩu mới
                    </>
                }
              </button>
            </form>
          )}

          {/* ── STEP 3: Đã gửi – hướng dẫn user ── */}
          {step === 3 && resetSent && (
            <div className="otp-final-success">
              <div className="otp-final-icon">
                <span className="material-symbols-outlined">mail_lock</span>
              </div>
              <h2 className="otp-final-title">Kiểm tra hộp thư!</h2>
              <p className="otp-final-desc">
                Email đặt mật khẩu mới đã được gửi đến <strong>{email}</strong>.
                Vui lòng mở email và nhấn vào nút <em>"Đặt lại mật khẩu"</em>.
              </p>
              <div className="otp-final-steps">
                {[
                  { icon: "inbox", text: "Mở hộp thư " + email },
                  { icon: "mail_open", text: "Tìm email từ SafeSchool Hub" },
                  { icon: "touch_app", text: "Nhấn nút \"Đặt lại mật khẩu\"" },
                  { icon: "lock_reset", text: "Nhập mật khẩu mới trong app" },
                ].map((item, i) => (
                  <div key={i} className="otp-final-step">
                    <span className="material-symbols-outlined otp-final-step-icon">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="otp-final-spam">
                Không thấy email? Kiểm tra mục <strong>Spam / Thư rác</strong>.
              </p>
              <button
                type="button"
                className="otp-back-btn"
                style={{ marginTop: "8px" }}
                onClick={() => { setStep(1); setResetSent(false); setSuccessMsg(null); setError(null); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>replay</span>
                Gửi lại từ đầu
              </button>
            </div>
          )}

          {/* Back to login */}
          <div className="login-register-row" style={{ marginTop: "20px" }}>
            <Link to="/auth/login" className="otp-back-login">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
