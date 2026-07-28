import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
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

export interface Article {
  id?: string;
  title: string;
  summary: string;
  content: string;
  category: "general" | "psychology" | "announcement" | "guide";
  imageUrl?: string;
  authorId: string;
  authorName: string;
  authorRole: "student" | "teacher" | "doctor" | "admin";
  likes: number;
  views: number;
  likedBy?: string[]; // Array of user Uids
  createdAt: Date | Timestamp | null;
  updatedAt: Date | Timestamp | null;
}

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
Nhà trường sẽ hướng dẫn chi tiết cách sử dụng nền tảng **SafeSchool Hub** để gửi phản ánh ẩn danh, báo cáo khẩn cấp tới Ban Giám hiệu hoặc giáo viên chủ nhiệm, và cách kết nối nhanh với Chuyên gia Tâm lý học đường khi gặp các khó khăn tâm lý.

> "Mỗi học sinh hãy là một đại sứ của sự tử tế. Hãy cùng chung tay bảo vệ bản thân và bạn bè xung quanh vì một mái trường không bạo lực."`,
    category: "announcement",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
    authorId: "admin_system",
    authorName: "Ban Giám Hiệu",
    authorRole: "admin",
    likes: 85,
    views: 310,
    likedBy: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "news_3",
    title: "Cẩm nang 5 bước xử lý xung đột bạn bè một cách thông minh",
    summary: "Xung đột bạn bè là điều khó tránh khỏi trong môi trường học đường. Học cách đối thoại và giải quyết mâu thuẫn văn minh cùng cẩm nang này.",
    content: `## Giải quyết mâu thuẫn bằng trí tuệ cảm xúc

Trong cuộc sống học sinh, những bất đồng quan điểm, hiểu lầm hay xung đột nhỏ với bạn bè là điều hết sức bình thường. Tuy nhiên, nếu không được xử lý khéo léo, chúng có thể leo thang thành bạo lực học đường hoặc làm rạn nứt những mối quan hệ tốt đẹp. 

Dưới đây là cẩm nang 5 bước giúp các em giải quyết mâu thuẫn một cách êm đẹp và thông minh:

---

### Bước 1: Giữ bình tĩnh và dừng phản ứng ngay lập tức
Khi tức giận, não bộ sẽ bị chi phối bởi cảm xúc và dễ đưa ra những lời nói, hành động gây tổn thương bạn bè. Hãy hít thở sâu 3 nhịp hoặc tạm thời lánh đi nơi khác cho đến khi cơn nóng giận qua đi.

### Bước 2: Lắng nghe chủ động góc nhìn của bạn
Hãy ngồi lại với bạn vào một thời điểm thích hợp và cho phép bạn trình bày quan điểm mà không ngắt lời. Đôi khi, mâu thuẫn phát sinh chỉ vì những hiểu lầm giao tiếp nhỏ. Hãy đặt câu hỏi: *"Vì sao bạn lại nghĩ/làm như vậy?"* để hiểu rõ nguyên nhân.

### Bước 3: Thể hiện cảm xúc bằng thông điệp "Tôi" (I-message)
Thay vì đổ lỗi và chỉ trích bạn (ví dụ: *"Cậu luôn nói xấu tôi"*), hãy tập trung mô tả cảm xúc của bản thân (ví dụ: *"Tôi cảm thấy buồn và tổn thương khi nghe những lời nói đó"*). Cách này giúp bạn giảm bớt thái độ phòng thủ và dễ cởi mở lắng nghe hơn.

### Bước 4: Cùng nhau tìm kiếm giải pháp dung hòa
Xác định mục tiêu chung là giữ gìn tình bạn. Hãy cùng bạn thảo luận: *"Chúng ta có thể làm gì để khắc phục hiểu lầm này?"*. Hãy sẵn sàng nhận lỗi nếu bản thân có phần sai sót. Sự chủ động xin lỗi luôn là liều thuốc hòa giải hiệu nghiệm nhất.

### Bước 5: Tìm kiếm sự hỗ trợ từ người lớn khi cần thiết
Nếu xung đột kéo dài, có dấu hiệu bị đe dọa hoặc có nguy cơ dẫn tới bạo lực thể chất, các em tuyệt đối không tự giải quyết. Hãy báo ngay cho Giáo viên chủ nhiệm, bố mẹ, hoặc gửi phản ánh khẩn cấp qua ứng dụng **SafeSchool Hub** để nhận được sự can thiệp an toàn và kịp thời từ phía nhà trường.

> "Người mạnh mẽ không phải là người thắng trong mọi cuộc cãi vã, mà là người biết kiểm soát cảm xúc để gìn giữ sự hòa khí và những mối quan hệ tốt đẹp."`,
    category: "guide",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
    authorId: "fallback_2",
    authorName: "Cô Nguyễn Minh Hằng (GVCN)",
    authorRole: "teacher",
    likes: 92,
    views: 280,
    likedBy: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  }
];

export class NewsService {
  // ── 1. Subscribe to articles list (realtime) ──
  static subscribeToArticles(callback: (articles: Article[]) => void): Unsubscribe {
    const q = query(collection(db, "newsArticles"), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        // Trả về fallback data nếu Firestore trống
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
      // Trả về fallback khi có lỗi kết nối
      callback(FALLBACK_ARTICLES);
    });
  }

  // ── 2. Create an article ──
  static async createArticle(
    article: Omit<Article, "id" | "createdAt" | "updatedAt" | "likes" | "views" | "likedBy">
  ): Promise<string> {
    try {
      const docData = {
        ...article,
        likes: 0,
        views: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "newsArticles"), docData);
      return ref.id;
    } catch (err) {
      console.error("[NewsService] createArticle error:", err);
      throw err;
    }
  }

  // ── 3. Update an article ──
  static async updateArticle(id: string, article: Partial<Article>): Promise<void> {
    try {
      // Nếu là mock article thì không update Firestore thật được, ném lỗi giả để UI xử lý hoặc cho phép sửa local
      if (id.startsWith("news_")) {
        console.info("[NewsService] Cannot update mock article on Firestore");
        return;
      }
      const ref = doc(db, "newsArticles", id);
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
      await deleteDoc(doc(db, "newsArticles", id));
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
      const ref = doc(db, "newsArticles", id);
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
      const ref = doc(db, "newsArticles", id);
      await updateDoc(ref, {
        views: increment(1),
      });
    } catch (err) {
      console.error("[NewsService] incrementViews error:", err);
    }
  }
}
