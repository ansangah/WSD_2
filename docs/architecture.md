# 애플리케이션 아키텍처

## 계층 구조

```
src
├─ app.ts / main.ts           # Express 초기화 / 서버 부트스트랩
├─ config/                    # env, swagger(openapi), registry
├─ core/                      # Prisma, logger, error helpers
├─ middleware/                # auth, rate-limit, error, validator
├─ modules/
│   ├─ auth/
│   ├─ users/
│   ├─ categories/
│   ├─ books/
│   ├─ orders/
│   ├─ reviews/
│   └─ stats/
├─ routes/                    # 라우터 등록
├─ utils/                     # jwt, password, pagination 등 공통 유틸
└─ scripts/seed.ts            # DB 시드
```

- **Configuration**: `.env` → `config/env.ts` (zod 검증) → 필요한 모듈에서 DI 없이 import
- **OpenAPI**: `config/swagger.ts`에서 `OpenAPIRegistry`를 공유하고 각 모듈이 path/schema를 등록
- **Error Handling**: `core/errors.ts`의 `ApiError` + 미들웨어 조합으로 모든 오류를 표준 JSON으로 반환
- **Logging**: `pino` + `pino-http`, `ActivityLog` 테이블로 사용자 행동 로깅
- **Rate Limiting**: 전역 `express-rate-limit` (+429 응답)
- **Persistence**: Prisma Client (singleton). 서비스 레이어에서만 직접 접근하도록 모듈화.
- **Security**: bcrypt 비밀번호, JWT (access/refresh) + RBAC, Helmet/CORS, request body size 제한

## 데이터 흐름 예시

1. **로그인**
    - `POST /auth/login` → `auth.router` → `auth.service.login`
    - 이메일로 사용자 조회 → bcrypt 비교 → JWT 발급 → RefreshToken 테이블 기록 → ActivityLog 기록
2. **주문 생성**
    - `POST /orders` → 인증 미들웨어 → zod 입력 검증
    - `orders.service.createOrder`에서 도서 재고 조회 → 트랜잭션으로 주문/품목 생성 + 재고 감소
    - 완료 후 ActivityLog 기록 → 응답
3. **도서 검색**
    - `GET /books` → query 검증 → `books.service.listBooks`
    - Prisma `findMany`에서 pagination/sort/filter(카테고리, 작가, 가격 범위)를 조합

## 비동기 / 성능 고려사항

- Prisma `$transaction`으로 주문 생성 시 데이터 정합성 확보
- 중복 요청 방지를 위해 unique 인덱스 활용(email, isbn13 등)
- Books/Orders/Reviews 목록은 인덱스를 기반으로 pagination
- ActivityLog는 별도 테이블로 audit trail을 유지
- Rate limit + helmet + cors 설정으로 기본적인 보안 hardening

## 테스트 전략

- `Vitest` + `supertest` (단위/통합 혼합)
- Prisma 레이어는 mock을 사용해 서비스 로직을 검증
- 유틸/미들웨어는 순수 함수 수준에서 검증

## 배포

- `npm run build` 로 `dist` 생성 → `node dist/main.js`
- PM2/systemd 등으로 프로세스 관리 (README 참조)
- Swagger: `/docs`, Health: `/health`
