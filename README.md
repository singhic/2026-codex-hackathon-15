# 15 Fullstack Boilerplate

Next.js App Router, Route Handler, Tailwind CSS v4, shadcn/ui, Supabase를 사용하는 pnpm 풀스택 모노레포입니다.
웹 화면과 Next.js 백엔드 경계, 공유 UI를 분리해 팀원이 같은 설정과 컴포넌트를 사용할 수 있도록 구성했습니다.

## 요구 환경

- Node.js `24.18.0`
- pnpm `11.19.0`

저장소의 `.nvmrc`, `.node-version`, `packageManager`, `engines` 값이 같은 버전을 가리킵니다.

## 시작하기

```bash
pnpm install --frozen-lockfile
pnpm dev
```

웹 애플리케이션은 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 환경 변수

`apps/web/.env.example`을 참고해 `apps/web/.env.local`을 만듭니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
```

Supabase URL과 publishable key는 브라우저에서 사용할 수 있는 공개 설정입니다. `OPENAI_API_KEY`는 서버 전용 값입니다. `NEXT_PUBLIC_` 접두사를 붙이거나 실제 키를 Git에 커밋하지 마세요.
현재 보일러플레이트에는 OpenAI SDK나 API 호출 코드가 포함되어 있지 않습니다.

로컬 Supabase 설정은 Codex에 연결된 프로젝트 범위 MCP에서 가져오며, 실제 값은 Git에서 제외되는 `apps/web/.env.local`에만 저장합니다.

## 워크스페이스

```text
apps/web                     Next.js 애플리케이션
apps/web/app/api             공개 HTTP Route Handler
apps/web/lib/server          서버 비즈니스 로직
apps/web/lib/supabase        브라우저·서버 Supabase 클라이언트
packages/ui                  공유 shadcn/ui 컴포넌트와 전역 스타일
packages/eslint-config       공통 ESLint 설정
packages/typescript-config   공통 TypeScript 설정
```

`@workspace/ui`는 다음 경로만 공개합니다.

- `@workspace/ui/globals.css`
- `@workspace/ui/components/*`
- `@workspace/ui/lib/*`
- `@workspace/ui/hooks/*`

Route Handler에는 요청 검증과 응답 변환만 두고, 비즈니스 로직과 데이터 접근은 각각 `lib/server`, `lib/supabase`로 분리합니다. 같은 Next.js 앱에서 동작하므로 프론트엔드가 내부 API를 호출할 때 별도 CORS 설정은 필요하지 않습니다.

백엔드 경계가 정상 동작하는지는 개발 서버 실행 후 `GET /api/health`로 확인할 수 있습니다. Supabase 공개 설정이 없으면 `503`, 준비되어 있으면 `200`을 반환하며 실제 환경변수 값은 응답에 포함하지 않습니다.

## Route Handler 규칙

- 공개 HTTP 엔드포인트는 `apps/web/app/api/<resource>/route.ts`에 둡니다.
- Route Handler는 입력 검증, 인증·인가 확인, 서비스 호출, HTTP 응답 변환만 담당합니다.
- 비즈니스 로직은 `apps/web/lib/server`, Supabase 접근은 `apps/web/lib/supabase`에 둡니다.
- Server Component는 같은 앱의 Route Handler를 다시 호출하지 않고 서버 모듈이나 Supabase 서버 클라이언트를 직접 사용합니다.
- 오류 응답에는 스택, 환경변수, Supabase 및 OpenAI 응답 원문 같은 내부 정보를 포함하지 않습니다.
- 공개 엔드포인트를 추가한 PR에는 요청·응답 계약과 인증 필요 여부를 함께 기록합니다.

## Supabase 마이그레이션

DB 스키마의 기준은 Dashboard 상태가 아니라 저장소의 `supabase/migrations`입니다. 초기 설정 시 저장소 루트에서 Supabase CLI로 프로젝트를 연결합니다.

```bash
supabase init
supabase link --project-ref <project-ref>
supabase db pull
```

일반적인 스키마 변경 순서는 다음과 같습니다.

```bash
supabase migration new <change-name>
supabase db reset --local
supabase gen types typescript --local > apps/web/lib/supabase/database.types.ts
```

마이그레이션 작업 규칙은 다음과 같습니다.

1. 테이블, 인덱스, 함수, 트리거, RLS 정책 변경은 하나의 migration에 함께 기록합니다.
2. migration과 갱신된 `database.types.ts`는 같은 PR에 포함합니다.
3. Dashboard에서 긴급 변경했다면 다음 작업 전에 `supabase db pull`로 변경 이력을 저장소에 반영합니다.
4. `seed.sql`에는 실제 사용자 정보, 토큰, API 키 등 민감한 데이터를 넣지 않습니다.
5. `supabase db reset --linked`는 원격 데이터를 제거할 수 있으므로 사용하지 않습니다.
6. 검토가 끝난 migration의 원격 반영은 담당자가 병합 후 `supabase db push --linked`로 수행합니다.

## Vercel 배포와 환경변수

Vercel에서 이 모노레포를 연결할 때 Root Directory를 `apps/web`로 지정합니다. 로컬 `.env.local`은 Vercel로 자동 동기화되지 않으므로 Dashboard에서 Development, Preview, Production 값을 각각 관리합니다.

| 변수                                   | 공개 범위     | 적용 환경                                     |
| -------------------------------------- | ------------- | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | 브라우저·서버 | Development, Preview, Production              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저·서버 | Development, Preview, Production              |
| `OPENAI_API_KEY`                       | 서버 전용     | API 기능을 사용하는 환경                      |
| `SUPABASE_SERVICE_ROLE_KEY`            | 서버 전용     | 관리자 기능이 확정된 환경에만 선택적으로 추가 |

- Preview가 운영 데이터에 접근하지 않도록 가능하면 환경별 Supabase 프로젝트를 분리합니다.
- 서버 전용 변수에는 `NEXT_PUBLIC_` 접두사를 붙이지 않으며 Client Component에서 참조하지 않습니다.
- 환경변수 값은 Git, README, PR 본문, 로그에 붙여 넣지 않습니다.
- Vercel 환경변수를 추가하거나 변경한 뒤에는 해당 Preview 또는 Production 배포를 다시 실행합니다.
- Codex Supabase MCP로 가져온 값은 로컬 개발 파일에만 반영되므로 Vercel 값은 별도로 등록하고 검증합니다.

## 명령어

| 명령어              | 설명                                      |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | web 개발 서버 실행                        |
| `pnpm lint`         | 전체 workspace ESLint 검사                |
| `pnpm typecheck`    | Next.js 타입 생성 후 전체 TypeScript 검사 |
| `pnpm build`        | 전체 프로덕션 빌드                        |
| `pnpm check`        | lint, typecheck, build 순차 실행          |
| `pnpm format`       | Prettier로 파일 정리                      |
| `pnpm format:check` | 포맷 변경 없이 검사                       |

## 패키지와 컴포넌트 추가

웹 앱에서만 사용하는 패키지는 web workspace에 추가합니다.

```bash
pnpm --filter web add <package>
```

Supabase 브라우저 및 서버 클라이언트는 web workspace의 `@supabase/supabase-js`, `@supabase/ssr`를 사용합니다.

공유 UI가 직접 import하는 패키지는 UI workspace에 추가합니다.

```bash
pnpm --filter @workspace/ui add <package>
```

shadcn/ui 컴포넌트는 저장소 루트에서 다음 명령으로 추가합니다.

```bash
pnpm dlx shadcn@4.11.0 add <component> -c apps/web
```

CLI는 공유 컴포넌트를 `packages/ui/src/components`에 배치합니다.

## 팀 작업 규칙

1. pnpm만 사용하고 `pnpm-lock.yaml`을 함께 커밋합니다.
2. 의존성을 추가할 때는 PR에 사용 목적과 대상 workspace를 적습니다.
3. 생성 파일과 비밀 값은 `.gitignore` 규칙을 유지합니다.
4. PR을 열기 전에 `pnpm check`를 실제로 실행합니다.
5. `pnpm check`가 성공하지 않았다면 성공으로 표시하지 말고 실패 원인을 공유합니다.
6. Vercel 프로젝트의 Root Directory는 `apps/web`로 지정하고 Development, Preview, Production 환경변수를 각각 관리합니다.
7. Supabase Service Role 키는 RLS를 우회해야 하는 서버 전용 관리 기능이 확정되기 전에는 추가하지 않습니다.
