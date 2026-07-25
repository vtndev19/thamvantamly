import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { PSYCHOLOGICAL_DOCTOR_SYSTEM_PROMPT } from "../constants/chatbotPrompts";

export interface ChatMessage {
  id?: string;
  sessionId: string;
  userId: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date | Timestamp | null;
  sentiment?: "positive" | "neutral" | "anxious" | "depressed" | "crisis";
}

export interface ChatSession {
  id?: string;
  userId: string;
  userName?: string;
  userSchoolCode?: string;
  sessionTitle: string;
  startedAt: Date | Timestamp | null;
  lastUpdatedAt: Date | Timestamp | null;
  messageCount: number;
  riskLevel: "low" | "medium" | "high" | "emergency";
  summaryState?: string;
}

/**
 * Service quản lý trò chuyện Chatbot Bác sĩ Tâm lý và Lưu trữ Firestore
 */
export class PsychChatService {
  private static useLocalStorageOnly = false;

  private static handleFirestoreError(error: any) {
    console.warn("⚠️ [PsychChatService] Firestore Permission Denied / Lỗi kết nối. Chuyển sang LocalStorage fallback:", error);
    this.useLocalStorageOnly = true;
  }

  private static createLocalSession(
    userId: string,
    userName: string,
    schoolCode: string,
    initialTopic: string
  ): string {
    const fallbackId = "session_local_" + Date.now();
    const localSessions = this.getLocalSessions(userId);
    const newSession: ChatSession = {
      id: fallbackId,
      userId,
      userName,
      userSchoolCode: schoolCode,
      sessionTitle: initialTopic,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      messageCount: 0,
      riskLevel: "low",
    };
    localSessions.unshift(newSession);
    localStorage.setItem(`psych_sessions_${userId}`, JSON.stringify(localSessions));
    return fallbackId;
  }

  /**
   * Tạo phiên trò chuyện mới cho học sinh
   */
  static async createSession(
    userId: string,
    userName: string = "Học sinh",
    schoolCode: string = "THPT001",
    initialTopic: string = "Tư vấn tâm lý mới"
  ): Promise<string> {
    console.log("🔍 [PsychChatService] Bắt đầu tạo phiên chat mới cho user:", { userId, userName, schoolCode });
    if (this.useLocalStorageOnly) {
      return this.createLocalSession(userId, userName, schoolCode, initialTopic);
    }
    try {
      const sessionRef = await addDoc(collection(db, "chat_sessions"), {
        userId,
        userName,
        userSchoolCode: schoolCode,
        sessionTitle: initialTopic,
        startedAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
        messageCount: 0,
        riskLevel: "low",
        summaryState: "Khởi tạo cuộc trò chuyện tư vấn",
      });
      console.log("✅ [PsychChatService] Tạo phiên chat thành công trên Firestore. Session ID:", sessionRef.id);
      return sessionRef.id;
    } catch (error) {
      this.handleFirestoreError(error);
      return this.createLocalSession(userId, userName, schoolCode, initialTopic);
    }
  }

  /**
   * Lấy danh sách các phiên trò chuyện của một học sinh
   */
  static async getUserSessions(userId: string): Promise<ChatSession[]> {
    if (this.useLocalStorageOnly) {
      return this.getLocalSessions(userId);
    }
    try {
      console.log("🔍 [PsychChatService] Tải danh sách các phiên chat của userId:", userId);
      const q = query(
        collection(db, "chat_sessions"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as ChatSession[];

      // Sort in memory to avoid requiring a composite index
      sessions.sort((a, b) => {
        const tA = a.lastUpdatedAt ? (typeof (a.lastUpdatedAt as any).toDate === "function" ? (a.lastUpdatedAt as any).toDate().getTime() : new Date(a.lastUpdatedAt as any).getTime()) : 0;
        const tB = b.lastUpdatedAt ? (typeof (b.lastUpdatedAt as any).toDate === "function" ? (b.lastUpdatedAt as any).toDate().getTime() : new Date(b.lastUpdatedAt as any).getTime()) : 0;
        return tB - tA; // Descending
      });

      console.log(`✅ [PsychChatService] Lấy thành công ${sessions.length} phiên chat từ Firestore.`);
      return sessions.length > 0 ? sessions : this.getLocalSessions(userId);
    } catch (error) {
      this.handleFirestoreError(error);
      return this.getLocalSessions(userId);
    }
  }

  /**
   * Lấy tất cả tin nhắn trong một phiên
   */
  static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    if (this.useLocalStorageOnly || sessionId.startsWith("session_local_")) {
      return this.getLocalMessages(sessionId);
    }
    try {
      console.log("🔍 [PsychChatService] Tải tin nhắn của sessionId:", sessionId);
      const q = query(
        collection(db, "chat_messages"),
        where("sessionId", "==", sessionId)
      );
      const snapshot = await getDocs(q);
      const msgs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as ChatMessage[];

      // Sort in memory to avoid requiring a composite index
      msgs.sort((a, b) => {
        const tA = a.timestamp ? (typeof (a.timestamp as any).toDate === "function" ? (a.timestamp as any).toDate().getTime() : new Date(a.timestamp as any).getTime()) : 0;
        const tB = b.timestamp ? (typeof (b.timestamp as any).toDate === "function" ? (b.timestamp as any).toDate().getTime() : new Date(b.timestamp as any).getTime()) : 0;
        return tA - tB; // Ascending
      });

      console.log(`✅ [PsychChatService] Lấy thành công ${msgs.length} tin nhắn từ Firestore.`);
      return msgs.length > 0 ? msgs : this.getLocalMessages(sessionId);
    } catch (error) {
      this.handleFirestoreError(error);
      return this.getLocalMessages(sessionId);
    }
  }

  /**
   * Gửi tin nhắn từ người dùng và tự động tạo câu trả lời từ AI Doctor
   */
  static async sendMessage({
    sessionId,
    userId,
    userName = "Học sinh",
    schoolCode = "THPT001",
    userText,
    history = [],
  }: {
    sessionId: string;
    userId: string;
    userName?: string;
    schoolCode?: string;
    userText: string;
    history: ChatMessage[];
  }): Promise<{ botMessage: ChatMessage; riskLevel: string }> {
    console.log("🚀 [PsychChatService] Bắt đầu gửi tin nhắn:", { sessionId, userId, userText });

    const isLocal = this.useLocalStorageOnly || sessionId.startsWith("session_local_");

    // 1. Phân tích rủi ro
    const lowerText = userText.toLowerCase();
    let detectedRisk: "low" | "medium" | "high" | "emergency" = "low";
    if (
      lowerText.includes("tự tử") ||
      lowerText.includes("muốn chết") ||
      lowerText.includes("tự hại") ||
      lowerText.includes("kết thúc cuộc sống")
    ) {
      detectedRisk = "emergency";
    } else if (
      lowerText.includes("bị đánh") ||
      lowerText.includes("bị bạo lực") ||
      lowerText.includes("trầm cảm nặng") ||
      lowerText.includes("tẩy chay")
    ) {
      detectedRisk = "high";
    } else if (
      lowerText.includes("áp lực") ||
      lowerText.includes("căng thẳng") ||
      lowerText.includes("mất ngủ") ||
      lowerText.includes("lo âu")
    ) {
      detectedRisk = "medium";
    }

    // 2. Thử lưu tin nhắn user lên Firestore/LocalStorage
    if (isLocal) {
      this.saveLocalMessage({
        sessionId,
        userId,
        sender: "user",
        text: userText,
        timestamp: new Date(),
      });
    } else {
      try {
        await addDoc(collection(db, "chat_messages"), {
          sessionId,
          userId,
          sender: "user",
          text: userText,
          timestamp: serverTimestamp(),
        });
        console.log("💾 [PsychChatService] Đã lưu tin nhắn User lên Firestore");
      } catch (e) {
        this.handleFirestoreError(e);
        this.saveLocalMessage({
          sessionId,
          userId,
          sender: "user",
          text: userText,
          timestamp: new Date(),
        });
      }
    }

    // 3. AI sinh câu trả lời
    const botReplyText = await this.generateAIReply(userText, history, detectedRisk);

    const botMessageObj: ChatMessage = {
      id: "bot_msg_" + Date.now(),
      sessionId,
      userId,
      sender: "bot",
      text: botReplyText,
      timestamp: new Date(),
      sentiment: detectedRisk === "emergency" ? "crisis" : detectedRisk === "high" ? "anxious" : "neutral",
    };

    // 4. Thử lưu tin nhắn AI Doctor lên Firestore/LocalStorage
    if (isLocal) {
      this.saveLocalMessage(botMessageObj);
    } else {
      try {
        const botMsgRef = await addDoc(collection(db, "chat_messages"), {
          sessionId,
          userId,
          sender: "bot",
          text: botReplyText,
          timestamp: serverTimestamp(),
          sentiment: botMessageObj.sentiment,
        });
        botMessageObj.id = botMsgRef.id;
      } catch (e) {
        this.handleFirestoreError(e);
        this.saveLocalMessage(botMessageObj);
      }
    }

    // 5. Cập nhật thông tin phiên
    if (isLocal) {
      const sessions = this.getLocalSessions(userId);
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        sessions[idx].messageCount += 2;
        sessions[idx].riskLevel = detectedRisk;
        sessions[idx].lastUpdatedAt = new Date();
        if (history.length === 0) sessions[idx].sessionTitle = userText.slice(0, 40) + "...";
        localStorage.setItem(`psych_sessions_${userId}`, JSON.stringify(sessions));
      }
    } else {
      try {
        const sessionDocRef = doc(db, "chat_sessions", sessionId);
        const sessionSnap = await getDoc(sessionDocRef);
        const currentCount = sessionSnap.exists() ? sessionSnap.data().messageCount || 0 : 0;

        await updateDoc(sessionDocRef, {
          lastUpdatedAt: serverTimestamp(),
          messageCount: currentCount + 2,
          riskLevel: detectedRisk,
          sessionTitle: history.length === 0 ? userText.slice(0, 40) + "..." : sessionSnap.data()?.sessionTitle || "Tư vấn tâm lý",
        });
      } catch (e) {
        this.handleFirestoreError(e);
        const sessions = this.getLocalSessions(userId);
        const idx = sessions.findIndex((s) => s.id === sessionId);
        if (idx !== -1) {
          sessions[idx].messageCount += 2;
          sessions[idx].riskLevel = detectedRisk;
          sessions[idx].lastUpdatedAt = new Date();
          if (history.length === 0) sessions[idx].sessionTitle = userText.slice(0, 40) + "...";
          localStorage.setItem(`psych_sessions_${userId}`, JSON.stringify(sessions));
        }
      }
    }

    return {
      botMessage: botMessageObj,
      riskLevel: detectedRisk,
    };
  }

  // --- Helper cho LocalStorage Fallback khi Firestore Security Rules chưa mở ---
  private static getLocalSessions(userId: string): ChatSession[] {
    try {
      const data = localStorage.getItem(`psych_sessions_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getLocalMessages(sessionId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(`psych_msgs_${sessionId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalMessage(msg: ChatMessage) {
    try {
      const msgs = this.getLocalMessages(msg.sessionId);
      msgs.push(msg);
      localStorage.setItem(`psych_msgs_${msg.sessionId}`, JSON.stringify(msgs));
    } catch (e) {
      console.error("Lỗi saveLocalMessage:", e);
    }
  }

  /**
   * Sinh phản hồi 100% bằng Trí tuệ Nhân tạo Gemini AI API & System Prompt Bác sĩ Tâm lý
   */
  private static async generateAIReply(
    userText: string,
    history: ChatMessage[],
    riskLevel: string
  ): Promise<string> {
    const apiKey =
      (import.meta.env.VITE_GEMINI_API_KEY as string) ||
      (typeof process !== "undefined" && process.env?.VITE_GEMINI_API_KEY) ||
      "";

    console.log("🔍 [PsychChatService] API Key đang sử dụng:", apiKey ? `${apiKey.slice(0, 8)}...` : "CHƯA CÓ");

    if (!apiKey || apiKey.trim() === "") {
      console.error("❌ [PsychChatService] Chưa cấu hình VITE_GEMINI_API_KEY trong file .env!");
      return "⚠️ Hệ thống chưa kết nối được với API Key của Gemini AI. Bạn hãy kiểm tra lại cấu hình VITE_GEMINI_API_KEY trong file `.env` nhé.";
    }

    console.log("🌐 [PsychChatService] Đang gọi Gemini AI với System Prompt Bác sĩ Tâm lý...");

    // Format lịch sử tin nhắn phù hợp với API Gemini
    const formattedContents = [
      ...history.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
      {
        role: "user",
        parts: [{ text: userText }],
      },
    ];

    // Các endpoint model chuẩn xác của Google Generative AI (2025-2026)
    const modelsToTry = [
      { name: "gemini-2.5-flash", apiVersion: "v1beta" },
      { name: "gemini-3.5-flash-lite", apiVersion: "v1beta" },
      { name: "gemini-3.5-flash", apiVersion: "v1beta" },
      { name: "gemini-2.5-pro", apiVersion: "v1beta" },
    ];

    let lastErrorDetails = "";

    for (const target of modelsToTry) {
      try {
        console.log(`📡 [PsychChatService] Đang kết nối tới Gemini AI (${target.name} - ${target.apiVersion})...`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${target.apiVersion}/models/${target.name}:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: PSYCHOLOGICAL_DOCTOR_SYSTEM_PROMPT }],
              },
              contents: formattedContents,
              generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048,
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
              ],
            }),
          }
        );

        const data = await response.json();
        console.log(`📥 [PsychChatService] Response từ Gemini AI (${target.name}):`, data);

        if (data.error) {
          lastErrorDetails = `[${target.name}] ${data.error.message || JSON.stringify(data.error)}`;
          console.warn(`⚠️ [PsychChatService] Model ${target.name} trả về lỗi:`, data.error);
          continue;
        }

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText && replyText.trim() !== "") {
          console.log(`✅ [PsychChatService] Trí tuệ Gemini AI (${target.name}) tư vấn thành công!`);
          return replyText;
        }
      } catch (err: any) {
        lastErrorDetails = err?.message || String(err);
        console.warn(`⚠️ [PsychChatService] Lỗi kết nối API với ${target.name}:`, err);
      }
    }

    // Nếu API Key bị lỗi hoặc không thể gọi Gemini API
    console.error("❌ [PsychChatService] Lỗi gọi Gemini AI:", lastErrorDetails);
    return `⚠️ **Thông báo hệ thống:** Không thể kết nối tới bộ não Gemini AI qua API Key của bạn.\nChi tiết lỗi: "${lastErrorDetails}".\nVui lòng kiểm tra lại tính hợp lệ của \`VITE_GEMINI_API_KEY\` trong file \`.env\`.`;
  }
}
