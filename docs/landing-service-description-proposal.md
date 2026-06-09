# Headline 섹션 → 서비스 설명 교체 제안

> 기존 `landing-headline-panel`을 서비스 설명 섹션으로 교체한다.
> 섹션 추가 없이 기존 구조(Hero → 서비스설명 → Login) 유지.

---

## 현재 vs 교체 후

**현재 Headline 섹션**
- 태그라인: `Ask · Search · Verify`
- 헤드라인: `Ask, search, and verify knowledge across your workspace.`
- 설명: `Confluence 문서를 자연어로 검색하고, 답변과 출처를 함께 확인하세요.`

→ 감성적이지만 "LINA가 뭘 해주는 도구인지" 구체적으로 전달이 안 됨.

**교체 후 목표**
- 처음 보는 사람도 스크롤 한 번에 "아, 이런 거구나" 파악
- 상업적 SaaS 제품처럼 기능이 눈에 보여야 함
- 기존 라이트 톤 + 깔끔한 레이아웃 유지

---

## 레이아웃 옵션 3가지

---

### Option A — 헤드라인 + 3열 카드 (추천)

전체 섹션을 feature showcase로 바꾼다. 상단에 짧은 가치 문장, 하단에 카드 3개.
가장 흔하지만 가장 검증된 B2B SaaS 패턴.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   HOW IT WORKS                      ← 레이블 칩          │
│                                                          │
│   Confluence 안의 지식을,            ← 헤드라인 2줄       │
│   질문 하나로 꺼내세요.                                    │
│                                                          │
│   답변이 필요할 때 동료에게 묻는 대신  ← 서브텍스트 1줄    │
│   LINA에게 물어보세요.                                     │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ Ask        │  │ Search     │  │ Verify     │         │
│  │            │  │            │  │            │         │
│  │ 자연어로    │  │ 문서 전체를 │  │ 답변 옆에  │         │
│  │ 질문하세요. │  │ 실시간 탐색 │  │ 출처 확인  │         │
│  └────────────┘  └────────────┘  └────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**카드 내용 (최종 카피)**

| 카드 | 타이틀 | 설명 |
|------|--------|------|
| 1 | Ask | 키워드가 기억나지 않아도 됩니다. 묻고 싶은 내용을 그냥 쓰면 됩니다. |
| 2 | Search | Confluence 공간 전체를 실시간으로 탐색해 가장 관련 높은 문서를 찾아냅니다. |
| 3 | Verify | 모든 답변에 출처 문서가 함께 제공됩니다. 직접 확인하고 공유하세요. |

---

### Option B — 2열 스플릿 레이아웃

왼쪽에 큰 헤드라인, 오른쪽에 기능 목록. 텍스트 비중이 높아 정보 전달에 유리.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Confluence를          │  ✓ 자연어로 질문                │
│  더 똑똑하게            │    키워드 없이도 원하는 답변     │
│  활용하는 방법.         │                                 │
│                        │  ✓ 전체 문서 실시간 탐색        │
│  팀의 지식을            │    흩어진 정보를 한 번에        │
│  낭비하지 마세요.       │                                 │
│                        │  ✓ 출처 제공으로 신뢰도 확보    │
│                        │    답변 근거를 바로 확인         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### Option C — 숫자 + 한 줄 설명 (심플)

텍스트 최소화. 숫자와 레이블로만 구성. 임팩트가 강하지만 정보량이 적음.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Confluence 지식, 이제 3초 안에.                         │
│                                                          │
│       질문       →       탐색       →      검증           │
│                                                          │
│   자연어 한 줄       문서 전체 스캔      출처 자동 첨부    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 최종 추천 방향: Option A

이유:
- 기존 `Ask · Search · Verify` 태그라인을 카드 타이틀로 자연스럽게 계승
- 섹션 하나에서 "무엇을 하는 도구인가"를 시각적으로 완결
- 카드 형식은 향후 기능 추가 시 확장이 쉬움

---

## 구현 코드 (Option A)

기존 `landing-headline-panel` 섹션 전체를 아래로 교체:

```vue
<section
  data-testid="landing-headline-panel"
  class="relative flex h-screen snap-start snap-always flex-col items-center justify-center overflow-hidden px-6 text-center"
  aria-label="LINA 서비스 소개"
>
  <!-- 레이블 칩 -->
  <p class="text-button uppercase tracking-[0.2em] text-overlay-dark-40">How it works</p>

  <!-- 메인 헤드라인 -->
  <h1 class="mt-5 max-w-2xl text-[48px] font-light leading-tight text-overlay-dark-80">
    Confluence 안의 지식을,<br />
    <span class="relative inline-block text-primary">
      질문 하나로
      <span class="absolute inset-x-0 bottom-1 h-0.5 rounded-tag bg-primary" aria-hidden="true" />
    </span>
    꺼내세요.
  </h1>

  <!-- 서브텍스트 -->
  <p class="mt-6 text-body text-overlay-dark-40">
    답변이 필요할 때 동료에게 묻는 대신, LINA에게 물어보세요.
  </p>

  <!-- 기능 카드 3열 -->
  <div class="mt-12 grid w-full max-w-3xl grid-cols-3 gap-5">
    <div
      v-for="feature in features"
      :key="feature.title"
      class="flex flex-col items-start gap-3 rounded-card border border-bg-300 bg-primary-white px-6 py-7 text-left transition hover:shadow-sm"
    >
      <span class="text-sm font-semibold tracking-widest text-primary uppercase">
        {{ feature.title }}
      </span>
      <p class="text-body text-overlay-dark-60">{{ feature.description }}</p>
    </div>
  </div>

  <!-- 스크롤 CTA (기존 유지) -->
  <button
    type="button"
    class="absolute bottom-16 left-1/2 inline-flex -translate-x-1/2 flex-col items-center gap-2 text-button font-normal text-overlay-dark-40 transition hover:text-overlay-dark-80 focus-visible:outline-none focus-visible:shadow-focus"
    @click="scrollToLoginPanel"
  >
    <span>scroll</span>
    <span class="text-xl leading-none" aria-hidden="true">⌄</span>
  </button>

  <footer class="absolute inset-x-0 bottom-8 text-center text-button font-normal text-overlay-dark-40">
    ©2026 LINA | SKALA
  </footer>
</section>
```

```ts
// script setup에 추가
const features = [
  {
    title: 'Ask',
    description: '키워드가 기억나지 않아도 됩니다. 묻고 싶은 내용을 그냥 쓰면 됩니다.',
  },
  {
    title: 'Search',
    description: 'Confluence 공간 전체를 실시간으로 탐색해 가장 관련 높은 문서를 찾아냅니다.',
  },
  {
    title: 'Verify',
    description: '모든 답변에 출처 문서가 함께 제공됩니다. 직접 확인하고 공유하세요.',
  },
] as const;
```

---

## 디자인 디테일 체크리스트

- [ ] 카드 배경 `bg-primary-white` — Hero/Login의 `bg-bg-100`과 미묘하게 구분
- [ ] 카드 border `border-bg-300` — 그림자 없이 선만으로 구분 (그림자+선 동시 사용 금지)
- [ ] feature 타이틀 `uppercase tracking-widest` — 브랜드 일관성 유지
- [ ] 헤드라인 강조 스팬은 기존 Headline 섹션 스타일 그대로 계승
- [ ] 카드 hover는 `shadow-sm`만 — 과한 인터랙션은 오히려 저렴해 보임
