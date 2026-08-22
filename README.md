# PostPick

PostPick은 매장 운영자가 A/B 포스터 테스트를 만들고, 로그인한 고객의 선택을 받아 결과를 확인하는 서비스입니다. Next.js App Router와 Route Handler, Tailwind CSS v4, shadcn/ui, Supabase를 pnpm·Turborepo 모노레포로 관리합니다.

## 요구 환경

- Node.js `24.18.0`
- pnpm `11.19.0`
- Docker Desktop

저장소의 `.nvmrc`, `.node-version`, `packageManager`, `engines`가 같은 런타임 계약을 가리킵니다. Supabase CLI는 루트 devDependency의 `2.114.0`으로 고정되어 있으므로 전역 설치본 대신 `pnpm supabase`를 사용합니다.

## 시작하기

```bash
pnpm install --frozen-lockfile
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

웹 애플리케이션은 기본적으로 `http://localhost:3000`, 로컬 Supabase API는 `http://127.0.0.1:54321`에서 실행됩니다. 개발을 마치면 `pnpm supabase:stop`으로 로컬 컨테이너를 종료할 수 있습니다.

## 환경변수

`apps/web/.env.example`을 복사해 Git에서 제외되는 `apps/web/.env.local`을 만듭니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 브라우저 사용이 허용된 공개 설정입니다.
- `NEXT_PUBLIC_SITE_URL`은 OAuth callback의 기준 origin입니다. Development, Preview, Production마다 해당 배포 origin으로 설정합니다.
- `OPENAI_API_KEY`는 서버 전용 계약입니다. 현재 OpenAI SDK와 API 호출 구현은 포함하지 않습니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 MVP 환경변수 계약에 포함하지 않습니다. 브라우저와 Route Handler는 사용자 세션으로만 Supabase에 접근합니다.
- 실제 키를 Git, README, PR, 로그에 기록하지 않습니다.

로컬 공개 키는 `pnpm supabase status -o env`로 확인할 수 있습니다. 이 명령의 출력에는 로컬 개발용 비밀도 포함되므로 출력 전체를 공유하거나 커밋하지 마세요.

## 워크스페이스와 백엔드 경계

```text
apps/web                     Next.js 보일러플레이트와 Route Handler
apps/web/lib/server          HTTP와 분리된 서버 서비스·오류 변환
apps/web/lib/supabase        타입이 적용된 브라우저·서버 클라이언트
packages/ui                  공유 shadcn/ui 컴포넌트·스타일·유틸리티
packages/eslint-config       공통 ESLint 설정
packages/typescript-config   공통 TypeScript 설정
supabase/migrations          DB 스키마·RLS·RPC·Cron의 기준 기록
supabase/tests/database      pgTAP 스키마·트랜잭션 테스트
supabase/tests/integration   동시성 테스트용 로컬 fixture
```

`@workspace/ui`는 `globals.css`, `components/*`, `lib/*`, `hooks/*`만 외부에 공개합니다. 웹 앱 전용 의존성은 `apps/web`, 공유 UI가 직접 사용하는 의존성은 `packages/ui`에 추가합니다.

서버 경계는 다음 원칙을 따릅니다.

- Route Handler는 세션 확인, 입력 검증, RPC 호출, HTTP 상태 변환만 담당합니다.
- 데이터 불변식과 원자 트랜잭션은 PostgreSQL Database Function에서 보장합니다.
- Server Component는 내부 Route Handler를 HTTP로 다시 호출하지 않고 같은 서버 서비스 계층을 사용합니다.
- `private` 테이블, service role, Supabase·OpenAI 오류 원문을 브라우저에 노출하지 않습니다.
- 진행 현황은 15초 폴링과 포커스 복귀 재조회로 구현하며 응답은 `Cache-Control: private, no-store`를 사용합니다.

## 인증 계약

가입·로그인은 Google OAuth만 허용합니다. 호스팅 Supabase에서 Email, Phone, Kakao 가입을 비활성화하고 `before-user-created` Auth Hook을 함께 활성화해야 합니다.

로그인·온보딩·업무 페이지, OAuth callback, 보호 경로와 화면별 이동 규칙은 프론트엔드 팀 범위이므로 이 백엔드 작업에는 포함하지 않습니다. 프론트엔드는 Supabase Auth 세션으로 아래 HTTP API를 호출하며, Redirect URL과 배포 origin은 프론트엔드 구현 및 배포 환경에서 관리합니다.

## HTTP API

프론트엔드 연동 순서, 요청·응답 타입, 화면별 호출표, 포스터 업로드, 오류·재시도 규칙은 [프론트엔드 API 연동 가이드](docs/frontend-api-integration.md)를 기준으로 구현합니다.

주요 공개 계약은 다음과 같습니다. 모든 도메인 API는 로그인 세션을 요구합니다.

```text
GET      /api/health
GET|POST /api/owner/stores
GET|POST /api/owner/stores/[storeId]/tests
PATCH    /api/owner/stores/[storeId]/tests/[testId]
POST     /api/owner/stores/[storeId]/tests/[testId]/start
POST     /api/owner/stores/[storeId]/tests/[testId]/cancel
GET      /api/owner/stores/[storeId]/tests/[testId]/progress
GET      /api/owner/stores/[storeId]/tests/[testId]/results
POST     /api/vote/[slug]
POST     /api/vote/[slug]/detail-view
GET      /api/vote/[slug]/result
GET|PATCH /api/me/profile
GET|POST /api/me/consents
GET      /api/me/rewards
GET      /api/owner/wallet
```

`GET /api/health`는 환경변수 존재 여부뿐 아니라 제한된 익명
`api.healthcheck()` RPC를 호출해 실제 Supabase DB 연결까지 확인합니다. 연결
실패 또는 3초 초과 시 HTTP 503과 `status: "degraded"`를 반환합니다.

테스트 시작·예약 취소·투표 요청에는 클라이언트가 만든 UUID `idempotencyKey`가 필요합니다. 테스트 포스터는 비공개 `test-posters` 버킷에 직접 업로드한 뒤 option endpoint로 경로를 확정하며, 조회 시 사용자 세션으로 10분짜리 signed URL을 발급합니다.

## Supabase 구조와 마이그레이션

- `api`: Data API에 노출하는 안정적인 RPC만 둡니다.
- `public`: 프로필, 약관, 카탈로그, 매장, 테스트와 옵션을 둡니다. 모든 테이블에 RLS가 켜져 있습니다.
- `private`: 원본 투표, 상세 조회 영수증, 운영자 크레딧·고객 포인트 원장, 정산을 둡니다. `anon`, `authenticated`에 스키마 직접 접근을 허용하지 않습니다.

운영자 크레딧과 고객 보상 포인트는 서로 다른 append-only 원장으로 관리합니다. 테스트 가격은 목표 30/50/70/100명에 각각 5,000/7,000/8,000/10,000 크레딧이며 운영기간과 무관합니다. 목표 미달 종료 시 유효 투표 비율만 사용 처리하고 나머지를 운영자 가상 크레딧으로 반환합니다.

처음 원격 프로젝트를 연결할 때만 다음을 실행합니다.

```bash
pnpm supabase link --project-ref <project-ref>
pnpm supabase db pull
```

일반 변경 흐름은 다음과 같습니다.

```bash
pnpm supabase migration new <change-name>
pnpm db:check
pnpm supabase:types
pnpm supabase db push --dry-run
```

마이그레이션 규칙:

1. Dashboard의 현재 상태가 아니라 `supabase/migrations`를 스키마 기준 기록으로 사용합니다.
2. migration, pgTAP, 갱신된 `database.types.ts`를 같은 PR에 포함합니다.
3. Dashboard 긴급 변경은 다음 작업 전에 `pnpm supabase db pull`로 저장소에 반영합니다.
4. `seed.sql`에는 공개 카탈로그만 두고 사용자 정보·토큰·키를 넣지 않습니다.
5. `db reset --linked`처럼 원격 데이터를 지울 수 있는 명령은 사용하지 않습니다.
6. `db push --dry-run` 결과를 검토한 뒤 담당자가 원격 migration을 적용합니다.
7. 예약 활성화와 만료 정산은 `private.advance_test_lifecycle()` 및 1분 주기 Supabase Cron이 담당합니다.

## DB 검증

```bash
pnpm supabase:reset
pnpm supabase:lint
pnpm supabase:test
pnpm supabase:test:integration
pnpm db:check
```

`supabase:test`는 스키마·권한·RLS·Storage·원장·정산을 pgTAP으로 검사합니다. `supabase:test:integration`은 Node 내장 테스트 러너와 `@supabase/supabase-js`로 실제 PostgREST에 동시 투표를 보내 동일 멱등 키와 서로 다른 키 경쟁을 검증합니다. 두 명령 모두 실행 중인 로컬 Supabase가 필요합니다.

## Vercel과 Supabase 운영 설정

Vercel 프로젝트의 Root Directory는 `apps/web`로 지정하고 Development, Preview, Production 환경변수를 각각 관리합니다. 로컬 `.env.local`은 자동 동기화되지 않습니다.

| 변수                                   | 공개 범위     | 적용 환경                          |
| -------------------------------------- | ------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | 브라우저·서버 | Development, Preview, Production   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저·서버 | Development, Preview, Production   |
| `OPENAI_API_KEY`                       | 서버 전용     | OpenAI 기능을 실제 사용하는 환경만 |

- Supabase Data API exposed schema를 `api`만 남기고 `public`, `private`를 제외합니다.
- Auth Redirect URL에는 localhost, 정확한 운영 도메인, 필요한 범위로 제한한 Vercel Preview 패턴만 등록합니다.
- Preview가 운영 데이터에 접근하지 않도록 가능하면 환경별 Supabase 프로젝트를 분리합니다.
- Vercel 환경변수 변경 후 해당 Preview 또는 Production을 다시 배포합니다.
- Production 반영 전 Google 외 신규 가입 거부, Auth Hook, RLS, 비공개 Storage, Cron 실행 이력을 다시 확인합니다.

## 공통 명령어

| 명령어              | 설명                                      |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | web 개발 서버 실행                        |
| `pnpm lint`         | 전체 workspace ESLint 검사                |
| `pnpm typecheck`    | Next.js 타입 생성 후 TypeScript 검사      |
| `pnpm build`        | 프로덕션 빌드                             |
| `pnpm check`        | lint, typecheck, build 순차 실행          |
| `pnpm format`       | Prettier로 파일 정리                      |
| `pnpm format:check` | 포맷 변경 없이 검사                       |
| `pnpm db:check`     | 로컬 DB reset, lint, pgTAP, 동시성 테스트 |

## 패키지와 팀 작업 규칙

```bash
pnpm --filter web add <package>
pnpm --filter @workspace/ui add <package>
pnpm dlx shadcn@4.11.0 add <component> -c apps/web
```

1. pnpm만 사용하고 `pnpm-lock.yaml`을 함께 커밋합니다.
2. 의존성을 추가할 때 PR에 사용 목적과 대상 workspace를 기록합니다.
3. 실제 `.env.local`, `.next`, `.turbo`, 로컬 Supabase 임시 상태를 커밋하지 않습니다.
4. PR 전 `pnpm db:check`와 `pnpm check`를 실제 실행합니다.
5. 실행하지 않았거나 실패한 검증을 성공으로 표시하지 않습니다.
6. 원격 migration, Auth provider, Redirect URL, exposed schema 변경은 적용 대상 프로젝트와 검토 결과를 PR에 남깁니다.
