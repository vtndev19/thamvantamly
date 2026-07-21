import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import type { UserProfile, UserRole } from "../types/user.types";

const USERS_COLLECTION = "users";

/**
 * Tạo profile người dùng mới trong Firestore sau khi đăng ký.
 * Document path: users/{uid}
 */
export async function createUserProfile(
  uid: string,
  data: {
    email: string | null;
    displayName: string | null;
    role: UserRole;
    schoolCode?: string;
  }
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userRef, {
    uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    schoolCode: data.schoolCode || "",
    createdAt: Date.now(),
  });
}

/**
 * Đọc profile người dùng từ Firestore.
 * Trả về null nếu document không tồn tại.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  return snapshot.data() as UserProfile;
}

/**
 * Lấy danh sách người dùng thuộc cùng một trường (theo schoolCode).
 * Phục vụ tính năng chia sẻ dữ liệu theo trường học giữa Học sinh & Giáo viên.
 */
export async function getUsersBySchoolCode(
  schoolCode: string,
  role?: UserRole
): Promise<UserProfile[]> {
  if (!schoolCode.trim()) return [];
  const usersRef = collection(db, USERS_COLLECTION);
  const q = role
    ? query(
        usersRef,
        where("schoolCode", "==", schoolCode.trim()),
        where("role", "==", role)
      )
    : query(usersRef, where("schoolCode", "==", schoolCode.trim()));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as UserProfile);
}

/**
 * Cập nhật role của người dùng (chỉ admin mới có quyền gọi hàm này).
 * Firestore Security Rules sẽ enforce điều này ở backend.
 */
export async function updateUserRole(
  uid: string,
  newRole: UserRole
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, { role: newRole });
}

/**
 * Cập nhật displayName trong profile Firestore
 */
export async function updateUserDisplayName(
  uid: string,
  displayName: string
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, { displayName });
}

/**
 * Tạo tự động hoặc đảm bảo tài khoản Admin tồn tại trên Firebase Auth & Firestore.
 * Thông tin Admin mặc định:
 * Email: admin@safeschool.vn
 * Mật khẩu: Admin@123456
 */
export async function seedAdminAccount(): Promise<{ email: string; pass: string }> {
  const adminEmail = "admin@safeschool.vn";
  const adminPass = "Admin@123456";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
    await updateProfile(userCredential.user, {
      displayName: "Quản trị viên Hệ thống",
    });
    await createUserProfile(userCredential.user.uid, {
      email: adminEmail,
      displayName: "Quản trị viên Hệ thống",
      role: "admin",
      schoolCode: "THPT000",
    });
  } catch (err: any) {
    if (err?.code === "auth/email-already-in-use") {
      console.log("Tài khoản admin@safeschool.vn đã tồn tại trên Firebase Auth.");
    } else {
      console.warn("Lỗi khởi tạo tài khoản admin:", err);
    }
  }

  return { email: adminEmail, pass: adminPass };
}
