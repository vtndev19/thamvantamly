import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../config/firebase";

const TEST_HISTORY_COLLECTION = "test_history";

export interface TestHistoryInput {
  studentId: string;
  testId: string;
  testTitle: string;
  score: number;
  maxScore: number;
  resultText: string;
  status: "normal" | "warning" | "danger";
}

export interface TestHistoryItem extends TestHistoryInput {
  id: string;
  createdAt: number;
}

/**
 * Lưu lịch sử làm bài test vào Firestore
 */
export async function saveTestHistory(input: TestHistoryInput): Promise<string> {
  try {
    const historyRef = collection(db, TEST_HISTORY_COLLECTION);
    const newRecord = {
      ...input,
      createdAt: Date.now(),
    };
    const docRef = await addDoc(historyRef, newRecord);
    return docRef.id;
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử làm bài kiểm tra:", error);
    throw error;
  }
}

/**
 * Lấy danh sách lịch sử làm bài test của một học sinh cụ thể
 */
export async function getTestHistoryByStudentId(studentId: string): Promise<TestHistoryItem[]> {
  if (!studentId) return [];
  try {
    const historyRef = collection(db, TEST_HISTORY_COLLECTION);
    const q = query(historyRef, where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TestHistoryItem, "id">),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Lỗi khi tải lịch sử kiểm tra:", error);
    return [];
  }
}

/**
 * Lưu lịch sử làm bài test trực tiếp vào User Profile (dự phòng)
 */
export async function saveTestHistoryToProfile(studentId: string, input: TestHistoryInput): Promise<void> {
  try {
    const userRef = doc(db, "users", studentId);
    await updateDoc(userRef, {
      testHistory: arrayUnion({
        id: `h-${Date.now()}`,
        ...input,
        createdAt: Date.now(),
      })
    });
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử vào Profile:", error);
    throw error;
  }
}

/**
 * Lấy lịch sử làm bài test từ User Profile (dự phòng)
 */
export async function getTestHistoryFromProfile(studentId: string): Promise<TestHistoryItem[]> {
  try {
    const userRef = doc(db, "users", studentId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && data.testHistory) {
        return (data.testHistory as TestHistoryItem[]).sort((a, b) => b.createdAt - a.createdAt);
      }
    }
    return [];
  } catch (error) {
    console.error("Lỗi khi đọc lịch sử từ Profile:", error);
    return [];
  }
}

