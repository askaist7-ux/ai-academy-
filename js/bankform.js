// 정산 계좌 입력 + 휴대폰(SMS) 인증: 가입 폼과 대시보드에서 공용으로 사용
import { esc, toast, authError } from "./ui.js";
import { isDemo } from "./store.js";

export const BANKS = ["국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행", "SC제일은행", "씨티은행", "카카오뱅크", "케이뱅크", "토스뱅크", "우체국", "새마을금고", "신협", "수협", "신한투자증권", "기타(직접 입력)"];
export const maskAcct = a => { const s = String(a || ""); return s.length > 4 ? "•".repeat(Math.min(s.length - 4, 8)) + s.slice(-4) : s; };
const digits = s => String(s || "").replace(/\D/g, "");

export function bankFormHtml(id, phoneLabel = "") {
  return `<div class="bankform" id="${id}">
    <div class="bf__step"><span class="bf__no">1</span><div><b>휴대폰 인증</b><p class="hint" style="margin:2px 0 0">${phoneLabel ? `연락처 <b data-bf-phone>${esc(phoneLabel)}</b> 로` : "위에 입력한 연락처로"} 인증번호(SMS)를 보내드립니다.${isDemo ? " (데모 모드: 인증번호 123456)" : ""}</p></div>
      <button type="button" class="btn btn--sm btn--ghost" data-bf-send>인증번호 받기</button></div>
    <div class="bf__code" hidden><input data-bf-code type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="인증번호 6자리"><button type="button" class="btn btn--sm btn--dark" data-bf-ok>입력</button></div>
    <div id="${id}-rc"></div>
    <p class="hint bf__msg" data-bf-msg role="status"></p>
    <fieldset class="bf__fields" data-bf-fields disabled>
      <div class="bf__step"><span class="bf__no">2</span><div><b>정산 계좌</b><p class="hint" style="margin:2px 0 0">수익 정산을 입금받을 계좌입니다. 인증번호를 입력하면 활성화됩니다.</p></div></div>
      <div class="field"><label>은행</label><select data-bf-bank><option value="">은행 선택</option>${BANKS.map(b => `<option>${b}</option>`).join("")}</select></div>
      <div class="field" data-bf-bank2 hidden><label>은행명 직접 입력</label><input data-bf-bank2in type="text" maxlength="20"></div>
      <div class="field"><label>계좌번호 (숫자만)</label><input data-bf-acct type="text" inputmode="numeric" maxlength="24" autocomplete="off" placeholder="- 없이 숫자만"></div>
      <div class="field" style="margin:0"><label>예금주</label><input data-bf-holder type="text" maxlength="30" autocomplete="off"></div>
    </fieldset></div>`;
}

export function wireBankForm(store, id, { getPhone, getHolder }) {
  const root = document.getElementById(id), $q = s => root.querySelector(s);
  const send = $q("[data-bf-send]"), msg = $q("[data-bf-msg]"), fields = $q("[data-bf-fields]"), codeIn = $q("[data-bf-code]");
  let code = "", timer = 0;
  const say = (t, bad) => { msg.textContent = t; msg.style.color = bad ? "var(--bad)" : ""; };
  const reset = () => { code = ""; fields.disabled = true; };
  $q("[data-bf-bank]").onchange = e => { $q("[data-bf-bank2]").hidden = !e.target.value.startsWith("기타"); };
  send.onclick = async () => {
    const ph = digits(getPhone());
    if (!/^01\d{8,9}$/.test(ph)) { say("연락처(휴대폰 번호)를 먼저 올바르게 입력해 주세요.", true); return; }
    reset(); send.disabled = true; say("인증번호를 보내는 중…");
    try {
      await store.phoneStart(ph, id + "-rc");
      $q(".bf__code").hidden = false; codeIn.value = ""; codeIn.focus(); say("인증번호를 보냈습니다. 문자 메시지를 확인해 주세요.");
      let n = 60; clearInterval(timer); send.textContent = `재전송 (${n})`;
      timer = setInterval(() => { n--; if (n <= 0) { clearInterval(timer); send.disabled = false; send.textContent = "인증번호 재전송"; } else send.textContent = `재전송 (${n})`; }, 1000);
    } catch (ex) { console.error(ex); send.disabled = false; say(authError(ex), true); }
  };
  $q("[data-bf-ok]").onclick = () => {
    const c = codeIn.value.trim();
    if (!/^\d{6}$/.test(c)) { say("인증번호 6자리를 입력해 주세요.", true); return; }
    code = c; fields.disabled = false;
    const h = $q("[data-bf-holder]"); if (!h.value && getHolder) h.value = getHolder() || "";
    say("인증번호가 입력되었습니다. 계좌 정보를 입력하고 저장하면 최종 확인됩니다.");
  };
  return {
    reset,
    // 입력이 전혀 없으면 null, 있으면 { code, bankName, bankAccount, bankHolder } (오류는 throw)
    read() {
      const sel = $q("[data-bf-bank]").value, acct = digits($q("[data-bf-acct]").value), holder = $q("[data-bf-holder]").value.trim();
      const bankName = sel.startsWith("기타") ? $q("[data-bf-bank2in]").value.trim() : sel;
      if (!sel && !acct) return null;
      if (!code) throw new Error("계좌를 등록하려면 먼저 휴대폰 인증번호를 받아 입력해 주세요.");
      if (!bankName) throw new Error("은행을 선택해 주세요.");
      if (!/^\d{8,20}$/.test(acct)) throw new Error("계좌번호는 숫자 8~20자리로 입력해 주세요.");
      if (!holder) throw new Error("예금주를 입력해 주세요.");
      return { code, bankName, bankAccount: acct, bankHolder: holder };
    }
  };
}
