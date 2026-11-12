// ─────────────────────────────────────────────────────────────
// AI 아카데미 영업 파트너 플랫폼 설정
// Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹) 의 firebaseConfig 값을 아래에 붙여넣으세요.
// apiKey 가 비어 있으면 "데모 모드"(브라우저 저장소)로 동작합니다.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  firebase: {
    apiKey: "AIzaSyDzoh22xaQ-LzDhkMqAAy-4CBczPq5IBhg",
    authDomain: "ai-academy-sales.firebaseapp.com",
    projectId: "ai-academy-sales",
    storageBucket: "ai-academy-sales.firebasestorage.app",
    messagingSenderId: "798523382277",
    appId: "1:798523382277:web:108fca8ad167901a209a6c"
  },
  // 관리자는 아이디로 로그인합니다. Firebase Auth 는 이메일이 필요하므로
  // "아이디@adminDomain" 형태로 내부 변환됩니다. (firestore.rules 의 값과 반드시 동일해야 함)
  adminId: "kaistweb",
  adminDomain: "aiacademy.app",
  contact: {
    phone: "010-2627-3771",
    email: "e_iiias@naver.com",
    kakao: "anseon7"
  },
  bank: "신한투자증권 1001-10-16481 장안선"
};
