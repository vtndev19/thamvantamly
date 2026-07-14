// Nhập các hàm cần thiết từ các SDK cần thiết
import { initializeApp } from "firebase/app" ;   
import { getAnalytics } from "firebase/analytics" ;   
// Việc cần làm: Thêm SDK cho các sản phẩm Firebase mà bạn muốn sử dụng
// https://firebase.google.com/docs/web/setup#available-libraries

// Cấu hình Firebase của ứng dụng web của bạn
// Đối với Firebase JS SDK phiên bản 7.20.0 trở lên, measurementId là tùy chọn.
const firebaseConfig = { 
  apiKey : "AIzaSyC-ZjZO1Bt5aX5_mwgLxadCvoVOg3LyiE4" , 
  authDomain : "thamvantamly-e51c8.firebaseapp.com" , 
  projectId : "thamvantamly-e51c8" , 
  storageBucket : "thamvantamly-e51c8.firebasestorage.app" , 
  messagingSenderId : "109182238360" , 
  appId : "1:109182238360:web:e06a0b11c0eab164d89aed" , 
  measurementId : "G-V4MENHLKPH" 
};

// Khởi tạo Firebase
const app = initializeApp ( firebaseConfig );
const analytics = getAnalytics ( app );