import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { getUserProfile } from "../services/userService";
import type { AppUser, UserRole } from "../types/user.types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Người dùng hiện tại (null = chưa đăng nhập) */
  user: AppUser | null;
  /** Firebase User gốc (để dùng với các Firebase API) */
  firebaseUser: User | null;
  /** true trong khi đang kiểm tra trạng thái đăng nhập */
  loading: boolean;
  /** Đăng xuất */
  logout: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

/**
 * AuthProvider – bọc toàn bộ app để cung cấp thông tin auth & role.
 *
 * Luồng:
 * 1. onAuthStateChanged của Firebase Auth kích hoạt khi trạng thái đăng nhập thay đổi.
 * 2. Khi có user → đọc profile từ Firestore để lấy role.
 * 3. Cập nhật state `user` (AppUser) chứa đủ uid + email + displayName + role.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (fbUser) {
        setLoading(true);
        // Lắng nghe realtime thay đổi profile của user trong Firestore
        const userDocRef = doc(db, "users", fbUser.uid);
        unsubProfile = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data();
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName || profile.displayName || "",
                role: profile.role,
                schoolCode: profile.schoolCode,
                createdAt: profile.createdAt,
              });
            } else {
              // Phục vụ fallback tạm thời khi vừa auth thành công nhưng chưa kịp lưu profile Firestore
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                role: "student" as UserRole,
                createdAt: Date.now(),
              });
            }
            setLoading(false);
          },
          (error) => {
            console.error("Lỗi lắng nghe user profile:", error);
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: "student" as UserRole,
              createdAt: Date.now(),
            });
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  async function logout() {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("userRole");
    }
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Hook để dùng AuthContext trong bất kỳ component nào.
 * Phải được dùng bên trong `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() phải được dùng bên trong <AuthProvider>");
  }
  return ctx;
}
