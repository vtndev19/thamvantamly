import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
  limit,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DoctorProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  specialization?: string;
  hospital?: string;
  licenseNumber?: string;
  phone?: string;
  photoURL?: string;
  proofUrl?: string;
  role: string;
  createdAt?: number;
  bio?: string;
  experience?: string;
  achievements?: string;
}

export type SenderRole = "student" | "doctor";

export interface DoctorChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: SenderRole;
  text: string;
  senderPhotoURL?: string;
  timestamp: Date | Timestamp | null;
  read?: boolean;
}

export interface DoctorChat {
  id?: string;
  studentId: string;
  studentName: string;
  studentPhotoURL?: string;
  doctorId: string;
  doctorName: string;
  doctorPhotoURL?: string;
  doctorSpecialization?: string;
  lastMessage?: string;
  lastMessageAt: Date | Timestamp | null;
  lastMessageSenderRole?: SenderRole;
  unreadByStudent: number;
  unreadByDoctor: number;
  createdAt: Date | Timestamp | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDate(val: Date | Timestamp | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof (val as Timestamp).toDate === "function") return (val as Timestamp).toDate();
  return null;
}

export function formatChatTime(val: Date | Timestamp | null | undefined): string {
  const d = toDate(val);
  if (!d) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} giờ trước`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// ─── DoctorChatService ─────────────────────────────────────────────────────────

export class DoctorChatService {
  // ── 1. Get all approved doctors from `doctors` collection ──────────────────

  static async getDoctors(): Promise<DoctorProfile[]> {
    try {
      const snap = await getDocs(collection(db, "doctors"));
      return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as DoctorProfile));
    } catch (err) {
      console.error("[DoctorChatService] getDoctors error:", err);
      return [];
    }
  }

  // ── 2. Get or create a 1-on-1 chat between student and doctor ─────────────

  static async getOrCreateChat(
    studentId: string,
    studentName: string,
    doctorId: string,
    doctorName: string,
    doctorPhotoURL?: string,
    doctorSpecialization?: string,
    studentPhotoURL?: string
  ): Promise<string> {
    try {
      // Query for existing chat
      const q = query(
        collection(db, "doctorChats"),
        where("studentId", "==", studentId),
        where("doctorId", "==", doctorId),
        limit(1)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        return snap.docs[0].id;
      }

      // Create new chat document
      const chatData: Omit<DoctorChat, "id"> = {
        studentId,
        studentName,
        studentPhotoURL: studentPhotoURL || "",
        doctorId,
        doctorName,
        doctorPhotoURL: doctorPhotoURL || "",
        doctorSpecialization: doctorSpecialization || "",
        lastMessage: "",
        lastMessageAt: serverTimestamp() as any,
        unreadByStudent: 0,
        unreadByDoctor: 0,
        createdAt: serverTimestamp() as any,
      };

      const ref = await addDoc(collection(db, "doctorChats"), chatData);
      return ref.id;
    } catch (err) {
      console.error("[DoctorChatService] getOrCreateChat error:", err);
      throw err;
    }
  }

  // ── 3. Send a message ──────────────────────────────────────────────────────

  static async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    senderRole: SenderRole,
    text: string,
    senderPhotoURL?: string
  ): Promise<void> {
    if (!text.trim()) return;

    try {
      // Add message to sub-collection
      await addDoc(collection(db, "doctorChats", chatId, "messages"), {
        chatId,
        senderId,
        senderName,
        senderRole,
        text: text.trim(),
        senderPhotoURL: senderPhotoURL || "",
        timestamp: serverTimestamp(),
        read: false,
      });

      // Update parent chat document
      const chatRef = doc(db, "doctorChats", chatId);
      const updateData: Record<string, any> = {
        lastMessage: text.trim().slice(0, 100),
        lastMessageAt: serverTimestamp(),
        lastMessageSenderRole: senderRole,
      };

      // Increment unread count for the other party
      if (senderRole === "student") {
        updateData.unreadByDoctor = await DoctorChatService._incrementUnread(chatId, "doctor");
        if (senderPhotoURL) {
          updateData.studentPhotoURL = senderPhotoURL;
        }
      } else {
        updateData.unreadByStudent = await DoctorChatService._incrementUnread(chatId, "student");
        if (senderPhotoURL) {
          updateData.doctorPhotoURL = senderPhotoURL;
        }
      }

      await updateDoc(chatRef, updateData);
    } catch (err) {
      console.error("[DoctorChatService] sendMessage error:", err);
      throw err;
    }
  }

  private static async _incrementUnread(chatId: string, forRole: "student" | "doctor"): Promise<number> {
    try {
      const chatSnap = await getDoc(doc(db, "doctorChats", chatId));
      if (!chatSnap.exists()) return 1;
      const field = forRole === "student" ? "unreadByStudent" : "unreadByDoctor";
      return (chatSnap.data()[field] || 0) + 1;
    } catch {
      return 1;
    }
  }

  // ── 4. Mark as read ────────────────────────────────────────────────────────

  static async markAsRead(chatId: string, role: SenderRole): Promise<void> {
    try {
      const field = role === "student" ? "unreadByStudent" : "unreadByDoctor";
      await updateDoc(doc(db, "doctorChats", chatId), { [field]: 0 });
    } catch (err) {
      console.error("[DoctorChatService] markAsRead error:", err);
    }
  }

  // ── 5. Subscribe to messages (realtime) ────────────────────────────────────

  static subscribeToMessages(
    chatId: string,
    callback: (messages: DoctorChatMessage[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, "doctorChats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snap) => {
      const messages: DoctorChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as DoctorChatMessage));
      callback(messages);
    }, (err) => {
      console.error("[DoctorChatService] subscribeToMessages error:", err);
    });
  }

  // ── 6. Subscribe to chat list for a user (realtime) ────────────────────────

  static subscribeToMyChats(
    userId: string,
    role: SenderRole,
    callback: (chats: DoctorChat[]) => void
  ): Unsubscribe {
    const field = role === "student" ? "studentId" : "doctorId";
    const q = query(
      collection(db, "doctorChats"),
      where(field, "==", userId)
    );

    return onSnapshot(q, (snap) => {
      const chats: DoctorChat[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as DoctorChat));

      // Sắp xếp in-memory theo lastMessageAt giảm dần để tránh composite index
      chats.sort((a, b) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (val instanceof Date) return val.getTime();
          if (typeof val.toDate === "function") return val.toDate().getTime();
          if (val.seconds) return val.seconds * 1000;
          return new Date(val).getTime();
        };
        return getMs(b.lastMessageAt) - getMs(a.lastMessageAt);
      });

      callback(chats);
    }, (err) => {
      console.error("[DoctorChatService] subscribeToMyChats error:", err);
    });
  }

  // ── 7. Get chat by ID (one-time) ───────────────────────────────────────────

  static async getChatById(chatId: string): Promise<DoctorChat | null> {
    try {
      const snap = await getDoc(doc(db, "doctorChats", chatId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as DoctorChat;
    } catch (err) {
      console.error("[DoctorChatService] getChatById error:", err);
      return null;
    }
  }
}
