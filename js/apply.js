// 신청서 페이지: ?c=<강의ID>&ref=<영업자ID>&t=<메모>  (이름은 주소에 싣지 않음)
import { getStore, isDemo } from "./store.js";
import { CONFIG } from "./config.js";
import { FORMS, PRIVACY_TEXT, DEFAULT_COURSES, fmtDate, won, priceText } from "./courses.js";
import { esc, toast, copyText } from "./ui.js";

// 로딩 중 오류가 나면 무한 로딩 대신 원인을 화면에 표시
const showLoadError = e => {
  const r = document.getElementById("root");
  if (r && /불러오는 중/.test(r.textContent)) r.innerHTML = `<div class="fcard" style="text-align:center;padding:36px 20px"><h2 style="margin:0 0 8px">신청서를 불러오지 못했습니다</h2><p style="color:var(--muted);margin:0 0 16px">잠시 후 다시 시도해 주세요. 계속되면 ${CONFIG.contact.phone} 로 문의해 주세요.</p><button class="btn btn--grad" onclick="location.reload()">새로고침</button><p style="font-size:12px;color:#9aa1b5;margin:14px 0 0">${esc(String(e?.message || e || ""))}</p></div>`;
};
window.addEventListener("error", ev => showLoadError(ev.error || ev.message));
window.addEventListener("unhandledrejection", ev => showLoadError(ev.reason));

// 입금 계좌 안내(모든 폼 공통)
const BANK = CONFIG.bankInfo || { name: "신한투자증권", account: "1001-10-16481", holder: "장안선" };
const bankBox = note => `<div class="bank"><div class="bank__h">입금 계좌</div>
  <div class="bank__line">${esc(BANK.name)} <span class="bank__no">${esc(BANK.account)}</span> ${esc(BANK.holder)}</div>
  ${note ? `<p class="bank__n">${esc(note)}</p>` : ""}
  <button type="button" class="btn btn--ghost btn--sm" data-copy-bank>계좌 복사</button></div>`;
document.addEventListener("click", e => { if (e.target.closest("[data-copy-bank]")) copyText(`${BANK.name} ${BANK.account} ${BANK.holder}`); });

const CLIENTS = ["삼성멀티캠퍼스", "삼성생명", "삼성물산", "한화손해보험", "카이스트", "LG그룹", "한국산업인력공단", "정보통신연구진흥원", "한국기계연구원", "한국항공우주연구원", "서울대학교", "포항공대", "한국섬유개발연구원", "문화재청", "한국한의학연구원"];
const q = new URLSearchParams(location.search);
// 예전 링크에 포함된 이름(n) 파라미터는 주소창에서 제거
if (q.has("n")) { q.delete("n"); try { history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); } catch {} }
const courseId = DEFAULT_COURSES[q.get("c")] ? q.get("c") : "regular8";
const preview = q.get("preview") === "1";
const root = document.getElementById("root");
const withTimeout = (p, ms, fb) => Promise.race([p, new Promise(r => setTimeout(() => r(fb), ms))]);
const store = await getStore();
const course = ((await withTimeout(store.getCourses().catch(() => null), 8000, null)) || DEFAULT_COURSES)[courseId] || DEFAULT_COURSES[courseId];
const fields = FORMS[courseId];
const refInfo = q.get("ref") ? await withTimeout(store.getRef(q.get("ref").toUpperCase()).catch(() => null), 6000, null) : null;
const refValid = !!(refInfo && refInfo.active !== false && refInfo.uid);
const campaign = (q.get("t") || "").slice(0, 60);

const BANNER = {
  corporate: { k: "AI 업무자동화 연구소", h: "장안선 교수의<br>AI 업무자동화 연구소", ul: ["기업·관공서 업무자동화", "대학교수 AI 활용 · 강의자동화", "카이스트 강의 22년차 AI 전문가", "기업·공공기관 출강 | 교수연수 | 맞춤형 컨설팅"] },
  regular8: { k: "8-WEEK PROGRAM", h: "장안선 직장 AI 클래스<br>8가지 수익화 8주 수업", ul: ["가장 쉬운 AI 실무교육, 처음부터 친절하게 배우는 수익화", "블로그·유튜브·상세페이지·이모티콘·음원·사이트", "수료 후 인공지능 AI 자격증 신청 기회"] },
  emoticon: { k: "EMOTICON CREATOR PROGRAM", h: "Skill로 완성하는<br>이모티콘 출시반", ul: ["정지형 · 움직이는 이모티콘", "굿즈·스티커 · 로그인 작가 사이트", "캐릭터 하나로 시작해 나만의 포트폴리오로"] }
}[courseId];

document.title = `${course.title} 신청서 | AI 아카데미`;

/* ── 렌더 ── */
const dateOpts = () => (course.openDates || []).filter(d => d.date >= new Date().toISOString().slice(0, 10) || preview).map(fmtDate);
function fieldHtml(f) {
  const req = f.required ? '<span class="req">*</span>' : "";
  const label = `<div class="qlabel">${esc(f.label)}${req}</div>`;
  const id = "f_" + f.name;
  switch (f.type) {
    case "text": case "tel": case "email": case "date":
      return `<div class="field fcard">${label}<input id="${id}" name="${f.name}" type="${f.type}" ${f.required ? "required" : ""} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""} autocomplete="off"></div>`;
    case "textarea":
      return `<div class="field fcard">${label}<textarea id="${id}" name="${f.name}" ${f.required ? "required" : ""}></textarea></div>`;
    case "radio": case "dates": {
      let opts = f.type === "dates" ? dateOpts() : f.options;
      const other = f.type === "dates" || f.other;
      return `<div class="field fcard" data-group="${f.name}">${label}<div class="opts">${opts.map(o => `<label class="opt"><input type="radio" name="${f.name}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join("")}
        ${other ? `<label class="opt"><input type="radio" name="${f.name}" value="__other"><span>기타:</span><input class="other" type="text" data-other="${f.name}" aria-label="기타 입력"></label>` : ""}</div></div>`;
    }
    case "checks":
      return `<div class="field fcard" data-group="${f.name}">${label}<div class="opts checks">${f.options.map(o => `<label class="opt"><input type="checkbox" name="${f.name}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join("")}
        ${f.other ? `<label class="opt"><input type="checkbox" name="${f.name}" value="__other"><span>기타:</span><input class="other" type="text" data-other="${f.name}" aria-label="기타 입력"></label>` : ""}</div></div>`;
    case "consent":
      return `<div class="field fcard" data-group="${f.name}">${label}<div class="opts"><label class="opt"><input type="checkbox" name="${f.name}" value="동의"><span>동의</span></label></div></div>`;
  }
}

const dates = (course.openDates || []).length ? course.openDates.map(fmtDate).join(" / ") : (course.dateNote || "일정 협의");
const priceLine = course.price > 0
  ? `${course.listPrice > course.price ? `<s style="color:#9aa1b5">${won(course.listPrice)}</s> → ` : ""}<b>${won(course.price)}</b>${course.listPrice > course.price ? ` (${Math.round((1 - course.price / course.listPrice) * 100)}% 할인)` : ""}`
  : esc(priceText(course));

root.innerHTML = `
  <div class="fbanner">
    <div class="fbanner__t">
      <img class="fbanner__logo" src="assets/logo-light.png" alt="AI Academy">
      <div class="fbanner__k">${esc(BANNER.k)}</div>
      <h1>${BANNER.h}</h1>
      <ul>${BANNER.ul.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>
    <div class="fbanner__circle"></div>
    <img class="fbanner__img" src="assets/prof.webp" alt="장안선 교수">
  </div>
  <div class="clients" aria-label="함께한 기관"><small>TRUSTED BY · 함께한 기관</small><div class="clients__w"><div class="clients__t">${[...CLIENTS, ...CLIENTS].map(n => `<span>${esc(n)}</span>`).join("")}</div></div></div>
  <div class="fcard fcard--top">
    <h2>${esc(course.title)}</h2>
    <p style="margin:0;color:var(--muted)">${courseId === "corporate" ? "상세 정보를 입력해 주시면 장안선 교수가 직접 검토 후 연락드립니다." : "아래 폼을 작성해 주시면 수업 참여가 가능합니다."}</p>
    <dl class="info">
      <div><dt>${courseId === "corporate" ? "진행" : "개강 일정"}</dt><dd>${esc(dates)}</dd></div>
      <div><dt>진행 방식</dt><dd>${esc(course.format)} · ${esc(course.duration)}</dd></div>
      <div><dt>${course.price > 0 ? "수강료" : "강사료"}</dt><dd>${priceLine}</dd></div>
    </dl>
    <div class="dl">${(course.docs || []).map(d => `<a class="btn btn--ghost btn--sm" href="${esc(d.url)}" download>⬇ ${esc(d.label)}</a>`).join("")}</div>
    ${preview ? `<div class="notice" style="margin-top:16px">미리보기 모드입니다. 제출되지 않습니다.</div>` : ""}
    <div class="notice" style="margin-top:16px;max-height:150px;overflow:auto">${esc(PRIVACY_TEXT)}</div>
    ${course.refund ? `<div class="notice" style="margin-top:10px"><b>수강료 환불규정</b>\n${esc(course.refund)}</div>` : ""}
    ${bankBox(course.price > 0 ? "입금 확인 시 등록이 확정됩니다." : "계약·견적 확정 후 안내에 따라 입금해 주세요.")}
    <p style="font-size:13px;color:var(--bad);margin:16px 0 0">* 표시는 필수 질문입니다.</p>
  </div>
  <form id="apply-form" novalidate>
    <div style="display:grid;gap:14px">${fields.map(fieldHtml).join("")}
      <p class="err" id="form-err" role="alert"></p>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="btn btn--grad btn--lg" id="submit" type="submit" ${preview ? "disabled" : ""}>제출</button>
        <span style="font-size:13px;color:var(--muted)">문의 ${CONFIG.contact.phone} · 카톡 ${CONFIG.contact.kakao}</span>
      </div>
    </div>
  </form>
  <div style="text-align:center;padding:12px 0 0;color:#7a82a6;font-size:13px">© AI ACADEMY · 장안선 교수 · ${CONFIG.contact.email}</div>`;

/* ── 제출 ── */
const form = document.getElementById("apply-form");
// 기타 입력칸 클릭 시 자동 선택
form.addEventListener("focusin", e => {
  const o = e.target.closest?.(".other"); if (!o) return;
  const input = o.closest(".opt").querySelector("input[type=radio],input[type=checkbox]"); if (input) input.checked = true;
});
function readValue(f) {
  const els = [...form.querySelectorAll(`[name="${f.name}"]`)];
  if (["text", "tel", "email", "date", "textarea"].includes(f.type)) return (els[0]?.value || "").trim();
  const other = form.querySelector(`[data-other="${f.name}"]`)?.value.trim();
  const pick = v => (v === "__other" ? (other ? `기타: ${other}` : "") : v);
  if (f.type === "radio" || f.type === "dates") return pick(els.find(x => x.checked)?.value || "");
  if (f.type === "consent") return els[0].checked ? "동의" : "";
  if (f.type === "checks") return els.filter(x => x.checked).map(x => pick(x.value)).filter(Boolean);
}
form.addEventListener("submit", async e => {
  e.preventDefault(); if (preview) return;
  const err = document.getElementById("form-err"); err.textContent = "";
  const answers = {}; let firstBad = null;
  for (const f of fields) {
    const v = readValue(f); answers[f.name] = v;
    const empty = Array.isArray(v) ? !v.length : !v;
    if (f.required && empty && !firstBad) firstBad = f;
  }
  if (firstBad) {
    err.textContent = `필수 항목을 확인해 주세요: ${firstBad.label}`;
    form.querySelector(`[name="${firstBad.name}"]`)?.closest(".fcard")?.scrollIntoView({ behavior: "smooth", block: "center" }); return;
  }
  const phone = answers.phone || "";
  if (!/^[0-9+\-\s()]{8,20}$/.test(phone)) { err.textContent = "연락처 형식을 확인해 주세요."; return; }
  if (answers.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(answers.email)) { err.textContent = "이메일 형식을 확인해 주세요."; return; }
  const btn = document.getElementById("submit"); btn.disabled = true; btn.textContent = "제출 중…";
  const clip = v => (Array.isArray(v) ? v.map(x => String(x).slice(0, 200)) : String(v).slice(0, 3000));
  const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, clip(v)]));
  try {
    await store.submitApplication({
      courseId, refId: refValid ? q.get("ref").toUpperCase() : "", refUid: refValid ? refInfo.uid : "", refName: refValid ? refInfo.name : "",
      campaign, applicantName: (answers.name || answers.manager || "").slice(0, 60), phone: phone.slice(0, 30), email: (answers.email || "").slice(0, 100),
      org: (answers.org || "").slice(0, 100), answers: clean
    });
    root.innerHTML = `
      <div class="fbanner" style="min-height:240px"><div class="fbanner__t"><img class="fbanner__logo" src="assets/logo-light.png" alt="AI Academy"><h1 style="margin:0">신청이 접수되었습니다</h1></div><div class="fbanner__circle"></div><img class="fbanner__img" src="assets/prof.webp" alt=""></div>
      <div class="fcard success"><div class="check">✓</div><h2>${esc(answers.name || answers.manager)}님, 감사합니다!</h2>
        <p style="color:var(--muted)">${courseId === "corporate" ? "내용을 검토한 후 장안선 교수가 직접 연락드리겠습니다." : "순차적으로 안내 메시지를 드립니다."}</p>
        <div style="text-align:left;margin-top:20px">${bankBox(course.price > 0 ? `수강료 ${won(course.price)} · 입금 확인 시 등록이 확정됩니다.` : "계약·견적 확정 후 안내에 따라 입금해 주세요.")}</div>
        <p style="margin-top:20px;font-size:14px">문의 ${CONFIG.contact.phone} · ${CONFIG.contact.email} · 카톡 ${CONFIG.contact.kakao}</p></div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (ex) {
    console.error(ex); btn.disabled = false; btn.textContent = "제출";
    err.textContent = /permission/.test(ex?.code || "") ? "제출에 실패했습니다. 잠시 후 다시 시도하거나 담당자에게 문의해 주세요." : (ex?.message || "제출 중 오류가 발생했습니다.");
    toast("제출 실패", "err");
  }
});
