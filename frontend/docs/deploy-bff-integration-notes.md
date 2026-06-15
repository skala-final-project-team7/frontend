# 배포 시 BFF 연동 주의사항

이 문서는 Frontend를 실제 BFF와 연결해 배포할 때 확인해야 할 API 계약 및 런타임 주의사항을 정리한다. 기준 문서는 `docs/api-spec.md` v2.6.2이다.

## 대화 메뉴 API 계약

채팅 케밥 메뉴의 고정, 이름 변경, 삭제 기능은 mock 전용 동작이 아니라 실제 API 함수에 연결되어 있다.

- 고정 토글: `PATCH /api/conversations/{conversationId}` body `{ "isPinned": true | false }`
- 이름 변경: `PATCH /api/conversations/{conversationId}` body `{ "title": "..." }`
- 삭제: `DELETE /api/conversations/{conversationId}`

삭제 성공 응답은 API spec과 동일하게 Common Response wrapper 내부 `data: null`을 기대한다.

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "대화 삭제 성공",
  "data": null
}
```

Frontend의 `apiRequest()`는 성공 응답의 `data`만 반환하므로 BFF는 모든 JSON API에서 Common Response wrapper 형식을 유지해야 한다. SSE 채팅 endpoint는 spec대로 wrapper를 적용하지 않는다.

## BFF 연결 시 우선 확인 항목

1. 인증 헤더

   3단계 인증이 활성화되면 `Authorization: Bearer {accessToken}` 헤더가 필수다. 현재 Frontend API wrapper와 SSE 요청에는 JWT를 자동 첨부하는 구현이 아직 없다. 인증 적용 배포 전 access token 저장, request header 주입, 만료 시 refresh 흐름을 먼저 연결해야 한다.

2. 로그인 콜백과 세션 저장

   API spec은 로그인/갱신 응답의 `accessToken`, `refreshToken`을 FE가 보관한다고 정의한다. 현재 로그인 화면은 `/api/auth/login` 진입 URL만 연결되어 있으며, callback 후 토큰 저장 및 refresh token 회전 처리는 별도 연결이 필요하다.

3. PATCH payload 검증

   `PATCH /api/conversations/{conversationId}`는 `title` 또는 `isPinned` 중 하나 이상이 필요하다. 현재 UI 호출부는 둘 중 하나를 항상 넣지만, BFF는 빈 body `{}`에 대해 `400 INVALID_REQUEST`를 반환하는 것이 안전하다.

4. 대화 삭제 후 목록 정합성

   Frontend는 삭제 성공 직후 로컬 대화 목록에서 해당 대화를 제거한다. BFF도 soft delete된 대화를 `GET /api/conversations`와 `GET /api/conversations/search` 결과에서 제외해야 한다.

5. SSE 완료 이벤트와 서버 messageId

   `POST /api/conversations/{conversationId}/chat`의 `done` 이벤트는 `messageId`를 반환한다. 실제 BFF 연동 후 assistant 메시지의 서버 저장 ID가 피드백 기능에 올바르게 사용되는지 확인해야 한다.

## 배포 전 체크리스트

- `GET /api/conversations` 응답에서 `isPinned`, `lastMessageAt`, pagination 필드가 spec과 일치한다.
- `PATCH /api/conversations/{conversationId}` 응답에서 `conversationId`, `title`, `isPinned`, `updatedAt`을 반환한다.
- `DELETE /api/conversations/{conversationId}` 응답에서 `data: null`을 반환한다.
- Common Response 실패 응답은 `isSuccess`, `code`, `errorCode`, `message` 4필드를 유지한다.
- 인증 활성화 환경에서는 JSON API와 SSE 요청 모두 Bearer JWT를 포함한다.
- SSE는 `status`, `token`, `sources`, `verification`, `meta`, `done`, `error` 이벤트 계약을 유지한다.
