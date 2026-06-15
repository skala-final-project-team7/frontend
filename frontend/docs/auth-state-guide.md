# 인증 상태 관리 가이드 — localStorage & Pinia 이해하기

> feature13에서 구현한 인증 시스템이 **어디에 무엇을 저장하고, 왜 그렇게 나누는지**를 처음 보는 사람도 이해할 수 있게 설명합니다.

---

## 먼저: 두 저장소의 역할 한 줄 요약

| 저장소 | 비유 | 실제로 저장하는 것 |
|---|---|---|
| **localStorage** | 열쇠고리 (브라우저가 보관) | `accessToken` — "나 로그인했다"는 증표 |
| **Pinia store** | 앱이 기억하는 메모장 (탭 안에서만 유효) | `currentUser`, `isAuthenticated` — 현재 누가 쓰고 있는지 |

---

## localStorage 란?

### "브라우저 금고"

```
브라우저 (Chrome, Safari...)
  └─ 로컬스토리지 (도메인마다 독립된 금고)
        └─ "accessToken" : "eyJhbGciOiJIUzI1NiJ9..."
```

- 브라우저가 탭 닫아도, 창 꺼도, 심지어 컴퓨터 재시작해도 **내용이 남아 있습니다.**
- 자바스크립트로 `localStorage.setItem("키", "값")` 하면 저장, `getItem("키")`로 읽습니다.
- 같은 도메인(`lina.example.com`)의 모든 탭이 같은 금고를 씁니다.

### 이 프로젝트에서 저장하는 것

```
localStorage["accessToken"] = "eyJhbGciOiJIUzI1NiJ9..."
```

딱 하나, **`accessToken`만** 저장합니다. 이 문자열이 곧 "나는 Confluence에서 인증받은 사람입니다"라는 증표입니다.

---

## Pinia store 란?

### "앱 안의 공유 메모장"

```
Vue 앱 (탭 하나)
  └─ Pinia (전역 상태 관리)
        └─ useAuthStore
              ├─ currentUser  : { name: "이다연", role: "USER", ... }
              ├─ isAuthenticated : true
              └─ isRestoringSession : false
```

- **탭 안에서만** 유효합니다. 새로고침하거나 탭을 닫으면 초기화됩니다.
- 어떤 컴포넌트에서든 `useAuthStore()`를 호출해서 같은 상태를 읽고 쓸 수 있습니다.
- Vue의 반응형(`ref`, `computed`)으로 만들어져 있어서, 값이 바뀌면 화면이 자동으로 업데이트됩니다.

### 이 프로젝트에서 저장하는 것

```ts
// src/stores/auth.ts
const currentUser = ref<CurrentUser | null>(null);
// → { userId, name, email, role, profileImageUrl, lastLoginAt } 또는 null

const isAuthenticated = computed(() => currentUser.value !== null);
// → currentUser 가 있으면 true, 없으면 false (자동 계산)

const isRestoringSession = ref(false);
// → 부팅 시 세션 복원 중인지 여부 (로딩 스피너 표시용)

const sessionRestoreAttempted = ref(false);
// → restoreSession() 이 한 번 이상 실행됐는지 (라우터 가드 활성화 트리거)
```

**accessToken은 Pinia에 없습니다.** 토큰 문자열을 두 곳에 두면 "어느 쪽이 진짜냐"는 혼란이 생기기 때문입니다.

---

## 왜 둘로 나눴나?

### localStorage ← accessToken을 넣는 이유

새로고침해도 로그인이 유지되어야 합니다. Pinia는 새로고침하면 사라지니, **영속적인** localStorage에 토큰을 보관합니다.

### Pinia ← currentUser를 넣는 이유

사용자 이름, 역할(`role`) 같은 정보는 컴포넌트들이 **즉시, 반응형으로** 참조해야 합니다. localStorage는 반응형이 아니어서 값이 바뀌어도 화면이 자동 업데이트되지 않습니다. 그래서 사용자 정보는 Pinia에 둡니다.

### accessToken을 Pinia에도 복사하지 않는 이유

```
❌ 잘못된 방식:
  localStorage["accessToken"] = "abc"
  pinia.token = "abc"   ← 두 곳에 같은 값, 동기화 문제 발생 위험

✅ 올바른 방식:
  localStorage["accessToken"] = "abc"   ← 단일 진실 소스
  (API 요청 시마다 localStorage에서 직접 읽음)
```

---

## 전체 흐름: 로그인부터 로그아웃까지

### 1단계: 로그인 버튼 클릭

```
사용자가 "일반 사용자로 로그인" 클릭
  → 브라우저가 GET /api/auth/login 으로 이동
  → BFF가 Confluence OAuth 페이지로 302 리디렉션
  → 사용자가 Confluence에서 인증
  → BFF가 code/state 검증 후 FE의 /auth/callback?accessToken=xxx 로 리디렉션
```

### 2단계: AuthCallbackPage.vue 처리

`/auth/callback` 페이지에 도착하면 `AuthCallbackPage.vue`가 실행됩니다.

```ts
// src/pages/AuthCallbackPage.vue (onMounted 내부)

// ① URL에서 accessToken, returnTo 추출
const { accessToken, returnTo } = route.query;
// returnTo = 로그인 화면에서 사용자가 누른 카드에 따라 붙는 이동 의도 (/chat 또는 /admin)

// ② localStorage에 저장 — "열쇠고리에 열쇠 꽂기"
localStorage.setItem('accessToken', accessToken);

// ③ Pinia 세션 복원 (사용자 정보 가져오기)
await authStore.restoreSession();

// ④ 사용자가 선택한 returnTo(의도)대로 이동
//    - /admin 접근은 라우터 가드가 role을 다시 확인하므로, 비관리자는 토큰만으로 못 들어감
if (['/chat', '/admin'].includes(returnTo)) {
  router.replace(returnTo);
} else {
  // 정상 로그인 흐름엔 returnTo가 항상 있다(로그인 카드가 자동으로 붙임).
  // 없으면 비정상 진입이므로 로그인 화면으로 돌려보내 재시도하게 한다.
  router.replace('/login');
}
```

이 시점에:
```
localStorage["accessToken"] = "eyJhbGciO..."  ← 저장됨

Pinia:
  currentUser = { name: "이다연", role: "USER", ... }  ← 채워짐
  isAuthenticated = true  ← true
```

### 3단계: API 요청마다 — 자동으로 토큰 첨부

```ts
// src/api/client.ts

function readAccessToken(): string {
  return localStorage.getItem('accessToken') ?? '';
  // 매번 localStorage에서 직접 읽는다
}

function buildJsonHeaders(...) {
  const accessToken = readAccessToken();

  if (accessToken) {
    baseHeaders.Authorization = `Bearer ${accessToken}`;
    // → 모든 API 요청에 "Authorization: Bearer eyJhbGciO..." 헤더 자동 추가
  }
}
```

컴포넌트나 Pinia가 토큰을 관리할 필요 없습니다. API 클라이언트가 **요청할 때마다 localStorage에서 꺼내서 헤더에 붙입니다.**

### 4단계: 새로고침 — 세션 복원

```
사용자가 F5 눌러 새로고침
  → Vue 앱 처음부터 다시 시작
  → Pinia 초기화 (currentUser = null)
  → main.ts 실행
```

```ts
// src/main.ts

enableMockApi().then(async () => {
  const pinia = createPinia();
  const authStore = useAuthStore(pinia);

  // 앱 마운트 전에 세션 복원
  await authStore.restoreSession();

  createApp(App).use(pinia).use(router).mount('#app');
});
```

`restoreSession()` 내부에서는:

```ts
// src/stores/auth.ts

async function restoreSession(): Promise<void> {
  sessionRestoreAttempted.value = true;  // 가드 활성화 표시

  // localStorage에 토큰이 있는지 확인
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return;  // 없으면 그냥 로그아웃 상태로 종료
  }

  // 토큰이 있으면 서버에 사용자 정보 요청
  isRestoringSession.value = true;
  try {
    currentUser.value = await getCurrentUser();  // GET /api/users/me
    // → 성공하면 Pinia에 사용자 정보 채움
  } catch {
    // 토큰이 만료됐거나 유효하지 않으면
    localStorage.removeItem('accessToken');  // 열쇠 버리기
    currentUser.value = null;               // Pinia도 초기화
  } finally {
    isRestoringSession.value = false;
  }
}
```

결과:
```
새로고침 후 상태:

localStorage["accessToken"] = "eyJhbGciO..."  ← 새로고침 전과 동일 (영속)

Pinia:
  currentUser = { name: "이다연", ... }  ← /api/users/me 로 복원됨
  isAuthenticated = true
```

### 5단계: 라우터 가드 — 보호된 페이지 접근 제어

```ts
// src/router/index.ts

router.beforeEach((to) => {
  if (!getActivePinia()) return;                         // ① Pinia 없으면 패스
  const authStore = useAuthStore();
  if (!authStore.sessionRestoreAttempted) return;        // ② 세션 복원 전이면 패스

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };                            // ③ 미인증이면 /login으로
  }

  if (to.meta.requiresAdmin && authStore.currentUser?.role !== 'ADMIN') {
    return { name: 'login' };                            // ④ 관리자 권한 없으면 /login으로
  }
});
```

`sessionRestoreAttempted`가 필요한 이유: 앱 부팅 직후 `restoreSession()`이 끝나기 전에 라우터 가드가 실행되면, Pinia에 사용자 정보가 없어서 모든 사람을 `/login`으로 보내버립니다. 이를 막으려고 **"세션 복원이 한 번 시도됐다"는 표시**를 보고 가드를 활성화합니다.

### 6단계: 로그아웃

```ts
// src/stores/auth.ts

async function logout(): Promise<void> {
  try {
    await apiLogout();  // POST /api/auth/logout (서버에도 알림)
  } catch {
    // 서버 실패해도 로컬은 반드시 정리
  } finally {
    clearAuth();
  }
}

function clearAuth(): void {
  localStorage.removeItem('accessToken');  // 열쇠 버리기
  currentUser.value = null;                // 메모 지우기
}
```

결과:
```
localStorage["accessToken"] = (없음)  ← 제거됨
Pinia:
  currentUser = null
  isAuthenticated = false
```

---

## 오류 케이스 처리

### accessToken이 만료된 경우 (401 응답)

현재 POC에서는 자동 갱신(refresh) 없이 **재로그인**으로 처리합니다.

```
API 요청 → 서버 401 응답
  → restoreSession 내부의 catch에서 처리
  → localStorage.removeItem('accessToken')
  → currentUser = null
  → 라우터 가드가 /login으로 보냄
```

### 관리자가 아닌데 /admin 접근 시

```
사용자가 /admin 주소 입력
  → 라우터 가드 실행
  → authStore.currentUser.role !== 'ADMIN' 확인
  → /login 으로 리디렉션
```

### Confluence에서 권한 없이 관리자 로그인 시도

```
"관리자로 로그인" 클릭 → GET /api/auth/login?mode=admin
  → BFF가 role 확인 → ADMIN이 아니면 403 FORBIDDEN
  → FE /auth/callback?errorCode=FORBIDDEN 으로 리디렉션
  → AuthCallbackPage가 감지 → accessToken 저장 안 함
  → /login?error=FORBIDDEN 으로 이동
  → LoginPage에서 "관리자 권한이 없는 계정입니다" 배너 표시
```

---

## 상태 한눈에 보기

### 로그아웃 상태

```
localStorage:  (accessToken 없음)
Pinia:
  currentUser          = null
  isAuthenticated      = false
  isRestoringSession   = false
  sessionRestoreAttempted = true  (앱이 한 번 시작된 이후)
```

### 로그인 상태 (일반 사용자)

```
localStorage:  accessToken = "eyJhbGciO..."
Pinia:
  currentUser = {
    userId: "712020:abc",
    name: "이다연",
    email: "dayeon@example.com",
    role: "USER",
    profileImageUrl: "https://...",
    lastLoginAt: "2026-06-15T10:00:00+09:00"
  }
  isAuthenticated = true
  isRestoringSession = false
  sessionRestoreAttempted = true
```

### 세션 복원 중 (새로고침 직후 잠깐)

```
localStorage:  accessToken = "eyJhbGciO..."  (아직 있음)
Pinia:
  currentUser          = null   (아직 /api/users/me 응답 대기 중)
  isAuthenticated      = false
  isRestoringSession   = true   ← 스피너 표시
  sessionRestoreAttempted = true
```

---

## 코드 파일 위치 정리

| 파일 | 역할 |
|---|---|
| `src/stores/auth.ts` | Pinia auth store — `currentUser`, `restoreSession`, `logout` |
| `src/pages/AuthCallbackPage.vue` | OAuth 콜백 처리 — localStorage에 토큰 저장 |
| `src/main.ts` | 앱 부팅 시 `restoreSession()` 호출 |
| `src/router/index.ts` | 보호 라우트 가드 (`requiresAuth`, `requiresAdmin`) |
| `src/api/client.ts` | 모든 API 요청에 localStorage 토큰을 Bearer 헤더로 주입 |

---

## 자주 드는 질문

**Q. 왜 쿠키를 안 쓰나요?**

`HttpOnly` 쿠키를 쓰면 JavaScript에서 접근할 수 없어 XSS에 더 안전합니다. 하지만 이 프로젝트의 BFF가 쿠키 기반 세션을 발급하지 않고 토큰을 응답 body로 내려주기 때문에, FE가 직접 받아서 보관해야 합니다.

**Q. 새 탭을 열면 로그인 상태가 공유되나요?**

localStorage는 같은 도메인의 **모든 탭이 공유**합니다. 탭 A에서 로그인하면 탭 B에서도 `localStorage["accessToken"]`이 있습니다. 다만 Pinia 상태는 탭마다 별개입니다. 탭 B를 새로고침하면 `restoreSession()`이 localStorage의 토큰을 읽어 Pinia를 채웁니다.

**Q. 로그아웃을 한 탭에서 하면 다른 탭도 로그아웃되나요?**

localStorage는 공유되지만, 다른 탭의 Pinia는 즉시 바뀌지 않습니다. 다른 탭에서 다음 API 요청 시 401이 오거나 새로고침하면 그때 로그아웃 상태가 됩니다. (현재 POC 범위)

**Q. 토큰이 만료되면 어떻게 되나요?**

현재 POC에서는 refresh token이 없기 때문에, 만료된 토큰으로 API 요청 시 서버가 401을 돌려줍니다. 그러면 `restoreSession()`의 catch가 토큰을 localStorage에서 지우고 `/login`으로 보냅니다. 자동 갱신은 후속 작업입니다.
