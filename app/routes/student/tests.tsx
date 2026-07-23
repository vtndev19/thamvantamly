import { useState, useEffect } from "react";
import { Link, redirect } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../../src/config/firebase";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  saveTestHistory,
  getTestHistoryByStudentId,
  saveTestHistoryToProfile,
  getTestHistoryFromProfile,
  type TestHistoryItem,
} from "../../src/services/testService";

export function meta() {
  return [
    { title: "Kiểm tra sức khỏe tinh thần – SafeSchool Hub" },
    {
      name: "description",
      content: "Các bài trắc nghiệm tự đánh giá mức độ lo âu, trầm cảm, căng thẳng dành cho học sinh.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader() {
  const auth = getAuth(getApp());

  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    }
  );

  if (!user) {
    throw redirect("/auth/login?redirect=/student/tests");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "student") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}

interface TestQuestion {
  id: number;
  text: string;
}

interface TestType {
  id: string;
  title: string;
  description: string;
  duration: string;
  questionsCount: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  questions: TestQuestion[];
}

const AVAILABLE_TESTS: TestType[] = [
  {
    id: "dass-21",
    title: "Thang đo DASS-21 (Rút gọn)",
    description: "Đánh giá 3 trạng thái cảm xúc: Trầm cảm (D), Lo âu (A), và Căng thẳng (S) trong tuần qua.",
    duration: "5 phút",
    questionsCount: 9,
    icon: "psychology",
    iconBg: "#e8f0fe",
    iconColor: "#0058bd",
    questions: [
      { id: 1, text: "Tôi thấy khó mà thư giãn hay thả lỏng được." },
      { id: 2, text: "Tôi bị khô miệng (dù không khát nước hay vận động)." },
      { id: 3, text: "Tôi không thấy có chút cảm xúc tích cực nào cả." },
      { id: 4, text: "Tôi bị khó thở (ví dụ thở gấp, hụt hơi dù không làm việc nặng)." },
      { id: 5, text: "Tôi thấy khó bắt tay vào công việc." },
      { id: 6, text: "Tôi có xu hướng phản ứng thái quá với các tình huống." },
      { id: 7, text: "Tôi bị run (ví dụ như run tay)." },
      { id: 8, text: "Tôi thấy mình đang dùng nhiều năng lượng để lo lắng." },
      { id: 9, text: "Tôi lo sợ mình sẽ bị suy sụp hoặc phát điên." },
    ]
  },
  {
    id: "school-stress",
    title: "Mức độ Áp lực Học đường",
    description: "Khảo sát nhanh mức độ stress phát sinh từ áp lực điểm số, bài tập và kỳ vọng của gia đình.",
    duration: "3 phút",
    questionsCount: 6,
    icon: "school",
    iconBg: "#fff2e8",
    iconColor: "#994100",
    questions: [
      { id: 1, text: "Tôi luôn cảm thấy lo lắng về kết quả thi cử tiếp theo." },
      { id: 2, text: "Lượng bài tập về nhà vượt quá khả năng hoàn thành thoải mái của tôi." },
      { id: 3, text: "Tôi cảm thấy mệt mỏi về thể chất khi nghĩ đến việc đến trường." },
      { id: 4, text: "Tôi cảm thấy kỳ vọng của bố mẹ về học tập tạo áp lực lớn cho tôi." },
      { id: 5, text: "Tôi không có đủ thời gian nghỉ ngơi, vui chơi vì lịch học thêm quá dày." },
      { id: 6, text: "Tôi khó tập trung nghe giảng trên lớp vì đầu óc suy nghĩ lan man." },
    ]
  }
];

const OPTIONS = [
  { value: 0, label: "Không bao giờ" },
  { value: 1, label: "Thỉnh thoảng" },
  { value: 2, label: "Thường xuyên" },
  { value: 3, label: "Rất thường xuyên" }
];

export default function StudentTestsPage() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTest, setActiveTest] = useState<TestType | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [testResult, setTestResult] = useState<{
    score: number;
    maxScore: number;
    resultText: string;
    status: "normal" | "warning" | "danger";
    description: string;
  } | null>(null);

  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getTestHistoryByStudentId(user.uid)
        .then((data) => {
          if (data && data.length > 0) {
            setHistory(data);
            setLoadingHistory(false);
          } else {
            // Check if there is data in the user profile fallback
            getTestHistoryFromProfile(user.uid).then((profileData) => {
              setHistory(profileData);
              setLoadingHistory(false);
            });
          }
        })
        .catch((err) => {
          console.warn("Lỗi tải từ collection, chuyển hướng sang profile:", err);
          getTestHistoryFromProfile(user.uid).then((profileData) => {
            setHistory(profileData);
            setLoadingHistory(false);
          });
        });
    }
  }, [user]);

  const formatDate = (timestamp: number) => {
    const dateObj = new Date(timestamp);
    return dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " + dateObj.toLocaleDateString("vi-VN");
  };

  const handleSelectTest = (test: TestType) => {
    setActiveTest(test);
    setAnswers({});
    setTestResult(null);
  };

  const handleSelectOption = (questionId: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitTest = () => {
    if (!activeTest) return;

    // Check if all questions are answered
    const unanswered = activeTest.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert(`Vui lòng trả lời đầy đủ tất cả ${activeTest.questionsCount} câu hỏi trước khi nộp bài.`);
      return;
    }

    // Calculate score
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    const maxScore = activeTest.questionsCount * 3;
    const ratio = totalScore / maxScore;

    let resultText = "Bình thường";
    let status: "normal" | "warning" | "danger" = "normal";
    let description = "Chỉ số tâm lý của bạn hiện tại nằm trong ngưỡng an toàn. Hãy tiếp tục duy trì lối sống lành mạnh nhé.";

    if (ratio >= 0.6) {
      resultText = "Nguy cơ cao (Nặng)";
      status = "danger";
      description = "Bạn đang có các dấu hiệu căng thẳng hoặc áp lực ở mức báo động. Chúng tôi khuyên bạn nên đặt lịch trò chuyện riêng với chuyên gia tâm lý học đường ngay để có sự hỗ trợ kịp thời.";
    } else if (ratio >= 0.3) {
      resultText = "Mức độ Vừa / Nhẹ";
      status = "warning";
      description = "Bạn đang trải qua một số áp lực hoặc lo lắng nhẹ. Hãy thử nghỉ ngơi, tham gia thể thao hoặc chia sẻ với bạn bè để giải tỏa bớt.";
    }

    const newResult = { score: totalScore, maxScore, resultText, status, description };
    setTestResult(newResult);

    // Save to Firestore history list
    if (user?.uid) {
      console.log("Saving test history for user:", user.uid);
      const testInput = {
        studentId: user.uid,
        testId: activeTest.id,
        testTitle: activeTest.title,
        score: totalScore,
        maxScore,
        resultText,
        status
      };

      saveTestHistory(testInput).then(() => {
        console.log("Saved successfully to Firestore collection");
        // Refresh history
        getTestHistoryByStudentId(user.uid).then((data) => {
          setHistory(data);
        });
      }).catch((err) => {
        console.warn("Lỗi khi lưu vào collection test_history, chuyển sang lưu vào user profile:", err);
        // Fallback: save to user profile doc
        saveTestHistoryToProfile(user.uid, testInput).then(() => {
          console.log("Saved successfully to User Profile document");
          getTestHistoryFromProfile(user.uid).then((data) => {
            setHistory(data);
          });
        }).catch((profileErr) => {
          console.error("Lỗi khi lưu vào user profile:", profileErr);
          alert("Không thể lưu kết quả kiểm tra lên Firestore. Chi tiết lỗi: " + profileErr.message);
        });
      });
    } else {
      console.warn("Không có user.uid");
      alert("Lỗi: Không tìm thấy thông tin tài khoản học sinh đăng nhập.");
    }
  };

  const handleGoBack = () => {
    setActiveTest(null);
    setAnswers({});
    setTestResult(null);
  };

  const allAnswered = activeTest ? activeTest.questions.every((q) => answers[q.id] !== undefined) : false;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>

            <Link
              to="/student/dashboard"
              className="flex items-center gap-2 text-primary font-serif font-extrabold text-[17px] tracking-tight select-none"
            >
              <Icon name="shield" filled size={22} />
              An Toàn Trường Học
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Tests navigation">
              <Link
                to="/student/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="home" size={18} />
                Trang chủ
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="fact_check" size={18} filled />
                Kiểm tra tâm lý
              </span>
              <Link
                to="/student/qna"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="help" size={18} />
                Hỏi đáp
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 animate-fade-in">
          <div className="max-w-[760px] mx-auto flex flex-col gap-8">
            
            {/* VIEW 1: Test Selection List & History */}
            {!activeTest && (
              <>
                {/* Title */}
                <div>
                  <h1 className="text-2xl font-serif font-extrabold text-on-surface">Kiểm tra sức khỏe tinh thần</h1>
                  <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                    Sử dụng các bài đánh giá nhanh chuẩn khoa học để tự nhận biết tình trạng căng thẳng, lo lắng của bản thân.
                  </p>
                </div>

                {/* Available Tests Grid */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-on-surface-variant tracking-wide uppercase">
                    Bài trắc nghiệm có sẵn ({AVAILABLE_TESTS.length})
                  </h3>

                  {AVAILABLE_TESTS.map((test) => (
                    <div
                      key={test.id}
                      className="bg-white border border-[#e8eaf0] rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: test.iconBg }}
                        >
                          <Icon name={test.icon} size={24} filled style={{ color: test.iconColor }} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-on-surface leading-snug">{test.title}</h4>
                          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{test.description}</p>
                          <div className="flex items-center gap-4 mt-3 flex-wrap text-[11px] font-semibold text-on-surface-variant/80">
                            <span className="flex items-center gap-1">
                              <Icon name="schedule" size={14} /> {test.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="quiz" size={14} /> {test.questionsCount} câu hỏi
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectTest(test)}
                        className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-5 py-3 rounded-2xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
                      >
                        Bắt đầu làm <Icon name="arrow_forward" size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* History Section */}
                <div className="bg-white border border-[#e8eaf0] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-serif font-bold text-on-surface flex items-center gap-2">
                      <Icon name="history" size={20} filled style={{ color: "#0058bd" }} />
                      Lịch sử đánh giá của bạn
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Theo dõi diễn biến tình trạng sức khỏe tâm lý của bạn qua các mốc thời gian.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 divide-y divide-outline-variant/20">
                    {loadingHistory ? (
                      <div className="text-center py-4 text-xs text-on-surface-variant italic">
                        Đang tải lịch sử...
                      </div>
                    ) : history.length > 0 ? (
                      history.map((h, idx) => {
                        const statusColor =
                          h.status === "danger"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : h.status === "warning"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200";

                        return (
                          <div key={h.id} className={`flex items-center justify-between gap-4 flex-wrap ${idx > 0 ? "pt-4" : ""}`}>
                            <div className="min-w-[200px]">
                              <h4 className="text-xs font-bold text-on-surface">{h.testTitle}</h4>
                              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{formatDate(h.createdAt)}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-on-surface-variant">
                                Điểm: <strong className="text-on-surface">{h.score}</strong>/{h.maxScore}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${statusColor}`}>
                                {h.resultText}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-on-surface-variant italic">
                        Chưa có lịch sử làm bài kiểm tra nào.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: Active Test & Questionnaire */}
            {activeTest && !testResult && (
              <div className="flex flex-col gap-6">
                
                {/* Back & Title Header */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleGoBack}
                    className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer self-start"
                  >
                    <Icon name="arrow_back" size={16} /> Quay lại danh sách
                  </button>
                  <div>
                    <h1 className="text-2xl font-serif font-extrabold text-on-surface">{activeTest.title}</h1>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Hãy chọn phương án phản ánh sát nhất cảm giác/trạng thái của bạn trong tuần vừa qua.
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant mb-2">
                    <span>Tiến trình hoàn thành</span>
                    <span>
                      {Object.keys(answers).length}/{activeTest.questionsCount} câu hỏi
                    </span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{
                        width: `${(Object.keys(answers).length / activeTest.questionsCount) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Questions List */}
                <div className="flex flex-col gap-4">
                  {activeTest.questions.map((q) => (
                    <div key={q.id} className="bg-white border border-[#e8eaf0] rounded-3xl p-5 shadow-xs flex flex-col gap-4">
                      <p className="text-sm font-bold text-on-surface leading-snug">
                        Câu {q.id}. {q.text}
                      </p>
                      
                      {/* Interactive radio-like cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {OPTIONS.map((opt) => {
                          const isSelected = answers[q.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleSelectOption(q.id, opt.value)}
                              className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "bg-primary border-primary text-on-primary font-bold shadow-sm"
                                  : "bg-surface-container-lowest border-outline-variant/40 hover:bg-surface-container text-on-surface-variant text-xs font-semibold"
                              }`}
                            >
                              <span className="block text-sm font-extrabold mb-0.5">{opt.value}</span>
                              <span className="text-[10px] leading-tight block">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Panel */}
                <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-[#e8eaf0] rounded-3xl p-5 shadow-sm">
                  <p className="text-xs text-on-surface-variant font-medium">
                    {allAnswered
                      ? "Bạn đã hoàn thành tất cả câu hỏi. Nhấn nộp để nhận kết quả."
                      : "Vui lòng hoàn thành mọi câu hỏi trước khi nhấn nộp bài."}
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleGoBack}
                      className="px-5 py-3 rounded-2xl border border-outline-variant/50 text-xs font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleSubmitTest}
                      disabled={!allAnswered}
                      className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        allAnswered
                          ? "bg-primary text-on-primary hover:bg-primary-container shadow-sm"
                          : "bg-surface-container text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/20"
                      }`}
                    >
                      <Icon name="check" size={16} /> NỘP BÀI
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 3: Results Display */}
            {activeTest && testResult && (
              <div className="bg-white border border-[#e8eaf0] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 text-center items-center">
                
                {/* Result header icon */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    testResult.status === "danger"
                      ? "bg-red-50 text-red-600"
                      : testResult.status === "warning"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <Icon
                    name={
                      testResult.status === "danger"
                        ? "error"
                        : testResult.status === "warning"
                        ? "warning"
                        : "check_circle"
                    }
                    size={36}
                    filled
                  />
                </div>

                {/* Score and Result */}
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    KẾT QUẢ ĐÁNH GIÁ
                  </p>
                  <h2
                    className={`text-2xl font-serif font-extrabold mt-1.5 ${
                      testResult.status === "danger"
                        ? "text-red-700"
                        : testResult.status === "warning"
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {testResult.resultText}
                  </h2>
                  <p className="text-sm font-semibold text-on-surface-variant mt-2">
                    Tổng điểm: <strong className="text-on-surface text-lg font-extrabold">{testResult.score}</strong>/{testResult.maxScore}
                  </p>
                </div>

                {/* Diagnosis / Guidance */}
                <div className="bg-surface-container-low rounded-2xl p-5 max-w-[500px]">
                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed font-medium">
                    {testResult.description}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[500px] justify-center mt-2">
                  {testResult.status === "danger" ? (
                    <>
                      <Link
                        to="/student/appointments/new"
                        className="flex-1 bg-[#ba1a1a] hover:bg-[#9a1414] text-white text-xs font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer w-full"
                      >
                        <Icon name="psychology" size={18} filled />
                        ĐẶT LỊCH TƯ VẤN NGAY
                      </Link>
                      <button
                        onClick={handleGoBack}
                        className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold py-3.5 px-6 rounded-2xl transition-all cursor-pointer border border-outline-variant/30 w-full"
                      >
                        Quay lại trang chủ test
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setAnswers({});
                          setTestResult(null);
                        }}
                        className="flex-1 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-3.5 px-6 rounded-2xl transition-all shadow-sm cursor-pointer w-full"
                      >
                        Làm lại bài kiểm tra
                      </button>
                      <button
                        onClick={handleGoBack}
                        className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold py-3.5 px-6 rounded-2xl transition-all cursor-pointer border border-outline-variant/30 w-full"
                      >
                        Quay lại trang chủ test
                      </button>
                    </>
                  )}
                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
