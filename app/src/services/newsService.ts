import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getUsersBySchoolCode } from "./userService";

// ── Collections ────────────────────────────────────────────────────────────────
const NEWS_ARTICLES_COLLECTION = "newsArticles";
const STUDENT_NOTIFICATIONS_COLLECTION = "student_notifications";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StudentNotification {
  id?: string;
  studentUid: string;
  schoolCode: string;
  newsPostId: string;
  title: string;
  message: string;
  category: "general" | "psychology" | "announcement" | "guide" | "news" | "event";
  senderName: string;
  isRead: boolean;
  createdAt: number;
}

export interface Article {
  id?: string;
  title: string;
  summary: string;
  content: string;
  category: "general" | "psychology" | "announcement" | "guide";
  imageUrl?: string;
  imageUrls?: string[]; // Multiple images as base64
  authorId: string;
  authorName: string;
  authorRole: "student" | "teacher" | "doctor" | "admin";
  likes: number;
  views: number;
  likedBy?: string[]; // Array of user Uids
  createdAt: Date | Timestamp | null;
  updatedAt: Date | Timestamp | null;
  schoolCode?: string;
  thptId?: string;
  isBroadcast?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Chung",
  psychology: "Tâm lý học đường",
  announcement: "Thông báo",
  guide: "Cẩm nang",
  news: "Tin tức",
  event: "Sự kiện",
};

export const FALLBACK_ARTICLES: Article[] = [
  {
    id: "news_1",
    title: "Chăm sóc sức khỏe tinh thần mùa thi cử: Lời khuyên từ chuyên gia",
    summary: "Mùa thi cử cận kề mang theo nhiều áp lực. Làm thế nào để giữ vững tinh thần thoải mái, ngủ đủ giấc và ôn tập hiệu quả?",
    content: `## Áp lực mùa thi và sức khỏe tinh thần

Mùa thi cử luôn là khoảng thời gian thử thách lớn đối với mọi học sinh. Áp lực từ kỳ vọng của bản thân, gia đình và nhà trường có thể dẫn đến trạng thái căng thẳng (stress) kéo dài, lo âu, thậm chí là trầm cảm.

### Những dấu hiệu stress mùa thi cần lưu ý:
1. **Mất ngủ thường xuyên**: Trằn trọc, thức giấc giữa đêm hoặc ngủ không sâu giấc.
2. **Thay đổi thói quen ăn uống**: Chán ăn hoặc ăn quá nhiều đồ ngọt, đồ ăn nhanh.
3. **Cảm xúc thất thường**: Dễ nổi cáu, lo sợ vô cớ, khóc lóc hoặc cảm thấy bất lực.
4. **Giảm khả năng tập trung**: Đọc sách không vào, mau quên.

---

## 4 Lời khuyên vàng để duy trì sức khỏe tinh thần tốt

### 1. Quản lý thời gian học tập khoa học
Hãy chia nhỏ nội dung ôn tập và học theo phương pháp **Pomodoro** (học 25 phút, nghỉ 5 phút). Tránh việc thức thâu đêm học dồn (nhồi nhét kiến thức) vì điều này khiến não bộ quá tải và suy giảm trí nhớ nghiêm trọng.

### 2. Ưu tiên giấc ngủ chất lượng
Giấc ngủ từ 7-8 tiếng mỗi đêm là bắt buộc để não bộ củng cố kiến thức đã học trong ngày. Trước khi ngủ 30 phút, hãy tắt tất cả các thiết bị điện tử để mắt và hệ thần kinh được thư giãn.

### 3. Dinh dưỡng đầy đủ và vận động nhẹ nhàng
- Bổ sung thực phẩm giàu omega-3 (cá, hạt óc chó), rau xanh, trái cây.
- Uống đủ 2 lít nước mỗi ngày.
- Dành 15-20 phút đi bộ, tập yoga hoặc thể dục nhẹ để tăng cường tuần hoàn máu và kích thích sản sinh hormone hạnh phúc (endorphin).

### 4. Chia sẻ và tìm kiếm sự trợ giúp
Nếu cảm thấy lo âu vượt quá tầm kiểm soát, em đừng ngần ngại chia sẻ với bố mẹ, giáo viên hoặc đặt lịch tư vấn trực tuyến với các **Bác sĩ Tâm lý trên SafeSchool Hub** để nhận được sự đồng hành và tháo gỡ kịp thời.

> "Hãy nhớ rằng, điểm số rất quan trọng, nhưng sức khỏe và hạnh phúc của em mới là điều quý giá nhất."`,
    category: "psychology",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
    imageUrls: ["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop"],
    authorId: "fallback_1",
    authorName: "ThS. Trần Thị Lan",
    authorRole: "doctor",
    likes: 124,
    views: 450,
    likedBy: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "news_2",
    title: "Diễn đàn chuyên đề: Phòng chống Bạo lực học đường năm học 2026",
    summary: "Nhà trường tổ chức buổi ngoại khóa chuyên đề nhằm nâng cao nhận thức, trang bị kỹ năng ứng phó và tuyên truyền thông điệp trường học an toàn.",
    content: `## Diễn đàn chuyên đề nâng cao nhận thức học sinh

Nhằm xây dựng môi trường giáo dục an toàn, lành mạnh, thân thiện và phòng chống hiệu quả các hành vi bạo lực học đường, Ban Giám hiệu nhà trường phối hợp cùng Đoàn Thanh niên và Tổ tư vấn tâm lý tổ chức Diễn đàn chuyên đề: **"SafeSchool - Trường học hạnh phúc, nói không với bạo lực"**.

### Thông tin chương trình:
* **Thời gian**: 07:30 - 11:30, Thứ Hai ngày 10 tháng 08 năm 2026.
* **Địa điểm**: Nhà đa năng trường THPT.
* **Thành phần tham gia**: Toàn thể cán bộ, giáo viên, nhân viên và học sinh các khối lớp.

---

## Các nội dung chính tại diễn đàn

### 1. Tọa đàm cùng Chuyên gia Pháp luật & Tâm lý
Học sinh sẽ được lắng nghe các chuyên gia phân tích về định nghĩa bạo lực học đường (bao gồm bạo lực thể chất, bạo lực ngôn từ và bắt nạt trên không gian mạng), những hậu quả pháp lý nghiêm trọng và tác động tiêu cực đến tâm lý lâu dài của cả nạn nhân lẫn người gây ra bạo lực.

### 2. Tập huấn kỹ năng tự vệ và xử lý tình huống
Hướng dẫn học sinh thực hành các kỹ năng tự bảo vệ bản thân, kỹ năng kiềm chế cảm xúc tức giận, cách hòa giải mâu thuẫn bằng biện pháp hòa bình, và cách ứng phó khi chứng kiến bạn bè bị bắt nạt.

### 3. Ra mắt Kênh hỗ trợ trực tuyến SafeSchool Hub
Nhà trường sẽ hướng dẫn chi tiết cách sử dụng nền tàm **SafeSchool Hub** để gửi phản ánh ẩn danh, báo cáo khẩn cấp tới Ban Giám hiệu hoặc giáo viên chủ nhiệm, và cách kết nối nhanh với Chuyên gia Tâm lý học đường khi gặp các khó khăn tâm lý.

> "Mỗi học sinh hãy là một đại sứ của sự tử tế. Hãy cùng chung tay bảo vệ bản thân và bạn bè xung quanh vì một mái trường không bạo lực."`,
    category: "announcement",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
    imageUrls: ["https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop"],
    authorId: "admin_system",
    authorName: "Ban Giám Hiệu",
    authorRole: "admin",
    likes: 85,
    views: 310,
    likedBy: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  }
];

export class NewsService {
  // ── 1. Subscribe to articles list (realtime) ──
  static subscribeToArticles(callback: (articles: Article[]) => void): Unsubscribe {
    const q = query(collection(db, NEWS_ARTICLES_COLLECTION), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        callback(FALLBACK_ARTICLES);
        return;
      }

      const list: Article[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as Article));
      callback(list);
    }, (err) => {
      console.error("[NewsService] subscribeToArticles error:", err);
      callback(FALLBACK_ARTICLES);
    });
  }

  // ── 2. Create an article ──
  static async createArticle(
    article: Omit<Article, "id" | "createdAt" | "updatedAt" | "likes" | "views" | "likedBy">
  ): Promise<{ id: string; notifiedCount: number }> {
    try {
      const docData = {
        ...article,
        likes: 0,
        views: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, NEWS_ARTICLES_COLLECTION), docData);
      const articleId = ref.id;
      let notifiedCount = 0;

      // ── Đếm số học sinh cùng trường nhận thông báo phát thanh ──
      if (article.isBroadcast && article.schoolCode) {
        try {
          const students = await getUsersBySchoolCode(article.schoolCode, "student");
          notifiedCount = students.length;
          console.log(`✅ Đã gửi thông báo đến ${students.length} học sinh trường ${article.schoolCode}`);
        } catch (err) {
          console.warn("Lỗi đếm số học sinh cùng trường:", err);
        }
      }

      return { id: articleId, notifiedCount };
    } catch (err) {
      console.error("[NewsService] createArticle error:", err);
      throw err;
    }
  }

  // ── 3. Update an article ──
  static async updateArticle(id: string, article: Partial<Article>): Promise<void> {
    try {
      if (id.startsWith("news_")) {
        console.info("[NewsService] Cannot update mock article on Firestore");
        return;
      }
      const ref = doc(db, NEWS_ARTICLES_COLLECTION, id);
      await updateDoc(ref, {
        ...article,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[NewsService] updateArticle error:", err);
      throw err;
    }
  }

  // ── 4. Delete an article ──
  static async deleteArticle(id: string): Promise<void> {
    try {
      if (id.startsWith("news_")) {
        console.info("[NewsService] Cannot delete mock article on Firestore");
        return;
      }
      await deleteDoc(doc(db, NEWS_ARTICLES_COLLECTION, id));
    } catch (err) {
      console.error("[NewsService] deleteArticle error:", err);
      throw err;
    }
  }

  // ── 5. Like or unlike an article ──
  static async toggleLikeArticle(id: string, userId: string, isLiked: boolean): Promise<void> {
    try {
      if (id.startsWith("news_")) {
        console.info("[NewsService] Cannot toggle like on mock article on Firestore");
        return;
      }
      const ref = doc(db, NEWS_ARTICLES_COLLECTION, id);
      await updateDoc(ref, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      });
    } catch (err) {
      console.error("[NewsService] toggleLikeArticle error:", err);
      throw err;
    }
  }

  // ── 6. Increment view counter ──
  static async incrementViews(id: string): Promise<void> {
    try {
      if (id.startsWith("news_")) {
        console.info("[NewsService] Cannot increment views on mock article on Firestore");
        return;
      }
      const ref = doc(db, NEWS_ARTICLES_COLLECTION, id);
      await updateDoc(ref, {
        views: increment(1),
      });
    } catch (err) {
      console.error("[NewsService] incrementViews error:", err);
    }
  }
}

// Legacy functions removed

export function listenStudentNotifications(
  studentUid: string,
  schoolCode: string,
  callback: (notifications: StudentNotification[]) => void
): Unsubscribe {
  if (!schoolCode) {
    callback([]);
    return () => {};
  }
  const ref = collection(db, NEWS_ARTICLES_COLLECTION);
  const q = query(ref, where("schoolCode", "==", schoolCode.trim()));
  
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const categoryLabels: Record<string, string> = {
          general: "Chung",
          psychology: "Tâm lý",
          announcement: "Thông báo",
          guide: "Cẩm nang",
        };
        return {
          id: docSnap.id,
          studentUid,
          schoolCode,
          newsPostId: docSnap.id,
          title: `📢 [${categoryLabels[data.category] || "Thông báo"}] ${data.title || ""}`,
          message: data.summary || "",
          category: data.category || "announcement",
          senderName: data.authorName || "Giáo viên",
          isRead: false,
          createdAt: data.createdAt 
            ? (typeof data.createdAt.toDate === "function" 
               ? data.createdAt.toDate().getTime() 
               : (data.createdAt.seconds * 1000 || data.createdAt)) 
            : Date.now(),
          isBroadcast: data.isBroadcast || false,
        };
      })
      .filter((n) => n.isBroadcast)
      .sort((a, b) => b.createdAt - a.createdAt) as StudentNotification[];
    callback(results);
  }, (err) => {
    console.error("Lỗi listenStudentNotifications:", err);
  });
}
