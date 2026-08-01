/**
 * otpService.ts
 * Quản lý OTP cho tính năng Quên Mật Khẩu.
 *
 * Flow:
 *  1. sendOTPEmail(email, displayName) → tạo OTP, lưu Firestore TTL 5 phút,
 *                                        gửi email chứa MÃ OTP 6 số qua EmailJS
 *  2. verifyOTP(email, otp)            → xác minh, xóa sau khi dùng
 *  3. checkEmailExistsInUsers(email)   → kiểm tra email có trong Firestore users
 *
 * Firestore path: otpRequests/{emailHash}
 *
 * EmailJS Setup (https://www.emailjs.com/):
 *  1. Tạo tài khoản miễn phí tại emailjs.com
 *  2. Tạo Email Service (kết nối Gmail/Outlook/…)
 *  3. Tạo Email Template với các biến:
 *       {{to_name}}   – Tên người nhận
 *       {{to_email}}  – Email người nhận
 *       {{otp_code}}  – Mã OTP 6 số
 *       {{expires_in}} – Thời gian hết hạn (mặc định "5 phút")
 *  4. Điền Service ID, Template ID, Public Key vào .env
 */

import emailjs from "@emailjs/browser";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";

const OTP_COLLECTION = "otpRequests";
const OTP_TTL_MS = 5 * 60 * 1000; // 5 phút

// EmailJS config từ biến môi trường
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || "";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || "";

/** Encode email thành Firestore docId an toàn */
function emailToDocId(email: string): string {
  return email.toLowerCase().trim().replace(/[@.]/g, "_");
}

/** Tạo OTP ngẫu nhiên 6 chữ số */
function generateOTP(): string {
  // Dùng crypto.getRandomValues để an toàn hơn Math.random()
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

export interface OTPRecord {
  email: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Tạo OTP và gửi email chứa MÃ OTP (không phải link) tới người dùng.
 *
 * @param email       - Email đăng ký của người dùng
 * @param displayName - Tên hiển thị để chèn vào email (nếu có)
 * @returns           - Promise<void> khi hoàn tất (OTP đã lưu Firestore + email đã gửi)
 */
export async function sendOTPEmail(
  email: string,
  displayName?: string
): Promise<void> {
  const otp = generateOTP();
  const now = Date.now();
  const docId = emailToDocId(email);

  // 1. Lưu OTP vào Firestore với TTL
  const record: OTPRecord = {
    email: email.toLowerCase().trim(),
    otp,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
  };
  await setDoc(doc(db, OTP_COLLECTION, docId), record);

  // 2. Kiểm tra cấu hình EmailJS
  const isEmailJSConfigured =
    EMAILJS_SERVICE_ID &&
    EMAILJS_TEMPLATE_ID &&
    EMAILJS_PUBLIC_KEY &&
    EMAILJS_SERVICE_ID !== "your_service_id";

  if (isEmailJSConfigured) {
    // Log cấu hình để debug
    console.info("[EmailJS] Đang gửi OTP...", {
      serviceId:  EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      toEmail:    email,
      otpCode:    otp,
    });

    try {
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_name:    displayName || email.split("@")[0],
          to_email:   email,
          otp_code:   otp,
          expires_in: "5 phút",
          app_name:   "SafeSchool Hub",
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      console.info("[EmailJS] ✅ Gửi thành công!", result.status, result.text);
    } catch (err: any) {
      // In lỗi chi tiết ra console để debug
      console.error("[EmailJS] ❌ Lỗi gửi email:", {
        status:  err?.status,
        text:    err?.text,
        message: err?.message,
        full:    err,
      });
      // Re-throw để ForgotPasswordForm bắt và hiển thị lỗi
      throw err;
    }
  } else {
    // Chế độ DEV: In OTP ra console (chưa cấu hình EmailJS)
    console.warn(
      "⚠️  EmailJS chưa được cấu hình. Xem hướng dẫn trong .env\n" +
      `[DEV] Mã OTP cho ${email}: ${otp}\n` +
      `[DEV] OTP hết hạn sau: ${new Date(now + OTP_TTL_MS).toLocaleTimeString("vi-VN")}`
    );
  }
}

/**
 * Xác minh OTP.
 * - Trả về { valid: true } nếu OTP đúng và chưa hết hạn.
 * - Xóa OTP khỏi Firestore sau khi verify thành công (one-time use).
 */
export async function verifyOTP(
  email: string,
  inputOtp: string
): Promise<{ valid: boolean; reason?: "not_found" | "expired" | "wrong" }> {
  const docId = emailToDocId(email);
  const docRef = doc(db, OTP_COLLECTION, docId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return { valid: false, reason: "not_found" };
  }

  const record = snapshot.data() as OTPRecord;

  if (Date.now() > record.expiresAt) {
    await deleteDoc(docRef);
    return { valid: false, reason: "expired" };
  }

  if (record.otp !== inputOtp.trim()) {
    return { valid: false, reason: "wrong" };
  }

  // OTP đúng → xóa để tránh dùng lại
  await deleteDoc(docRef);
  return { valid: true };
}

/**
 * Kiểm tra email có tồn tại trong collection `users`.
 * Trả về thông tin user nếu tìm thấy, null nếu không.
 */
export async function checkEmailExistsInUsers(
  email: string
): Promise<{ uid: string; email: string; displayName?: string } | null> {
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("email", "==", email.toLowerCase().trim())
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const userDoc = snapshot.docs[0];
  const data = userDoc.data();
  return {
    uid:         userDoc.id,
    email:       data.email,
    displayName: data.displayName,
  };
}

/**
 * Xóa OTP theo email (dùng khi cancel flow hoặc user thoát giữa chừng).
 */
export async function deleteOTP(email: string): Promise<void> {
  const docId = emailToDocId(email);
  await deleteDoc(doc(db, OTP_COLLECTION, docId));
}

/** Kiểm tra EmailJS đã được cấu hình chưa (dùng cho UI hiển thị cảnh báo) */
export function isEmailJSConfigured(): boolean {
  return !!(
    EMAILJS_SERVICE_ID &&
    EMAILJS_TEMPLATE_ID &&
    EMAILJS_PUBLIC_KEY &&
    EMAILJS_SERVICE_ID !== "your_service_id"
  );
}
