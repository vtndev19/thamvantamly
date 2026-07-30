import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, redirect, useSearchParams, Link } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  DoctorChatService,
  formatChatTime,
  type DoctorChat,
  type DoctorChatMessage,
  type DoctorProfile,
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
    throw redirect("/auth/login?redirect=/student/chat");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "student" && role !== "admin") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}

export function meta() {
  return [
    { title: "Hộp thư tư vấn – SafeSchool Hub" },
    { name: "description", content: "Nhắn tin trực tuyến với các bác sĩ tâm lý học đường." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const FALLBACK_DOCTORS: DoctorProfile[] = [
  {
    uid: "fallback_1",
    displayName: "ThS. Trần Thị Lan",
    email: null,
    specialization: "Tâm lý học đường",
    hospital: "Trung tâm Sức khỏe Tâm thần",
    licenseNumber: "CCHN-001",
    photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    role: "doctor",
  },
  {
    uid: "fallback_2",
    displayName: "TS. Nguyễn Văn Nam",
    email: null,
    specialization: "Tư vấn hướng nghiệp",
    hospital: "Bệnh viện Tâm thần Trung ương",
    licenseNumber: "CCHN-002",
    photoURL: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    role: "doctor",
  },
  {
    uid: "fallback_3",
    displayName: "Chuyên viên Lê Hoàng",
    email: null,
    specialization: "Phát triển kỹ năng mềm",
    hospital: "Phòng tư vấn học đường THPT",
    licenseNumber: "CCHN-003",
    photoURL: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop",
    role: "doctor",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function StudentChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState<DoctorChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [allDoctors, setAllDoctors] = useState<DoctorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeChat, setActiveChat] = useState<DoctorChat | null>(null);
  const [messages, setMessages] = useState<DoctorChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // View state cho responsive mobile: "list" hoặc "chat"
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubChatsRef = useRef<(() => void) | null>(null);
  const unsubMsgsRef = useRef<(() => void) | null>(null);

  const studentId = user?.uid || "";
  const studentName = user?.displayName || user?.email?.split("@")[0] || "Học sinh";

  // Redirect nếu không phải student
  useEffect(() => {
    if (user && user.role !== "student") {
      navigate("/auth/login?error=access_denied");
    }
  }, [user, navigate]);

  // Lấy danh sách toàn bộ bác sĩ
  useEffect(() => {
    async function fetchDoctors() {
      const docs = await DoctorChatService.getDoctors();
      // Gộp fallback doctors để luôn có bác sĩ demo
      const merged = [...docs];
      FALLBACK_DOCTORS.forEach(fallback => {
        if (!merged.some(d => d.uid === fallback.uid)) {
          merged.push(fallback);
        }
      });
      setAllDoctors(merged);
    }
    fetchDoctors();
  }, []);

  // Lắng nghe danh sách chat của tôi
  useEffect(() => {
    if (!studentId) return;
    setLoadingChats(true);
    unsubChatsRef.current = DoctorChatService.subscribeToMyChats(studentId, "student", (list) => {
      setChats(list);
      setLoadingChats(false);
      
      // Kiểm tra nếu có searchParam `doctor` hoặc `chatId`
      const paramChatId = searchParams.get("chatId");
      const paramDoctorId = searchParams.get("doctor");
      
      if (paramChatId) {
        const found = list.find(c => c.id === paramChatId);
        if (found) {
          setActiveChat(found);
          setMobileView("chat");
        }
      } else if (paramDoctorId && list.length > 0) {
        const found = list.find(c => c.doctorId === paramDoctorId);
        if (found) {
          setActiveChat(found);
          setMobileView("chat");
        }
      }
    });

    return () => {
      unsubChatsRef.current?.();
    };
  }, [studentId, searchParams]);

  // Xử lý tạo hoặc mở chat khi ấn vào bác sĩ từ thanh tìm kiếm/chuyên gia gợi ý
  const handleStartChatWithDoctor = async (doctor: DoctorProfile) => {
    if (!studentId) return;
    setMobileView("chat");

    if (doctor.uid.startsWith("fallback_")) {
      // Mock chat với bác sĩ demo
      const mockChat: DoctorChat = {
        id: `mock_${doctor.uid}`,
        studentId,
        studentName,
        studentPhotoURL: user?.photoURL || "",
        doctorId: doctor.uid,
        doctorName: doctor.displayName || "Bác sĩ",
        doctorPhotoURL: doctor.photoURL || "",
        doctorSpecialization: doctor.specialization || "Chuyên gia",
        lastMessage: "Bắt đầu cuộc trò chuyện demo",
        lastMessageAt: new Date(),
        unreadByStudent: 0,
        unreadByDoctor: 0,
        createdAt: new Date(),
      };
      
      // Kiểm tra xem chat mock đã có trong list chưa để tái sử dụng
      const existing = chats.find(c => c.doctorId === doctor.uid);
      if (existing) {
        setActiveChat(existing);
      } else {
        setActiveChat(mockChat);
        setChats(prev => [mockChat, ...prev]);
      }
      setTimeout(() => inputRef.current?.focus(), 300);
      return;
    }

    try {
      setLoadingChats(true);
      const chatId = await DoctorChatService.getOrCreateChat(
        studentId,
        studentName,
        doctor.uid,
        doctor.displayName || "Bác sĩ",
        doctor.photoURL,
        doctor.specialization,
        user?.photoURL || ""
      );
      setSearchParams({ chatId });
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (err) {
      console.error("Lỗi tạo/mở chat:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  // Đăng ký nhận tin nhắn khi activeChat thay đổi
  useEffect(() => {
    unsubMsgsRef.current?.();
    if (!activeChat?.id) {
      setMessages([]);
      return;
    }

    if (activeChat.id.startsWith("mock_")) {
      // Tin nhắn demo
      setMessages([
        {
          chatId: activeChat.id,
          senderId: activeChat.doctorId,
          senderName: activeChat.doctorName,
          senderRole: "doctor",
          text: `Chào em, cô là ${activeChat.doctorName}. Cô có thể giúp gì cho em hôm nay?`,
          timestamp: new Date(),
        }
      ]);
      return;
    }

    unsubMsgsRef.current = DoctorChatService.subscribeToMessages(activeChat.id, (list) => {
      setMessages(list);
    });
    DoctorChatService.markAsRead(activeChat.id, "student");

    return () => {
      unsubMsgsRef.current?.();
    };
  }, [activeChat?.id]);

  // Tự động cuộn xuống dưới
  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages]);

  const handleSelectChat = async (chat: DoctorChat) => {
    setActiveChat(chat);
    setMobileView("chat");
    setSearchParams({ chatId: chat.id || "" });
    if (chat.id && !chat.id.startsWith("mock_")) {
      await DoctorChatService.markAsRead(chat.id, "student");
    }
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending || !activeChat) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);

    if (activeChat.id?.startsWith("mock_")) {
      // Mock logic nhắn tin
      const newMsg: DoctorChatMessage = {
        chatId: activeChat.id,
        senderId: studentId,
        senderName: studentName,
        senderRole: "student",
        text,
        senderPhotoURL: user?.photoURL || "",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMsg]);
      setIsSending(false);

      // Phản hồi giả lập từ bác sĩ sau 1 giây
      setTimeout(() => {
        const replies = [
          "Cô hiểu cảm giác của em. Em có thể chia sẻ cụ thể hơn được không?",
          "Điều đó chắc hẳn đã khiến em rất mệt mỏi. Hãy kể thêm cho cô nhé.",
          "Cảm ơn em đã tin tưởng chia sẻ với cô. Cô luôn ở đây để lắng nghe em.",
          "Đây là một môi trường an toàn và bảo mật, em có thể thoải mái chia sẻ.",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const doctorReply: DoctorChatMessage = {
          chatId: activeChat.id!,
          senderId: activeChat.doctorId,
          senderName: activeChat.doctorName,
          senderRole: "doctor",
          text: randomReply,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, doctorReply]);
      }, 1000);

      setTimeout(() => inputRef.current?.focus(), 150);
      return;
    }

    try {
      await DoctorChatService.sendMessage(
        activeChat.id!,
        studentId,
        studentName,
        "student",
        text,
        user?.photoURL || ""
      );
    } catch (err) {
      console.error("Lỗi gửi tin:", err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Lọc danh sách bác sĩ dựa trên tìm kiếm
  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const queryLower = searchQuery.toLowerCase();
    return allDoctors.filter(
      (d) =>
        d.displayName?.toLowerCase().includes(queryLower) ||
        d.specialization?.toLowerCase().includes(queryLower)
    );
  }, [allDoctors, searchQuery]);

  // Các bác sĩ đề xuất chưa chat
  const suggestedDoctors = useMemo(() => {
    const existingDoctorIds = chats.map((c) => c.doctorId);
    return allDoctors.filter((d) => !existingDoctorIds.includes(d.uid));
  }, [allDoctors, chats]);

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadByStudent || 0), 0);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/10 text-sky-600">
                <Icon name="chat" size={20} filled />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-base leading-tight">
                  Hộp thư tư vấn tâm lý
                </h1>
                <p className="text-[11px] text-slate-500 leading-none">
                  Trò chuyện an toàn và bảo mật với chuyên gia
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Body ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          
          {/* ── CỘT TRÁI: DANH SÁCH CHAT & TÌM KIẾM ── */}
          <div
            className={`absolute inset-0 w-full h-full lg:relative lg:flex lg:flex-col bg-white border-r border-slate-100 z-10 lg:w-[360px] flex-shrink-0 transition-transform duration-300 ${
              mobileView === "list" ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          >
            {/* Thanh tìm kiếm */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm bác sĩ hoặc chuyên khoa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-sky-500 transition-all duration-200"
                />
                <div className="absolute left-3.5 top-2.5 text-slate-400">
                  <Icon name="search" size={18} />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Vùng scroll danh sách */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
              {searchQuery.trim() !== "" ? (
                /* Kết quả tìm kiếm bác sĩ */
                <div>
                  <p className="text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">
                    Kết quả tìm kiếm ({filteredDoctors.length})
                  </p>
                  {filteredDoctors.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Không tìm thấy bác sĩ nào phù hợp
                    </div>
                  ) : (
                    filteredDoctors.map((doc) => (
                      <button
                        key={doc.uid}
                        onClick={() => {
                          setSearchQuery("");
                          handleStartChatWithDoctor(doc);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-left transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                          {doc.photoURL ? (
                            <img src={doc.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(doc.displayName || "BS")
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{doc.displayName}</p>
                          <p className="text-xs text-slate-400 truncate">{doc.specialization}</p>
                        </div>
                        <div className="text-sky-500">
                          <Icon name="chat" size={18} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <>
                  {/* Cuộc trò chuyện hiện có */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">
                      Hội thoại gần đây
                    </p>
                    {loadingChats ? (
                      <div className="space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                            <div className="w-11 h-11 rounded-full bg-slate-100 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="h-3.5 bg-slate-100 rounded w-28 mb-2" />
                              <div className="h-2.5 bg-slate-50 rounded w-36" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : chats.length === 0 ? (
                      <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl mx-2">
                        <Icon name="chat_bubble_outline" size={28} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Chưa có tin nhắn nào</p>
                        <p className="text-[10px] text-slate-300 mt-1">Chọn chuyên gia phía dưới để bắt đầu</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {chats.map((chat) => {
                          const isActive = activeChat?.id === chat.id;
                          return (
                            <button
                              key={chat.id}
                              onClick={() => handleSelectChat(chat)}
                              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                                isActive
                                  ? "bg-sky-500/5 border-l-4 border-sky-500 pl-2 shadow-xs"
                                  : "hover:bg-slate-50 border-l-4 border-transparent"
                              }`}
                            >
                              <div className="relative flex-shrink-0">
                                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm overflow-hidden border border-slate-100">
                                  {chat.doctorPhotoURL ? (
                                    <img src={chat.doctorPhotoURL} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    getInitials(chat.doctorName)
                                  )}
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-sky-400 border-2 border-white" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className={`text-sm truncate text-slate-700 ${chat.unreadByStudent > 0 ? "font-bold text-slate-900" : "font-semibold"}`}>
                                    {chat.doctorName}
                                  </p>
                                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                                    {formatChatTime(chat.lastMessageAt)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <p className={`text-xs truncate ${chat.unreadByStudent > 0 ? "text-sky-600 font-semibold" : "text-slate-400"}`}>
                                    {chat.lastMessageSenderRole === "student" ? "Bạn: " : ""}
                                    {chat.lastMessage || "Nhấn để bắt đầu trò chuyện"}
                                  </p>
                                  {chat.unreadByStudent > 0 && (
                                    <span className="flex-shrink-0 text-white text-[10px] font-bold flex items-center justify-center rounded-full bg-sky-500 w-4 h-4">
                                      {chat.unreadByStudent}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Chuyên gia tâm lý gợi ý */}
                  {suggestedDoctors.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">
                        Đội ngũ Chuyên gia gợi ý
                      </p>
                      <div className="space-y-1">
                        {suggestedDoctors.map((doc) => (
                          <button
                            key={doc.uid}
                            onClick={() => handleStartChatWithDoctor(doc)}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-left transition-all cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                              {doc.photoURL ? (
                                <img src={doc.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(doc.displayName || "BS")
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{doc.displayName}</p>
                              <p className="text-xs text-slate-400 truncate">{doc.specialization}</p>
                            </div>
                            <div className="text-slate-400 hover:text-sky-500">
                              <Icon name="add_comment" size={18} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── CỘT PHẢI: KHUNG CHAT CHI TIẾT ── */}
          <div
            className={`absolute inset-0 w-full h-full lg:relative lg:flex lg:flex-col bg-slate-50 lg:flex-1 z-20 flex flex-col transition-transform duration-300 ${
              mobileView === "chat" ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            }`}
          >
            {!activeChat ? (
              /* Màn hình Welcome trống */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto gap-6 w-full">
                <div className="w-20 h-20 bg-sky-500/10 text-sky-600 rounded-3xl flex items-center justify-center shadow-sm">
                  <Icon name="forum" size={40} filled />
                </div>
              </div>
            ) : (
              /* Màn hình Chat hoạt động */
              <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/60 sticky top-0 z-10 flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Nút Back trên Mobile */}
                    <button
                      onClick={() => setMobileView("list")}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
                      title="Quay lại danh sách"
                    >
                      <Icon name="arrow_back" size={20} />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                      {activeChat.doctorPhotoURL ? (
                        <img src={activeChat.doctorPhotoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(activeChat.doctorName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {activeChat.doctorName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {activeChat.doctorSpecialization || "Chuyên gia tâm lý"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block text-[10px] text-sky-600 font-bold bg-sky-50 px-2 py-1 rounded-lg">
                      Bảo mật y tế
                    </span>
                    <Link
                      to={`/student/appointments/new?doctor=${activeChat.doctorId}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <Icon name="calendar_today" size={12} />
                      Đặt lịch hẹn
                    </Link>
                  </div>
                </div>

                {/* Khung tin nhắn */}
                <div className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                      <Icon name="chat_bubble_outline" size={32} className="text-slate-300" />
                      <p className="text-xs">Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {messages.map((msg, idx) => {
                        const isStudent = msg.senderRole === "student";
                        const isFirst =
                          idx === 0 || messages[idx - 1]?.senderRole !== msg.senderRole;
                        const isLast =
                          idx === messages.length - 1 ||
                          messages[idx + 1]?.senderRole !== msg.senderRole;

                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex items-end gap-2 ${
                              isStudent ? "justify-end" : "justify-start"
                            }`}
                            style={{ marginBottom: isLast ? 10 : 2 }}
                          >
                            {/* Avatar Bác sĩ ở tin nhắn bên trái */}
                            {!isStudent && (
                              <div
                                className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] overflow-hidden flex-shrink-0"
                                style={{ opacity: isFirst ? 1 : 0 }}
                              >
                                {activeChat.doctorPhotoURL ? (
                                  <img
                                    src={activeChat.doctorPhotoURL}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  getInitials(msg.senderName)
                                )}
                              </div>
                            )}

                            {/* Bong bóng tin nhắn */}
                            <div
                              className="max-w-[75%] px-4 py-2.5 text-sm shadow-xs leading-relaxed break-words"
                              style={{
                                borderRadius: isStudent
                                  ? isLast
                                    ? "20px 20px 4px 20px"
                                    : "20px"
                                  : isLast
                                  ? "20px 20px 20px 4px"
                                  : "20px",
                                background: isStudent ? "#0ea5e9" : "white",
                                color: isStudent ? "white" : "#1e293b",
                                border: isStudent ? "none" : "1px solid #e2e8f0",
                              }}
                            >
                              <p className="margin-0">{msg.text}</p>
                              {isLast && msg.timestamp && (
                                <p
                                  className="text-[9px] text-right mt-1"
                                  style={{ color: isStudent ? "rgba(255,255,255,0.7)" : "#94a3b8" }}
                                >
                                  {formatTimestamp(msg.timestamp)}
                                </p>
                              )}
                            </div>

                            {/* Avatar Học sinh ở tin nhắn bên phải */}
                            {isStudent && (
                              <div
                                className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] overflow-hidden flex-shrink-0"
                                style={{ opacity: isFirst ? 1 : 0 }}
                              >
                                {user?.photoURL ? (
                                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  getInitials(studentName)
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Typing/Sending indicator */}
                      {isSending && (
                        <div className="flex items-end gap-2 justify-start mb-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex-shrink-0" />
                          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-1 shadow-xs">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Khung soạn thảo tin nhắn */}
                <div className="p-4 bg-white border-t border-slate-200/80 flex-shrink-0">
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
                      placeholder={`Nhắn tin với ${activeChat.doctorName}...`}
                      disabled={isSending}
                      autoComplete="off"
                      className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-all duration-200"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSending}
                      className="w-11 h-11 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/10 flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="send" size={18} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(val: any): string {
  if (!val) return "";
  const d = typeof val.toDate === "function" ? val.toDate() : new Date(val);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
