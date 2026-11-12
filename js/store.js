// 데이터 계층: Firebase(Auth + Firestore) / 데모 모드(localStorage) 를 같은 인터페이스로 제공
import { CONFIG } from "./config.js";
import { DEFAULT_COURSES, maskName } from "./courses.js";

export const isDemo = !CONFIG.firebase.apiKey;
export const toE164 = v => { const d = String(v || "").replace(/\D/g, ""); return d.startsWith("82") ? "+" + d : "+82" + d.replace(/^0/, ""); };
export const adminEmail = `${CONFIG.adminId}@${CONFIG.adminDomain}`;
export const toEmail = v => (v.includes("@") ? v.trim() : `${v.trim()}@${CONFIG.adminDomain}`);

const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function genRefId() {
  const a = new Uint32Array(6); crypto.getRandomValues(a);
  return "AIA-" + [...a].map(n => REF_CHARS[n % REF_CHARS.length]).join("");
}
const toMs = v => (v && typeof v.toMillis === "function" ? v.toMillis() : v || 0);
const mergeCourses = remote => {
  const out = {};
  for (const [id, d] of Object.entries(DEFAULT_COURSES)) out[id] = { ...d, ...(remote?.[id] || {}), id };
  return out;
};
export const calcCommission = (amount, rate) => Math.round((Number(amount) || 0) * (Number(rate) || 0));

/* ═════════════════════ Firebase 구현 ═════════════════════ */
async function createFirebaseStore() {
  const V = "10.14.1", B = `https://www.gstatic.com/firebasejs/${V}/`;
  const [appM, authM, fsM] = await Promise.all([
    import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")
  ]);
  const app = appM.initializeApp(CONFIG.firebase);
  const auth = authM.getAuth(app);
  const db = fsM.getFirestore(app);
  const { doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, orderBy, limit, writeBatch, serverTimestamp } = fsM;
  const norm = s => ({ id: s.id, ...s.data(), createdAt: toMs(s.data().createdAt), settledAt: toMs(s.data().settledAt) });

  let rc = null, pvId = null;
  return {
    mode: "firebase",
    onAuth(cb) {
      return authM.onAuthStateChanged(auth, async u => {
        if (!u) return cb(null);
        const isAdmin = (u.email || "").toLowerCase() === adminEmail;
        let profile = null;
        if (!isAdmin) {
          try { const s = await getDoc(doc(db, "users", u.uid)); profile = s.exists() ? { uid: u.uid, ...s.data() } : null; } catch (e) { console.warn(e); }
        }
        cb({ uid: u.uid, email: u.email, isAdmin, profile, name: isAdmin ? "관리자" : profile?.name || u.displayName || "" });
      });
    },
    async signUp({ name, phone, email, password }) {
      if (email.trim().toLowerCase() === adminEmail) throw new Error("사용할 수 없는 이메일입니다.");
      const cred = await authM.createUserWithEmailAndPassword(auth, email.trim(), password);
      try {
        await authM.updateProfile(cred.user, { displayName: name });
        let refId = genRefId();
        for (let i = 0; i < 5 && (await getDoc(doc(db, "refs", refId))).exists(); i++) refId = genRefId();
        const b = writeBatch(db);
        b.set(doc(db, "users", cred.user.uid), { name, phone, email: email.trim(), refId, active: true, createdAt: serverTimestamp() });
        b.set(doc(db, "refs", refId), { uid: cred.user.uid, name, active: true, createdAt: serverTimestamp() });
        await b.commit();
      } catch (e) { await cred.user.delete().catch(() => {}); throw e; }
    },
    async signIn(idOrEmail, password) { await authM.signInWithEmailAndPassword(auth, toEmail(idOrEmail), password); },
    signOut() { return authM.signOut(auth); },
    async resetPassword(email) { await authM.sendPasswordResetEmail(auth, email.trim()); },

    async getCourses() {
      let remote = {};
      try { (await getDocs(collection(db, "courses"))).forEach(s => (remote[s.id] = s.data())); } catch (e) { console.warn(e); }
      return mergeCourses(remote);
    },
    async saveCourse(id, data) { await setDoc(doc(db, "courses", id), data, { merge: true }); },
    async getRef(refId) {
      if (!refId) return null;
      try { const s = await getDoc(doc(db, "refs", refId)); return s.exists() ? { refId, ...s.data() } : null; } catch { return null; }
    },
    // 휴대폰(SMS) 인증 후 정산 계좌 저장: 인증번호 확인 = 계정에 휴대폰 연결(또는 재인증) 성공
    async phoneStart(phone, boxId) {
      if (rc) { try { rc.clear(); } catch {} rc = null; }
      const box = document.getElementById(boxId); if (box) box.innerHTML = "";
      rc = new authM.RecaptchaVerifier(auth, box, { size: "invisible" });
      pvId = await new authM.PhoneAuthProvider(auth).verifyPhoneNumber(toE164(phone), rc);
    },
    async saveBank(code, bank) {
      if (!pvId) throw new Error("인증번호를 먼저 받아 주세요.");
      const u = auth.currentUser; if (!u) throw new Error("로그인이 필요합니다.");
      const cred = authM.PhoneAuthProvider.credential(pvId, code);
      if (u.providerData.some(p => p.providerId === "phone")) await authM.reauthenticateWithCredential(u, cred);
      else await authM.linkWithCredential(u, cred);
      await u.getIdToken(true);
      await updateDoc(doc(db, "users", u.uid), { bankName: bank.bankName, bankAccount: bank.bankAccount, bankHolder: bank.bankHolder, phoneVerifiedAt: serverTimestamp() });
      pvId = null;
    },
    // 첨부파일(회사소개 자료 등): Firebase Storage 업로드. 경로만 신청서에 기록하고, 다운로드 주소는 관리자만 발급받습니다.
    async uploadAttachment(file) {
      const sM = await import(B + "firebase-storage.js");
      const safe = file.name.replace(/[^\w.\-가-힣]+/g, "_").slice(-80) || "file";
      const path = `uploads/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}/${safe}`;
      await sM.uploadBytes(sM.ref(sM.getStorage(app), path), file, { contentType: file.type || "application/octet-stream" });
      return path;
    },
    async attachmentUrl(path) {
      const sM = await import(B + "firebase-storage.js");
      return sM.getDownloadURL(sM.ref(sM.getStorage(app), path));
    },
    async submitApplication(p) {
      const aRef = doc(collection(db, "applications")); const id = aRef.id;
      const b = writeBatch(db);
      const hasRef = !!p.refUid;
      b.set(aRef, {
        courseId: p.courseId, refId: hasRef ? p.refId : "direct", refUid: hasRef ? p.refUid : "", refName: hasRef ? p.refName : "",
        campaign: p.campaign || "", applicantName: p.applicantName, phone: p.phone, email: p.email || "", org: p.org || "",
        answers: p.answers, status: "applied", amount: 0, commission: 0, settled: false, createdAt: serverTimestamp()
      });
      if (hasRef) b.set(doc(db, "referrals", id), {
        appId: id, courseId: p.courseId, refId: p.refId, refUid: p.refUid, maskedName: maskName(p.applicantName),
        campaign: p.campaign || "", status: "applied", amount: 0, commission: 0, settled: false, createdAt: serverTimestamp()
      });
      await b.commit();
      return id;
    },
    async listMyReferrals(uid) {
      const s = await getDocs(query(collection(db, "referrals"), where("refUid", "==", uid)));
      return s.docs.map(norm).sort((a, b) => b.createdAt - a.createdAt);
    },
    // ── 관리자 ──
    async adminUsers() { return (await getDocs(collection(db, "users"))).docs.map(s => ({ uid: s.id, ...s.data(), createdAt: toMs(s.data().createdAt) })); },
    async adminApplications() { return (await getDocs(query(collection(db, "applications"), orderBy("createdAt", "desc"), limit(2000)))).docs.map(norm); },
    async adminSetUserActive(user, active) {
      const b = writeBatch(db);
      b.update(doc(db, "users", user.uid), { active }); b.update(doc(db, "refs", user.refId), { active });
      await b.commit();
    },
    async adminUpdateApplication(a, { status, amount, rate }) {
      const commission = status === "confirmed" ? calcCommission(amount, rate) : 0;
      const amt = status === "confirmed" ? Number(amount) || 0 : 0;
      const b = writeBatch(db);
      b.update(doc(db, "applications", a.id), { status, amount: amt, commission, ...(status !== "confirmed" ? { settled: false } : {}) });
      if (a.refUid) b.update(doc(db, "referrals", a.id), { status, amount: amt, commission, ...(status !== "confirmed" ? { settled: false } : {}) });
      await b.commit();
    },
    async adminDeleteApplication(a) {
      const b = writeBatch(db);
      b.delete(doc(db, "applications", a.id));
      if (a.refUid) b.delete(doc(db, "referrals", a.id));
      await b.commit();
    },
    // 영업 파트너 삭제: 프로필·고유 ID·실적 요약을 지웁니다. (신청서 원본은 관리자 기록으로 남김)
    // ※ Firebase 로그인 계정 자체는 콘솔 Authentication 에서 따로 삭제해야 합니다.
    async adminDeletePartner(user) {
      const refs = await getDocs(query(collection(db, "referrals"), where("refUid", "==", user.uid)));
      const ids = refs.docs.map(d => d.ref);
      for (let i = 0; i < ids.length; i += 400) { const b = writeBatch(db); ids.slice(i, i + 400).forEach(r => b.delete(r)); await b.commit(); }
      const b = writeBatch(db);
      b.delete(doc(db, "refs", user.refId)); b.delete(doc(db, "users", user.uid));
      await b.commit();
    },
    async adminSetSettled(items, settled) {
      for (let i = 0; i < items.length; i += 200) {
        const b = writeBatch(db);
        items.slice(i, i + 200).forEach(a => {
          b.update(doc(db, "applications", a.id), { settled, settledAt: settled ? serverTimestamp() : null });
          if (a.refUid) b.update(doc(db, "referrals", a.id), { settled, settledAt: settled ? serverTimestamp() : null });
        });
        await b.commit();
      }
    }
  };
}

/* ═════════════════════ 데모(localStorage) 구현 ═════════════════════ */
function createLocalStore() {
  const K = "aia_demo_db_v1", S = "aia_demo_session";
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } };
  const db0 = load();
  const db = { users: [], refs: {}, courses: {}, applications: [], passwords: {}, ...db0 };
  const save = () => localStorage.setItem(K, JSON.stringify(db));
  const listeners = new Set();
  const DEMO_ADMIN_PW = "demo-admin";
  const sessionUser = () => {
    const email = localStorage.getItem(S); if (!email) return null;
    if (email === adminEmail) return { uid: "admin", email, isAdmin: true, profile: null, name: "관리자" };
    const p = db.users.find(u => u.email === email); if (!p) return null;
    return { uid: p.uid, email, isAdmin: false, profile: p, name: p.name };
  };
  const emit = () => listeners.forEach(f => f(sessionUser()));
  const uid = () => "u" + Math.random().toString(36).slice(2, 10);
  const refOf = id => db.applications.filter(a => a.refId === id);

  return {
    mode: "demo",
    onAuth(cb) { listeners.add(cb); setTimeout(() => cb(sessionUser()), 0); return () => listeners.delete(cb); },
    async signUp({ name, phone, email, password }) {
      email = email.trim();
      if (email.toLowerCase() === adminEmail) throw new Error("사용할 수 없는 이메일입니다.");
      if (db.users.some(u => u.email === email)) throw new Error("이미 가입된 이메일입니다.");
      let refId = genRefId(); while (db.refs[refId]) refId = genRefId();
      const user = { uid: uid(), name, phone, email, refId, active: true, createdAt: Date.now() };
      db.users.push(user); db.refs[refId] = { uid: user.uid, name, active: true }; db.passwords[email] = password; save();
      localStorage.setItem(S, email); emit();
    },
    async signIn(idOrEmail, password) {
      const email = toEmail(idOrEmail);
      const ok = email === adminEmail ? password === DEMO_ADMIN_PW : db.passwords[email] === password;
      if (!ok) throw new Error("auth/invalid-credential");
      localStorage.setItem(S, email); emit();
    },
    async signOut() { localStorage.removeItem(S); emit(); },
    async resetPassword() { /* demo */ },
    async getCourses() { return mergeCourses(db.courses); },
    async saveCourse(id, data) { db.courses[id] = { ...(db.courses[id] || {}), ...data }; save(); },
    async getRef(refId) { const r = db.refs[refId]; return r ? { refId, ...r } : null; },
    async phoneStart() { /* 데모: 인증번호는 123456 */ },
    async saveBank(code, bank) {
      if (code !== "123456") throw new Error("auth/invalid-verification-code");
      const u = db.users.find(x => x.email === localStorage.getItem(S)); if (!u) throw new Error("로그인이 필요합니다.");
      Object.assign(u, { bankName: bank.bankName, bankAccount: bank.bankAccount, bankHolder: bank.bankHolder, phoneVerifiedAt: Date.now() }); save();
    },
    async uploadAttachment(file) { return "demo/" + file.name; },
    async attachmentUrl() { return ""; },
    async submitApplication(p) {
      const id = "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const hasRef = !!p.refUid;
      db.applications.unshift({
        id, courseId: p.courseId, refId: hasRef ? p.refId : "direct", refUid: hasRef ? p.refUid : "", refName: hasRef ? p.refName : "",
        campaign: p.campaign || "", applicantName: p.applicantName, phone: p.phone, email: p.email || "", org: p.org || "",
        answers: p.answers, status: "applied", amount: 0, commission: 0, settled: false, createdAt: Date.now()
      });
      save(); return id;
    },
    async listMyReferrals(u) {
      return db.applications.filter(a => a.refUid === u).map(a => ({ ...a, maskedName: maskName(a.applicantName) }));
    },
    async adminUsers() { return db.users.map(u => ({ ...u })); },
    async adminApplications() { return db.applications.map(a => ({ ...a })); },
    async adminSetUserActive(user, active) {
      const u = db.users.find(x => x.uid === user.uid); if (u) u.active = active;
      if (db.refs[user.refId]) db.refs[user.refId].active = active; save();
    },
    async adminUpdateApplication(a, { status, amount, rate }) {
      const t = db.applications.find(x => x.id === a.id); if (!t) return;
      t.status = status; t.amount = status === "confirmed" ? Number(amount) || 0 : 0;
      t.commission = status === "confirmed" ? calcCommission(amount, rate) : 0;
      if (status !== "confirmed") t.settled = false; save();
    },
    async adminDeleteApplication(a) { db.applications = db.applications.filter(x => x.id !== a.id); save(); },
    async adminDeletePartner(user) {
      db.users = db.users.filter(u => u.uid !== user.uid); delete db.refs[user.refId]; delete db.passwords[user.email]; save();
    },
    async adminSetSettled(items, settled) {
      items.forEach(a => { const t = db.applications.find(x => x.id === a.id); if (t) { t.settled = settled; t.settledAt = settled ? Date.now() : 0; } });
      save();
    }
  };
}

let _store;
export async function getStore() {
  if (!_store) _store = isDemo ? createLocalStore() : await createFirebaseStore();
  return _store;
}
