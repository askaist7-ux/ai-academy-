# AI 아카데미 영업 파트너 플랫폼

HTML / CSS / JavaScript + Firebase(Auth·Firestore) · Vercel 정적 배포

## 구조
- `index.html` 메인 (강의 3종, 링크 복사, 커리큘럼 다운로드, 수익 구조)
- `login.html` 로그인 · 회원가입 (가입 시 고유 ID `AIA-XXXXXX` 자동 발급)
- `dashboard.html` 영업자 대시보드 (링크 생성기, 신청/확정/수익 집계)
- `apply.html?c=강의ID&ref=고유ID&n=이름&t=메모` 신청폼 (기업강연 / 8주 정규반 / 이모티콘반)
- `admin.html` 관리자 (개강일·가격·배분율 수정, 영업자별 신청 수, 결제 확정, 정산, CSV)
- `firestore.rules` 보안 규칙 · `scripts/setup-admin.mjs` 관리자 계정 생성

## 설정 순서
1. Firebase 콘솔에서 프로젝트 생성 → Authentication "이메일/비밀번호" 사용 설정 → Firestore 데이터베이스 생성
2. 웹 앱 등록 후 `firebaseConfig` 값을 `js/config.js` 에 입력
3. 관리자 계정 생성: `ADMIN_PASSWORD='비밀번호' node scripts/setup-admin.mjs`
   (아이디 `kaistweb` → 내부 이메일 `kaistweb@aiacademy.app`. 비밀번호는 코드에 저장되지 않습니다)
4. 보안 규칙 배포: Firebase 콘솔 Firestore > 규칙에 `firestore.rules` 내용을 붙여넣기 (또는 `npx firebase-tools deploy --only firestore:rules`)
5. Vercel 배포: `npx vercel --prod`

## 수익 구조
수강료 확정 금액 × 강의별 배분율(기본 50%). 8주 정규반 1,200,000원 → 600,000원. 관리자 신청서 화면에서 "결제확정" 처리 시 수익이 확정되고, 정산 탭에서 완료 처리합니다.

## 데모 모드
`apiKey` 가 비어 있으면 브라우저 저장소로 동작합니다(관리자 데모 비밀번호: `demo-admin`).
