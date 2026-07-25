import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { Icon } from "../ui/Icon";
import { PsychChatService } from "../../src/services/psychChatService";
import type { ChatMessage, ChatSession } from "../../src/services/psychChatService";
import { useAuth } from "../../src/contexts/AuthContext";

function formatSessionTime(date: Date | { toDate?: () => Date } | null): string {
  if (!date) return "";
  const d = typeof (date as any).toDate === "function" ? (date as any).toDate() : new Date(date as any);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} giờ`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} ngày`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatMessageText(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    let f = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    f = f.replace(/__(.*?)__/g, "<strong>$1</strong>");
    f = f.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
    if (f.trim().startsWith("- ") || f.trim().startsWith("• ")) {
      f = `<span style="display:flex;gap:6px;align-items:flex-start"><span style="color:#0058bd;font-weight:700;flex-shrink:0">•</span><span>${f.trim().slice(2)}</span></span>`;
    }
    result.push(
      <span key={i} dangerouslySetInnerHTML={{ __html: f }} />,
      i < lines.length - 1 ? <br key={`br${i}`} /> : null
    );
  });
  return result;
}

export function ChatbotWidget() {
  const location = useLocation();
  const { user } = useAuth();

  // Exclude chatbot display on homepage (/), login (/auth/login), and register (/auth/register)
  const excludedPaths = ["/", "/auth/login", "/auth/register"];
  const shouldHide = !user || excludedPaths.includes(location.pathname);

  const userId = user?.uid || "";
  const userName = user?.displayName || user?.email?.split("@")[0] || "Học sinh";
  const schoolCode = (user as any)?.schoolCode || "THPT001";

  /* widget state */
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showAttentionPopup, setShowAttentionPopup] = useState(true);

  /* data */
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRisk, setCurrentRisk] = useState("low");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldHide || !userId) return;
    PsychChatService.getUserSessions(userId).then((s) => {
      setSessions(s);
      if (s.length > 0) setActiveSessionId(s[0].id!);
    });
  }, [userId, shouldHide]);

  useEffect(() => {
    if (shouldHide || !activeSessionId) return;
    PsychChatService.getSessionMessages(activeSessionId).then(setMessages);
  }, [activeSessionId, shouldHide]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  if (shouldHide) return null;

  const handleNewSession = async () => {
    try {
      const id = await PsychChatService.createSession(userId, userName, schoolCode, "Phiên mới");
      setActiveSessionId(id);
      setSessions(await PsychChatService.getUserSessions(userId));
      setMessages([]);
      setShowHistory(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setShowHistory(false);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;
    let sid = activeSessionId;
    if (!sid) {
      sid = await PsychChatService.createSession(userId, userName, schoolCode, text.slice(0, 30));
      setActiveSessionId(sid);
    }
    setMessages((p) => [...p, { sessionId: sid!, userId, sender: "user", text, timestamp: new Date() }]);
    if (!textToSend) setInputText("");
    setIsLoading(true);
    try {
      const r = await PsychChatService.sendMessage({
        sessionId: sid!,
        userId,
        userName,
        schoolCode,
        userText: text,
        history: messages,
      });
      setMessages((p) => [...p, r.botMessage]);
      setCurrentRisk(r.riskLevel);
      setSessions(await PsychChatService.getUserSessions(userId));
      if (!isOpen) setHasUnread(true);
    } catch (e) {
      console.error(e);
      setMessages((p) => [
        ...p,
        {
          sessionId: sid!,
          userId,
          sender: "bot",
          text: "Xin lỗi, đã xảy ra sự cố. Thử lại sau nhé.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleOpen = () => {
    setIsOpen((v) => !v);
    setHasUnread(false);
  };

  const W = isExpanded ? "540px" : "400px";
  const H = isExpanded ? "680px" : "560px";

  const chips = [
    { icon: "sentiment_stressed", text: "Em đang rất căng thẳng" },
    { icon: "bedtime", text: "Em hay mất ngủ" },
    { icon: "group_off", text: "Em bị bạn bè cô lập" },
    { icon: "school", text: "Lo lắng về kì thi" },
  ];

  const S = {
    fill: { flex: 1, minWidth: 0 },
    row: { display: "flex", alignItems: "center" },
    col: { display: "flex", flexDirection: "column" as const },
  };

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
            zIndex: 40,
          }}
        />
      )}

      {/* ========== CHAT POPUP ========== */}
      <div
        aria-modal="true"
        aria-label="Chat với Bác sĩ Tâm lý AI"
        style={{
          position: "fixed",
          bottom: 92,
          right: 20,
          zIndex: 50,
          width: W,
          maxWidth: "calc(100vw - 2.5rem)",
          height: H,
          maxHeight: "calc(100vh - 7.5rem)",
          ...S.col,
          borderRadius: 24,
          overflow: "hidden",
          background: "white",
          border: "1px solid #e2e6ef",
          boxShadow: "0 28px 80px rgba(0,40,120,0.22),0 8px 24px rgba(0,0,0,0.1)",
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
            background: "linear-gradient(135deg,#0072ff 0%,#003d94 100%)",
            flexShrink: 0,
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <img
                src="/chatbot.png"
                alt="AI"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <span
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#34d399",
                border: "2px solid #003d94",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white" }}>
              Bác sĩ Tâm lý AI
            </p>
            <div style={{ ...S.row, gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#34d399",
                }}
              />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                Đang hoạt động
              </span>
            </div>
          </div>
          <div style={{ ...S.row, gap: 3, flexShrink: 0 }}>
            <Link
              to="/student/support"
              style={{
                ...S.row,
                gap: 4,
                background: "rgba(239,68,68,0.25)",
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              <Icon name="emergency" size={11} filled />
              SOS
            </Link>
            {[
              {
                onClick: () => setShowHistory((v) => !v),
                icon: "history",
                active: showHistory,
              },
              { onClick: handleNewSession, icon: "add", active: false },
              {
                onClick: () => setIsExpanded((v) => !v),
                icon: isExpanded ? "close_fullscreen" : "open_in_full",
                active: false,
              },
              { onClick: () => setIsOpen(false), icon: "close", active: false },
            ].map((b, i) => (
              <button
                key={i}
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

        {/* Emergency bar */}
        {(currentRisk === "high" || currentRisk === "emergency") && (
          <div
            style={{
              ...S.row,
              gap: 8,
              background: "#dc2626",
              color: "white",
              padding: "7px 14px",
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <Icon name="warning" size={13} filled />
            <span
              style={{
                ...S.fill,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Nếu em đang nguy hiểm, gọi ngay 111 hoặc 113
            </span>
            <Link
              to="/student/support"
              style={{ color: "white", textDecoration: "underline", flexShrink: 0 }}
            >
              Trợ giúp
            </Link>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          {/* ── Messages panel ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              ...S.col,
              background: "linear-gradient(180deg,#f5f8ff 0%,#eef2ff 100%)",
              transition: "transform 0.3s ease",
              transform: showHistory ? "translateX(-100%)" : "translateX(0)",
            }}
          >
            <div
              id="chat-messages"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "12px 10px",
                ...S.col,
                gap: 2,
              }}
            >
              {messages.length === 0 && !isLoading ? (
                /* empty state */
                <div
                  style={{
                    flex: 1,
                    ...S.col,
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 16,
                  }}
                >
                  <div style={{ position: "relative", marginBottom: 16 }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        background: "radial-gradient(circle,rgba(0,88,189,0.15) 0%,transparent 70%)",
                        transform: "scale(2)",
                        filter: "blur(14px)",
                      }}
                    />
                    <div
                      style={{
                        position: "relative",
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0,88,189,0.22),0 0 0 2px white",
                      }}
                    >
                      <img
                        src="/chatbot.png"
                        alt="AI"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0a1e40", margin: "0 0 6px" }}>
                    Xin chào, {userName}!
                  </p>
                  <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6, margin: "0 0 20px", maxWidth: 230 }}>
                    Hãy chia sẻ điều em đang nghĩ. Mọi thông tin đều được bảo mật.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
                    {chips.map((q) => (
                      <button
                        key={q.text}
                        onClick={() => handleSend(q.text)}
                        style={{
                          ...S.row,
                          gap: 8,
                          background: "white",
                          border: "1px solid #e2e6ef",
                          borderRadius: 14,
                          padding: 10,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,88,189,0.35)";
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,88,189,0.03)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e6ef";
                          (e.currentTarget as HTMLButtonElement).style.background = "white";
                        }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 10,
                            background: "rgba(0,88,189,0.08)",
                            ...S.row,
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon name={q.icon} size={14} className="text-primary" />
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#1a1f2e", lineHeight: 1.3 }}>
                          {q.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isBot = msg.sender === "bot";
                    const showB = isBot && (idx === 0 || messages[idx - 1]?.sender !== "bot");
                    const showU = !isBot && (idx === 0 || messages[idx - 1]?.sender !== "user");
                    const isLast = idx === messages.length - 1 || messages[idx + 1]?.sender !== msg.sender;
                    return (
                      <div
                        key={idx}
                        style={{
                          ...S.row,
                          alignItems: "flex-end",
                          gap: 7,
                          justifyContent: isBot ? "flex-start" : "flex-end",
                          marginBottom: isLast ? 10 : 2,
                          animation: "chatSlideUp 0.25s ease-out",
                        }}
                      >
                        {isBot && (
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              overflow: "hidden",
                              flexShrink: 0,
                              opacity: showB ? 1 : 0,
                              transition: "opacity 0.15s",
                            }}
                          >
                            <img
                              src="/chatbot.png"
                              alt="AI"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        )}
                        <div
                          style={{
                            maxWidth: "80%",
                            padding: "9px 12px",
                            fontSize: 12.5,
                            lineHeight: 1.65,
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                            minWidth: 0,
                            ...(isBot
                              ? {
                                  background: "white",
                                  color: "#1a1f2e",
                                  border: "1px solid #e8ecf4",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                  borderRadius: isLast ? "18px 18px 18px 4px" : "18px",
                                }
                              : {
                                  background: "linear-gradient(135deg,#0072ff 0%,#003d94 100%)",
                                  color: "white",
                                  boxShadow: "0 4px 14px rgba(0,88,189,0.32)",
                                  borderRadius: isLast ? "18px 18px 4px 18px" : "18px",
                                }),
                          }}
                        >
                          <div
                            className={isBot ? "chatbot-msg" : ""}
                            style={!isBot ? { whiteSpace: "pre-line" } : {}}
                          >
                            {isBot ? formatMessageText(msg.text) : msg.text}
                          </div>
                        </div>
                        {!isBot && (
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              flexShrink: 0,
                              ...S.row,
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "white",
                              background: "linear-gradient(135deg,#0072ff 0%,#003d94 100%)",
                              opacity: showU ? 1 : 0,
                              transition: "opacity 0.15s",
                            }}
                          >
                            {userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Typing indicator */}
              {isLoading && (
                <div
                  style={{
                    ...S.row,
                    alignItems: "flex-end",
                    gap: 7,
                    justifyContent: "flex-start",
                    marginBottom: 10,
                    animation: "chatSlideUp 0.25s ease-out",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/chatbot.png"
                      alt="AI"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #e8ecf4",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      borderRadius: "18px 18px 18px 4px",
                      padding: "11px 15px",
                    }}
                  >
                    <div style={{ ...S.row, gap: 4 }}>
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "rgba(0,88,189,0.4)",
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

            {/* Input bar */}
            <div
              style={{
                flexShrink: 0,
                background: "white",
                borderTop: "1px solid #e8ecf4",
                padding: "10px 12px",
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                style={{ ...S.row, gap: 8 }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tâm sự hoặc câu hỏi..."
                  disabled={isLoading}
                  autoComplete="off"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "#f0f3fa",
                    border: "1.5px solid #dce1ef",
                    borderRadius: 14,
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "#1a1f2e",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0058bd";
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,88,189,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#dce1ef";
                    e.currentTarget.style.background = "#f0f3fa";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  style={{
                    flexShrink: 0,
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    ...S.row,
                    justifyContent: "center",
                    background: "linear-gradient(135deg,#0072ff 0%,#003d94 100%)",
                    color: "white",
                    opacity: !inputText.trim() || isLoading ? 0.4 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon name="send" size={16} />
                </button>
              </form>
              <p
                style={{
                  fontSize: 10,
                  textAlign: "center",
                  color: "rgba(0,0,0,0.38)",
                  margin: "8px 0 0",
                }}
              >
                🔒 Mọi thông tin được bảo mật tuyệt đối
              </p>
            </div>
          </div>

          {/* ── History panel ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              ...S.col,
              background: "white",
              transition: "transform 0.3s ease",
              transform: showHistory ? "translateX(0)" : "translateX(100%)",
            }}
          >
            <div
              style={{
                ...S.row,
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid #e8ecf4",
                flexShrink: 0,
              }}
            >
              <div style={{ ...S.row, gap: 8 }}>
                <Icon name="forum" size={16} className="text-primary" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0a1e40" }}>
                  Lịch sử tư vấn
                </span>
                {sessions.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: "rgba(0,88,189,0.1)",
                      color: "#0058bd",
                      padding: "2px 7px",
                      borderRadius: 99,
                    }}
                  >
                    {sessions.length}
                  </span>
                )}
              </div>
              <div style={{ ...S.row, gap: 4 }}>
                <button
                  onClick={handleNewSession}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#0058bd",
                    display: "flex",
                  }}
                >
                  <Icon name="add_circle" size={18} />
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    display: "flex",
                  }}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 8 }}>
              {sessions.length === 0 ? (
                <div
                  style={{
                    ...S.col,
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "40px 20px",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      background: "rgba(0,88,189,0.08)",
                      ...S.row,
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Icon name="chat_bubble_outline" size={22} className="text-primary" />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", margin: "0 0 4px" }}>
                    Chưa có lịch sử
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", margin: 0 }}>
                    Hãy bắt đầu trò chuyện!
                  </p>
                </div>
              ) : (
                sessions.map((s) => {
                  const isAct = s.id === activeSessionId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSession(s.id!)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: isAct ? "1px solid rgba(0,88,189,0.25)" : "1px solid transparent",
                        background: isAct ? "rgba(0,88,189,0.06)" : "none",
                        cursor: "pointer",
                        ...S.row,
                        alignItems: "flex-start",
                        gap: 10,
                        marginBottom: 4,
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 10,
                          background: isAct ? "#0058bd" : "#f0f3fa",
                          color: isAct ? "white" : "#6b7280",
                          ...S.row,
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <Icon name="chat" size={13} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: "0 0 3px",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: isAct ? "#0058bd" : "#1a1f2e",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.sessionTitle || "Phiên tư vấn"}
                        </p>
                        <div style={{ ...S.row, gap: 6 }}>
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>
                            {s.messageCount || 0} tin nhắn
                          </span>
                          <span style={{ fontSize: 9, color: "#d1d5db" }}>•</span>
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>
                            {formatSessionTime(s.lastUpdatedAt as Date)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div style={{ flexShrink: 0, padding: 12, borderTop: "1px solid #e8ecf4" }}>
              <div
                style={{
                  background:
                    "linear-gradient(135deg,rgba(0,88,189,0.05),rgba(0,88,189,0.1))",
                  borderRadius: 14,
                  padding: "10px 12px",
                  ...S.row,
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <Icon name="security" size={13} className="text-primary" />
                <p style={{ fontSize: 10, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                  Mọi cuộc hội thoại được mã hóa và chỉ dùng để hỗ trợ sức khỏe tâm thần học sinh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== FLOATING ACTION BUTTON ========== */}
      <div style={{ position: "fixed", bottom: 18, right: 20, zIndex: 50 }}>
        {showAttentionPopup && !isOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 14px)",
              right: 0,
              background: "linear-gradient(135deg, #0072ff 0%, #003d94 100%)",
              color: "white",
              padding: "10px 14px",
              borderRadius: "18px 18px 4px 18px",
              boxShadow: "0 12px 36px rgba(0,88,189,0.35)",
              animation: "attentionFloat 3s ease-in-out infinite",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              fontSize: "12px",
              fontWeight: 700,
              zIndex: 60,
              border: "1px solid rgba(255,255,255,0.25)"
            }}
          >
            <Icon name="support_agent" size={16} style={{ color: "#34d399" }} />
            <span>Bác sĩ AI hỗ trợ 24/7!</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAttentionPopup(false);
              }}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "none",
                borderRadius: "50%",
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                marginLeft: 4,
                fontSize: 10,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
            >
              <Icon name="close" size={10} />
            </button>
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 20,
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid #003d94"
              }}
            />
          </div>
        )}

        {!isOpen && (
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#0072ff,#003d94)",
              opacity: 0.28,
              animation: "fabPulse 2.2s ease-out infinite",
            }}
          />
        )}
        <button
          id="chatbot-fab"
          onClick={toggleOpen}
          title="Chat với Bác sĩ Tâm lý AI"
          style={{
            position: "relative",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            ...S.row,
            justifyContent: "center",
            background: "linear-gradient(135deg,#0072ff 0%,#003d94 100%)",
            boxShadow: "0 8px 26px rgba(0,88,189,0.52)",
            transition: "all 0.28s cubic-bezier(0.34,1.56,0.64,1)",
            transform: isOpen ? "scale(0.88) rotate(180deg)" : "scale(1) rotate(0deg)",
          }}
          onMouseEnter={(e) => {
            if (!isOpen) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.14)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = isOpen
              ? "scale(0.88) rotate(180deg)"
              : "scale(1) rotate(0deg)";
          }}
        >
          {isOpen ? (
            <Icon name="keyboard_arrow_down" size={26} style={{ color: "white" }} />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <img
                src="/chatbot.png"
                alt="AI"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
          {hasUnread && !isOpen && (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 17,
                height: 17,
                borderRadius: "50%",
                background: "#ef4444",
                border: "2.5px solid white",
                ...S.row,
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 8, fontWeight: 800, color: "white" }}>1</span>
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes chatSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fabPulse    { 0%{transform:scale(0.95);opacity:0.48} 50%{transform:scale(1.42);opacity:0.14} 100%{transform:scale(1.68);opacity:0} }
        @keyframes bounce      { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes attentionFloat {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 4px 12px rgba(0,88,189,0.3)); }
          50%      { transform: translateY(-8px) scale(1.02); filter: drop-shadow(0 12px 20px rgba(0,88,189,0.45)); }
        }
        .chatbot-msg { overflow-wrap:anywhere; word-break:normal; hyphens:auto; }
        .chatbot-msg strong { font-weight:700; color:#0a1e40; }
        .chatbot-msg em     { font-style:italic; color:#414754; }
        #chat-messages::-webkit-scrollbar       { width:4px; }
        #chat-messages::-webkit-scrollbar-track { background:transparent; }
        #chat-messages::-webkit-scrollbar-thumb { background:#c1c6d6; border-radius:99px; }
      `}</style>
    </>
  );
}
