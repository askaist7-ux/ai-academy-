// 관리자 계정 생성 스크립트 (1회 실행)
//   ADMIN_PASSWORD='비밀번호' node scripts/setup-admin.mjs
// - js/config.js 의 firebase.apiKey / adminId / adminDomain 을 사용합니다.
// - 비밀번호는 코드에 저장하지 않고 환경변수로만 전달합니다.
// - Firebase 콘솔 > Authentication > 로그인 방법 에서 "이메일/비밀번호"를 먼저 사용 설정해야 합니다.
import { CONFIG } from "../js/config.js";

const pw = process.env.ADMIN_PASSWORD;
if (!CONFIG.firebase.apiKey) throw new Error("js/config.js 에 Firebase 설정이 비어 있습니다.");
if (!pw) throw new Error("ADMIN_PASSWORD 환경변수가 필요합니다.");
const email = `${CONFIG.adminId}@${CONFIG.adminDomain}`;
const call = async (ep, body) => {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${ep}?key=${CONFIG.firebase.apiKey}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: pw, returnSecureToken: true, ...body }) });
  return r.json();
};
let res = await call("signUp");
if (res.error?.message === "EMAIL_EXISTS") {
  res = await call("signInWithPassword");
  console.log(res.idToken ? `이미 존재하는 관리자 계정입니다. (${email}) 비밀번호 확인 완료.` : `계정이 이미 있으나 비밀번호가 다릅니다: ${res.error?.message}`);
} else if (res.idToken) console.log(`관리자 계정 생성 완료: ${email}`);
else { console.error("실패:", res.error?.message); process.exit(1); }
