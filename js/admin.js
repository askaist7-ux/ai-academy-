import { initPage, $, $$, esc, toast, fmtTs, copyText, buildLink, COURSE_ORDER, STATUS, csvDownload, authError } from "./ui.js";
import { won, fmtDate, FORMS, DEFAULT_COURSES } from "./courses.js";
import { isDemo } from "./store.js";

const { store } = await initPage({ requireAdmin: true });
let courses, cmap, users, apps;
let tab = "overview";
const F = { course: "", ref: "", status: "", q: "" };

async function load() {
  courses = COURSE_ORDER(await store.getCourses()); cmap = Object.fromEntries(courses.map(c => [c.id, c]));
  [users, apps] = await Promise.all([store.adminUsers(), store.adminApplications()]);
}
const sum = (a, k) => a.reduce((s, r) => s + (Number(r[k]) || 0), 0);
const bankOf = u => u.bankAccount ? `${esc(u.bankName)} <b>${esc(u.bankAccount)}</b> ${esc(u.bankHolder || "")} <span class="okmark" title="휴대폰 인증 완료">✓</span>` : '<span style="color:var(--muted)">미등록</span>';
const uByRef = () => Object.fromEntries(users.map(u => [u.refId, u]));
const rateOf = a => cmap[a.courseId]?.commissionRate ?? 0.5;
const refLabel = a => (a.refUid ? `${a.refName} <small style="color:var(--muted)">${esc(a.refId)}</small>` : '<span style="color:var(--muted)">직접 신청</span>');

/* ───────── 개요 ───────── */
function vOverview() {
  const conf = apps.filter(a => a.status === "confirmed"), viaRef = apps.filter(a => a.refUid);
  const pend = conf.filter(a => a.refUid && !a.settled);
  const rank = users.map(u => { const m = apps.filter(a => a.refId === u.refId); const c = m.filter(a => a.status === "confirmed"); return { u, n: m.length, c: c.length, com: sum(c, "commission") }; }).sort((a, b) => b.n - a.n || b.com - a.com).slice(0, 10);
  return `
  <div class="kpis kpis--6">
    <div class="kpi"><span>총 신청</span><b>${apps.length}</b><small>영업 경유 ${viaRef.length}건</small></div>
    <div class="kpi"><span>결제 확정</span><b>${conf.length}</b></div>
    <div class="kpi"><span>확정 매출</span><b>${won(sum(conf, "amount"))}</b></div>
    <div class="kpi kpi--grad"><span>배분 수익 합계</span><b>${won(sum(conf.filter(a => a.refUid), "commission"))}</b></div>
    <div class="kpi"><span>정산 대기</span><b>${won(sum(pend, "commission"))}</b></div>
    <div class="kpi"><span>영업 파트너</span><b>${users.length}</b><small>활성 ${users.filter(u => u.active !== false).length}</small></div>
  </div>
  <section class="panel" style="margin-top:24px"><h3>강의별 현황</h3><p class="sub">&nbsp;</p>
    <div class="tblwrap"><table><thead><tr><th>강의</th><th class="num">신청</th><th class="num">확정</th><th class="num">확정 매출</th><th class="num">배분 수익</th></tr></thead><tbody>
    ${courses.map(c => { const m = apps.filter(a => a.courseId === c.id), cf = m.filter(a => a.status === "confirmed"); return `<tr><td><b>${esc(c.short)}</b></td><td class="num">${m.length}</td><td class="num">${cf.length}</td><td class="num">${won(sum(cf, "amount"))}</td><td class="num">${won(sum(cf.filter(a => a.refUid), "commission"))}</td></tr>`; }).join("")}
    </tbody></table></div></section>
  <section class="panel" style="margin-top:24px"><h3>영업 파트너 랭킹 (신청 건수)</h3><p class="sub">고유 ID별 접수 건수 기준 상위 10명</p>
    <div class="tblwrap"><table><thead><tr><th>#</th><th>이름</th><th>고유 ID</th><th class="num">신청</th><th class="num">확정</th><th class="num">확정 수익</th></tr></thead><tbody>
    ${rank.length ? rank.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.u.name)}</b></td><td>${esc(r.u.refId)}</td><td class="num">${r.n}</td><td class="num">${r.c}</td><td class="num">${won(r.com)}</td></tr>`).join("") : `<tr><td colspan="6" class="empty">가입한 영업 파트너가 없습니다.</td></tr>`}
    </tbody></table></div></section>`;
}

/* ───────── 강의·일정 ───────── */
function vCourses() {
  return `<div class="cgrid">${courses.map(c => `
  <section class="panel" data-c="${c.id}">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px"><h3>${esc(c.short)} · ${esc(c.title)}</h3>
      <label class="toggle"><input type="checkbox" data-k="active" ${c.active !== false ? "checked" : ""}> 모집 노출</label></div>
    <p class="sub">개강일을 바꾸면 메인·신청폼·영업자 홍보 문구에 즉시 반영됩니다.</p>
    <div class="cedit">
      <div class="field wide"><label>강의명</label><input type="text" data-k="title" value="${esc(c.title)}"></div>
      <div class="field"><label>수강료(원) · 0이면 협의</label><input type="number" min="0" step="1000" data-k="price" value="${c.price}"></div>
      <div class="field"><label>정가(원) · 할인율 표시용</label><input type="number" min="0" step="1000" data-k="listPrice" value="${c.listPrice}"></div>
      <div class="field"><label>수익 배분율(%)</label><input type="number" min="0" max="100" step="1" data-k="rate" value="${Math.round(c.commissionRate * 100)}"></div>
      <div class="field"><label>진행 방식</label><input type="text" data-k="format" value="${esc(c.format)}"></div>
      <div class="field"><label>교육 시간·기간</label><input type="text" data-k="duration" value="${esc(c.duration)}"></div>
      <div class="field"><label>일정 안내 문구 (개강일 없을 때)</label><input type="text" data-k="dateNote" value="${esc(c.dateNote || "")}"></div>
      <div class="field wide"><label>개강 일정</label><div class="dates" data-dates>${(c.openDates || []).map(dateRow).join("")}</div>
        <div><button class="btn btn--sm btn--ghost" data-add-date type="button">+ 개강일 추가</button></div></div>
      <div class="field wide"><label>환불 규정 (선택)</label><textarea data-k="refund" style="min-height:70px">${esc(c.refund || "")}</textarea></div>
      <div class="field wide"><label>커리큘럼 다운로드 파일 (한 줄에 하나: 표시이름 | 파일주소)</label><textarea data-k="docs" style="min-height:70px">${esc((c.docs || []).map(d => `${d.label} | ${d.url}`).join("\n"))}</textarea>
        <p class="hint">새 PDF를 올리려면 프로젝트의 docs 폴더에 파일을 추가한 뒤 /docs/파일명.pdf 로 적어 주세요.</p></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap"><button class="btn btn--grad" data-save>변경사항 저장</button><button class="btn btn--ghost" data-reset type="button">기본값으로 되돌리기</button></div>
  </section>`).join("")}</div>`;
}
const dateRow = d => `<div class="drow"><input type="date" data-d value="${esc(d?.date || "")}"><input type="text" data-t value="${esc(d?.time || "저녁 8시")}" placeholder="시간 (예: 저녁 8시)"><button class="btn btn--sm btn--danger" data-del type="button">삭제</button></div>`;
function bindCourses() {
  $$("[data-c]").forEach(sec => {
    const id = sec.dataset.c, g = k => sec.querySelector(`[data-k="${k}"]`);
    sec.querySelector("[data-add-date]").onclick = () => sec.querySelector("[data-dates]").insertAdjacentHTML("beforeend", dateRow({}));
    sec.addEventListener("click", e => { if (e.target.matches("[data-del]")) e.target.closest(".drow").remove(); });
    sec.querySelector("[data-save]").onclick = async ev => {
      const btn = ev.target; btn.disabled = true;
      const openDates = $$(".drow", sec).map(r => ({ date: r.querySelector("[data-d]").value, time: r.querySelector("[data-t]").value.trim() })).filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
      const docs = g("docs").value.split("\n").map(l => l.split("|").map(s => s.trim())).filter(a => a[0] && a[1]).map(([label, url]) => ({ label, url }));
      const data = { title: g("title").value.trim() || cmap[id].title, active: g("active").checked, price: Math.max(0, Number(g("price").value) || 0), listPrice: Math.max(0, Number(g("listPrice").value) || 0),
        commissionRate: Math.min(1, Math.max(0, (Number(g("rate").value) || 0) / 100)), format: g("format").value.trim(), duration: g("duration").value.trim(), dateNote: g("dateNote").value.trim(), refund: g("refund").value.trim(), openDates, docs };
      try { await store.saveCourse(id, data); toast("저장되었습니다"); await load(); } catch (e) { toast(authError(e), "err"); }
      btn.disabled = false;
    };
    sec.querySelector("[data-reset]").onclick = async () => {
      if (!confirm("이 강의 설정을 기본값으로 되돌릴까요?")) return;
      const d = DEFAULT_COURSES[id];
      try { await store.saveCourse(id, { title: d.title, active: true, price: d.price, listPrice: d.listPrice, commissionRate: d.commissionRate, format: d.format, duration: d.duration, dateNote: d.dateNote, refund: d.refund, openDates: d.openDates, docs: d.docs }); toast("기본값으로 복원했습니다"); await load(); render(); } catch (e) { toast(authError(e), "err"); }
    };
  });
}

/* ───────── 영업 파트너 ───────── */
function vPartners() {
  return `<section class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><h3>영업 파트너 (${users.length}명)</h3><p class="sub">고유 ID별 신청 건수와 수익을 확인하고 계정을 비활성화하거나 삭제할 수 있습니다.</p></div><button class="btn btn--sm btn--ghost" id="csv-users">CSV</button></div>
  <div class="tblwrap"><table><thead><tr><th>이름</th><th>고유 ID</th><th>이메일</th><th>연락처</th><th>정산 계좌</th><th>가입일</th>${courses.map(c => `<th class="num">${esc(c.short)}</th>`).join("")}<th class="num">총 신청</th><th class="num">확정</th><th class="num">확정 수익</th><th>상태</th><th></th></tr></thead><tbody>
  ${users.length ? users.map(u => { const m = apps.filter(a => a.refId === u.refId), cf = m.filter(a => a.status === "confirmed");
    return `<tr><td><b>${esc(u.name)}</b></td><td>${esc(u.refId)}</td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td>${bankOf(u)}</td><td>${fmtTs(u.createdAt).slice(0, 10)}</td>
      ${courses.map(c => `<td class="num">${m.filter(a => a.courseId === c.id).length}</td>`).join("")}<td class="num"><b>${m.length}</b></td><td class="num">${cf.length}</td><td class="num">${won(sum(cf, "commission"))}</td>
      <td><span class="badge ${u.active === false ? "off" : "confirmed"}">${u.active === false ? "비활성" : "활성"}</span></td>
      <td style="white-space:nowrap"><button class="btn btn--sm btn--ghost" data-view="${u.refId}">신청 보기</button> <button class="btn btn--sm btn--ghost" data-toggle="${u.uid}">${u.active === false ? "활성화" : "비활성화"}</button> <button class="btn btn--sm btn--danger" data-del-user="${u.uid}">삭제</button></td></tr>`; }).join("")
    : `<tr><td colspan="${10 + courses.length}" class="empty">아직 가입한 영업 파트너가 없습니다.</td></tr>`}
  </tbody></table></div></section>`;
}
function bindPartners() {
  $$("[data-toggle]").forEach(b => b.onclick = async () => {
    const u = users.find(x => x.uid === b.dataset.toggle);
    try { await store.adminSetUserActive(u, u.active === false); toast("변경되었습니다"); await load(); render(); } catch (e) { toast(authError(e), "err"); }
  });
  $$("[data-del-user]").forEach(b => b.onclick = async () => {
    const u = users.find(x => x.uid === b.dataset.delUser); if (!u) return;
    const n = apps.filter(a => a.refId === u.refId).length;
    if (!confirm(`영업 파트너 "${u.name}" (${u.refId})을(를) 삭제할까요?\n\n- 파트너 정보와 고유 ID가 삭제되고, 이 ID로 된 신청 링크는 '직접 신청'으로 처리됩니다.\n- 이미 접수된 신청서 ${n}건은 관리자 기록으로 남습니다.\n- 삭제 후에는 되돌릴 수 없습니다.`)) return;
    try { await store.adminDeletePartner(u); toast("영업 파트너를 삭제했습니다"); await load(); render(); } catch (e) { toast(authError(e), "err"); }
  });
  $$("[data-view]").forEach(b => b.onclick = () => { F.ref = b.dataset.view; setTab("apps"); });
  $("#csv-users")?.addEventListener("click", () => csvDownload("partners.csv", [["이름", "고유ID", "이메일", "연락처", "정산 계좌", "가입일", ...courses.map(c => c.short + " 신청"), "총 신청", "확정", "확정 수익", "상태"],
    ...users.map(u => { const m = apps.filter(a => a.refId === u.refId), cf = m.filter(a => a.status === "confirmed"); return [u.name, u.refId, u.email, u.phone, u.bankAccount ? `${u.bankName} ${u.bankAccount} ${u.bankHolder || ""}` : "", fmtTs(u.createdAt), ...courses.map(c => m.filter(a => a.courseId === c.id).length), m.length, cf.length, sum(cf, "commission"), u.active === false ? "비활성" : "활성"]; })]));
}

/* ───────── 신청서 ───────── */
const filtered = () => apps.filter(a => (!F.course || a.courseId === F.course) && (!F.status || a.status === F.status) && (!F.ref || (F.ref === "direct" ? !a.refUid : a.refId === F.ref))
  && (!F.q || [a.applicantName, a.phone, a.org, a.email, a.campaign].join(" ").toLowerCase().includes(F.q.toLowerCase())));
function vApps() {
  const list = filtered();
  return `<section class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><h3>신청서 (${list.length}/${apps.length}건)</h3><p class="sub">행을 클릭하면 전체 내용을 보고 결제 확정·수익 금액 처리, 삭제를 할 수 있습니다.</p></div><button class="btn btn--sm btn--ghost" id="csv-apps">CSV</button></div>
  <div class="filters">
    <select id="fa-course"><option value="">전체 강의</option>${courses.map(c => `<option value="${c.id}" ${F.course === c.id ? "selected" : ""}>${esc(c.short)}</option>`).join("")}</select>
    <select id="fa-ref"><option value="">전체 영업자</option><option value="direct" ${F.ref === "direct" ? "selected" : ""}>직접 신청</option>${users.map(u => `<option value="${u.refId}" ${F.ref === u.refId ? "selected" : ""}>${esc(u.name)} (${esc(u.refId)})</option>`).join("")}</select>
    <select id="fa-status"><option value="">전체 상태</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${F.status === k ? "selected" : ""}>${v}</option>`).join("")}</select>
    <input type="text" id="fa-q" placeholder="이름·연락처·기관 검색" value="${esc(F.q)}"></div>
  <div class="tblwrap"><table><thead><tr><th>접수일시</th><th>강의</th><th>신청자</th><th>연락처</th><th>영업 파트너</th><th>기관·채널</th><th>상태</th><th class="num">확정금액</th><th class="num">수익</th></tr></thead><tbody>
  ${list.length ? list.map(a => `<tr class="click" data-app="${a.id}"><td>${fmtTs(a.createdAt)}</td><td>${esc(cmap[a.courseId]?.short)}</td><td><b>${esc(a.applicantName)}</b>${a.org ? `<br><small style="color:var(--muted)">${esc(a.org)}</small>` : ""}</td><td>${esc(a.phone)}</td><td>${refLabel(a)}</td><td>${esc(a.campaign || "-")}</td>
    <td><span class="badge ${a.status}">${STATUS[a.status]}</span>${a.settled ? ' <span class="badge settled">정산</span>' : ""}</td><td class="num">${a.status === "confirmed" ? won(a.amount) : "-"}</td><td class="num">${a.status === "confirmed" && a.refUid ? won(a.commission) : "-"}</td></tr>`).join("")
    : `<tr><td colspan="9" class="empty">조건에 맞는 신청서가 없습니다.</td></tr>`}
  </tbody></table></div></section>`;
}
function bindApps() {
  const rerender = () => { render(); };
  $("#fa-course").onchange = e => { F.course = e.target.value; rerender(); };
  $("#fa-ref").onchange = e => { F.ref = e.target.value; rerender(); };
  $("#fa-status").onchange = e => { F.status = e.target.value; rerender(); };
  $("#fa-q").onchange = e => { F.q = e.target.value; rerender(); };
  $$("[data-app]").forEach(tr => tr.onclick = () => openApp(apps.find(a => a.id === tr.dataset.app)));
  $("#csv-apps").onclick = () => csvDownload("applications.csv", [["접수일시", "강의", "신청자", "기관", "연락처", "이메일", "영업자", "영업자ID", "기관·채널", "상태", "확정금액", "수익", "정산"],
    ...filtered().map(a => [fmtTs(a.createdAt), cmap[a.courseId]?.short, a.applicantName, a.org, a.phone, a.email, a.refName, a.refId, a.campaign, STATUS[a.status], a.amount, a.commission, a.settled ? "완료" : ""])]);
}
function openApp(a) {
  const c = cmap[a.courseId], fields = FORMS[a.courseId] || [];
  const val = f => { const v = a.answers?.[f.name]; return Array.isArray(v) ? v.join(", ") : v || "-"; };
  $("#modal-box").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:start;gap:10px"><h3>${esc(c?.short)} · ${esc(a.applicantName)}</h3><button class="btn btn--sm btn--ghost" id="m-close">닫기</button></div>
    <dl class="kv"><dt>접수일시</dt><dd>${fmtTs(a.createdAt)}</dd><dt>영업 파트너</dt><dd>${a.refUid ? `${esc(a.refName)} (${esc(a.refId)})` : "직접 신청"}</dd><dt>기관·채널 메모</dt><dd>${esc(a.campaign || "-")}</dd>
    ${fields.map(f => { const t = String(val(f)); const at = t.startsWith("📎 ") ? t.split(" | ") : null;
      return `<dt>${esc(f.label)}</dt><dd>${at ? `${esc(at[0])} <button class="btn btn--sm btn--ghost" data-att="${esc(at[1] || "")}">다운로드</button>` : esc(t)}</dd>`; }).join("")}</dl>
    <div class="mact"><div class="field" style="margin:0"><label>상태</label><select id="m-status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${a.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
      <div class="field" style="margin:0"><label>확정 금액(원)${c?.price ? "" : " · 계약금액"}</label><input type="number" id="m-amount" min="0" step="1000" value="${a.amount || c?.price || 0}"></div>
      <button class="btn btn--grad" id="m-save">저장</button></div>
    <p class="hint" style="margin-top:10px" id="m-hint"></p>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">${a.status === "confirmed" && a.refUid ? `<button class="btn btn--sm btn--ghost" id="m-settle">${a.settled ? "정산 완료 취소" : "정산 완료 처리"}</button>` : ""}<button class="btn btn--sm btn--danger" id="m-del" style="margin-left:auto">신청서 삭제</button></div>`;
  $("#modal").classList.add("on");
  const rate = rateOf(a), hint = () => { const s = $("#m-status").value, n = Number($("#m-amount").value) || 0; $("#m-hint").textContent = s === "confirmed" && a.refUid ? `영업 파트너 수익 = ${won(n)} × ${Math.round(rate * 100)}% = ${won(Math.round(n * rate))}` : s === "confirmed" ? "직접 신청 건은 수익 배분 대상이 아닙니다." : ""; };
  $("#m-status").onchange = $("#m-amount").oninput = hint; hint();
  $("#m-close").onclick = () => $("#modal").classList.remove("on");
  $$("[data-att]").forEach(b => b.onclick = async () => {
    try { const u = await store.attachmentUrl(b.dataset.att); if (!u) return toast("데모 모드에서는 파일이 저장되지 않습니다", "err"); window.open(u, "_blank", "noopener"); } catch (e) { toast("파일을 열 수 없습니다 (Storage 설정을 확인해 주세요)", "err"); }
  });
  $("#m-save").onclick = async () => {
    try { await store.adminUpdateApplication(a, { status: $("#m-status").value, amount: $("#m-amount").value, rate }); toast("저장되었습니다"); $("#modal").classList.remove("on"); await load(); render(); } catch (e) { toast(authError(e), "err"); }
  };
  $("#m-del").onclick = async () => {
    if (!confirm(`${a.applicantName}님의 신청서를 삭제할까요?\n삭제하면 되돌릴 수 없고, 영업 파트너의 실적·수익에서도 빠집니다.`)) return;
    try { await store.adminDeleteApplication(a); toast("신청서를 삭제했습니다"); $("#modal").classList.remove("on"); await load(); render(); } catch (e) { toast(authError(e), "err"); }
  };
  $("#m-settle")?.addEventListener("click", async () => {
    try { await store.adminSetSettled([a], !a.settled); toast("처리되었습니다"); $("#modal").classList.remove("on"); await load(); render(); } catch (e) { toast(authError(e), "err"); }
  });
}
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") e.target.classList.remove("on"); });

/* ───────── 정산 ───────── */
function vSettle() {
  const rows = users.map(u => { const cf = apps.filter(a => a.refId === u.refId && a.status === "confirmed"); const done = cf.filter(a => a.settled), pend = cf.filter(a => !a.settled); return { u, cf, done, pend }; }).filter(r => r.cf.length);
  return `<section class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><h3>수익 정산</h3><p class="sub">결제 확정된 신청의 수익 배분 합계입니다. 송금 후 “정산 완료 처리”를 눌러 주세요.</p></div><button class="btn btn--sm btn--ghost" id="csv-settle">CSV</button></div>
  <div class="tblwrap"><table><thead><tr><th>영업 파트너</th><th>고유 ID</th><th>연락처</th><th>정산 계좌</th><th class="num">확정 건수</th><th class="num">확정 매출</th><th class="num">총 수익</th><th class="num">정산 완료</th><th class="num">정산 대기</th><th></th></tr></thead><tbody>
  ${rows.length ? rows.map(r => `<tr><td><b>${esc(r.u.name)}</b></td><td>${esc(r.u.refId)}</td><td>${esc(r.u.phone)}</td><td>${bankOf(r.u)}</td><td class="num">${r.cf.length}</td><td class="num">${won(sum(r.cf, "amount"))}</td><td class="num">${won(sum(r.cf, "commission"))}</td><td class="num">${won(sum(r.done, "commission"))}</td><td class="num"><b>${won(sum(r.pend, "commission"))}</b></td>
    <td>${r.pend.length ? `<button class="btn btn--sm btn--grad" data-pay="${r.u.refId}">정산 완료 처리 (${r.pend.length}건)</button>` : '<span class="badge settled">완료</span>'}</td></tr>`).join("")
    : `<tr><td colspan="10" class="empty">결제 확정된 신청이 아직 없습니다.</td></tr>`}
  </tbody></table></div></section>`;
}
function bindSettle() {
  $$("[data-pay]").forEach(b => b.onclick = async () => {
    const items = apps.filter(a => a.refId === b.dataset.pay && a.status === "confirmed" && !a.settled);
    if (!confirm(`${items.length}건, 총 ${won(sum(items, "commission"))}을 정산 완료 처리할까요?`)) return;
    try { await store.adminSetSettled(items, true); toast("정산 완료 처리되었습니다"); await load(); render(); } catch (e) { toast(authError(e), "err"); }
  });
  $("#csv-settle")?.addEventListener("click", () => csvDownload("settlement.csv", [["영업 파트너", "고유ID", "연락처", "정산 계좌", "확정 건수", "확정 매출", "총 수익", "정산 완료", "정산 대기"],
    ...users.map(u => { const cf = apps.filter(a => a.refId === u.refId && a.status === "confirmed"); return [u.name, u.refId, u.phone, u.bankAccount ? `${u.bankName} ${u.bankAccount} ${u.bankHolder || ""}` : "", cf.length, sum(cf, "amount"), sum(cf, "commission"), sum(cf.filter(a => a.settled), "commission"), sum(cf.filter(a => !a.settled), "commission")]; }).filter(r => r[4])]));
}

/* ───────── 라우팅 ───────── */
function render() {
  $$("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.t === tab));
  const v = $("#view");
  v.innerHTML = { overview: vOverview, courses: vCourses, partners: vPartners, apps: vApps, settle: vSettle }[tab]();
  ({ courses: bindCourses, partners: bindPartners, apps: bindApps, settle: bindSettle }[tab] || (() => {}))();
}
function setTab(t) { tab = t; render(); window.scrollTo({ top: 0 }); }
$("#tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setTab(b.dataset.t); });
try { await load(); render(); } catch (e) { $("#view").innerHTML = `<div class="panel"><h3>데이터를 불러오지 못했습니다</h3><p class="sub">${esc(authError(e))}</p></div>`; console.error(e); }
