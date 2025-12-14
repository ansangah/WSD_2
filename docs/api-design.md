# API 설계 개요

## 리소스 개요

| 리소스 | 주요 엔드포인트 | 설명 |
| --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | JWT 기반 인증, 토큰 갱신, 로그아웃 |
| Users | CRUD + 관리 기능 | 회원가입, 자기 정보, RBAC, 관리자 활성/비활성화, 서브 리소스 |
| Categories | CRUD + 계층 구조 | 카테고리 계층과 도서 조회 |
| Books | CRUD + 검색 | 저자/카테고리 검색, 관련 도서, 리뷰 작성 |
| Orders | CRUD + 상태 관리 | 사용자 주문, 관리자 목록/상태 업데이트, 취소 |
| Reviews | 모더레이션 | 관리자 검수, 사용자 투표 |
| Stats | 집계/통계 | 대시보드 KPI, Top 상품, 일별 매출 |
| Health | `GET /health` | 배포 헬스체크 |

총 40개의 HTTP 엔드포인트를 제공하며, 모든 목록 API는 page/size/sort와 최소 2개의 검색 조건(keyword, status 등)을 지원합니다.

## 공통 규격

- **표준 에러 포맷**: `timestamp`, `path`, `status`, `code`, `message`, `details`
- **페이지네이션**: `page`(1-base), `size`(최대 100)
- **정렬**: `sort=field,ASC|DESC`
- **검색**: 리소스별 keyword, status, dateFrom/dateTo 등 2개 이상 필터
- **인증**: `Authorization: Bearer <token>`
- **관리자 전용**: Users, Orders, Reviews, Stats 일부

## 엔드포인트 요약

| 메서드/경로 | 설명 |
| --- | --- |
| `POST /auth/login` | 사용자 로그인, Access/Refresh 토큰 발급 |
| `POST /auth/refresh` | Refresh 토큰 재발급 및 교체 |
| `POST /auth/logout` | Refresh 토큰 회수 |
| `POST /users` | 공개 회원가입 |
| `GET /users` | (ADMIN/CURATOR) 사용자 목록 필터/검색 |
| `GET /users/me` | 내 프로필 |
| `PATCH /users/me` | 내 프로필 수정 |
| `GET /users/:id` | (ADMIN/CURATOR) 사용자 상세 |
| `PATCH /users/:id` | (ADMIN/CURATOR) 사용자 정보 수정 |
| `DELETE /users/:id` | (ADMIN) 소프트 삭제(비활성화) |
| `PATCH /users/:id/role` | (ADMIN) 역할 변경 |
| `PATCH /users/:id/deactivate` | (ADMIN) 강제 비활성화 |
| `GET /users/:id/orders` | (ADMIN/CURATOR) 특정 사용자 주문 |
| `GET /users/:id/reviews` | (ADMIN/CURATOR) 특정 사용자 리뷰 |
| `GET /categories` | 카테고리 전체 + 자식 |
| `POST /categories` | (ADMIN/CURATOR) 카테고리 생성 |
| `GET /categories/:id` | 카테고리 상세 |
| `PATCH /categories/:id` | (ADMIN/CURATOR) 수정 |
| `DELETE /categories/:id` | (ADMIN) 삭제 |
| `GET /categories/:id/books` | 카테고리별 도서 |
| `GET /books` | 도서 목록/검색/정렬 |
| `POST /books` | (ADMIN/CURATOR) 도서 등록 |
| `GET /books/:id` | 도서 상세 + 최근 리뷰 |
| `PATCH /books/:id` | (ADMIN/CURATOR) 도서 수정 |
| `DELETE /books/:id` | (ADMIN) 도서 아카이브 |
| `GET /books/:id/reviews` | 도서 리뷰 |
| `POST /books/:id/reviews` | (USER) 리뷰 작성 |
| `GET /books/:id/related` | 연관 도서 |
| `POST /orders` | (USER) 주문 생성 |
| `GET /orders` | (ADMIN/CURATOR) 주문 목록 |
| `GET /orders/mine` | 내 주문 |
| `GET /orders/:id` | (소유자/관리자) 주문 상세 |
| `PATCH /orders/:id/status` | (ADMIN/CURATOR) 상태 변경 |
| `DELETE /orders/:id` | (USER) 주문 취소 |
| `GET /orders/:id/items` | (소유자/관리자) 주문 품목 |
| `GET /reviews` | (ADMIN/CURATOR) 리뷰 목록 |
| `GET /reviews/:id` | (ADMIN/CURATOR) 리뷰 상세 |
| `PATCH /reviews/:id/status` | (ADMIN/CURATOR) 모더레이션 |
| `POST /reviews/:id/helpful` | 커뮤니티 투표(도움됨) |
| `POST /reviews/:id/not-helpful` | 커뮤니티 투표(도움 안 됨) |
| `GET /stats/overview` | (ADMIN) KPI |
| `GET /stats/top-books` | (ADMIN/CURATOR) 인기 도서 |
| `GET /stats/daily-sales` | (ADMIN/MANAGER) 최근 14일 매출 |
| `GET /health` | 헬스 체크(+uptime) |

## 입력/출력 스키마

- 모든 요청 DTO는 `zod` 스키마로 정의되며 `@asteasolutions/zod-to-openapi`를 통해 Swagger 문서에 자동 반영되었습니다.
- 대표 스키마: `CreateUserInput`, `CreateBookInput`, `CreateOrderInput`, `ReviewResponse`, `OrderResponse` 등

## 에러 코드 표준

- `BAD_REQUEST`, `VALIDATION_FAILED`, `INVALID_QUERY_PARAM`
- `UNAUTHORIZED`, `TOKEN_EXPIRED`
- `FORBIDDEN`
- `RESOURCE_NOT_FOUND`, `USER_NOT_FOUND`
- `DUPLICATE_RESOURCE`, `STATE_CONFLICT`
- `UNPROCESSABLE_ENTITY`
- `TOO_MANY_REQUESTS`
- `DATABASE_ERROR`, `INTERNAL_SERVER_ERROR`, `UNKNOWN_ERROR`

Swagger `/docs`에서는 각 엔드포인트에 대해 400/401/403/404/422/500 응답 예시와 위의 에러 코드를 명시했습니다.
