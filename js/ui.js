import { getStore, isDemo } from "./store.js";
import { CONFIG } from "./config.js";
import { nextDateText, priceText, commissionText } from "./courses.js";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fmtTs = ms => { if (!ms) return "-"; const d = new Date(ms); const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };

export function toast(msg, type = "ok") {
  let box = $("#toasts"); if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); }
  const t = document.createElement("div"); t.className = "toast " + type; t.textContent = msg; box.appendChild(t);
  setTimeout(() => t.classList.add("out"), 2600); setTimeout(() => t.remove(), 3100);
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
  toast("복사되었습니다");
}
export function authError(e) {
  const c = e?.code || e?.message || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return "아이디(이메일) 또는 비밀번호가 올바르지 않습니다.";
  if (/email-already-in-use/.test(c)) return "이미 가입된 이메일입니다.";
  if (/weak-password/.test(c)) return "비밀번호는 6자 이상이어야 합니다.";
  if (/invalid-email/.test(c)) return "이메일 형식이 올바르지 않습니다.";
  if (/invalid-verification-code/.test(c)) return "인증번호가 올바르지 않습니다.";
  if (/code-expired|session-expired/.test(c)) return "인증번호가 만료되었습니다. 다시 받아 주세요.";
  if (/credential-already-in-use|account-exists/.test(c)) return "이미 다른 계정에 인증된 휴대폰 번호입니다.";
  if (/invalid-phone-number/.test(c)) return "휴대폰 번호 형식이 올바르지 않습니다.";
  if (/operation-not-allowed|billing-not-enabled|captcha-check-failed|app-not-authorized/.test(c)) return "휴대폰 인증을 사용할 수 없습니다. (관리자: Firebase 휴대폰 로그인 설정 확인)";
  if (/too-many-requests/.test(c)) return "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (/network/.test(c)) return "네트워크 오류입니다. 연결을 확인해 주세요.";
  if (/permission-denied|insufficient/.test(c)) return "권한이 없습니다. (Firestore 보안 규칙을 확인하세요)";
  return e?.message || "오류가 발생했습니다.";
}

/* 신청폼 링크: 영업자 고유ID(ref) + 이름(n) + 메모(t) */
export function buildLink(courseId, user, campaign = "") {
  const u = new URL("apply.html", location.origin + location.pathname.replace(/[^/]*$/, ""));
  u.searchParams.set("c", courseId);
  if (user?.profile?.refId) { u.searchParams.set("ref", user.profile.refId); }
  if (campaign) u.searchParams.set("t", campaign);
  return u.toString();
}
export function shareText(course, link) {
  const dt = nextDateText(course), pr = priceText(course);
  return `[AI 아카데미 · 장안선 교수]\n${course.title}\n• 일정: ${dt}\n• 수강료/비용: ${pr}\n• 진행: ${course.format}\n\n신청서 👉 ${link}`;
}

/* 공통 헤더/푸터 + 인증 상태 */
export async function initPage({ requireAuth = false, requireAdmin = false } = {}) {
  const store = await getStore();
  document.body.insertAdjacentHTML("afterbegin", `<div id="site-header"></div>`);
  document.body.insertAdjacentHTML("beforeend", `<div id="site-footer"></div>`);
  if (isDemo) document.body.insertAdjacentHTML("afterbegin", `<div class="demo-bar">데모 모드 · Firebase 설정 전이라 데이터는 이 브라우저에만 저장됩니다. (관리자 데모 로그인: ${CONFIG.adminId} / demo-admin)</div>`);

  const user = await new Promise(res => { let first = true; store.onAuth(u => { if (first) { first = false; res(u); } }); });
  const here = location.pathname.split("/").pop() || "index.html";
  if (requireAuth && !user) location.replace(`login.html?next=${encodeURIComponent(here + location.search)}`);
  if (requireAdmin && !user?.isAdmin) location.replace(`login.html?next=admin.html`);
  if (requireAuth && user?.isAdmin && here === "dashboard.html") location.replace("admin.html");

  const nav = [["index.html#courses", "강의 소개"], ["index.html#revenue", "수익 구조"], ["index.html#process", "진행 방식"]];
  $("#site-header").innerHTML = `
  <header class="hd"><div class="container hd__in">
    <a href="index.html" class="hd__logo" aria-label="AI Academy"><img src="assets/logo-dark.png" alt="AI Academy"></a>
    <nav class="hd__nav" id="nav">${nav.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav>
    <div class="hd__auth">
      ${user ? `<span class="hd__who">${esc(user.name || user.email)}${user.isAdmin ? " · 관리자" : ""}</span>
        <a class="btn btn--sm btn--ghost" href="${user.isAdmin ? "admin.html" : "dashboard.html"}">${user.isAdmin ? "관리자 페이지" : "내 대시보드"}</a>
        <button class="btn btn--sm btn--dark" id="btn-logout">로그아웃</button>`
      : `<a class="btn btn--sm btn--ghost" href="login.html">로그인</a><a class="btn btn--sm btn--grad" href="login.html?mode=signup">영업 파트너 가입</a>`}
    </div>
    <button class="hd__burger" id="burger" aria-label="메뉴"><span></span><span></span></button>
  </div></header>`;
  $("#site-footer").innerHTML = `
  <footer class="ft"><div class="container ft__in">
    <div><img src="assets/logo-light.png" alt="AI Academy" class="ft__logo"><p class="ft__tag">MAKE GREATNESS WITH AI</p></div>
    <div class="ft__c"><b>교육문의 · AI 아카데미</b><span>${CONFIG.contact.phone}</span><span>${CONFIG.contact.email}</span><span>ID : ${CONFIG.contact.kakao}</span></div>
    <div class="ft__c"><b>영업 파트너 플랫폼</b><span>고유 ID 신청 링크 · 실적 확인 · 수익 정산</span><span>© AI ACADEMY. All rights reserved.</span></div>
  </div></footer>`;
  $("#btn-logout")?.addEventListener("click", async () => { await store.signOut(); location.href = "index.html"; });
  $("#burger")?.addEventListener("click", () => document.body.classList.toggle("nav-open"));
  document.addEventListener("click", e => { if (e.target.closest("#nav a")) document.body.classList.remove("nav-open"); });

  // 스크롤 등장 효과
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  window.__reveal = () => $$(".reveal:not(.in)").forEach(el => io.observe(el));
  window.__reveal();
  return { store, user };
}

export function csvDownload(filename, rows) {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob(["﻿" + rows.map(r => r.map(q).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export const COURSE_ORDER = c => Object.values(c).sort((a, b) => a.order - b.order);
export const STATUS = { applied: "신청접수", confirmed: "결제확정", cancelled: "취소" };
export { commissionText };
