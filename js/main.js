import { initPage, $, $$, esc, copyText, buildLink, shareText, toast, COURSE_ORDER } from "./ui.js";
import { fmtDate, won, priceText, commissionText } from "./courses.js";

import { initLogo } from "./logo.js";

const { store, user } = await initPage();
const courses = COURSE_ORDER(await store.getCourses());

// CTA
if (user) {
  $("#cta-main").textContent = user.isAdmin ? "관리자 페이지" : "내 대시보드";
  $("#cta-main").href = user.isAdmin ? "admin.html" : "dashboard.html";
  $("#cta-join").textContent = user.isAdmin ? "관리자 페이지로 이동" : "내 대시보드로 이동";
  $("#cta-join").href = user.isAdmin ? "admin.html" : "dashboard.html";
}

// 수익 구조 예시(8주 정규반 값 연동)
const reg = courses.find(c => c.id === "regular8");
if (reg) {
  $("#rev-price").textContent = won(reg.price);
  $("#rev-rate").textContent = Math.round(reg.commissionRate * 100) + "%";
  $("#rev-earn").textContent = won(Math.round(reg.price * reg.commissionRate));
  $("#rev-bar").style.width = Math.round(reg.commissionRate * 100) + "%";
}

function datesHtml(c) {
  if (c.openDates?.length) return c.openDates.map(d => `<div>${esc(fmtDate(d))}</div>`).join("");
  return esc(c.dateNote || "일정 협의");
}

$("#course-list").innerHTML = courses.filter(c => c.active !== false).map((c, i) => `
  <article class="course reveal" data-id="${c.id}">
    <div class="course__no grad-text">0${i + 1}</div>
    <div>
      <div class="course__k">${esc(c.kicker)}</div>
      <h3>${esc(c.title)}</h3>
      <p class="course__sum">${esc(c.summary)}</p>
      <div class="tags">${(c.highlights || []).map(h => `<span class="tag">${esc(h)}</span>`).join("")}</div>
      <details class="cur"><summary>커리큘럼 한눈에 보기</summary>
        <ol>${(c.curriculum || []).map(x => `<li><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`).join("")}</ol>
      </details>
    </div>
    <div>
      <dl class="meta">
        <dt>개강 일정</dt><dd>${datesHtml(c)}</dd>
        <dt>진행 방식</dt><dd>${esc(c.format)}<br><span style="color:var(--muted);font-weight:500">${esc(c.duration)}</span></dd>
        <dt>수강료</dt><dd>${c.price > 0 ? `${c.listPrice > c.price ? `<span class="old">${won(c.listPrice)}</span><span class="off">${Math.round((1 - c.price / c.listPrice) * 100)}%</span>` : ""}<span class="big">${won(c.price)}</span>` : `<span class="big">${esc(priceText(c))}</span>`}</dd>
      </dl>
      <div class="earn"><span>영업 파트너 수익<br>(${Math.round(c.commissionRate * 100)}%)</span><b class="grad-text">${commissionText(c)}</b></div>
      <div class="actions">
        <button class="btn btn--grad" data-act="link">신청폼 링크 복사</button>
        <div class="row">
          <button class="btn btn--ghost" data-act="text">홍보 문구 복사</button>
          <a class="btn btn--ghost" href="apply.html?c=${c.id}&preview=1" target="_blank" rel="noopener">폼 미리보기</a>
        </div>
        <div class="row">${(c.docs || []).slice(0, 2).map(d => `<a class="btn btn--ghost btn--sm" href="${esc(d.url)}" download>⬇ ${esc(d.label)}</a>`).join("")}</div>
      </div>
    </div>
  </article>`).join("");
window.__reveal?.();

$("#course-list").addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  if (!user) { $("#login-modal").classList.add("on"); return; }
  const c = courses.find(x => x.id === b.closest(".course").dataset.id);
  const link = buildLink(c.id, user);
  if (b.dataset.act === "link") await copyText(link);
  else await copyText(shareText(c, link));
  if (user.isAdmin) toast("관리자 계정은 영업자 ID 없이 직접 신청 링크가 복사됩니다", "ok");
});
$("#login-close").onclick = () => $("#login-modal").classList.remove("on");
$("#login-modal").addEventListener("click", e => { if (e.target.id === "login-modal") e.target.classList.remove("on"); });

// 인터랙티브 로고
initLogo($("#logo-stage"), {
  x: $("#lo-x"), y: $("#lo-y"), angle: $("#lo-angle"), palette: $("#lo-palette"), mode: $("#lo-mode"), wave: $("#lo-wave"), plays: $("#lo-plays"),
  replay: $("#lg-replay"), theme: $("#lg-theme"), waveBtn: $("#lg-wave"), palettes: $$("#brand .logo-pals button"),
});
