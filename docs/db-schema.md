# DB 스키마 (Bookstore)

## 개요

- **DB**: PostgreSQL 16 (Prisma ORM, host port 15432)
- **PK 전략**: 모든 테이블 `cuid()` 문자열 PK
- **시간 필드**: `createdAt`, `updatedAt`, 필요 시 `deletedAt`
- **관계**: 다대다(`book_authors`, `book_categories`), 감사 로그(`activity_logs`)

## 주요 테이블

### users
| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | CHAR | PK |
| email | VARCHAR(255) | Unique 로그인 |
| passwordHash | VARCHAR | bcrypt 결과 |
| name | VARCHAR | 실명 |
| birthDate | DATETIME | 선택 |
| gender | VARCHAR | 선택 |
| role | ENUM(USER, CURATOR, ADMIN) | RBAC |
| status | ENUM(ACTIVE, INACTIVE, SUSPENDED) | 계정 상태 |
| region | VARCHAR | 거주 지역 |
| lastLoginAt | DATETIME | 마지막 로그인 |

연관 테이블: `refresh_tokens`, `orders`, `reviews`, `carts`, `wishlists`, `user_library`, `activity_logs`.

### refresh_tokens
| 필드 | 설명 |
| --- | --- |
| token | 저장된 refresh token (unique) |
| userAgent / deviceInfo / ipAddress | 클라이언트 메타 |
| expiresAt / revoked | 만료 및 회수 정보 |

### categories
- 계층 구조 지원 (`parentId` FK → self)
- `book_categories` 를 통해 책과 다대다 매핑

### authors
- 작가 기본 정보 (`name`, `biography`)
- `book_authors` 로 책과 매핑 (`authorOrder`로 정렬 유지)

### books
| 필드 | 설명 |
| --- | --- |
| isbn13 | Unique ISBN (선택) |
| title / description | 기본 정보 |
| price | DECIMAL(10,2) |
| stock | Int 재고 |
| languageCode / pageCount / coverUrl / publishedAt | 메타데이터 |
| avgRating / reviewCount | 통계 컬럼 (비동기 업데이트) |
| deletedAt | Soft delete |

연관:
- `book_authors` : 다대다
- `book_categories` : 다대다
- `reviews`, `order_items`, `cart_items`, `wishlist`, `user_library`

### reviews
| 필드 | 설명 |
| --- | --- |
| rating | 1~5 |
| title / body | 리뷰 내용 |
| likeCount / commentCount | 집계 |
| deletedAt | 모더레이션을 위한 소프트 삭제 |

연관:
- `review_likes` (user별 helpful)
- `comments` (nested 구조)

### comments / comment_likes
- `parentCommentId` 로 대댓글 지원
- `comment_likes` 로 좋아요/취소 추적

### wishlists / user_library
- `wishlists`: 사용자가 찜한 도서 (unique userId+bookId)
- `user_library`: 소장한 도서, `acquiredAt`, `source` 기록

### carts / cart_items
- `cart.status`: ACTIVE / CHECKED_OUT / ABANDONED
- 각 `cart_item` 은 책과 수량, 단가를 보관

### orders / order_items
| 필드 | 설명 |
| --- | --- |
| status | ENUM(PENDING, PAID, FULFILLED, CANCELLED, REFUNDED) |
| itemTotal / discountTotal / shippingFee / totalAmount | 비용 구성 |
| customerNameSnapshot / customerEmailSnapshot | 당시 사용자 정보 |
| cancelledAt | 취소 시각 |

`order_items` 는 각 책의 `titleSnapshot`, `unitPrice`, `quantity`, `subtotal`을 저장.

### activity_logs
- `userId`, `action`, `metadata(JSON)` 기록
- 로그인/주문 생성 등 감사 추적

## 인덱스 & 제약

- `users`: `email`, `role`, `status` 인덱스
- `books`: `title`, `publishedAt`, soft delete 필터
- `book_authors`, `book_categories`: `@@unique([bookId, authorId])`, `@@unique([bookId, categoryId])`
- `refresh_tokens`: `token` unique + `userId`, `expiresAt` 인덱스
- `order_items`, `cart_items`: FK 인덱스

## 시드 데이터

`src/scripts/seed.ts` 생성 항목:
- Admin + Curator + 30명의 사용자
- 카테고리 12개, 작가 40명
- 책 150권 (카테고리/작가 다대다)
- 주문 70건, 리뷰 120건

시드는 Faker 기반으로 생성되며, 실 DB 초기화 시 `npm run seed` 실행.*** End Patch
