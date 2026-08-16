# Repository Working Agreements

- JavaScript와 TypeScript 작업에는 pnpm을 사용합니다.
- 큰 변경 전에는 기존 파일을 확인하고 변경 의도를 요약합니다.
- 의존성을 조용히 추가하지 말고, 사용 목적과 대상 workspace를 명시합니다.
- 변경 후 `pnpm typecheck`와 관련 검증을 실행합니다.
- 요청 범위를 벗어난 추측성 리팩터링은 하지 않습니다.
- 실행하지 않은 명령을 성공했다고 말하지 않습니다.
- 제품 동작을 바꾸는 요구가 모호하면 가정을 명시합니다.
- 변경은 현재 작업 범위에 한정합니다.

## Next.js

현재 Next.js 버전의 API와 규칙은 `node_modules/next/dist/docs/`를 우선 확인합니다.
학습 데이터의 오래된 관례보다 저장소에 설치된 문서와 deprecation 안내를 따릅니다.
