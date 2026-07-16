import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
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
  }
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userRef, {
    uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
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
