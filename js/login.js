import { initPage, $, $$, authError, toast } from "./ui.js";
import { bankFormHtml, wireBankForm } from "./bankform.js";

const { store, user } = await initPage();
const q = new URLSearchParams(location.search);
const safeNext = n => (/^[a-z0-9_-]+\.html([?#].*)?$/i.test(n || "") ? n : null);
const go = u => { location.href = safeNext(q.get("next")) || (u?.isAdmin ? "admin.html" : "dashboard.html"); };
if (user) go(user);

function mode(m) {
  $$(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.m === m));
  $("#f-login").hidden = m !== "login"; $("#f-signup").hidden = m !== "signup";
}
$$(".tabs button").forEach(b => b.addEventListener("click", () => mode(b.dataset.m)));
mode(q.get("mode") === "signup" ? "signup" : "login");
if (q.get("admin") === "1") { // 관리자 로그인: 아이디만 미리 채우고(비밀번호는 입력), 가입 탭은 숨김
  const { CONFIG } = await import("./config.js");
  $("#l-id").value = CONFIG.adminId; $("#l-pw").focus();
  $$(".tabs button").forEach(b => { if (b.dataset.m === "signup") b.hidden = true; });
}

$("#f-login").addEventListener("submit", async e => {
  e.preventDefault(); const err = $("#l-err"); err.textContent = "";
  const id = $("#l-id").value.trim(), pw = $("#l-pw").value;
  if (!id || !pw) { err.textContent = "아이디와 비밀번호를 입력해 주세요."; return; }
  const btn = $("#l-btn"); btn.disabled = true; btn.textContent = "로그인 중…";
  try {
    await store.signIn(id, pw);
    const isAdmin = id.toLowerCase() === (await import("./config.js")).CONFIG.adminId || id.toLowerCase().startsWith("kaistweb@");
    location.href = safeNext(q.get("next")) || (isAdmin ? "admin.html" : "dashboard.html");
  } catch (ex) { err.textContent = authError(ex); btn.disabled = false; btn.textContent = "로그인"; }
});

$("#s-bank").innerHTML = bankFormHtml("sbank");
const bf = wireBankForm(store, "sbank", { getPhone: () => $("#s-phone").value, getHolder: () => $("#s-name").value.trim() });
$("#s-phone").addEventListener("input", () => bf.reset());

$("#f-signup").addEventListener("submit", async e => {
  e.preventDefault(); const err = $("#s-err"); err.textContent = "";
  const v = id => $(id).value.trim();
  const name = v("#s-name"), phone = v("#s-phone"), email = v("#s-email"), pw = $("#s-pw").value;
  if (!name || !phone || !email || !pw) { err.textContent = "모든 항목을 입력해 주세요."; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = "이메일 형식이 올바르지 않습니다."; return; }
  if (pw.length < 6) { err.textContent = "비밀번호는 6자 이상이어야 합니다."; return; }
  if (pw !== $("#s-pw2").value) { err.textContent = "비밀번호 확인이 일치하지 않습니다."; return; }
  if (!$("#s-agree").checked) { err.textContent = "개인정보 수집·이용에 동의해 주세요."; return; }
  let bank = null; try { bank = bf.read(); } catch (ex) { err.textContent = ex.message; return; }
  const btn = $("#s-btn"); btn.disabled = true; btn.textContent = "가입 중…";
  try {
    await store.signUp({ name, phone, email, password: pw });
    let wait = 600;
    if (bank) { try { btn.textContent = "계좌 인증 중…"; await store.saveBank(bank.code, bank); toast("가입 완료! 정산 계좌도 등록되었습니다."); } catch (ex) { console.error(ex); toast(`가입은 완료됐어요. 계좌 등록은 실패했습니다 (${authError(ex)}) — 대시보드에서 다시 등록해 주세요.`, "err"); wait = 3500; } }
    else toast("가입 완료! 고유 ID가 발급되었습니다.");
    setTimeout(() => (location.href = safeNext(q.get("next")) || "dashboard.html"), wait);
  }
  catch (ex) { err.textContent = authError(ex); btn.disabled = false; btn.textContent = "가입하고 내 ID 받기"; }
});

$("#l-reset").addEventListener("click", async () => {
  const em = $("#l-id").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { $("#l-err").textContent = "비밀번호 재설정은 이메일 입력 후 눌러 주세요."; return; }
  try { await store.resetPassword(em); toast("재설정 메일을 보냈습니다. 메일함을 확인해 주세요."); } catch (ex) { $("#l-err").textContent = authError(ex); }
});
