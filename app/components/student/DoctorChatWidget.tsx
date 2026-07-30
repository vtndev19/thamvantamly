import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";
import { Icon } from "../ui/Icon";
import {
  DoctorChatService,
  type DoctorProfile,
  type DoctorChatMessage,
  type DoctorChat,
} from "../../src/services/doctorChatService";
import { useAuth } from "../../src/contexts/AuthContext";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(val: any): string {
  if (!val) return "";
  const d = typeof val.toDate === "function" ? val.toDate() : new Date(val);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ─── Context / Global State ────────────────────────────────────────────────────

// Shared state được expose ra ngoài để experts.tsx có thể trigger mở chat
let _openChatWith: ((doctor: DoctorProfile) => void) | null = null;

export function openDoctorChat(doctor: DoctorProfile) {
  if (_openChatWith) {
    _openChatWith(doctor);
  } else {
    console.warn("[DoctorChatWidget] openDoctorChat called but widget is not mounted or user is not a student.", doctor);
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DoctorChatWidget() {
  const location = useLocation();
  const { user } = useAuth();

  // shouldHide: ẩn UI nhưng KHÔNG unregister _openChatWith - hook vẫn chạy bình thường
  const shouldHideUI =
    !user ||
    user.role !== "student" ||
    !location.pathname.startsWith("/student") ||
    location.pathname === "/student/chat";

  // ── State ──────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDoctor, setActiveDoctor] = useState<DoctorProfile | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DoctorChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [myChats, setMyChats] = useState<DoctorChat[]>([]);
  const [showChatList, setShowChatList] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubMsgsRef = useRef<(() => void) | null>(null);
  const unsubChatsRef = useRef<(() => void) | null>(null);

  const studentId = user?.uid || "";
  const studentName = user?.displayName || user?.email?.split("@")[0] || "Học sinh";

  // ── Register global opener ─────────────────────────────────────────────────
  const handleOpenWith = useCallback(
    async (doctor: DoctorProfile) => {
      if (!studentId) {
        console.warn("[DoctorChatWidget] handleOpenWith: studentId is empty, user not loaded yet");
        return;
      }

      // Mở widget ngay lập tức để user thấy phản hồi
      setActiveDoctor(doctor);
      setShowChatList(false);
      setActiveChatId(null); // reset
      setIsOpen(true);

      // Bác sĩ fallback (demo) - không có real chat
      if (doctor.uid.startsWith("fallback_")) {
        console.info("[DoctorChatWidget] Fallback doctor - no real chat available");
        setTimeout(() => inputRef.current?.focus(), 350);
        return;
      }

      try {
        const chatId = await DoctorChatService.getOrCreateChat(
          studentId,
          studentName,
          doctor.uid,
          doctor.displayName || "Bác sĩ",
          doctor.photoURL,
          doctor.specialization,
          user?.photoURL || ""
        );
        setActiveChatId(chatId);
        await DoctorChatService.markAsRead(chatId, "student");
      } catch (err) {
        console.error("[DoctorChatWidget] Lỗi mở chat:", err);
      }

      setTimeout(() => inputRef.current?.focus(), 350);
    },
    [studentId, studentName]
  );

  useEffect(() => {
    _openChatWith = handleOpenWith;
    return () => {
      _openChatWith = null;
    };
  }, [handleOpenWith]);

  // ── Subscribe chat list (tính unread) ─────────────────────────────────────
  useEffect(() => {
    if (!studentId || shouldHideUI) return;
    unsubChatsRef.current = DoctorChatService.subscribeToMyChats(studentId, "student", (chats) => {
      setMyChats(chats);
      const total = chats.reduce((acc, c) => acc + (c.unreadByStudent || 0), 0);
      setTotalUnread(total);
    });
    return () => {
      unsubChatsRef.current?.();
    };
  }, [studentId, shouldHideUI]);

  // ── Subscribe messages for active chat ────────────────────────────────────
  useEffect(() => {
    unsubMsgsRef.current?.();
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    unsubMsgsRef.current = DoctorChatService.subscribeToMessages(activeChatId, setMessages);
    return () => {
      unsubMsgsRef.current?.();
    };
  }, [activeChatId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, isOpen]);

  // ── Mark read when opening ─────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && activeChatId) {
      DoctorChatService.markAsRead(activeChatId, "student");
    }
  }, [isOpen, activeChatId]);

  // ── Auto show chat list if no active doctor is selected ────────────────────
  useEffect(() => {
    if (isOpen && !activeDoctor) {
      setShowChatList(true);
    }
  }, [isOpen, activeDoctor]);

  // ── Notification Toast logic for new messages ──────────────────────────────
  const prevUnreadRef = useRef<Record<string, number>>({});
  const [activeToast, setActiveToast] = useState<{
    chatId: string;
    doctorName: string;
    doctorPhotoURL?: string;
    text: string;
    doctorProfile: DoctorProfile;
  } | null>(null);

  useEffect(() => {
    if (myChats.length === 0) return;

    myChats.forEach((chat) => {
      const prevUnread = prevUnreadRef.current[chat.id!] || 0;
      const currentUnread = chat.unreadByStudent || 0;

      // Nếu số tin nhắn chưa đọc tăng lên, và chat popup đang không tập trung vào chat này
      if (currentUnread > prevUnread && (!isOpen || activeChatId !== chat.id)) {
        if (chat.lastMessageSenderRole === "doctor" && chat.lastMessage) {
          const docProfile: DoctorProfile = {
            uid: chat.doctorId,
            displayName: chat.doctorName,
            email: null,
            photoURL: chat.doctorPhotoURL,
            specialization: chat.doctorSpecialization,
            role: "doctor",
          };

          setActiveToast({
            chatId: chat.id!,
            doctorName: chat.doctorName,
            doctorPhotoURL: chat.doctorPhotoURL,
            text: chat.lastMessage,
            doctorProfile: docProfile,
          });

          // Phát âm thanh báo hiệu nhẹ
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {}
        }
      }
      prevUnreadRef.current[chat.id!] = currentUnread;
    });
  }, [myChats, isOpen, activeChatId]);

  // Tự động đóng toast sau 5 giây
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (shouldHideUI) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputText.trim() || isSending || !activeChatId || !studentId) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      await DoctorChatService.sendMessage(activeChatId, studentId, studentName, "student", text, user?.photoURL || "");
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSelectChat = async (chat: DoctorChat) => {
    // Load doctor profile từ chat data
    const doctor: DoctorProfile = {
      uid: chat.doctorId,
      displayName: chat.doctorName,
      email: null,
      photoURL: chat.doctorPhotoURL,
      specialization: chat.doctorSpecialization,
      role: "doctor",
    };
    setActiveDoctor(doctor);
    setActiveChatId(chat.id!);
    setShowChatList(false);
    await DoctorChatService.markAsRead(chat.id!, "student");
  };

  // ── Dimensions ────────────────────────────────────────────────────────────
  const W = isExpanded ? "520px" : "380px";
  const H = isExpanded ? "660px" : "540px";

  const S = {
    row: { display: "flex", alignItems: "center" } as const,
    col: { display: "flex", flexDirection: "column" as const },
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.32)",
            backdropFilter: "blur(4px)",
            zIndex: 45,
          }}
        />
      )}

      {/* ── CHAT POPUP ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 92,
          zIndex: 50,
          width: W,
          maxWidth: "calc(100vw - 2.5rem)",
          height: H,
          maxHeight: "calc(100vh - 3.5rem)",
          ...S.col,
          borderRadius: 24,
          overflow: "hidden",
          background: "white",
          border: "1px solid #e2e6ef",
          boxShadow: "0 28px 80px rgba(0,100,80,0.18),0 8px 24px rgba(0,0,0,0.1)",
          transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          transformOrigin: "bottom right",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.82) translateY(26px)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            ...S.row,
            gap: 10,
            padding: "12px 14px",
            background: "linear-gradient(135deg,#059669 0%,#065f46 100%)",
            flexShrink: 0,
          }}
        >
          {activeDoctor && !showChatList && (
            <button
              onClick={() => setShowChatList(true)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "2px",
              }}
              title="Quay lại danh sách"
            >
              <Icon name="arrow_back" size={18} />
            </button>
          )}

          {/* Doctor avatar / List icon */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {activeDoctor && !showChatList ? (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.3)",
                  background: "#d1fae5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#065f46",
                }}
              >
                {activeDoctor.photoURL ? (
                  <img
                    src={activeDoctor.photoURL}
                    alt="Doctor"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  getInitials(activeDoctor.displayName || "BS")
                )}
              </div>
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="forum" size={18} style={{ color: "white" }} />
              </div>
            )}
            <span
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#34d399",
                border: "2px solid #065f46",
              }}
            />
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white" }}>
              {showChatList
                ? "Cuộc trò chuyện"
                : activeDoctor
                ? activeDoctor.displayName || "Bác sĩ"
                : "Chat với Bác sĩ"}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
              {showChatList
                ? `${myChats.length} cuộc trò chuyện`
                : activeDoctor?.specialization || "Chuyên gia tâm lý học đường"}
            </p>
          </div>

          {/* Actions */}
          <div style={{ ...S.row, gap: 3, flexShrink: 0 }}>
            {[
              {
                onClick: () => setShowChatList((v) => !v),
                icon: "chat_bubble",
                active: showChatList,
                title: "Danh sách chat",
              },
              {
                onClick: () => setIsExpanded((v) => !v),
                icon: isExpanded ? "close_fullscreen" : "open_in_full",
                active: false,
                title: isExpanded ? "Thu nhỏ" : "Phóng to",
              },
              {
                onClick: () => setIsOpen(false),
                icon: "remove",
                active: false,
                title: "Thu nhỏ",
              },
            ].map((b, i) => (
              <button
                key={i}
                title={b.title}
                onClick={b.onClick}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: b.active ? "rgba(255,255,255,0.22)" : "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.82)",
                  display: "flex",
                }}
              >
                <Icon name={b.icon} size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          {/* ── Chat list panel ──────────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              ...S.col,
              background: "white",
              transition: "transform 0.3s ease",
              transform: showChatList ? "translateX(0)" : "translateX(-100%)",
              zIndex: 1,
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              {myChats.length === 0 ? (
                <div
                  style={{
                    ...S.col,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px 20px",
                    textAlign: "center",
                    gap: 12,
                  }}
                >
                  <Icon name="chat_bubble_outline" size={40} style={{ color: "#d1d5db" }} />
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                    Chưa có cuộc trò chuyện nào
                  </p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                    Vào trang bác sĩ để bắt đầu chat
                  </p>
                </div>
              ) : (
                myChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      background:
                        activeChatId === chat.id ? "rgba(5,150,105,0.06)" : "transparent",
                      border: "none",
                      borderLeft:
                        activeChatId === chat.id ? "3px solid #059669" : "3px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(5,150,105,0.04)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        activeChatId === chat.id ? "rgba(5,150,105,0.06)" : "transparent")
                    }
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "#d1fae5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#065f46",
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      {chat.doctorPhotoURL ? (
                        <img
                          src={chat.doctorPhotoURL}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        getInitials(chat.doctorName)
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...S.row, justifyContent: "space-between", gap: 4 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1a1f2e",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {chat.doctorName}
                        </p>
                        <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>
                          {formatTime(chat.lastMessageAt)}
                        </span>
                      </div>
                      <div style={{ ...S.row, gap: 4 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: chat.unreadByStudent > 0 ? "#059669" : "#6b7280",
                            fontWeight: chat.unreadByStudent > 0 ? 600 : 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {chat.lastMessage || "Bắt đầu cuộc trò chuyện"}
                        </p>
                        {chat.unreadByStudent > 0 && (
                          <span
                            style={{
                              flexShrink: 0,
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "#059669",
                              color: "white",
                              fontSize: 10,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {chat.unreadByStudent > 9 ? "9+" : chat.unreadByStudent}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Messages panel ───────────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              ...S.col,
              background: "linear-gradient(180deg,#f0fdf4 0%,#ecfdf5 100%)",
              transition: "transform 0.3s ease",
              transform: showChatList ? "translateX(100%)" : "translateX(0)",
            }}
          >
            {/* Empty state: chưa chọn doctor */}
            {!activeDoctor && !showChatList ? (
              <div
                style={{
                  flex: 1,
                  ...S.col,
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 24,
                  gap: 12,
                }}
              >
                <Icon name="health_and_safety" size={48} style={{ color: "#d1d5db" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>
                  Chưa có cuộc trò chuyện
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                  Vào trang <strong>Chuyên gia</strong> để kết nối<br />với bác sĩ tâm lý
                </p>
              </div>
            ) : (
              <>
                {/* Messages list */}
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    padding: "12px 10px",
                    ...S.col,
                    gap: 2,
                  }}
                >
                  {messages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        ...S.col,
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: 16,
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "3px solid #d1fae5",
                          boxShadow: "0 4px 14px rgba(5,150,105,0.18)",
                          background: "#d1fae5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#065f46",
                        }}
                      >
                        {activeDoctor?.photoURL ? (
                          <img
                            src={activeDoctor.photoURL}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          getInitials(activeDoctor?.displayName || "BS")
                        )}
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#065f46", margin: 0 }}>
                        {activeDoctor?.displayName}
                      </p>
                      <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                        {activeDoctor?.specialization || "Chuyên gia tâm lý học đường"}<br />
                        Gửi tin nhắn để bắt đầu
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.senderRole === "student";
                      const isFirst =
                        idx === 0 || messages[idx - 1]?.senderRole !== msg.senderRole;
                      const isLast =
                        idx === messages.length - 1 ||
                        messages[idx + 1]?.senderRole !== msg.senderRole;

                      return (
                        <div
                          key={msg.id || idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 6,
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            marginBottom: isLast ? 8 : 2,
                          }}
                        >
                          {/* Doctor avatar */}
                          {!isMe && (
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                overflow: "hidden",
                                flexShrink: 0,
                                opacity: isFirst ? 1 : 0,
                                background: "#d1fae5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#065f46",
                                border: "1px solid #a7f3d0",
                              }}
                            >
                              {msg.senderPhotoURL ? (
                                <img
                                  src={msg.senderPhotoURL}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : activeDoctor?.photoURL ? (
                                <img
                                  src={activeDoctor.photoURL}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                getInitials(msg.senderName)
                              )}
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            style={{
                              maxWidth: "78%",
                              padding: "9px 12px",
                              fontSize: 12.5,
                              lineHeight: 1.65,
                              overflowWrap: "break-word",
                              wordBreak: "break-word",
                              ...(isMe
                                ? {
                                    background: "linear-gradient(135deg,#059669 0%,#065f46 100%)",
                                    color: "white",
                                    boxShadow: "0 4px 14px rgba(5,150,105,0.28)",
                                    borderRadius: isLast ? "18px 18px 4px 18px" : "18px",
                                  }
                                : {
                                    background: "white",
                                    color: "#1a1f2e",
                                    border: "1px solid #d1fae5",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                    borderRadius: isLast ? "18px 18px 18px 4px" : "18px",
                                  }),
                            }}
                          >
                            {msg.text}
                          </div>

                          {/* Student avatar */}
                          {isMe && (
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                overflow: "hidden",
                                flexShrink: 0,
                                opacity: isFirst ? 1 : 0,
                                background: "linear-gradient(135deg,#059669,#065f46)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                fontWeight: 700,
                                color: "white",
                                border: "1px solid #059669",
                              }}
                            >
                              {msg.senderPhotoURL ? (
                                <img
                                  src={msg.senderPhotoURL}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : user?.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                getInitials(studentName)
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {isSending && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 6,
                        justifyContent: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "#d1fae5",
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #d1fae5",
                          borderRadius: "18px 18px 18px 4px",
                          padding: "10px 14px",
                        }}
                      >
                        <div style={{ display: "flex", gap: 4 }}>
                          {[0, 150, 300].map((d) => (
                            <span
                              key={d}
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "rgba(5,150,105,0.5)",
                                display: "block",
                                animation: `bounce 1.2s ${d}ms infinite`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} style={{ height: 4 }} />
                </div>

                {/* Input */}
                <div
                  style={{
                    flexShrink: 0,
                    background: "white",
                    borderTop: "1px solid #d1fae5",
                    padding: "10px 12px",
                  }}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    style={{ display: "flex", gap: 8 }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Nhắn tin với ${activeDoctor?.displayName || "bác sĩ"}...`}
                      disabled={isSending || !activeChatId}
                      autoComplete="off"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        background: "#f0fdf4",
                        border: "1.5px solid #a7f3d0",
                        borderRadius: 14,
                        padding: "10px 14px",
                        fontSize: 12.5,
                        color: "#1a1f2e",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#059669";
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.1)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#a7f3d0";
                        e.currentTarget.style.background = "#f0fdf4";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSending || !activeChatId}
                      style={{
                        flexShrink: 0,
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg,#059669 0%,#065f46 100%)",
                        color: "white",
                        opacity: !inputText.trim() || isSending || !activeChatId ? 0.4 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      <Icon name="send" size={16} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── FLOATING BUBBLE ──────────────────────────────────────────────── */}
      <button
        id="doctor-chat-bubble"
        onClick={() => {
          setIsOpen((v) => !v);
          if (!isOpen && activeChatId) {
            DoctorChatService.markAsRead(activeChatId, "student");
          }
        }}
        title="Chat với Bác sĩ tâm lý"
        style={{
          position: "fixed",
          bottom: 88,
          right: 24,
          zIndex: 50,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg,#059669 0%,#065f46 100%)",
          color: "white",
          boxShadow: "0 6px 24px rgba(5,150,105,0.45),0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          transform: isOpen ? "scale(0.9)" : "scale(1)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 10px 32px rgba(5,150,105,0.55),0 3px 12px rgba(0,0,0,0.18)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = isOpen
            ? "scale(0.9)"
            : "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 24px rgba(5,150,105,0.45),0 2px 8px rgba(0,0,0,0.15)";
        }}
      >
        <Icon name={isOpen ? "close" : "forum"} size={26} filled />

        {/* Unread badge */}
        {totalUnread > 0 && !isOpen && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#ef4444",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
              animation: "pulse 2s infinite",
            }}
          >
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* ── NOTIFICATION TOAST ────────────────────────────────────────────── */}
      {activeToast && createPortal(
        <div
          onClick={() => {
            handleOpenWith(activeToast.doctorProfile);
            setActiveToast(null);
          }}
          style={{
            position: "fixed",
            bottom: 156,
            right: 24,
            zIndex: 99999,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1.5px solid #059669",
            borderRadius: 20,
            padding: "12px 16px",
            width: 320,
            boxShadow: "0 12px 30px rgba(5,150,105,0.22), 0 4px 12px rgba(0, 0, 0, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            animation: "slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 16px 36px rgba(5,150,105,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(5,150,105,0.22)";
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: "#d1fae5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: "#065f46",
            border: "1.5px solid #a7f3d0"
          }}>
            {activeToast.doctorPhotoURL ? (
              <img src={activeToast.doctorPhotoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              getInitials(activeToast.doctorName)
            )}
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>
              BS. {activeToast.doctorName}
            </p>
            <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeToast.text}
            </p>
          </div>
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveToast(null);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: 4,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
