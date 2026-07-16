import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../config/firebase";
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          // Đọc profile từ Firestore để lấy role
          const profile = await getUserProfile(fbUser.uid);

          if (profile) {
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: profile.role,
              createdAt: profile.createdAt,
            });
          } else {
            // Không tìm thấy profile → mặc định role student
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: "student" as UserRole,
              createdAt: Date.now(),
            });
          }
        } catch {
          // Lỗi đọc Firestore → vẫn set user nhưng không có role
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            role: "student" as UserRole,
            createdAt: Date.now(),
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function logout() {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
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
