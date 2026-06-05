# Landing Page (SCR-100) 구현 가이드

확정 방향: **White 배경 + Cute XL 로고** — 풀스크린 큐트 로고 + 지식 그래프 + 스냅 덱 전환

프로토타입 원본: `frontend/landing-concepts.html`

---

## 1. 라이브러리 설치

```bash
npm install gsap
```

폰트는 그냥 프리텐다드 쓰고 싶어.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@200;300;400;500;600;700&family=Spline+Sans+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
```

---

## 2. 에셋

| 파일 | 용도 |
|---|---|
| `frontend/assets/logo-lina-cute_files/logo-lina-cute4.png` | 패널 1 풀스크린 로고 (투명 PNG) |
| `frontend/assets/logo-lina-ver3.png` | 패널 2 소형 로고, 브랜드마크 (투명 PNG) |
| `frontend/assets/mascot.png` | 로그인 패널 헤더 마스코트 |
| `frontend/assets/confluence-icon.png` | 로그인 버튼 아이콘 |

에셋은 기존 `src/shared/assets.ts`에 Vite import로 추가한다.

```ts
import logoLinaCute4Url from '../../frontend/assets/logo-lina-cute_files/logo-lina-cute4.png'
import logoLinaVer3Url from '../../frontend/assets/logo-lina-ver3.png'

export { logoLinaCute4Url, logoLinaVer3Url }
```

---

## 3. 컴포넌트 구조

`LandingPage.vue`가 이미 존재하므로 하위 컴포넌트를 분리해 조립한다.

```
src/pages/LandingPage.vue          ← 스냅 덱 컨테이너, 라우팅
  src/features/landing/
    LandingHero.vue                ← 패널 1: 로고 + 그래프 + acronym
    LandingHeadline.vue            ← 패널 2: eyebrow + headline + subline
  src/pages/LoginPage.vue          ← 패널 3: 기존 로그인 화면 (재사용)
```

LoginPage는 이미 구현되어 있으므로 스냅 덱 안에 임베드하거나 라우팅으로 전환한다. 임베드 방식을 권장한다(스냅 전환이 자연스러움).

---

## 4. LandingPage.vue — 스냅 덱 구조

```vue
<template>
  <div class="deck" ref="deckRef">
    <LandingHero class="panel p1" @scroll-next="scrollToPanel(1)" />
    <LandingHeadline class="panel p2" @scroll-next="scrollToPanel(2)" />
    <!-- 로그인은 기존 LoginPage 콘텐츠를 패널로 임베드 -->
    <section class="panel login">
      <LoginPageContent />
    </section>
  </div>
</template>
```

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import LandingHero from '@/features/landing/LandingHero.vue'
import LandingHeadline from '@/features/landing/LandingHeadline.vue'
import LoginPageContent from '@/features/auth/LoginPageContent.vue'

const deckRef = ref<HTMLElement | null>(null)

function scrollToPanel(index: number) {
  const panels = deckRef.value?.querySelectorAll('.panel')
  panels?.[index].scrollIntoView({ behavior: 'smooth' })
}

// IntersectionObserver로 패널 진입 시 각 컴포넌트의 애니메이션 트리거
// → 각 컴포넌트에서 expose된 playAnim() 호출
</script>
```

**CSS — 스냅 덱 (scoped 또는 global)**

```css
.deck {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}
.deck::-webkit-scrollbar { display: none; }

.panel {
  position: relative;
  height: 100vh;
  overflow: hidden;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
```

> **주의**: `html, body`에 `overflow: hidden`을 설정해야 스냅 덱 외부 스크롤이 발생하지 않는다. 다른 페이지로 이동 시 반드시 해제한다(router guard에서 처리).

---

## 5. LandingHero.vue — 패널 1

### 역할
- 풀스크린 큐트 로고 (`logo-lina-cute4.png`)
- 로고 글자 위치에 겹치는 acronym 텍스트: `inked / ntelligence / avigation / gent`
- 지식 그래프 (SVG 엣지 + DOM 노드, rAF 추적)
- 노드 ambient float 애니메이션

### 핵심 CSS

```css
/* 패널 1 배경: 쿨 그레이화이트 */
.p1 {
  background: radial-gradient(140% 120% at 50% 50%, #f8f8f9 0%, #ededef 55%, #e4e4e6 100%);
}

/* XL 로고: 화면 거의 다 차게 */
.lina-xl {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(94vw, 1060px);
  opacity: 0; /* GSAP으로 fade-in */
}
.lina-xl img { display: block; width: 100%; height: auto; }

/* acronym 텍스트: 로고 이미지 위에 오버레이, 글자 수직 중앙 */
/* 이미지 비율 941/1672 = 56.3% → 글자 수직 중심 ≈ 52% */
.acr-xl {
  position: absolute;
  left: 0; right: 0;
  top: 52%;
  transform: translateY(-50%);
  height: 0; /* 레이아웃 영향 없음 */
  pointer-events: none;
}
.acr-xl .word {
  position: absolute;
  transform: translateX(-50%);
  font: 300 11px/1 'Spline Sans Mono';
  letter-spacing: .28em;
  text-transform: uppercase;
  color: rgba(0,0,0,.5);
  overflow: hidden;
  height: 0; opacity: 0; /* GSAP으로 등장 */
}
/* 각 글자 가로 중심 (logo-lina-cute4.png 기준) */
.wl { left: 12%; }
.wi { left: 37%; }
.wn { left: 62%; }
.wa { left: 87%; }
```

> **주의**: `.acr-xl`의 `left` 퍼센트는 `logo-lina-cute4.png` (1672×941px)의 각 글자 시각적 중심점을 측정한 값이다. 로고 이미지가 교체되면 다시 측정해야 한다.

### 입장 애니메이션 (GSAP)

```ts
import gsap from 'gsap'

function playAnim() {
  const linaXL = linaXLRef.value
  const words = [...acrXLRef.value.querySelectorAll('.word')]
  
  gsap.set(words, { height: 0, opacity: 0 })
  
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl
    .fromTo(linaXL, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 1.3, ease: 'power2.out' }, 0)
    .to(words, { height: '1.2em', opacity: 1, duration: 0.5, stagger: 0.18, ease: 'power2.out' }, 1.0)
    .to(brandMarkRef.value, { opacity: 1, duration: 0.5 }, '-=.4')
    .to(scrollCueRef.value, { opacity: 1, duration: 0.5 }, '<')
}
```

### 지식 그래프 구현 (rAF 기반)

그래프는 **SVG 엣지(선) + DOM 노드(div)** 구조다. 노드는 `%` 좌표로 배치하고, `requestAnimationFrame`으로 매 프레임 노드의 `getBoundingClientRect()`를 읽어 SVG 선의 `x1/y1/x2/y2`를 갱신한다.

```ts
// 노드 위치 (% 기준, HUB 중심 50,43)
const SCATTER = [
  [50,15],[70,23],[31,25],[82,38],[18,43],
  [62,40],[39,47],[86,60],[14,64],[74,69],[33,73],[57,80]
]
const ZS = [.7,1,.62,.85,.55,.95,.7,.8,.58,.88,.66,.92] // 깊이값

// 교차 링크 (hub→all 외 추가 연결)
const CROSS = [[0,1],[2,4],[3,5],[6,9],[8,10],[7,11],[1,3],[0,5],[2,6],[9,11]]

// hub 엣지는 각 노드 컬러로, cross 엣지는 rgba(0,0,0,.04)
// 노드 dot: size = 5 + z*9 (가까울수록 크게)
// 노드 blur: (1 - z) * 1.4px (멀수록 흐리게) → 깊이감
// 노드 opacity: .28 + z*.62
```

ambient float (hover 없음):
```ts
nodeEls.forEach((n, i) => {
  gsap.to(n.el, {
    x: gsap.utils.random(-14, 14),
    y: gsap.utils.random(-12, 12),
    duration: gsap.utils.random(5, 9),
    repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.14
  })
})
```

> **주의**: `onUnmounted`에서 반드시 `cancelAnimationFrame(raf)`를 호출한다. 호출하지 않으면 라우팅 후에도 rAF가 계속 실행된다.

---

## 6. LandingHeadline.vue — 패널 2

### 역할
- 소형 로고 상단 배치 (`logo-lina-ver3.png`)
- eyebrow: `Ask · Search · Verify`
- 헤드라인: 단어별 stagger 등장 + `verify` 밑줄 드로우
- 서브라인 fade-in

### 핵심 구조

```html
<div class="eyebrow">Ask · Search · Verify</div>
<h1 class="headline">
  <span class="w">Ask,</span>
  <span class="w">search,</span>
  <span class="w">and</span>
  <span class="w av"><span class="accent">verify</span><i class="ul"></i></span>
  <span class="w">knowledge</span>
  <span class="w">across</span>
  <span class="w">your</span>
  <span class="w">workspace.</span>
</h1>
<p class="subline">Confluence 문서를 자연어로 검색하고, 답변과 출처를 함께 확인하세요.</p>
```

```css
.headline {
  font: 300 54px/1.16 'Hanken Grotesk', sans-serif;
  letter-spacing: -.02em;
  color: #16161a;
}
.headline .accent { color: #F48122; font-weight: 400; }
/* verify 밑줄: scaleX 0→1 드로우 */
.headline .ul {
  position: absolute; left: 0; right: 0; bottom: .04em;
  height: 2px; background: #F48122; border-radius: 2px;
  transform: scaleX(0); transform-origin: left;
}
```

### 입장 애니메이션

```ts
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
gsap.set(ulRef.value, { scaleX: 0 })
tl
  .fromTo(linaSmRef.value, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: .7 }, 0)
  .fromTo(eyebrowRef.value, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5 }, .1)
  .fromTo('.headline .w', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .65, stagger: .05 }, .15)
  .to(ulRef.value, { scaleX: 1, duration: .55, ease: 'power2.out' }, '-=.3')
  .fromTo(sublineRef.value, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5 }, '-=.25')
```

---

## 7. 패널 진입 트리거 — IntersectionObserver

각 패널의 애니메이션은 **해당 패널이 55% 이상 보일 때** 실행한다. 같은 패널이 연속으로 트리거되지 않도록 `activePanel` 인덱스로 guard한다.

```ts
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= 0.55) {
        const i = panels.indexOf(e.target as HTMLElement)
        if (i !== activePanel) {
          activePanel = i
          animFns[i]()
        }
      }
    })
  },
  { root: deckRef.value, threshold: [0.55] }
)
panels.forEach(p => io.observe(p))
```

> **주의**: `onUnmounted`에서 `io.disconnect()`를 호출한다.

---

## 8. 라우팅 연결

```ts
// src/router/index.ts
{ path: '/', name: 'landing', component: () => import('@/pages/LandingPage.vue') },
{ path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue') },
```

- LandingPage에서 로그인 패널(패널 3)은 `LoginPage` 콘텐츠를 인라인으로 임베드한다.
- 또는 패널 3 스냅 진입 시 `router.push('/login')`으로 전환해도 된다(스냅 애니메이션 포기 시).
- `feature12`에서 구현한 `LoginPage`의 역할 선택 로직(`isRoleSelectionOpen`, `continueWithRole`)을 그대로 재사용한다.

---

## 9. 주의사항 및 함정

### overflow: hidden 충돌
`ChatPage`와 `AdminPage`는 `overflow` 설정이 다르다. `LandingPage` 진입/이탈 시 `body` overflow를 토글해야 한다.

```ts
// LandingPage.vue
onMounted(() => { document.body.style.overflow = 'hidden' })
onUnmounted(() => { document.body.style.overflow = '' })
```

### GSAP 인스턴스 정리
`buildP1Graph()`가 반환하는 `stop()` (rAF 취소)와 GSAP 트윈은 컴포넌트 언마운트 시 정리한다. 정리하지 않으면 라우팅 후 메모리 누수와 오류가 발생한다.

```ts
onUnmounted(() => {
  graphInstance.stop()      // rAF cancelAnimationFrame
  gsap.killTweensOf('*')    // 또는 컨텍스트 단위로 ctx.revert()
  io.disconnect()
})
```

GSAP Context를 쓰면 더 안전하다:
```ts
const ctx = gsap.context(() => { /* 모든 애니메이션 */ }, rootRef)
onUnmounted(() => ctx.revert())
```

### acr-xl 위치 튜닝
`.acr-xl`의 `top: 52%`는 `logo-lina-cute4.png` 기준이다. 로고 이미지가 바뀌면 다시 조정해야 한다. 해상도별로 글자 위치가 달라질 수 있으니 `onResize`에서 보정 로직을 넣는 것도 고려한다.

### 폰트 로딩 완료 전 애니메이션
폰트가 늦게 로드되면 첫 애니메이션이 시스템 폰트로 렌더링된다. `document.fonts.ready`를 기다린 후 애니메이션을 시작한다.

```ts
onMounted(async () => {
  await document.fonts.ready
  playAnim()
})
```

### scroll-snap과 router.push 충돌
스냅 스크롤 중에 `router.push`를 호출하면 전환이 끊길 수 있다. 로그인 패널을 인라인 임베드 방식으로 구현하면 이 문제를 피할 수 있다.

### prefers-reduced-motion
```ts
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (reduced) {
  // 애니메이션 없이 최종 상태로 즉시 세팅
  gsap.set([linaXL, ...words, brandMark, scrollCue], { opacity: 1, height: 'auto' })
  return
}
```

---

## 10. 구현 순서 권장

1. `npm install gsap` 및 폰트 추가
2. `src/shared/assets.ts`에 새 에셋 export 추가
3. `LandingPage.vue` 스냅 덱 구조 작성 (3패널)
4. `LandingHero.vue` — 로고 + 그래프 (그래프 먼저, 애니메이션 나중)
5. `LandingHeadline.vue` — 헤드라인 레이아웃 → 애니메이션
6. `LoginPage` 콘텐츠 패널 3 임베드
7. IntersectionObserver 연결
8. `onMounted/onUnmounted` 정리 코드
9. `prefers-reduced-motion` 대응
10. 라우팅 연결 및 overflow 토글
