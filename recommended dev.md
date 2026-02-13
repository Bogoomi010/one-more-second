# Recommended Development Plan

## 프로젝트 현황 요약
- 제품 요약:
  - React + TypeScript 기반 브라우저 게임.
  - 로컬 프로필/랭킹(LocalStorage) + Firebase 연동 시 클라우드 인증/점수/프로필 동기화.
- 아키텍처 요약:
  - 프론트엔드 단일 앱(CRA) + Firebase Auth/Firestore(BaaS) + Vercel 정적 배포.
  - 별도 백엔드 서버 없이 클라이언트가 Firestore에 직접 접근.
- Firebase 사용 방식:
  - 인증: Google Popup 로그인.
  - 데이터: `users/{uid}`, `users/{uid}/achievements/*`, `users/{uid}/daily/*`, `scoreSubmissions/*`.
  - 랭킹 조회: `scoreSubmissions` 직접 조회 후 클라이언트에서 중복 제거/정렬.
- 배포 구조:
  - CRA 빌드 결과를 Vercel에서 정적 호스팅.
- 발견된 위험 요소:
  - 랭킹 탭 전환/갱신 시 Firestore 읽기량 증가 가능(무료 플랜 한도 소진 위험).
  - 점수/닉네임 검증이 대부분 클라이언트에 있어 악의적 입력 방어가 약함.
  - 공개 컬렉션 구조(`scoreSubmissions` 읽기 공개)로 개인정보/운영 리스크 존재.
  - 일부 문자열/주석 인코딩 깨짐 정황(운영 환경에서 UX/가독성 저하 가능).
- 검토한 주요 경로:
  - `src/lib/firebase.ts`
  - `src/services/authService.ts`
  - `src/services/userDataService.ts`
  - `src/services/rankingService.ts`
  - `src/components/RankingPanel.tsx`
  - `src/pages/Game/components/ScoreSubmitModal.tsx`
  - `src/pages/Game/index.tsx`
  - `src/context/AuthContext.tsx`
  - `firebase/firestore.rules`
  - `firebase/firestore.indexes.json`

## 개선 우선순위 제안 목록

### 1) Cloud Functions 기반 리더보드 Materialization 도입
- 무엇을 바꿀 것인가:
  - `scoreSubmissions` 원본을 직접 조회하지 않고, 집계 컬렉션(`leaderboard_global`, `leaderboard_country_{code}`, `leaderboard_daily_{date}`)을 읽도록 전환.
  - 점수 제출 시 함수(트리거/Callable)에서 정규화 및 Top N 유지.
- 필요 이유:
  - 현재는 랭킹 조회마다 다량 문서 읽기 + 클라이언트 중복 제거를 수행해 비용과 지연이 커짐.
- Firebase 영향:
  - 읽기 비용 크게 감소(랭킹 조회 1~수개 문서 수준으로 축소 가능).
  - 쓰기/함수 호출 비용은 증가하지만 트래픽 증가 시 총비용 안정화에 유리.
- Vercel 영향:
  - 프론트는 조회 대상 컬렉션만 교체하면 되어 배포 구조 영향 작음.
- 영향 범위:
  - `src/services/rankingService.ts`, `firebase/firestore.rules`, (신규) `functions/*`.
- 작업 규모 / 위험도:
  - L / 중간.
- 프로젝트 구조 영향:
  - Firebase Functions 디렉터리 및 배포 파이프라인 추가 필요.
- 예상 사이드 이펙트:
  - 랭킹 반영 지연(수 초) 가능.
- 대응 방안:
  - 제출 직후 로컬 optimistic 업데이트 + 다음 주기 동기화.
- 점진적 적용 전략:
  - 1단계: 글로벌 랭킹만 materialized.
  - 2단계: 국가/일일 랭킹 확장.
- 검증방법:
  - 랭킹 조회당 read 수 측정(Firebase Usage), 제출 후 반영 지연/정합성 E2E 테스트.

### 2) Firestore Rules 강화(스키마/범위/변경 불가 필드 검증)
- 무엇을 바꿀 것인가:
  - `scoreSubmissions` create 시 필드 화이트리스트, 타입, 값 범위(score 최소/최대), `uid==auth.uid` 외 검증 추가.
  - `users/{uid}` 문서 업데이트 허용 필드를 제한하고 의도치 않은 필드 삽입 차단.
- 필요 이유:
  - 현재 규칙은 인증/소유권 중심이라 데이터 오염·치팅 방어가 약함.
- Firebase 영향:
  - 무료 플랜에서도 보안/무결성 효과가 큼(비용 영향 미미).
- Vercel 영향:
  - 영향 없음.
- 영향 범위:
  - `firebase/firestore.rules`, 관련 클라이언트 쓰기 로직.
- 작업 규모 / 위험도:
  - M / 중간.
- 프로젝트 구조 영향:
  - 규칙 테스트(에뮬레이터) 추가 권장.
- 예상 사이드 이펙트:
  - 기존 클라이언트가 보내는 필드와 규칙 불일치 시 저장 실패 가능.
- 대응 방안:
  - 규칙 배포 전 스테이징에서 submit/sync 시나리오 회귀 테스트.
- 점진적 적용 전략:
  - 로그 기반 permissive -> strict 순차 강화.
- 검증방법:
  - 정상/비정상 payload 테스트, 권한 없는 UID 쓰기 차단 테스트.

### 3) 점수 제출 경로 단순화(“1유저 1기록” 정착)
- 무엇을 바꿀 것인가:
  - 현재처럼 제출 시 기존 문서를 조회 후 삭제/재삽입하는 방식 대신, `users/{uid}/bestScore`를 소스 오브 트루스로 두고 공개 랭킹은 파생 데이터로 생성.
- 필요 이유:
  - 지금 구조는 제출마다 추가 조회/삭제가 발생하고, 동시성/중복 처리 복잡도가 높음.
- Firebase 영향:
  - write/read 횟수 감소, 충돌 감소.
- Vercel 영향:
  - 영향 없음.
- 영향 범위:
  - `src/services/userDataService.ts`, `src/services/rankingService.ts`, 규칙/함수.
- 작업 규모 / 위험도:
  - M / 중간.
- 프로젝트 구조 영향:
  - 도메인 모델 명확화(원본 스코어 로그 vs 리더보드 분리).
- 예상 사이드 이펙트:
  - 기존 `scoreSubmissions` 히스토리 활용 기능이 있으면 마이그레이션 필요.
- 대응 방안:
  - 히스토리 보존 컬렉션 별도 유지 후 조회 경로만 전환.
- 점진적 적용 전략:
  - 신규 제출부터 신모델 적용, 구모델 병행 읽기 후 점진 제거.
- 검증방법:
  - 동일 유저 반복 제출, 동점/역전, 동시 제출 시나리오 테스트.

### 4) 클라이언트 캐싱 + 재조회 제어
- 무엇을 바꿀 것인가:
  - 랭킹 결과 TTL 캐시(예: 15~30초)와 탭별 메모이제이션 적용.
  - `refreshTrigger` 기반 강제 재조회 최소화(점수 제출/프로필 변경 때만 명시적 invalidate).
- 필요 이유:
  - 무료 플랜에서 불필요한 read를 줄이는 가장 빠른 단기 개선.
- Firebase 영향:
  - 즉시 read 절감.
- Vercel 영향:
  - 영향 없음.
- 영향 범위:
  - `src/components/RankingPanel.tsx`, `src/services/rankingService.ts`.
- 작업 규모 / 위험도:
  - S / 낮음.
- 프로젝트 구조 영향:
  - 서비스 계층에 간단 캐시 모듈 추가 가능.
- 예상 사이드 이펙트:
  - 최신 데이터 반영이 수초 지연될 수 있음.
- 대응 방안:
  - 수동 새로고침 버튼/자동 무효화 이벤트 제공.
- 점진적 적용 전략:
  - 글로벌 탭부터 적용 후 국가/일일 확장.
- 검증방법:
  - 동일 사용자 반복 탭 전환 시 네트워크 호출 수 비교.

### 5) 인코딩/다국어 메시지 정리 및 운영 가시성 추가
- 무엇을 바꿀 것인가:
  - 깨진 문자열을 i18n 리소스로 이관하고 코드 내 하드코딩 메시지 제거.
  - 점수 제출 실패/인증 실패 로그를 구조화(에러 코드, uid 유무, 경로)하고 Sentry/Analytics 연동.
- 필요 이유:
  - 사용자 메시지 품질 저하와 장애 원인 추적 어려움이 동시에 존재.
- Firebase 영향:
  - 직접 비용 영향은 작으나 운영 품질 향상.
- Vercel 영향:
  - 클라이언트 로그 전송 SDK 추가 정도.
- 영향 범위:
  - `src/App.tsx`, `src/services/userDataService.ts`, `src/utils/api.ts`, `src/i18n/locales/*`.
- 작업 규모 / 위험도:
  - S~M / 낮음.
- 프로젝트 구조 영향:
  - 메시지 관리 일원화(i18n 키 기반).
- 예상 사이드 이펙트:
  - 번역 키 누락 시 fallback 문구 노출 가능.
- 대응 방안:
  - locale 키 검증 스크립트 추가.
- 점진적 적용 전략:
  - 에러 메시지 영역부터 우선 정리 후 전체 확장.
- 검증방법:
  - 언어 전환 회귀 테스트, 실패 케이스별 사용자 노출 메시지 확인.

## 인프라 및 비용 리스크 분석
- 무료 플랜 한계:
  - 현재 구조는 조회 중심 트래픽에서 read 소모가 빠르게 누적될 수 있음.
  - 특히 랭킹 탭/새로고침 사용량이 늘면 무료 한도 초과 가능성이 큼.
- 트래픽 증가 시 예상 변화:
  - DAU 증가보다 “랭킹 조회 빈도”가 비용을 더 빠르게 밀어올릴 수 있음.
  - 현재는 클라이언트 집계 방식이라 데이터 규모가 커질수록 지연/비용이 동반 증가.
- 비용 급증 위험 구간:
  - 이벤트/마케팅 등으로 동시 접속이 단기 급증하는 구간.
  - 봇/어뷰징 트래픽이 점수 제출/조회 API를 반복 호출하는 구간.

## 공통 개선 제안
- 테스트 전략:
  - Firestore Rules 에뮬레이터 테스트 추가(정상/비정상 payload, 권한 케이스).
  - 랭킹/제출 서비스 단위 테스트에 “대량 데이터” 시나리오 포함.
- 보안 규칙 강화:
  - 스키마 검증, 필드 제한, 값 범위 제한, 불변 필드 검증 도입.
- 로그/모니터링:
  - 에러 코드 표준화, 제출/조회 성공률 대시보드, read/write 지표 관측.
- 개발 생산성:
  - 도메인 계층 분리(`submission`, `leaderboard`, `profile`)와 타입 스키마 공유(zod 등) 권장.

## 부록
- 가정 및 한계:
  - 본 문서는 저장소 코드 정적 분석 기준이며, 실제 트래픽/쿼터 수치는 Firebase 콘솔 실측이 필요.
- 확인 필요 영역:
  - 실제 Vercel 환경 변수/도메인 설정, Firebase Usage 대시보드, 보안 규칙 배포 상태.
- 향후 아키텍처 진화 방향:
  - 단기: 캐시/룰 강화/조회량 절감.
  - 중기: Functions 기반 리더보드 집계.
  - 장기: 치팅 방지 강화(서버 검증 로직, 이상치 탐지).

