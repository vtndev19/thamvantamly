import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import { Icon } from "../ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  DoctorChatService,
  formatChatTime,
  type DoctorChat,
  type DoctorChatMessage,
} from "../../src/services/doctorChatService";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function DoctorChatBubble() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Only display DoctorChatBubble on doctor dashboard routes
  const shouldHide =
    !user ||
    user.role !== "doctor" ||
    !location.pathname.startsWith("/doctor");

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chats, setChats] = useState<DoctorChat[]>([]);
  const [activeChat, setActiveChat] = useState<DoctorChat | null>(null);
  const [messages, setMessages] = useState<DoctorChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubChatsRef = useRef<(() => void) | null>(null);
  const unsubMsgsRef = useRef<(() => void) | null>(null);

  const doctorId = user?.uid || "";
  const doctorName = user?.displayName || "Bác sĩ";

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadByDoctor || 0), 0);

  useEffect(() => {
    if (!doctorId || shouldHide) return;
    unsubChatsRef.current = DoctorChatService.subscribeToMyChats(doctorId, "doctor", setChats);
    return () => unsubChatsRef.current?.();
  }, [doctorId, shouldHide]);

  useEffect(() => {
    unsubMsgsRef.current?.();
    if (!activeChat?.id) { setMessages([]); return; }
    unsubMsgsRef.current = DoctorChatService.subscribeToMessages(activeChat.id, setMessages);
    DoctorChatService.markAsRead(activeChat.id, "doctor");
    return () => unsubMsgsRef.current?.();
  }, [activeChat?.id]);

  useEffect(() => {
    if (isOpen) setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, isOpen]);

  // ── Notification Toast logic for doctors ────────────────────────────────────
  const prevUnreadRef = useRef<Record<string, number>>({});
  const [activeToast, setActiveToast] = useState<{
    chatId: string;
    studentName: string;
    text: string;
    chat: DoctorChat;
  } | null>(null);

  useEffect(() => {
    if (chats.length === 0) return;

    chats.forEach((chat) => {
      const prevUnread = prevUnreadRef.current[chat.id!] || 0;
      const currentUnread = chat.unreadByDoctor || 0;

      // Nếu có tin nhắn mới và bác sĩ chưa mở cuộc trò chuyện này
      if (currentUnread > prevUnread && (!isOpen || activeChat?.id !== chat.id)) {
        if (chat.lastMessageSenderRole === "student" && chat.lastMessage) {
          setActiveToast({
            chatId: chat.id!,
            studentName: chat.studentName,
            text: chat.lastMessage,
            chat: chat,
          });

          // Phát âm thanh nhẹ báo tin nhắn đến
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {}
        }
      }
      prevUnreadRef.current[chat.id!] = currentUnread;
    });
  }, [chats, isOpen, activeChat?.id]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (shouldHide) return null;

  // Khi click bubble: nếu đang ở trang /doctor/chat thì không hiển thị widget
  const isOnChatPage = location.pathname === "/doctor/chat";

  const handleSelectChat = async (chat: DoctorChat) => {
    setActiveChat(chat);
    if (chat.id) await DoctorChatService.markAsRead(chat.id, "doctor");
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending || !activeChat?.id) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      await DoctorChatService.sendMessage(activeChat.id, doctorId, doctorName, "doctor", text);
    } catch (err) {
      console.error("Lỗi gửi tin:", err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const W = isExpanded ? "520px" : "400px";
  const H = isExpanded ? "640px" : "520px";

  const S = { row: { display: "flex", alignItems: "center" } as const, col: { display: "flex", flexDirection: "column" as const } };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="md:hidden" onClick={() => setIsOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.32)", backdropFilter: "blur(4px)", zIndex: 45 }} />
      )}

      {/* Popup */}
      <div style={{ position: "fixed", bottom: 96, right: 20, zIndex: 50, width: W, maxWidth: "calc(100vw - 2.5rem)", height: H, maxHeight: "calc(100vh - 8rem)", ...S.col, borderRadius: 24, overflow: "hidden", background: "white", border: "1px solid #d1fae5", boxShadow: "0 28px 80px rgba(5,150,105,0.18),0 8px 24px rgba(0,0,0,0.1)", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)", transformOrigin: "bottom right", opacity: isOpen ? 1 : 0, transform: isOpen ? "scale(1) translateY(0)" : "scale(0.82) translateY(26px)", pointerEvents: isOpen ? "auto" : "none" }}>
        {/* Header */}
        <div style={{ ...S.row, gap: 10, padding: "12px 14px", background: "linear-gradient(135deg,#059669 0%,#065f46 100%)", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white" }}>
              {activeChat ? activeChat.studentName : "Tin nhắn học sinh"}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
              {activeChat ? "Đang tư vấn" : `${chats.length} cuộc trò chuyện${totalUnread > 0 ? ` · ${totalUnread} chưa đọc` : ""}`}
            </p>
          </div>
          <div style={{ ...S.row, gap: 3, flexShrink: 0 }}>
            {activeChat && (
              <button onClick={() => setActiveChat(null)} title="Quay lại danh sách" style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.82)", display: "flex" }}>
                <Icon name="arrow_back" size={15} />
              </button>
            )}
            <button onClick={() => navigate("/doctor/chat")} title="Mở trang chat đầy đủ" style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.82)", display: "flex" }}>
              <Icon name="open_in_new" size={15} />
            </button>
            <button onClick={() => setIsExpanded(v => !v)} style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.82)", display: "flex" }}>
              <Icon name={isExpanded ? "close_fullscreen" : "open_in_full"} size={15} />
            </button>
            <button onClick={() => setIsOpen(false)} style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.82)", display: "flex" }}>
              <Icon name="remove" size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        {!activeChat ? (
          /* ── Chat list ── */
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {chats.length === 0 ? (
              <div style={{ ...S.col, alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: 24, gap: 10 }}>
                <Icon name="chat_bubble_outline" size={40} style={{ color: "#d1d5db" }} />
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Chưa có học sinh nào nhắn tin</p>
              </div>
            ) : chats.map(chat => (
              <button key={chat.id} onClick={() => handleSelectChat(chat)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", border: "none", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(5,150,105,0.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#bfdbfe,#93c5fd)", color: "#1d4ed8", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {getInitials(chat.studentName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...S.row, justifyContent: "space-between", gap: 4 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: chat.unreadByDoctor > 0 ? 700 : 600, color: "#1a1f2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chat.studentName}
                    </p>
                    <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>{formatChatTime(chat.lastMessageAt)}</span>
                  </div>
                  <div style={{ ...S.row, gap: 4 }}>
                    <p style={{ margin: 0, fontSize: 11, color: chat.unreadByDoctor > 0 ? "#059669" : "#6b7280", fontWeight: chat.unreadByDoctor > 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {chat.lastMessageSenderRole === "doctor" ? "Bạn: " : ""}{chat.lastMessage || "Bắt đầu cuộc trò chuyện"}
                    </p>
                    {chat.unreadByDoctor > 0 && (
                      <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {chat.unreadByDoctor > 9 ? "9+" : chat.unreadByDoctor}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* ── Messages ── */
          <>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 10px", ...S.col, gap: 2, background: "linear-gradient(180deg,#f0fdf4,#f8fafc)" }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, ...S.col, alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8 }}>
                  <Icon name="chat_bubble_outline" size={36} style={{ color: "#d1fae5" }} />
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Bắt đầu tư vấn với {activeChat.studentName}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isDoctor = msg.senderRole === "doctor";
                  const isFirst = idx === 0 || messages[idx - 1]?.senderRole !== msg.senderRole;
                  const isLast = idx === messages.length - 1 || messages[idx + 1]?.senderRole !== msg.senderRole;
                  return (
                    <div key={msg.id || idx} style={{ ...S.row, alignItems: "flex-end", gap: 6, justifyContent: isDoctor ? "flex-end" : "flex-start", marginBottom: isLast ? 8 : 2 }}>
                      {!isDoctor && (
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#bfdbfe,#93c5fd)", color: "#1d4ed8", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: isFirst ? 1 : 0 }}>
                          {getInitials(msg.senderName)}
                        </div>
                      )}
                      <div style={{ maxWidth: "78%", padding: "9px 12px", fontSize: 12.5, lineHeight: 1.65, overflowWrap: "break-word", wordBreak: "break-word", ...(isDoctor ? { background: "linear-gradient(135deg,#059669,#065f46)", color: "white", boxShadow: "0 4px 12px rgba(5,150,105,0.25)", borderRadius: isLast ? "18px 18px 4px 18px" : "18px" } : { background: "white", color: "#1a1f2e", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderRadius: isLast ? "18px 18px 18px 4px" : "18px" }) }}>
                        {msg.text}
                      </div>
                      {isDoctor && (
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#065f46)", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: isFirst ? 1 : 0 }}>
                          {getInitials(doctorName)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {isSending && (
                <div style={{ ...S.row, alignItems: "flex-end", gap: 6, justifyContent: "flex-end", marginBottom: 8 }}>
                  <div style={{ background: "linear-gradient(135deg,#059669,#065f46)", borderRadius: "18px 18px 4px 18px", padding: "10px 14px" }}>
                    <div style={{ ...S.row, gap: 4 }}>
                      {[0, 150, 300].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.7)", display: "block", animation: `bounce 1.2s ${d}ms infinite` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} style={{ height: 4 }} />
            </div>

            {/* Input */}
            <div style={{ flexShrink: 0, background: "white", borderTop: "1px solid #d1fae5", padding: "10px 12px" }}>
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ ...S.row, gap: 8 }}>
                <input ref={inputRef} type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder={`Tư vấn cho ${activeChat.studentName}...`} disabled={isSending} autoComplete="off"
                  style={{ flex: 1, minWidth: 0, background: "#f0fdf4", border: "1.5px solid #a7f3d0", borderRadius: 14, padding: "10px 14px", fontSize: 12.5, color: "#1a1f2e", outline: "none", transition: "all 0.2s" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#059669"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#a7f3d0"; e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="submit" disabled={!inputText.trim() || isSending} style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#059669,#065f46)", color: "white", opacity: !inputText.trim() || isSending ? 0.4 : 1, transition: "all 0.2s" }}>
                  <Icon name="send" size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Floating bubble */}
      {!isOnChatPage && (
        <button
          id="doctor-bubble-btn"
          onClick={() => setIsOpen(v => !v)}
          title="Tin nhắn học sinh"
          style={{ position: "fixed", bottom: 20, right: 20, zIndex: 50, width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#059669 0%,#065f46 100%)", color: "white", boxShadow: "0 6px 24px rgba(5,150,105,0.45),0 2px 8px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", transform: isOpen ? "scale(0.9)" : "scale(1)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = isOpen ? "scale(0.9)" : "scale(1)"; }}
        >
          <Icon name={isOpen ? "close" : "forum"} size={22} filled />
          {totalUnread > 0 && !isOpen && (
            <span style={{ position: "absolute", top: -3, right: -3, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", animation: "pulse 2s infinite" }}>
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* ── NOTIFICATION TOAST FOR DOCTOR ─────────────────────────────────── */}
      {activeToast && createPortal(
        <div
          onClick={() => {
            handleSelectChat(activeToast.chat);
            setIsOpen(true);
            setActiveToast(null);
          }}
          style={{
            position: "fixed",
            bottom: 84,
            right: 20,
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
            flexShrink: 0,
            background: "linear-gradient(135deg,#bfdbfe,#93c5fd)",
            color: "#1d4ed8",
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid #bfdbfe"
          }}>
            {getInitials(activeToast.studentName)}
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>
              Học sinh {activeToast.studentName}
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
