# Vercel Frontend Deployment

이 문서는 LINA Frontend를 Kubernetes pod로 배포하지 않고 Vercel에 배포하는 경우의 구조, 이유, 무료 배포 절차, BFF/API Gateway 연결 방식을 정리한다.

작성 기준일: 2026-06-04

---

## 1. 결론

현재 프로젝트에서는 Frontend를 Vercel에 배포하고, Backend/BFF/RAG/Worker/DB 계층은 Kubernetes에 배포하는 구조가 적합하다.

```text
User Browser
  |
  | HTTPS
  v
Vercel
  - Vue/Vite build 결과물 HTML/CSS/JS 서빙
  - CDN 기반 정적 파일 배포
  - Preview / Production deployment 제공
  |
  | API request
  v
api.your-domain.com
  |
  v
Kubernetes Ingress 또는 Gateway
  |
  v
api-gateway-bff
  |
  +--> backend service
  +--> rag-pipeline
  +--> auth/session/user services
  +--> mysql / mongodb / vector-db / valkey / rabbitmq
```

핵심은 Vercel과 Kubernetes Ingress/API Gateway가 같은 역할이 아니라는 점이다.

- Vercel: Frontend 정적 파일을 사용자에게 빠르게 서빙하는 hosting/CDN 계층
- Kubernetes Ingress 또는 Gateway: 외부 API 요청을 Kubernetes 내부 service로 라우팅하는 진입 계층
- API Gateway / BFF: 인증 확인, 요청 조합, Backend/RAG 호출, SSE proxy, 응답 표준화 등 application gateway 계층

---

## 2. 왜 Frontend pod를 Kubernetes에 올리지 않는가

Vue/Vite Frontend는 빌드 후 정적 파일로 배포된다.

```text
npm run build
  -> dist/index.html
  -> dist/assets/*.js
  -> dist/assets/*.css
```

이 파일들은 별도의 서버 애플리케이션이 아니라 정적 asset이다. Kubernetes에 올리려면 보통 다음 리소스가 필요하다.

```text
frontend Docker image
frontend Deployment
frontend Service
frontend Ingress rule
static file serving용 NGINX container
TLS / cache / rollout 설정
```

이 방식도 가능하지만, 현재 프로젝트 단계에서는 정적 Frontend 하나를 위해 Kubernetes 운영 부담이 늘어난다. 반면 Vercel은 Git repository를 연결하면 build, deploy, HTTPS, preview URL, CDN 서빙을 대부분 관리해준다.

따라서 Frontend는 Vercel에 맡기고, Kubernetes는 실제 서버 프로세스와 상태 저장 계층에 집중하는 편이 단순하다.

---

## 3. Vercel을 쓰는 이유

### 3.1 무료로 시작 가능

Vercel Hobby plan은 개인 프로젝트와 소규모 애플리케이션을 위한 무료 plan이다. 단, Hobby plan은 personal/non-commercial 성격이므로 팀 운영, 상업 서비스, 회사 정책 대상 프로젝트에서는 Pro 이상이 필요할 수 있다.

확인해야 할 사항:

- 프로젝트가 Vercel Hobby plan 사용 조건에 맞는가
- 회사/팀 정책상 외부 hosting/CDN 사용이 허용되는가
- preview deployment URL이 외부에 노출되어도 되는가
- source repository를 Vercel에 연결해도 되는가

### 3.2 Frontend 배포가 단순하다

Vercel은 Vite 기반 Frontend framework 배포를 지원한다. Git repository를 import하면 build command와 output directory를 인식하거나 설정할 수 있다.

현재 Vue/Vite 프로젝트의 일반적인 설정은 다음과 같다.

```text
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

### 3.3 Preview deployment가 유용하다

Pull Request 또는 branch별로 preview URL을 만들 수 있다. Backend가 아직 완성되지 않아도 Frontend 화면, 라우팅, mock API 흐름을 먼저 확인할 수 있다.

---

## 4. 무료 배포 절차

### 4.1 사전 준비

1. Vercel 계정을 생성한다.
2. GitHub/GitLab/Bitbucket repository를 준비한다.
3. Frontend project root가 명확해야 한다.

현재 repository 기준 project root는 다음 위치다.

```text
frontend/
```

### 4.2 Vercel dashboard에서 배포

1. Vercel Dashboard에 접속한다.
2. `Add New...` -> `Project`를 선택한다.
3. Frontend repository를 import한다.
4. monorepo 또는 하위 디렉터리 구조라면 Root Directory를 `frontend`로 지정한다.
5. Framework Preset을 `Vite`로 설정한다.
6. build 설정을 확인한다.

```text
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

7. Environment Variables를 등록한다.

예시:

```text
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://api.your-domain.com
```

8. Deploy를 실행한다.
9. 배포가 끝나면 `*.vercel.app` preview 또는 production URL을 확인한다.

### 4.3 Vercel CLI로 배포하는 경우

Vercel CLI를 사용할 수도 있다.

```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

CLI 배포도 가능하지만, 팀 프로젝트에서는 dashboard + Git integration 기반 배포가 추적성과 preview 관리 측면에서 더 단순하다.

---

## 5. Frontend에서 BFF로 이어지는 구조

Frontend는 브라우저에서 실행된다. 따라서 API 요청은 사용자의 브라우저에서 BFF public endpoint로 직접 나간다.

```text
Browser on https://lina.vercel.app
  |
  | fetch("https://api.your-domain.com/api/conversations")
  v
Kubernetes Ingress / Gateway
  |
  v
api-gateway-bff service
  |
  +--> backend service
  +--> rag-pipeline service
```

이 구조에서는 Frontend와 BFF가 서로 다른 origin이 된다.

```text
Frontend origin: https://lina.vercel.app
API origin:      https://api.your-domain.com
```

따라서 BFF에서 CORS와 인증 cookie 정책을 명확히 설정해야 한다.

필수 확인 항목:

- BFF CORS allowed origin에 Vercel production domain 추가
- preview deployment를 테스트할 경우 preview domain 허용 전략 결정
- cookie 인증이면 `Secure`, `SameSite=None` 또는 적절한 same-site 전략 확인
- OAuth callback URL에 Vercel production URL 등록
- 관리자 callback과 일반 사용자 callback 흐름 분리 여부 확인

---

## 6. API 연결 방식 선택

### 6.1 권장: API domain을 명시적으로 사용

Frontend 환경 변수에 API base URL을 넣고, API client가 이 값을 기준으로 요청한다.

```text
VITE_API_BASE_URL=https://api.your-domain.com
```

예상 흐름:

```text
Vercel Frontend
  -> https://api.your-domain.com/api/...
  -> Kubernetes Ingress/Gateway
  -> api-gateway-bff
```

장점:

- 구조가 명확하다.
- Vercel과 Kubernetes의 책임이 분리된다.
- API 트래픽을 Kubernetes Gateway/BFF에서 직접 관찰하고 통제하기 쉽다.

주의:

- CORS 설정이 필요하다.
- cookie 기반 인증이면 cross-origin cookie 정책을 신중히 설정해야 한다.

### 6.2 대안: Vercel rewrite로 `/api/*`를 BFF로 proxy

Vercel은 `vercel.json`의 rewrites를 통해 `/api/*` 요청을 외부 origin으로 넘길 수 있다.

예시:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.your-domain.com/api/:path*"
    }
  ]
}
```

이 경우 브라우저 입장에서는 같은 Vercel origin의 `/api/...`를 호출하는 것처럼 보인다.

```text
Browser
  -> https://lina.vercel.app/api/conversations
  -> Vercel rewrite
  -> https://api.your-domain.com/api/conversations
  -> Kubernetes Ingress/Gateway
  -> api-gateway-bff
```

장점:

- 브라우저 코드에서는 same-origin `/api` 호출처럼 보인다.
- 일부 CORS 복잡도를 줄일 수 있다.

주의:

- API traffic이 Vercel을 한 번 더 거쳐 간다.
- SSE streaming, long-running request, auth cookie, cache header 동작을 반드시 검증해야 한다.
- Backend API 관측 시 실제 client IP, forwarded header, proxy 경로를 명확히 처리해야 한다.

현재 LINA 프로젝트에서는 `VITE_API_BASE_URL=https://api.your-domain.com` 방식이 더 명확하다. 필요할 때만 Vercel rewrite를 검토한다.

---

## 7. Kubernetes 쪽 구조

Vercel을 사용하더라도 Kubernetes에는 외부 API 진입점이 필요하다.

권장 구조:

```text
api.your-domain.com
  |
  v
Kubernetes Ingress 또는 Gateway
  |
  v
api-gateway-bff Service
  |
  +--> backend Service
  +--> rag-pipeline Service
  +--> auth/session/user domain
```

Kubernetes에 필요한 주요 리소스:

```text
Ingress 또는 Gateway
api-gateway-bff Deployment / Service
backend Deployment / Service
rag-pipeline Deployment / Service
workers
mysql
mongodb
rabbitmq
valkey
vector-db
```

Frontend pod는 이 목록에서 제외한다.

---

## 8. NGINX의 위치

NGINX를 쓴다면 보통 둘 중 하나다.

### 8.1 NGINX Ingress Controller

Kubernetes cluster 외부에서 들어오는 요청을 내부 service로 라우팅한다.

```text
api.your-domain.com
  -> NGINX Ingress Controller
  -> api-gateway-bff Service
```

이 경우 NGINX는 network ingress 역할이다.

### 8.2 API Gateway / BFF를 NGINX로만 대체하는 것은 비권장

NGINX는 routing, TLS termination, header forwarding, rate limiting 같은 gateway 역할 일부는 가능하다. 하지만 LINA의 BFF는 단순 reverse proxy가 아니라 다음 application logic을 가진다.

- 인증 확인
- 사용자 권한 확인
- Backend와 RAG 요청 조합
- SSE streaming proxy
- 대화 이력 저장 흐름 조정
- 오류 응답 표준화

따라서 NGINX만으로 `api-gateway-bff`를 완전히 대체하기보다는, NGINX/Ingress는 외부 진입점으로 두고 BFF는 별도 application service로 유지하는 구성이 적절하다.

---

## 9. 환경 변수 예시

Vercel production:

```text
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://api.your-domain.com
```

Vercel preview:

```text
VITE_USE_MOCK=true
VITE_API_BASE_URL=
```

또는 preview에서도 backend staging을 붙일 수 있다.

```text
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://staging-api.your-domain.com
```

주의:

- `VITE_*` 환경 변수는 build 결과에 포함되어 브라우저에서 볼 수 있다.
- secret, token, client secret은 `VITE_*`에 넣지 않는다.
- OAuth client secret 같은 민감 정보는 BFF/backend 환경 변수로만 관리한다.

---

## 10. 인증/OAuth에서 확인할 것

Vercel + Kubernetes BFF 구조에서는 인증 callback과 cookie 정책을 먼저 정해야 한다.

예상 흐름:

```text
User
  -> Vercel Frontend Login Page
  -> GET https://api.your-domain.com/api/auth/login
  -> Confluence OAuth
  -> callback to https://api.your-domain.com/api/auth/callback
  -> BFF/backend session 발급
  -> redirect to https://lina.vercel.app/chat
```

관리자 모드:

```text
User
  -> Vercel Frontend Login Page
  -> GET https://api.your-domain.com/api/auth/login?mode=admin
  -> Confluence OAuth
  -> callback
  -> BFF/backend checks role
  -> ADMIN이면 https://lina.vercel.app/admin
  -> 권한 부족이면 login page로 redirect 또는 error 표시
```

확인 항목:

- OAuth provider에 등록할 redirect URI
- 로그인 성공 후 redirect할 Frontend URL
- session cookie domain
- `SameSite`, `Secure`, `HttpOnly` 설정
- preview deployment에서 OAuth를 허용할지 여부

---

## 11. 운영 체크리스트

Frontend/Vercel:

- [ ] Vercel project root를 `frontend`로 설정
- [ ] Framework preset을 `Vite`로 설정
- [ ] Build command가 `npm run build`인지 확인
- [ ] Output directory가 `dist`인지 확인
- [ ] Production env에 `VITE_USE_MOCK=false` 설정
- [ ] Production env에 `VITE_API_BASE_URL=https://api.your-domain.com` 설정
- [ ] secret을 `VITE_*` 환경 변수에 넣지 않음
- [ ] custom domain 연결 여부 결정

Kubernetes/BFF:

- [ ] `api.your-domain.com` DNS가 Ingress/Gateway로 연결됨
- [ ] TLS 인증서 구성
- [ ] Ingress/Gateway가 `api-gateway-bff` service로 라우팅
- [ ] BFF CORS allowed origin에 Vercel production domain 추가
- [ ] preview URL 허용 정책 결정
- [ ] SSE streaming proxy 동작 검증
- [ ] OAuth callback URL과 post-login redirect URL 확정
- [ ] cookie 인증 정책 검증

---

## 12. 참고 자료

- Vercel Hobby Plan: https://vercel.com/docs/accounts/plans/hobby
- Vercel Vite deployment: https://vercel.com/docs/frameworks/frontend/vite
- Vercel deployments overview: https://vercel.com/docs/deployments/overview
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel rewrites: https://vercel.com/docs/rewrites
- Kubernetes Ingress: https://kubernetes.io/docs/concepts/services-networking/ingress
- Kubernetes Ingress Controllers: https://kubernetes.io/docs/concepts/services-networking/ingress-controllers
