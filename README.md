# WSD Assignment 2 – Bookstore API Server

FastAPI 대신 **Express + TypeScript** + **Prisma(PostgreSQL)**로 구현한 전자책/도서 백엔드입니다. JWT 인증, RBAC, 검색/정렬/페이지네이션, 통계, 레이트리밋, Swagger, Postman 컬렉션, 자동화 테스트(21개)를 모두 포함하며 JCloud 배포를 전제로 작성되었습니다.

## DB 선택: PostgreSQL (MySQL 대신)

원 과제 가이드의 예시는 MySQL이지만, 본 프로젝트는 개발/배포의 안정성을 위해 PostgreSQL로 구성했습니다.

- 로컬 환경에서 MySQL 연결/권한 이슈 및 컬럼 길이 제약으로 시드가 자주 실패하는 문제가 있었고, PostgreSQL로 전환해 해결했습니다.
- Prisma 7 드라이버 어댑터 기반 구성에서 PostgreSQL이 가장 단순하고 재현 가능한 세팅이었습니다.

## 프로젝트 개요

- 온라인 서점 도메인: 사용자, 카테고리, 도서, 저자, 주문, 리뷰, 통계
- 총 40개 이상의 REST 엔드포인트
- 일관된 에러 포맷 + 10종 이상의 에러 코드
- Swagger `/docs` & Postman 컬렉션 제공
- Faker 기반 시드 데이터(>200 rows)
- Vitest 21개 테스트 (유틸, 미들웨어, 서비스, 인증)

## 실행 방법

### 로컬 실행 (예시)

```bash
npm install
cp .env.example .env
npx prisma migrate deploy && npm run seed
npm run dev
```

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# DATABASE_URL, JWT 시크릿 등 값 채우기

# 3. Prisma 마이그레이션 및 시드
npx prisma migrate deploy
npm run seed

# 4. 로컬 개발/테스트
npm run dev      # ts-node-dev + tsconfig-paths
npm test        # Vitest 21 tests

# 5. 프로덕션 빌드
npm run build
node dist/main.js
```

### Docker 로 PostgreSQL 실행

```bash
# 1) PostgreSQL 컨테이너 기동
docker compose up -d postgres

# 2) 상태 확인
docker compose logs -f postgres

# 3) DB 준비가 끝나면 마이그레이션/시드
npx prisma migrate deploy
npm run seed
```

로컬에서는 포트 충돌을 피하기 위해 Docker의 PostgreSQL(컨테이너 5432)을 호스트 `15432`로 바인딩합니다.  
`docker-compose.yml`에 정의된 계정(`wsd_user/wsd_pass`)은 `.env(.example)`의 `DATABASE_URL`과 동일합니다. 필요한 경우 두 파일을 함께 수정하세요.

### PM2 / JCloud 예시

```bash
pm2 start dist/main.js --name wsd2-api --env production
pm2 save
```

## 환경변수

| 변수 | 설명 |
| --- | --- |
| `PORT` | 서버 포트 (기본 8080) |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | 32자 이상 시크릿 |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | `15m`, `7d` 형식 지원 |
| `CORS_ORIGIN` | 허용 Origin (`,` 구분, `*` 허용) |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | 전역 레이트리밋 설정 |
| `LOG_LEVEL` | pino 로그 레벨 |
| `SWAGGER_ENABLED` | `true/false` |
| `APP_VERSION` | `/health`에 노출되는 앱 버전(선택) |
| `BUILD_TIME` | `/health`에 노출되는 빌드 시간(선택) |

`.env.example`에 전체 목록과 샘플 값이 포함되어 있습니다.

## 배포 주소

- **Base URL**: `http://113.198.66.68:10237`
- **Swagger**: `http://113.198.66.68:10237/docs`
- **Health**: `http://113.198.66.68:10237/health`

프로덕션 배포 시 포트/도메인 변경이 생기면 이 섹션을 갱신하세요.

## 인증 플로우

1. `POST /auth/login` → Access/Refresh 토큰 발급
2. 보호된 엔드포인트는 `Authorization: Bearer <accessToken>`
3. Access 토큰 만료 시 `POST /auth/refresh`로 토큰 회전 (DB에 기존 Refresh 토큰 revoked)
4. `POST /auth/logout`은 Refresh 토큰 회수

### 역할/권한

| 역할 | 설명 | 주요 권한 |
| --- | --- | --- |
| `USER` | 일반 사용자 | 주문 생성/조회, 리뷰 작성, 위시리스트/라이브러리 관리 |
| `CURATOR` | 운영 담당자 | 도서/카테고리 CRUD, 사용자 검색, 리뷰 모더레이션 |
| `ADMIN` | 시스템 관리자 | 모든 기능 + 역할 변경, 통계 조회 |

관리자 전용 엔드포인트는 최소 3개 이상(`GET /users`, `PATCH /users/:id/role`, `GET /stats/overview` 등)입니다.

## 예제 계정

| 이메일 | 비밀번호 | 역할 |
| --- | --- | --- |
| `admin@example.com` | `P@ssw0rd!` | ADMIN |
| `curator@example.com` | `P@ssw0rd!` | CURATOR |
| `user1@example.com` | `P@ssw0rd!` | USER |

## DB 연결 정보 (예시)

```
Host: localhost
Port: 15432
Database: wsd_assignment
User: wsd_user
Password: ******  (Classroom 비공개 제출)
```

PostgreSQL 접속 예: `psql postgresql://wsd_user:***@localhost:15432/wsd_assignment`

## 엔드포인트 요약

문서 전체는 `docs/api-design.md`와 Swagger에서 확인하세요. 주요 구분:

- **Auth**: `/auth/login`, `/auth/refresh`, `/auth/logout`
- **Users**: CRUD + `/users/me`, `/users/:id/(orders|reviews)`, role/deactivate
- **Categories**: CRUD + `/categories/:id/books`
- **Books**: CRUD + 검색/정렬, `/books/:id/(reviews|related)`
- **Orders**: `/orders`, `/orders/mine`, `/orders/:id/status`, `/orders/:id/items`
- **Reviews**: 관리자 목록/모더레이션, 투표 API
- **Stats**: `/stats/overview`, `/stats/top-books`, `/stats/daily-sales`
- **Health**: `/health`

## Postman & Swagger

- `postman/wsd2.postman_collection.json`
    - 환경 변수: `{{baseUrl}}`, `{{accessToken}}`, `{{refreshToken}}`
    - Pre-request 스크립트로 토큰 자동 주입, Tests 탭에서 응답 검증 5개 이상
- (선택) `postman/wsd2.local.postman_environment.json`
    - 로컬 실행용 Environment 템플릿(`baseUrl` 등)
- Swagger `/docs`
    - zod-to-openapi 기반 자동 스키마
    - 401/403/404/422/500 예시 포함

## 테스트

| 영역 | 테스트 수 |
| --- | --- |
| 유틸/보안 (JWT/비밀번호/Duration/Pagination) | 10 |
| 미들웨어 (JWT 인증) | 3 |
| 서비스 (Users/Orders/Auth) | 8 |

`npm test` 로 실행되며, DB 의존 구간은 Prisma Mock으로 isolation.

## 성능/보안 고려사항

- bcrypt 12 rounds 비밀번호 해시
- JWT + Refresh 토큰 테이블 + RBAC 미들웨어
- Helmet, CORS, JSON body 제한 1MB
- 전역 `express-rate-limit` (응답 429)
- Prisma 인덱스 기반 검색 (email/status/createdAt 등)
- 주문 생성 시 트랜잭션으로 재고 감소 & ActivityLog 기록

## 한계 및 개선 계획

- **실시간 알림**: 현재 REST 기반, SSE/WebSocket 미구현 → 주문 상태 알림 개선 여지
- **서치 엔진**: RDB LIKE 검색 → Elasticsearch 같은 전문 검색 도입 검토
- **캐싱**: 인기 도서/통계는 실시간 계산 → Redis 캐시 적용 예정
- **이미지/파일 업로드**: 미구현
- **End-to-end 테스트**: 현재 unit/service 레벨 → 실제 DB 통합 테스트는 배포 환경에서 진행 필요

## 제출물 정리

| 항목 | 위치 |
| --- | --- |
| Swagger 문서 | `/docs` |
| Postman 컬렉션 | `postman/wsd2.postman_collection.json` |
| DB/아키텍처 문서 | `docs/db-schema.md`, `docs/architecture.md` |
| API 설계 | `docs/api-design.md` |
| 자격 증명 템플릿 | `docs/credentials-template.txt` |
| 테스트 스크립트 | `npm test` |

실제 `.env`와 JCloud 키 파일은 Git에 올리지 말고 Classroom 제출에 포함하세요.
