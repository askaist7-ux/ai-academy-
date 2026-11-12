// 강의 기본 설정(관리자 대시보드에서 수정하면 Firestore 의 값이 우선 적용됩니다)
export const DEFAULT_COURSES = {
  corporate: {
    id: "corporate",
    order: 1,
    active: true,
    kicker: "CORPORATE LECTURE",
    title: "기업·기관 AI 업무자동화 강연",
    short: "기업강연",
    summary: "기업·관공서·대학을 위한 맞춤형 AI 활용 강연. 업무자동화, 강의자동화, 실습 워크숍까지 기관 상황에 맞춰 설계합니다.",
    format: "기관 방문 출강 / 온라인 · 협의",
    duration: "4시간",
    price: 1500000,
    listPrice: 3000000,
    priceLabel: "",
    commissionRate: 0.5,
    openDates: [],
    dateNote: "희망 일정은 신청서에서 입력 → 교수 직접 검토 후 연락",
    refund: "",
    highlights: ["기업·관공서 업무자동화", "대학교수 AI 활용·강의자동화", "카이스트 강의 22년차 AI 전문가", "기업·공공기관 출강 · 교수연수 · 맞춤형 컨설팅"],
    curriculum: [
      { t: "생성형 AI 기초와 업무 활용", d: "ChatGPT·Gemini·Claude 비교, 업무별 프롬프트 설계" },
      { t: "업무자동화 실습", d: "Gem 챗봇, NotebookLM, 젠스파크로 자료 조사·정리 자동화" },
      { t: "문서·보고서·발표자료 제작", d: "Gamma 등으로 보고서·제안서·발표자료를 빠르게 작성" },
      { t: "회사 내부 AI전문강사", d: "강의안·평가·자료 제작과 학습자 맞춤 콘텐츠 설계" },
      { t: "기관 사이트 클로드코드", d: "로그인, 관리자페이지 코딩 완료하기" }
    ],
    docs: [
      { label: "기업강연 과정안내서 (PDF)", url: "/docs/corporate-guide.pdf" },
      { label: "기업강연 교육계획서 (PDF)", url: "/docs/corporate-plan.pdf" }
    ]
  },
  regular8: {
    id: "regular8",
    order: 2,
    active: true,
    kicker: "8-WEEK PROGRAM",
    title: "8가지 AI 수익화 8주 정규반",
    short: "8주 정규반",
    summary: "매주 하나의 실전 프로젝트로 완성하는 콘텐츠 제작 · Skill 자동화 · 포트폴리오. 인공지능 AI 자격증 취득 과정.",
    format: "온라인 ZOOM · 수업 VOD 녹화본 제공",
    duration: "주 1회 2시간 · 8주 · 총 16시간",
    price: 1200000,
    listPrice: 2000000,
    priceLabel: "",
    commissionRate: 0.5,
    openDates: [
      { date: "2026-11-17", time: "저녁 8시" },
      { date: "2026-11-23", time: "저녁 8시" }
    ],
    dateNote: "",
    refund: "개강 7일 전 100% 환불 / 개강 5일 전 50% 환불 / 개강 1일 전 30% 환불 / 개강 당일 환불 불가 (단, 정규반 오픈채팅방·카페 입장 후에는 수업 자료가 이미 제공되므로 환불 불가)",
    highlights: ["총 8주 · 8개 분야 · 8개 결과물", "KAIST ITA 강의 22년차 장안선 교수 직강", "수업 VOD 녹화본 · 메뉴얼 제공", "수료 후 AI 자격증 신청 기회"],
    curriculum: [
      { t: "1주 · 블로그 & 쇼핑커넥트", d: "검색되는 콘텐츠와 상품 연결 → 블로그 글 + 상품 연계 기획안" },
      { t: "2주 · 유튜브·쇼츠 자동화", d: "쇼핑쇼츠·정보 쇼츠 대본·음성·자막 → 30~60초 쇼츠 1편" },
      { t: "3주 · 상세페이지 제작", d: "고객·상품 분석, 혜택·근거·FAQ 구성 → 상세페이지 1종" },
      { t: "4주 · 감마·노트북LM·젠스파크", d: "자료 기반 요약·교차 검증 → 발표자료 + 요약본" },
      { t: "5주 · 포스터·SNS & 강의제안서", d: "홍보물 설계 + AI 강의제안서 Skill → 홍보물 + 제안서" },
      { t: "6주 · 이모티콘 & Skill 자동화", d: "캐릭터 기획·규격화·제출 준비 → 이모티콘 시안 세트" },
      { t: "7주 · 음원 수익화", d: "콘셉트·가사·프롬프트 설계, 음원·커버 → 음원 1곡" },
      { t: "8주 · 클로드 사이트 제작 & AI 강사", d: "로그인·관리자 사이트, 강의 시연 → 사이트 시제품 + 포트폴리오" }
    ],
    docs: [
      { label: "8주 교육계획서 (PDF)", url: "/docs/regular8-plan.pdf" },
      { label: "8주 정규반 과정안내서 (PDF)", url: "/docs/regular8-guide.pdf" }
    ]
  },
  emoticon: {
    id: "emoticon",
    order: 3,
    active: true,
    kicker: "EMOTICON CREATOR PROGRAM",
    title: "Skill로 완성하는 이모티콘 출시반",
    short: "이모티콘반",
    summary: "캐릭터 하나로 시작해 나만의 포트폴리오로 완성합니다. 정지형·움직이는 이모티콘, 굿즈·스티커, 로그인 작가 사이트까지.",
    format: "온라인 ZOOM",
    duration: "총 4회 · 회당 3시간 · 총 12시간",
    price: 450000,
    listPrice: 600000,
    priceLabel: "",
    commissionRate: 0.5,
    openDates: [{ date: "2026-11-18", time: "저녁 8시" }],
    dateNote: "",
    refund: "",
    highlights: ["4 SESSIONS · 4 PROJECTS · 1 PORTFOLIO", "VOD 청강 무료쿠폰 5가지 제공", "OGQ·카카오 제출 준비까지", "그림 실력과 관계없이 입문 가능"],
    curriculum: [
      { t: "1회차 · 멈티 · Skill 완성", d: "캐릭터 기획부터 정지형 이모티콘 제출 준비까지, OGQ 승인·카카오 제작" },
      { t: "2회차 · 움티 · 포토샵과 애니메이트", d: "표정과 동작에 리듬을 더하는 움직이는 이모티콘" },
      { t: "3회차 · 굿즈 · 스티커 · 일러스트", d: "캐릭터를 인쇄와 상품 이미지로 확장 (스티커·명함·티셔츠)" },
      { t: "4회차 · 작가 사이트 · Claude 로그인", d: "로그인과 관리 기능을 갖춘 작가 포트폴리오 사이트" }
    ],
    docs: [
      { label: "이모티콘반 교육계획서 (PDF)", url: "/docs/emoticon-plan.pdf" },
      { label: "이모티콘반 과정안내서 (PDF)", url: "/docs/emoticon-guide.pdf" }
    ]
  }
};

// ── 신청서 항목 정의 ──────────────────────────────────────────
const AI_INTERESTS_REGULAR = [
  "AI 이미지생성", "컷핏·클립챔프 영상편집", "Veo(AI영상자동생성)", "SUNO(AI음원제작) 수익화", "AI 웹사이트 / AI앱 수익화",
  "유튜브 수익화", "블로그 수익화(네이버·구글)", "쿠팡파트너스 채널 연동 수익화", "AI이모티콘 수익화", "NFT 수익화",
  "Figma AI(디자인 자동화)", "Gem 챗봇 AI(나만의 비서·업무자동화)", "Chat GPT", "Gemini", "Claude", "Copilot", "Grok", "Genspark"
];
const AI_INTERESTS_EMOTICON = [
  "AI 이모티콘 수익화", "AI 이미지생성", "AI 영상생성", "컷핏·클립챔프 영상편집", "Veo(AI영상자동생성)", "SUNO(AI음원제작) 수익화",
  "AI코딩 웹사이트 수익화", "유튜브 수익화", "블로그 수익화", "쿠팡파트너스 채널 연동 수익화", "NFT 수익화", "Figma AI", "Gem 챗봇 AI", "인공지능 AI자격증 8주 정규반"
];
const consent = (name, label) => ({ name, label, type: "consent", required: true });

export const FORMS = {
  corporate: [
    { name: "org", label: "기관명 (주요 업무)", type: "text", required: true },
    { name: "manager", label: "담당자 (성함 및 직함)", type: "text", required: true },
    { name: "phone", label: "연락처 (휴대폰)", type: "tel", required: true },
    { name: "email", label: "이메일", type: "email", required: true },
    { name: "wishDate", label: "희망 교육 날짜", type: "date", required: true },
    { name: "flexible", label: "날짜 조율 가능 여부", type: "radio", required: true, options: ["네, 조율 가능합니다.", "아니오, 지정된 날짜만 가능합니다."] },
    { name: "wishTime", label: "희망 교육 시간 (예: 14:00~17:00, 총 3시간)", type: "text", required: true },
    { name: "headcount", label: "교육 대상 (인원수)", type: "text", required: true },
    { name: "place", label: "강의 장소 (상세 주소 및 교육장 명칭 / 온·오프라인 여부)", type: "text", required: true },
    { name: "targetRole", label: "교육 대상자 (주요 직무 및 연차)", type: "text", required: true },
    { name: "level", label: "교육 대상자의 생성형 AI 활용 수준", type: "radio", required: true, options: ["초급 : 생성형 AI/GPT에 대한 지식이 거의 없음", "중급 : 기본 개념은 알고 있으며, 가끔 활용", "고급 : 평소 업무에 적극적으로 활용 중"] },
    { name: "content", label: "강의 희망 내용 (구체적인 주제 및 커리큘럼 요구사항)", type: "textarea", required: true },
    { name: "practice", label: "실습 여부 (이론 위주 / 실습 병행 여부)", type: "text", required: true },
    { name: "purpose", label: "강의 목적 (예: 실무 적용, 트렌드 파악, 동기 부여 등)", type: "text", required: true },
    { name: "budget", label: "희망 강사료 예산 (대략적인 범위 기재 · 원고료, 교통비 포함 여부 등)", type: "text", required: true },
    { name: "etc", label: "기타 요청 사항 (장비 지원, 주차 지원, 자료 배포 여부 등)", type: "text", required: true },
    { name: "proof", label: "증빙 서류 필요 여부 (예: 통장사본, 신분증 사본, 사업자등록증 등)", type: "text", required: true },
    { name: "intro", label: "회사소개 자료 링크 (선택 · 구글드라이브/홈페이지 주소 등)", type: "text", required: false },
    { name: "question", label: "의견 또는 질문", type: "textarea", required: true }
  ],
  regular8: [
    { name: "startDate", label: "원하는 개강일", type: "dates", required: true },
    { name: "name", label: "이름", type: "text", required: true },
    { name: "openchat", label: "오픈채팅방 닉네임", type: "text", required: true },
    { name: "email", label: "이메일", type: "email", required: false },
    { name: "phone", label: "전화번호", type: "tel", required: true },
    { name: "address", label: "자격증 배송을 위한 주소 (상세히)", type: "text", required: true },
    { name: "birth", label: "생년월일 (동명이인 구분 위함)", type: "text", required: true, placeholder: "예: 1980-01-01" },
    consent("c1", "수업내용은 무단전재, 유포, 재생산이 금지되어있습니다. 이를 어길 경우 법적 대응 및 손해배상이 이루어지는 점 동의하십니까?"),
    consent("c2", "개인정보 수집 및 이용에 대한 내용을 동의하십니까?"),
    consent("c3", "무단 불참시 다음 특강에 대한 참여가 제한될 수 있습니다. 불참시 사전 전달 부탁드립니다."),
    { name: "interests", label: "가장 관심있는 AI강의는?", type: "checks", required: true, options: AI_INTERESTS_REGULAR, other: true },
    { name: "request", label: "수업시 부탁하고싶은 점 (자세히 작성해주십시오^^)", type: "textarea", required: false },
    { name: "payMethod", label: "수강료 입금", type: "radio", required: true, options: ["은행송금", "미입금"], other: true }
  ],
  emoticon: [
    { name: "startDate", label: "관심과목 / 개강일", type: "dates", required: true },
    { name: "name", label: "이름", type: "text", required: true },
    { name: "openchat", label: "오픈채팅방 닉네임", type: "text", required: true },
    { name: "cafeNick", label: "장안선교수 네이버카페 닉네임", type: "text", required: true },
    { name: "zoomNick", label: "줌 닉네임", type: "text", required: true },
    { name: "email", label: "이메일", type: "email", required: false },
    { name: "phone", label: "전화번호", type: "tel", required: true },
    { name: "address", label: "주소 (상세히)", type: "text", required: true },
    { name: "birth", label: "생년월일 (동명이인 구분 위함)", type: "text", required: true, placeholder: "예: 1980-01-01" },
    consent("c1", "수업내용은 무단전재, 유포, 재생산이 금지되어있습니다. 이를 어길 경우 법적 대응 및 손해배상이 이루어지는 점 동의하십니까?"),
    consent("c2", "개인정보 수집 및 이용에 대한 내용을 동의하십니까?"),
    consent("c3", "무단 불참시 다음 특강에 대한 참여가 제한될 수 있습니다. 불참시 사전 전달 부탁드립니다."),
    { name: "interests", label: "가장 관심있는 AI강의는?", type: "checks", required: true, options: AI_INTERESTS_EMOTICON, other: true },
    { name: "request", label: "수업시 부탁하고싶은 점 (자세히 작성해주십시오^^)", type: "textarea", required: false },
    { name: "payMethod", label: "수강료 입금", type: "radio", required: true, options: ["은행송금", "미입금"], other: true }
  ]
};

export const PRIVACY_TEXT = `[개인정보 수집 및 이용]
1. 수집 및 이용 목적: 장안선교수는 「정보통신망 이용 촉진 및 정보보호」 등에 관한 법률을 준수하고 있습니다. 수집된 개인정보는 교육 참여자에게 과정에 대한 개별 공지를 목적으로 활용합니다.
2. 수집 항목: 이름, 연락처(휴대전화), 이메일 등
3. 보유 및 이용 기간: 정보 수집일로부터 3년 (단, 관련 법규에 별도 규정이 있는 경우 법규를 따름)
4. 동의 거부 권리 및 거부 시 불이익: 개인정보 이용에 귀하는 동의를 거부할 권리가 있으며, 미동의 시 수업 참여가 불가능합니다.
5. 영업 파트너 정보: 신청서에는 신청을 안내한 영업 파트너의 고유 ID와 이름이 함께 기록되며, 파트너에게는 신청자의 이름(일부 마스킹)과 신청 여부만 공유됩니다.`;

// ── 유틸 ─────────────────────────────────────────────────────
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
export function fmtDate(d) {
  if (!d?.date) return "";
  const [y, m, dd] = d.date.split("-").map(Number);
  const dt = new Date(y, m - 1, dd);
  return `${y}.${String(m).padStart(2, "0")}.${String(dd).padStart(2, "0")} (${DOW[dt.getDay()]}) ${d.time || ""}`.trim();
}
export const won = n => (Number(n) || 0).toLocaleString("ko-KR") + "원";
export function priceText(c) { return c.price > 0 ? won(c.price) : (c.priceLabel || "협의"); }
export function commissionText(c) {
  if (c.price > 0) return won(Math.round(c.price * c.commissionRate));
  return `계약금액의 ${Math.round(c.commissionRate * 100)}%`;
}
export function maskName(n = "") {
  n = String(n).trim();
  if (n.length <= 1) return n;
  if (n.length === 2) return n[0] + "*";
  return n[0] + "*".repeat(n.length - 2) + n[n.length - 1];
}
export function nextDateText(c) {
  const t = new Date().toISOString().slice(0, 10);
  const list = (c.openDates || []).filter(d => d.date >= t).sort((a, b) => a.date.localeCompare(b.date));
  if (list.length) return fmtDate(list[0]);
  return c.dateNote || "일정 협의";
}
