import { useState, useEffect, useRef } from "react";
import { useNavigate, redirect } from "react-router";
import { DoctorSidebar } from "../../components/doctor/DoctorSidebar";
import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  DoctorChatService,
  formatChatTime,
  type DoctorChat,
  type DoctorChatMessage,
} from "../../src/services/doctorChatService";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../../src/config/firebase";

export async function clientLoader() {
  const authInstance = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsubscribe = authInstance.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    }
  );

  if (!user) {
    throw redirect("/auth/login?redirect=/doctor/chat");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "doctor" && role !== "admin") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}


export function meta() {
  return [
    { title: "Chat với Học sinh – SafeSchool Hub" },
    { name: "description", content: "Phòng chat tư vấn tâm lý giữa bác sĩ và học sinh." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatTimestamp(val: any): string {
  if (!val) return "";
  const d = typeof val.toDate === "function" ? val.toDate() : new Date(val);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function DoctorChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chat list
  const [chats, setChats] = useState<DoctorChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Active chat
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

  // Redirect nếu không phải doctor
  useEffect(() => {
    if (user && user.role !== "doctor") {
      navigate("/auth/login?error=access_denied");
    }
  }, [user, navigate]);

  // Subscribe chat list
  useEffect(() => {
    if (!doctorId) return;
    setLoadingChats(true);
    unsubChatsRef.current = DoctorChatService.subscribeToMyChats(doctorId, "doctor", (list) => {
      setChats(list);
      setLoadingChats(false);
    });
    return () => {
      unsubChatsRef.current?.();
    };
  }, [doctorId]);

  // Subscribe messages
  useEffect(() => {
    unsubMsgsRef.current?.();
    if (!activeChat?.id) {
      setMessages([]);
      return;
    }
    unsubMsgsRef.current = DoctorChatService.subscribeToMessages(activeChat.id, setMessages);
    DoctorChatService.markAsRead(activeChat.id, "doctor");
    return () => {
      unsubMsgsRef.current?.();
    };
  }, [activeChat?.id]);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages]);

  const handleSelectChat = async (chat: DoctorChat) => {
    setActiveChat(chat);
    if (chat.id) {
      await DoctorChatService.markAsRead(chat.id, "doctor");
    }
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending || !activeChat?.id || !doctorId) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      await DoctorChatService.sendMessage(activeChat.id, doctorId, doctorName, "doctor", text, user?.photoURL || "");
    } catch (err) {
      console.error("Lỗi gửi tin:", err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadByDoctor || 0), 0);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DoctorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#059669,#065f46)" }}
              >
                <Icon name="chat_bubble" size={18} style={{ color: "white" }} filled />
              </div>
              <div>
                <h1 className="font-bold text-on-surface text-base leading-tight">
                  Chat với Học sinh
                </h1>
                <p className="text-[11px] text-on-surface-variant leading-none">
                  {loadingChats ? "Đang tải..." : `${chats.length} cuộc trò chuyện`}
                  {totalUnread > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                      {totalUnread} chưa đọc
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* ── LEFT: Chat list ── */}
          <div
            className="flex-shrink-0 border-r border-outline-variant/20 flex flex-col"
            style={{ width: 300, background: "#fafafa" }}
          >
            {/* List header */}
            <div className="px-4 py-3 border-b border-outline-variant/10">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                Học sinh đang chat
              </p>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="flex flex-col gap-0">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                      <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-28 mb-2" />
                        <div className="h-2.5 bg-gray-100 rounded w-36" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
                  <Icon name="chat_bubble_outline" size={40} style={{ color: "#d1d5db" }} />
                  <p className="text-sm font-semibold text-gray-400">Chưa có học sinh nào nhắn tin</p>
                  <p className="text-xs text-gray-300">Tin nhắn từ học sinh sẽ xuất hiện tại đây</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 cursor-pointer"
                    style={{
                      background:
                        activeChat?.id === chat.id
                          ? "rgba(5,150,105,0.08)"
                          : "transparent",
                      borderLeft:
                        activeChat?.id === chat.id
                          ? "3px solid #059669"
                          : "3px solid transparent",
                      borderTop: "none",
                      borderRight: "none",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      if (activeChat?.id !== chat.id)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "rgba(5,150,105,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (activeChat?.id !== chat.id)
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold border overflow-hidden"
                      style={{
                        width: 44,
                        height: 44,
                        background: "linear-gradient(135deg,#bfdbfe,#93c5fd)",
                        color: "#1d4ed8",
                        borderColor: "#bfdbfe",
                        position: "relative",
                      }}
                    >
                      {chat.studentPhotoURL ? (
                        <img
                          src={chat.studentPhotoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(chat.studentName)
                      )}
                      {/* Online dot */}
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#34d399",
                          border: "2px solid #fafafa",
                          zIndex: 10
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-sm font-semibold text-on-surface truncate"
                          style={{ fontWeight: chat.unreadByDoctor > 0 ? 700 : 600 }}
                        >
                          {chat.studentName}
                        </p>
                        <span className="text-[10px] text-on-surface-variant flex-shrink-0">
                          {formatChatTime(chat.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className="text-xs truncate flex-1"
                          style={{
                            color: chat.unreadByDoctor > 0 ? "#059669" : "#9ca3af",
                            fontWeight: chat.unreadByDoctor > 0 ? 600 : 400,
                          }}
                        >
                          {chat.lastMessageSenderRole === "doctor" ? "Bạn: " : ""}
                          {chat.lastMessage || "Bắt đầu cuộc trò chuyện"}
                        </p>
                        {chat.unreadByDoctor > 0 && (
                          <span
                            className="flex-shrink-0 text-white text-[10px] font-bold flex items-center justify-center rounded-full"
                            style={{
                              width: 18,
                              height: 18,
                              background: "#ef4444",
                              minWidth: 18,
                            }}
                          >
                            {chat.unreadByDoctor > 9 ? "9+" : chat.unreadByDoctor}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT: Chat area ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeChat ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}
                >
                  <Icon name="forum" size={36} style={{ color: "#059669" }} filled />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-on-surface">Chọn cuộc trò chuyện</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Chọn một học sinh ở bên trái để bắt đầu tư vấn
                  </p>
                </div>
                {totalUnread > 0 && (
                  <div className="mt-4 px-5 py-3 rounded-2xl border border-red-200 bg-red-50 flex items-center gap-2">
                    <Icon name="notifications_active" size={18} style={{ color: "#ef4444" }} filled />
                    <span className="text-sm font-semibold text-red-700">
                      {totalUnread} tin nhắn chưa đọc
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-outline-variant/20 flex-shrink-0"
                  style={{ background: "white" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg,#bfdbfe,#93c5fd)",
                      color: "#1d4ed8",
                    }}
                  >
                    {activeChat.studentPhotoURL ? (
                      <img
                        src={activeChat.studentPhotoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(activeChat.studentName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">
                      {activeChat.studentName}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[11px] text-emerald-600 font-semibold">Đang trực tuyến</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant px-3 py-1.5 rounded-xl bg-surface-container/50">
                      Chat tư vấn bảo mật
                    </span>
                  </div>
                </div>

                {/* Messages area */}
                <div
                  className="flex-1 overflow-y-auto px-5 py-4"
                  style={{ background: "linear-gradient(180deg,#f0fdf4,#f8fafc)" }}
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                      <Icon name="chat_bubble_outline" size={40} style={{ color: "#d1fae5" }} />
                      <p className="text-sm text-gray-400">
                        Bắt đầu cuộc trò chuyện với {activeChat.studentName}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {messages.map((msg, idx) => {
                        const isDoctor = msg.senderRole === "doctor";
                        const isFirst =
                          idx === 0 || messages[idx - 1]?.senderRole !== msg.senderRole;
                        const isLast =
                          idx === messages.length - 1 ||
                          messages[idx + 1]?.senderRole !== msg.senderRole;

                        return (
                          <div
                            key={msg.id || idx}
                            className="flex items-end gap-2"
                            style={{
                              justifyContent: isDoctor ? "flex-end" : "flex-start",
                              marginBottom: isLast ? 8 : 2,
                            }}
                          >
                            {/* Student avatar */}
                            {!isDoctor && (
                              <div
                                className="rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
                                style={{
                                  width: 28,
                                  height: 28,
                                  background: "linear-gradient(135deg,#bfdbfe,#93c5fd)",
                                  color: "#1d4ed8",
                                  opacity: isFirst ? 1 : 0,
                                }}
                              >
                                {msg.senderPhotoURL ? (
                                  <img
                                    src={msg.senderPhotoURL}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : activeChat.studentPhotoURL ? (
                                  <img
                                    src={activeChat.studentPhotoURL}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  getInitials(msg.senderName)
                                )}
                              </div>
                            )}

                            {/* Message bubble */}
                            <div
                              className="max-w-[70%]"
                              style={{
                                padding: "10px 14px",
                                fontSize: 13.5,
                                lineHeight: 1.65,
                                overflowWrap: "break-word",
                                wordBreak: "break-word",
                                ...(isDoctor
                                  ? {
                                      background:
                                        "linear-gradient(135deg,#059669 0%,#065f46 100%)",
                                      color: "white",
                                      boxShadow: "0 4px 12px rgba(5,150,105,0.25)",
                                      borderRadius: isLast
                                        ? "18px 18px 4px 18px"
                                        : "18px",
                                    }
                                  : {
                                      background: "white",
                                      color: "#1a1f2e",
                                      border: "1px solid #e5e7eb",
                                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                      borderRadius: isLast
                                        ? "18px 18px 18px 4px"
                                        : "18px",
                                    }),
                              }}
                            >
                              {msg.text}
                            </div>

                            {/* Doctor avatar */}
                            {isDoctor && (
                              <div
                                className="rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 overflow-hidden"
                                style={{
                                  width: 28,
                                  height: 28,
                                  background: "linear-gradient(135deg,#059669,#065f46)",
                                  color: "white",
                                  opacity: isFirst ? 1 : 0,
                                }}
                              >
                                {msg.senderPhotoURL ? (
                                  <img
                                    src={msg.senderPhotoURL}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : user?.photoURL ? (
                                  <img
                                    src={user.photoURL}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  getInitials(doctorName)
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} style={{ height: 4 }} />
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div
                  className="flex-shrink-0 border-t border-outline-variant/15 px-5 py-3.5"
                  style={{ background: "white" }}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-3"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Tư vấn cho ${activeChat.studentName}...`}
                      disabled={isSending}
                      autoComplete="off"
                      className="flex-1 min-w-0 text-sm text-on-surface outline-none"
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px solid #a7f3d0",
                        borderRadius: 16,
                        padding: "11px 16px",
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
                      disabled={!inputText.trim() || isSending}
                      className="flex-shrink-0 flex items-center justify-center text-white cursor-pointer border-none"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: "linear-gradient(135deg,#059669,#065f46)",
                        boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                        opacity: !inputText.trim() || isSending ? 0.45 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      <Icon name="send" size={18} />
                    </button>
                  </form>
                  <p className="text-[10px] text-center text-on-surface-variant mt-2">
                    🔒 Mọi thông tin trong cuộc trò chuyện được bảo mật y tế
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
