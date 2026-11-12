import { initPage, $, $$, esc, toast, authError, copyText, buildLink, shareText, fmtTs, COURSE_ORDER, STATUS, csvDownload } from "./ui.js";
import { won, commissionText } from "./courses.js";
import { bankFormHtml, wireBankForm, maskAcct } from "./bankform.js";

const { store, user } = await initPage({ requireAuth: true });
if (!user?.profile) {
  $("#dash").innerHTML = `<div class="panel"><h3>프로필을 찾을 수 없습니다</h3><p class="sub">회원 정보가 아직 생성되지 않았습니다. 로그아웃 후 다시 가입하거나 관리자에게 문의해 주세요.</p></div>`;
  throw new Error("no profile");
}
const p = user.profile;
const courses = COURSE_ORDER(await store.getCourses());
const cmap = Object.fromEntries(courses.map(c => [c.id, c]));
let rows = await store.listMyReferrals(user.uid);

$("#dash").innerHTML = `
  <div class="dhead">
    <div><span class="kicker">SALES PARTNER</span><h1>${esc(p.name)}님의<br>영업 대시보드</h1></div>
    <div class="idbox"><div><small>나의 고유 ID</small><b id="myid">${esc(p.refId)}</b></div><button class="btn btn--sm btn--ghost" id="copy-id">복사</button></div>
  </div>
  ${p.active === false ? `<div class="notice" style="background:#fde8eb;color:var(--bad)">현재 비활성화된 계정입니다. 새 신청은 내 ID로 연결되지 않습니다. 관리자에게 문의해 주세요.</div>` : ""}
  <div class="kpis" id="kpis"></div>

  <section class="panel">
    <h3>신청폼 링크 만들기</h3>
    <p class="sub">강의를 선택하면 내 고유 ID(${esc(p.refId)})와 이름(${esc(p.name)})이 담긴 신청 링크가 생성됩니다. 기관명·채널 메모를 넣으면 어느 곳에서 들어온 신청인지 구분할 수 있어요.</p>
    <div class="gen">
      <div class="field" style="margin:0"><label for="g-course">강의</label><select id="g-course">${courses.filter(c => c.active !== false).map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join("")}</select></div>
      <div class="field" style="margin:0"><label for="g-tag">기관·채널 메모 (선택)</label><input id="g-tag" type="text" maxlength="40" placeholder="예: OO시청 교육팀, 카톡방A"></div>
      <button class="btn btn--grad" id="g-make">링크 생성</button>
    </div>
    <div class="linkout" id="linkout">
      <div class="linkbox"><code id="g-link"></code><button class="btn btn--sm btn--dark" id="g-copy">링크 복사</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn btn--sm btn--ghost" id="g-text">홍보 문구 복사</button>
        <a class="btn btn--sm btn--ghost" id="g-open" target="_blank" rel="noopener">신청폼 열어보기</a>
        <button class="btn btn--sm btn--ghost" id="g-share">공유하기</button>
        <span id="g-docs" style="display:contents"></span>
      </div>
    </div>
  </section>

  <section class="panel" id="bank-panel">
    <h3>정산 계좌</h3>
    <p class="sub">수익을 입금받을 계좌입니다. 등록·변경할 때마다 <b>내 연락처 휴대폰 인증</b>이 필요합니다.</p>
    <div id="bank-now"></div>
    <div id="bank-edit" hidden>
      <div id="dbank"></div>
      <p class="err" id="bank-err" role="alert"></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn--grad" id="bank-save" type="button">계좌 저장</button><button class="btn btn--ghost" id="bank-cancel" type="button">취소</button></div>
    </div>
  </section>

  <section class="panel">
    <h3>강의별 실적</h3><p class="sub">내 ID로 접수된 신청 건수와 수익입니다. 수익은 관리자가 결제를 확정한 건부터 집계됩니다.</p>
    <div class="tblwrap"><table><thead><tr><th>강의</th><th class="num">신청 접수</th><th class="num">결제 확정</th><th class="num">확정 매출</th><th class="num">예상 수익</th><th class="num">확정 수익</th><th class="num">정산 대기</th></tr></thead><tbody id="by-course"></tbody></table></div>
  </section>

  <section class="panel">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h3>신청 내역</h3><p class="sub" style="margin:0 0 16px">신청자 이름은 개인정보 보호를 위해 일부 가려서 표시됩니다.</p></div><button class="btn btn--sm btn--ghost" id="csv">CSV 내려받기</button></div>
    <div class="filters"><select id="f-course"><option value="">전체 강의</option>${courses.map(c => `<option value="${c.id}">${esc(c.short)}</option>`).join("")}</select>
      <select id="f-status"><option value="">전체 상태</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
    <div class="tblwrap"><table><thead><tr><th>접수일시</th><th>강의</th><th>신청자</th><th>기관·채널</th><th>상태</th><th class="num">수익</th></tr></thead><tbody id="rows"></tbody></table></div>
  </section>`;

// 정산 계좌: 휴대폰 인증 후 등록/변경
const hasBank = !!p.bankAccount;
$("#bank-now").innerHTML = hasBank
  ? `<div class="bank-now"><div><small>등록된 계좌</small><b>${esc(p.bankName)} ${esc(maskAcct(p.bankAccount))}</b><span>예금주 ${esc(p.bankHolder || "-")} · <em class="okmark">✓ 휴대폰 인증 완료</em></span></div><button class="btn btn--sm btn--ghost" id="bank-open" type="button">계좌 변경</button></div>`
  : `<div class="bank-now"><div><small>등록된 계좌</small><b style="color:var(--muted)">아직 등록되지 않았습니다</b><span>정산을 받으려면 계좌를 등록해 주세요.</span></div><button class="btn btn--sm btn--grad" id="bank-open" type="button">계좌 등록</button></div>`;
$("#dbank").innerHTML = bankFormHtml("dbf", p.phone);
const dbf = wireBankForm(store, "dbf", { getPhone: () => p.phone, getHolder: () => p.name });
$("#bank-open").onclick = () => { $("#bank-edit").hidden = false; $("#bank-open").hidden = true; };
$("#bank-cancel").onclick = () => { $("#bank-edit").hidden = true; $("#bank-open").hidden = false; dbf.reset(); $("#bank-err").textContent = ""; };
$("#bank-save").onclick = async () => {
  const err = $("#bank-err"); err.textContent = "";
  let b; try { b = dbf.read(); } catch (ex) { err.textContent = ex.message; return; }
  if (!b) { err.textContent = "은행·계좌번호·예금주를 입력해 주세요."; return; }
  const btn = $("#bank-save"); btn.disabled = true; btn.textContent = "인증 중…";
  try { await store.saveBank(b.code, b); toast("정산 계좌가 저장되었습니다."); setTimeout(() => location.reload(), 700); }
  catch (ex) { console.error(ex); err.textContent = authError(ex); btn.disabled = false; btn.textContent = "계좌 저장"; }
};

const mk = () => buildLink($("#g-course").value, user, $("#g-tag").value.trim());
$("#copy-id").onclick = () => copyText(p.refId);
$("#g-make").onclick = () => {
  const link = mk(), c = cmap[$("#g-course").value];
  $("#g-link").textContent = link; $("#g-open").href = link; $("#linkout").classList.add("on");
  $("#g-docs").innerHTML = (c.docs || []).slice(0, 2).map(d => `<a class="btn btn--sm btn--ghost" href="${esc(d.url)}" download>⬇ ${esc(d.label)}</a>`).join("");
};
$("#g-copy").onclick = () => copyText($("#g-link").textContent);
$("#g-text").onclick = () => copyText(shareText(cmap[$("#g-course").value], $("#g-link").textContent));
$("#g-share").onclick = async () => {
  const link = $("#g-link").textContent, c = cmap[$("#g-course").value];
  if (navigator.share) { try { await navigator.share({ title: c.title, text: shareText(c, link) }); } catch {} } else copyText(shareText(c, link));
};
$("#g-make").click();

// 예상 수익: 신청접수(입금 확인 전) 건의 수강료 × 배분율. 결제 확정 시 확정 수익으로 전환됩니다.
const estOf = r => r.status === "applied" ? Math.round((Number(cmap[r.courseId]?.price) || 0) * (Number(cmap[r.courseId]?.commissionRate ?? 0.5))) : 0;
function render() {
  const sum = (arr, k) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const conf = rows.filter(r => r.status === "confirmed");
  const pending = conf.filter(r => !r.settled);
  $("#kpis").innerHTML = `
    <div class="kpi"><span>총 신청 접수</span><b>${rows.length}건</b><small>취소 ${rows.filter(r => r.status === "cancelled").length}건 포함</small></div>
    <div class="kpi"><span>결제 확정</span><b>${conf.length}건</b><small>확정 매출 ${won(sum(conf, "amount"))}</small></div>
    <div class="kpi kpi--grad"><span>확정 수익</span><b>${won(sum(conf, "commission"))}</b><small>결제 확정 건의 배분 합계</small></div>
    <div class="kpi"><span>예상 수익 (입금 대기)</span><b>${won(rows.reduce((t, r) => t + estOf(r), 0))}</b><small>신청접수 ${rows.filter(r => r.status === "applied").length}건 · 입금 확정 시 확정 수익으로 전환</small></div>
    <div class="kpi"><span>정산 대기 / 완료</span><b>${won(sum(pending, "commission"))}</b><small>정산 완료 ${won(sum(conf.filter(r => r.settled), "commission"))}</small></div>`;
  $("#by-course").innerHTML = courses.map(c => {
    const r = rows.filter(x => x.courseId === c.id), cf = r.filter(x => x.status === "confirmed");
    return `<tr><td><b>${esc(c.short)}</b></td><td class="num">${r.length}</td><td class="num">${cf.length}</td><td class="num">${won(sum(cf, "amount"))}</td><td class="num">${won(r.reduce((t, x) => t + estOf(x), 0))}</td><td class="num"><b>${won(sum(cf, "commission"))}</b></td><td class="num">${won(sum(cf.filter(x => !x.settled), "commission"))}</td></tr>`;
  }).join("");
  const fc = $("#f-course").value, fs = $("#f-status").value;
  const list = rows.filter(r => (!fc || r.courseId === fc) && (!fs || r.status === fs));
  $("#rows").innerHTML = list.length ? list.map(r => `<tr><td>${fmtTs(r.createdAt)}</td><td>${esc(cmap[r.courseId]?.short || r.courseId)}</td><td>${esc(r.maskedName)}</td><td>${esc(r.campaign || "-")}</td>
    <td><span class="badge ${r.status}">${STATUS[r.status]}</span>${r.settled ? ' <span class="badge settled">정산완료</span>' : ""}</td><td class="num">${r.status === "confirmed" ? won(r.commission) : r.status === "applied" && estOf(r) ? `<span style="color:var(--muted)">예상 ${won(estOf(r))}</span>` : "-"}</td></tr>`).join("")
    : `<tr><td colspan="6" class="empty">아직 접수된 신청이 없습니다. 위에서 링크를 만들어 전달해 보세요.</td></tr>`;
}
$("#f-course").onchange = $("#f-status").onchange = render;
$("#csv").onclick = () => csvDownload(`my-referrals-${p.refId}.csv`, [["접수일시", "강의", "신청자", "기관·채널", "상태", "정산", "확정금액", "수익"],
  ...rows.map(r => [fmtTs(r.createdAt), cmap[r.courseId]?.short, r.maskedName, r.campaign, STATUS[r.status], r.settled ? "완료" : "", r.amount, r.commission])]);
render();
