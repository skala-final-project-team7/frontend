# Confluence Admin Key API 테스트 결과 정리

작성일: 2026-06-02  
작성 목적: Confluence API 수집 단계에서 Admin Key를 사용할 경우 권한 제한 페이지까지 조회 가능한지, API 응답에 본문/메타데이터/권한 정보가 어떤 형태로 나타나는지 확인

> 주의: 본 문서에는 Atlassian API Token, 이메일, 실제 인증값을 포함하지 않는다. 테스트 중 생성한 임시 TSV 파일은 삭제 대상이며 커밋하지 않는다.

---

## 1. 테스트 배경

Agent/RAG 데이터 수집 단계에서 Confluence 문서를 가져올 때 다음 사항을 확인할 필요가 있었다.

1. API Key/API Token을 통해 데이터를 받았을 때 page 데이터가 어떤 형식으로 내려오는가?
2. 관리자 권한 계정에서 Admin Key를 사용하면, 일반 사용자 권한으로는 조회할 수 없는 페이지도 API로 가져올 수 있는가?
3. 페이지 조회 응답에 해당 페이지의 조회 권한 정보도 함께 포함되는가?
4. 권한 정보 및 기타 메타데이터는 어떤 API에서 어떤 형식으로 확인할 수 있는가?

이번 테스트는 위 질문에 답하기 위한 실제 Confluence Cloud API 호출 테스트다.

---

## 2. 테스트 환경

- Confluence Cloud Premium 플랜
- 테스트 계정: site/admin 권한 보유 계정
- 인증 방식: Atlassian email + Atlassian API Token
- Admin Key 적용 방식:
  - `POST /api/v2/admin-key`로 Admin Key 활성화
  - 이후 API 호출에 `Atl-Confluence-With-Admin-Key: true` header 추가
- 테스트 작업 디렉토리:
  - `/Users/younghoonlee/workspace_git/confluence_api_test_tmp`
  - git repository 밖의 임시 디렉토리

환경변수 형태:

```bash
export CONF_BASE_URL="https://{site}.atlassian.net/wiki"
export ATLASSIAN_EMAIL="{admin-email}"
export ATLASSIAN_API_TOKEN="{api-token}"
```

Admin Key는 별도의 고정 문자열 key가 아니다. 관리자 계정의 API Token으로 Admin Key 기능을 활성화한 뒤, 요청 header에 다음 값을 붙이는 방식이다.

```text
Atl-Confluence-With-Admin-Key: true
```

---

## 3. 테스트 절차

### 3.1 일반 API Token으로 페이지 목록 조회

Admin Key 없이 현재 계정의 일반 조회 권한 기준으로 페이지 목록을 조회했다.

```bash
curl -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  "$CONF_BASE_URL/api/v2/pages?limit=10&body-format=storage" \
  | jq .
```

요약 출력:

```bash
curl -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  "$CONF_BASE_URL/api/v2/pages?limit=10&body-format=storage" \
  | jq -r '.results[] | "\(.id)\t\(.spaceId)\t\(.title)\t\(.["_links"].webui)"'
```

확인된 첫 10개 페이지:

```text
229475  229378  개요  /spaces/~71202091b5112c7df44d37a47e2109344ee81d/overview
458764  491523  [장애대응] DynamoDB 쓰로틀링 - 2025-08-30  /spaces/ai27Rev1/pages/458764/DynamoDB+-+2025-08-30
458785  491523  [장애대응] Route53 DNS 전파 지연 - 2025-10-15  /spaces/ai27Rev1/pages/458785/Route53+DNS+-+2025-10-15
458808  491523  GCP 운영 매뉴얼  /spaces/ai27Rev1/pages/458808/GCP
458835  491523  📂 DevOps Engineering  /spaces/ai27Rev1/pages/458835/DevOps+Engineering
458859  491523  ADR-001: Vector DB 선정 - Qdrant  /spaces/ai27Rev1/pages/458859/ADR-001+Vector+DB+-+Qdrant
491616  491523  ai_2반_7팀_Rev1 Home  /spaces/ai27Rev1/overview
491715  491523  Cloud 운영 문서  /spaces/ai27Rev1/pages/491715/Cloud
491741  491523  EKS Pod 리소스 가이드라인 및 Right-Sizing  /spaces/ai27Rev1/pages/491741/EKS+Pod+Right-Sizing
491775  491523  📂 Cloud Control Center  /spaces/ai27Rev1/pages/491775/Cloud+Control+Center
```

### 3.2 Admin Key 활성화

```bash
curl -i -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -X POST \
  "$CONF_BASE_URL/api/v2/admin-key" \
  --data '{"durationInMinutes":60}'
```

응답:

```text
HTTP/2 200
```

응답 body:

```json
{
  "accountId": "712020:91b5112c-7df4-4d37-a47e-2109344ee81d",
  "expirationTime": "2026-06-02T01:56:43.174Z"
}
```

의미:

- Admin Key 활성화 성공
- 지정된 만료 시간까지 Admin Key header 사용 가능

### 3.3 Admin Key header를 붙여 페이지 목록 조회

```bash
curl -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  -H "Atl-Confluence-With-Admin-Key: true" \
  "$CONF_BASE_URL/api/v2/pages?limit=10&body-format=storage" \
  | jq -r '.results[] | "\(.id)\t\(.spaceId)\t\(.title)\t\(.["_links"].webui)"'
```

첫 10개 결과는 일반 호출과 동일했다. 따라서 전체 목록 비교를 진행했다.

### 3.4 일반 호출과 Admin Key 호출의 전체 page id 비교

민감한 본문은 저장하지 않고, 비교용으로 `id`, `spaceId`, `title`, `webui`만 TSV 파일에 저장했다.

일반 호출:

```bash
curl -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  "$CONF_BASE_URL/api/v2/pages?limit=250" \
  | jq -r '.results[] | "\(.id)\t\(.spaceId)\t\(.title)\t\(.["_links"].webui)"' \
  > normal_pages.tsv
```

Admin Key 호출:

```bash
curl -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  -H "Atl-Confluence-With-Admin-Key: true" \
  "$CONF_BASE_URL/api/v2/pages?limit=250" \
  | jq -r '.results[] | "\(.id)\t\(.spaceId)\t\(.title)\t\(.["_links"].webui)"' \
  > admin_pages.tsv
```

개수 비교:

```bash
wc -l normal_pages.tsv admin_pages.tsv
```

결과:

```text
232 normal_pages.tsv
237 admin_pages.tsv
469 total
```

Admin Key에서만 보이는 page id:

```bash
comm -13 \
  <(cut -f1 normal_pages.tsv | sort) \
  <(cut -f1 admin_pages.tsv | sort)
```

결과:

```text
7798785
7798794
8454146
8519682
8781825
```

Admin Key에서만 보이는 페이지 상세:

```bash
grep -Ff \
  <(comm -13 <(cut -f1 normal_pages.tsv | sort) <(cut -f1 admin_pages.tsv | sort)) \
  admin_pages.tsv
```

결과:

```text
7798785  491523  페이지 2026-06-01 15:05  /spaces/ai27Rev1/pages/7798785/2026-06-01+15+05
7798794  491523  영훈없음  /spaces/ai27Rev1/pages/7798794
8454146  491523  프론트 엔드 작업 규칙 - Q&A  /spaces/ai27Rev1/pages/8454146/-+Q+A
8519682  491523  프론트엔드  /spaces/ai27Rev1/pages/8519682
8781825  491523  프론트엔드 정의서  /spaces/ai27Rev1/pages/8781825
```

---

## 4. 특정 제한 페이지 직접 조회 테스트

테스트 대상:

```bash
export TEST_PAGE_ID="7798794"
```

페이지:

```text
7798794 | 영훈없음
```

### 4.1 일반 API Token으로 직접 조회

```bash
curl -i -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  "$CONF_BASE_URL/api/v2/pages/$TEST_PAGE_ID?body-format=storage"
```

응답:

```text
HTTP/2 404
```

응답 body:

```json
{
  "errors": [
    {
      "status": 404,
      "code": "NOT_FOUND",
      "title": "Not Found",
      "detail": null
    }
  ]
}
```

해석:

- 일반 권한으로는 페이지가 존재하지 않는 것처럼 보인다.
- Confluence는 권한 없는 페이지에 대해 403이 아니라 404를 반환할 수 있다.

### 4.2 Admin Key로 직접 조회

```bash
curl -i -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  -H "Atl-Confluence-With-Admin-Key: true" \
  "$CONF_BASE_URL/api/v2/pages/$TEST_PAGE_ID?body-format=storage"
```

응답:

```text
HTTP/2 200
```

응답 일부:

```json
{
  "parentType": "folder",
  "spaceId": "491523",
  "parentId": "8126465",
  "createdAt": "2026-06-01T07:05:30.582Z",
  "ownerId": "712020:d54eba09-60a7-4fe9-9ec7-3892d80e841d",
  "authorId": "712020:d54eba09-60a7-4fe9-9ec7-3892d80e841d",
  "version": {
    "number": 1,
    "authorId": "712020:d54eba09-60a7-4fe9-9ec7-3892d80e841d",
    "createdAt": "2026-06-01T07:05:56.625Z",
    "ncsStepVersion": "1"
  },
  "position": 271,
  "status": "current",
  "body": {
    "storage": {
      "representation": "storage",
      "value": ""
    }
  },
  "title": "영훈없음",
  "id": "7798794",
  "_links": {
    "webui": "/spaces/ai27Rev1/pages/7798794"
  }
}
```

해석:

- 일반 호출에서는 404였던 페이지가 Admin Key 호출에서는 200으로 조회된다.
- Admin Key를 사용하면 일반 조회 권한이 없는 페이지도 API로 가져올 수 있음을 확인했다.

---

## 5. Page API 응답 데이터 형식

`/api/v2/pages?body-format=storage` 또는 `/api/v2/pages/{pageId}?body-format=storage` 응답에서 확인한 주요 필드:

| 필드 | 설명 |
|---|---|
| `id` | Confluence page id |
| `title` | 페이지 제목 |
| `spaceId` | Confluence space id |
| `parentId` | 상위 page/folder id |
| `parentType` | 상위 객체 타입. 예: `page`, `folder`, `null` |
| `createdAt` | 생성 시각 |
| `ownerId` | 소유자 accountId |
| `authorId` | 작성자 accountId |
| `version.number` | 페이지 version |
| `version.authorId` | 해당 version 작성자 |
| `version.createdAt` | 해당 version 생성 시각 |
| `status` | 페이지 상태. 예: `current` |
| `body.storage.representation` | 본문 representation. 예: `storage` |
| `body.storage.value` | Confluence storage-format 본문 HTML/XML |
| `_links.webui` | 웹 UI 상대 경로 |
| `_links.editui`, `_links.edituiv2`, `_links.tinyui` | 편집/축약 링크 |

확인한 특징:

- 본문은 `body.storage.value`에 들어온다.
- 형식은 일반 HTML과 Confluence macro XML이 섞인 storage format이다.
- 페이지 조회 응답에는 `ownerId`, `authorId`, `version`, `createdAt`, `spaceId`, `parentId` 등 메타데이터가 포함된다.
- 그러나 page 조회 응답 자체에는 `allowed_users`, `allowed_groups`, `restrictions`, `permissions` 같은 상세 조회 권한 정보가 직접 포함되지 않는다.

---

## 6. 권한 정보 조회 테스트

권한 정보는 page 조회 API가 아니라 restriction API로 별도 조회했다.

테스트 명령:

```bash
curl -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  -H "Atl-Confluence-With-Admin-Key: true" \
  "$CONF_BASE_URL/rest/api/content/$TEST_PAGE_ID/restriction/byOperation/read" \
  | jq .
```

`7798794 | 영훈없음` 응답 요약:

```json
{
  "operation": "read",
  "restrictions": {
    "user": {
      "results": [
        {
          "accountId": "712020:b5462b07-2cca-4777-a836-2c053fe5e2e0",
          "displayName": "신유진",
          "accountStatus": "active"
        },
        {
          "accountId": "712020:d54eba09-60a7-4fe9-9ec7-3892d80e841d",
          "displayName": "sunny",
          "accountStatus": "active"
        },
        {
          "accountId": "712020:fc737f4a-5998-4622-b3fd-42ad13e118f9",
          "displayName": "최태성",
          "accountStatus": "active"
        }
      ],
      "size": 3
    },
    "group": {
      "results": [],
      "size": 0
    }
  }
}
```

해석:

- `7798794`는 page-level read restriction이 걸려 있다.
- 읽기 허용 대상 user는 3명이다.
- group 단위 restriction은 없다.
- 테스트 계정은 이 user restriction 목록에 없으므로 일반 조회에서는 404가 발생했다.
- Admin Key 호출에서는 해당 restriction을 우회해 조회가 가능했다.

---

## 7. Admin Key 전용 페이지 5개 restriction 요약

Admin Key에서만 보인 5개 페이지에 대해 read restriction을 조회했다.

요약 명령:

```bash
for id in $(comm -13 <(cut -f1 normal_pages.tsv | sort) <(cut -f1 admin_pages.tsv | sort)); do
  title=$(grep "^$id	" admin_pages.tsv | cut -f3)
  echo "===== $id | $title ====="
  curl -sS \
    -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
    -H "Accept: application/json" \
    -H "Atl-Confluence-With-Admin-Key: true" \
    "$CONF_BASE_URL/rest/api/content/$id/restriction/byOperation/read" \
    | jq -r '{
        user_size: .restrictions.user.size,
        users: [.restrictions.user.results[].displayName],
        group_size: .restrictions.group.size,
        groups: [.restrictions.group.results[].name]
      }'
done
```

결과 요약:

| pageId | title | read user restriction | read group restriction | 해석 |
|---|---|---|---|---|
| `7798785` | 페이지 2026-06-01 15:05 | `sunny`, `이다연` | 없음 | page-level read restriction 존재 |
| `7798794` | 영훈없음 | `신유진`, `sunny`, `최태성` | 없음 | page-level read restriction 존재 |
| `8454146` | 프론트 엔드 작업 규칙 - Q&A | 없음 | 없음 | page 자체 restriction 없음. 상위 folder/page 또는 space permission 영향 가능 |
| `8519682` | 프론트엔드 | `신유진`, `sunny` | 없음 | page-level read restriction 존재 |
| `8781825` | 프론트엔드 정의서 | 없음 | 없음 | page 자체 restriction 없음. 상위 folder/page 또는 space permission 영향 가능 |

중요한 해석:

- Admin Key로만 보인 5개 중 3개는 page-level read restriction이 명확히 확인됐다.
- 2개는 page 자체 restriction은 없지만 일반 조회에서는 보이지 않았다.
- 이 경우 상위 folder/page restriction 또는 space permission 계층에서 접근이 제한되었을 가능성이 높다.
- 따라서 RAG ingestion에서 정확한 ACL을 만들려면 단일 page restriction만 보는 것으로는 부족할 수 있다.

---

## 8. Admin Key 비활성화

테스트 종료 후 Admin Key를 비활성화했다.

```bash
curl -i -sS \
  -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -X DELETE \
  "$CONF_BASE_URL/api/v2/admin-key"
```

응답:

```text
HTTP/2 204
```

의미:

- Admin Key 비활성화 정상 완료

---

## 9. 임시 파일 처리

테스트 중 생성한 파일:

```text
normal_pages.tsv
admin_pages.tsv
```

이 파일들은 page id/title/webui만 포함하지만, 테스트 산출물이므로 커밋하지 않는다. 테스트 종료 후 삭제한다.

```bash
rm -f normal_pages.tsv admin_pages.tsv
```

환경변수도 필요 시 제거한다.

```bash
unset CONF_BASE_URL
unset ATLASSIAN_EMAIL
unset ATLASSIAN_API_TOKEN
unset TEST_PAGE_ID
```

---

## 10. 질문별 결론

### Q1. API Key/API Token을 통해 데이터를 받았을 때 보이는 데이터 형식은?

`/api/v2/pages` 응답은 다음 구조다.

```json
{
  "results": [
    {
      "id": "...",
      "title": "...",
      "spaceId": "...",
      "parentId": "...",
      "parentType": "...",
      "createdAt": "...",
      "ownerId": "...",
      "authorId": "...",
      "version": {
        "number": 1,
        "authorId": "...",
        "createdAt": "..."
      },
      "status": "current",
      "body": {
        "storage": {
          "representation": "storage",
          "value": "<p>...</p>"
        }
      },
      "_links": {
        "webui": "..."
      }
    }
  ],
  "_links": {
    "next": "...",
    "base": "..."
  }
}
```

본문은 `body.storage.value`에 들어오며, Confluence storage-format HTML/XML이다.

### Q2. Admin Key를 사용하면 조회 권한이 없는 페이지도 받아지는가?

예. 확인됐다.

일반 API Token:

```text
GET /api/v2/pages/7798794?body-format=storage
HTTP/2 404
```

Admin Key header 포함:

```text
GET /api/v2/pages/7798794?body-format=storage
Atl-Confluence-With-Admin-Key: true
HTTP/2 200
```

전체 목록 비교에서도 일반 호출 232개, Admin Key 호출 237개로 5개 페이지 차이가 확인됐다.

### Q3. 받은 각 데이터에 조회 권한도 함께 명시되어 나타나는가?

아니오. page 조회 응답에는 권한 정보가 직접 포함되지 않는다.

page 응답에는 본문과 기본 메타데이터가 포함되지만, 다음과 같은 권한 필드는 직접 오지 않았다.

```text
allowed_users
allowed_groups
restrictions
permissions
```

권한 정보는 별도 restriction endpoint를 호출해야 한다.

```bash
GET /rest/api/content/{pageId}/restriction/byOperation/read
```

### Q4. 권한 및 모든 메타데이터는 어떤 형식으로 나타나는가?

페이지 메타데이터:

- `/api/v2/pages`
- `/api/v2/pages/{pageId}?body-format=storage`
- page object 내부 필드로 제공
- 예: `id`, `title`, `spaceId`, `parentId`, `parentType`, `createdAt`, `ownerId`, `authorId`, `version`, `status`, `_links`

권한/restriction 정보:

- `/rest/api/content/{pageId}/restriction/byOperation/read`
- `restrictions.user.results[]`
- `restrictions.group.results[]`
- user restriction 예시:

```json
{
  "accountId": "...",
  "displayName": "신유진",
  "accountStatus": "active"
}
```

group restriction은 이번 테스트 대상에서는 모두 비어 있었다.

---

## 11. Agent/RAG ingestion 관점의 시사점

### 11.1 Admin Key 수집은 가능하지만 ACL 저장이 필수

Admin Key를 사용하면 일반 사용자 권한으로 볼 수 없는 페이지까지 수집할 수 있다. 따라서 ingestion pipeline은 더 넓은 문서 집합을 확보할 수 있다.

하지만 RAG 검색/응답 단계에서 사용자별 접근 통제를 지키려면, 수집 시 각 페이지의 권한 정보를 함께 저장해야 한다.

즉, 단순히 Admin Key로 모든 페이지를 수집만 하면 안 된다. 수집한 페이지별로 ACL metadata를 구성해야 한다.

예상 payload 필드:

```json
{
  "page_id": "7798794",
  "space_key": "ai27Rev1",
  "allowed_users": [
    "712020:b5462b07-2cca-4777-a836-2c053fe5e2e0",
    "712020:d54eba09-60a7-4fe9-9ec7-3892d80e841d",
    "712020:fc737f4a-5998-4622-b3fd-42ad13e118f9"
  ],
  "allowed_groups": []
}
```

### 11.2 page-level restriction만으로는 부족할 수 있음

이번 테스트에서 `8454146`, `8781825`는 page-level read restriction이 비어 있었지만, 일반 호출에서는 보이지 않고 Admin Key에서만 보였다.

따라서 접근 제한 원인이 다음 계층에 있을 수 있다.

- 상위 folder/page restriction
- space permission
- 기타 Confluence 권한 계층

정확한 ACL을 만들려면 page 자체 restriction뿐 아니라 상위 계층 권한까지 고려해야 한다.

### 11.3 현재 ai-agent 구현과의 연결

현재 `ai-agent` ingestion/RAG 계약은 Qdrant payload에 다음 ACL 필드를 둔다.

```text
allowed_groups
allowed_users
space_key
```

이번 테스트 결과를 반영하면, 실제 Confluence 연동 단계에서는 다음이 필요하다.

1. Admin Key로 page body와 기본 metadata 수집
2. 각 page별 read restriction 조회
3. user/group restriction을 `allowed_users`, `allowed_groups`로 변환
4. page 자체 restriction이 없는 경우 상위 folder/page/space permission까지 확인할지 정책 결정
5. Qdrant payload에 ACL metadata 저장
6. `/ml/query` 검색 시 BFF가 전달한 `userId`, `groups`, `spaceKey`로 ACL pre-filtering 수행

---

## 12. 최종 결론

이번 실습으로 다음을 확인했다.

1. Confluence API는 page 본문과 기본 메타데이터를 `/api/v2/pages`에서 제공한다.
2. 본문은 `body.storage.value`에 storage-format HTML/XML로 들어온다.
3. 일반 API Token 호출은 현재 계정이 볼 수 있는 페이지만 반환한다.
4. Admin Key를 활성화하고 `Atl-Confluence-With-Admin-Key: true` header를 붙이면 일반 권한으로 보이지 않는 페이지도 조회된다.
5. 실제로 일반 호출 232개, Admin Key 호출 237개로 5개 차이가 확인됐다.
6. 특정 페이지 `7798794 | 영훈없음`은 일반 호출 404, Admin Key 호출 200으로 확인됐다.
7. 페이지 조회 응답에는 권한 정보가 직접 포함되지 않는다.
8. 권한 정보는 `/rest/api/content/{pageId}/restriction/byOperation/read`에서 별도로 조회해야 한다.
9. page-level read restriction은 user/group 단위로 확인 가능하다.
10. 일부 페이지는 page-level restriction이 비어 있어도 일반 조회에서 제외될 수 있으므로, 상위 folder/page 또는 space permission까지 고려해야 한다.
11. RAG ingestion에서 Admin Key를 사용할 경우, 전체 문서 수집은 가능하지만 ACL metadata 저장과 query-time filtering이 필수다.

