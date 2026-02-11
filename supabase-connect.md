# One More Second — Supabase 적용 플랜

목표: 로그인 필수 + 랭킹(전체/국가/일일) + 동시접속(실시간 멀티X) 조건에서,
클라이언트 조작을 최소화하면서 운영/확장 가능한 Supabase 백엔드 구성.

---

## 0) 기본 원칙

1. **점수 제출은 클라이언트가 DB에 직접 쓰지 않는다.**
   - 점수/랭킹 관련 테이블은 클라 write 금지
   - **Edge Function(서버 함수)** 를 통해서만 반영

2. **랭킹은 "TopN 테이블"이 아니라 "유저별 best"를 저장하고 쿼리로 TopN을 뽑는다.**
   - 유지보수/확장성/정확도가 좋다.

3. **KST 자정 초기화는 서버에서 date_kst를 계산한다.**
   - 클라 시간/타임존 조작 방지 + 일일 랭킹 일관성 확보

---

## 1) Supabase 프로젝트 생성 & 환경 구성

### 1-1. Supabase 프로젝트 생성
- Supabase에서 새 프로젝트 생성
- DB 비밀번호 보관
- Region은 유저/서비스 주 사용 지역 고려(한국이면 가까운 리전)

### 1-2. 키/환경변수 세팅
프론트(공개):
- `VITE_SUPABASE_URL` (또는 CRA면 `REACT_APP_SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY`

서버(비공개):
- Edge Function에서 사용하는 `SERVICE_ROLE_KEY`는 절대 프론트에 넣지 않는다.

### 1-3. 라이브러리 설치
- `@supabase/supabase-js`

---

## 2) 인증(Auth) 설계

### 2-1. 로그인 방식 선택
MVP 권장:
- 이메일 + 매직링크 (passwordless) 또는
- Google OAuth (가장 편함)

### 2-2. 유저 프로필(닉네임/국가)
- 로그인 후 최초 1회 `profiles` upsert
- 닉네임 규칙(길이/금칙어)은 프론트 + 서버 모두에서 최소 검증

---

## 3) DB 스키마(권장)

### 3-1. `profiles`
- `user_id` uuid (PK, auth.users 참조)
- `display_name` text
- `country_code` text (예: "KR", "JP")
- `created_at` timestamptz

용도:
- 랭킹 표시용 닉네임/국가

### 3-2. `best_scores`
- `user_id` uuid (PK)
- `best_ms` int (생존시간 ms)
- `updated_at` timestamptz

용도:
- 전체 랭킹 / 국가별 랭킹

### 3-3. `daily_best_scores`
- `date_kst` date
- `user_id` uuid
- `best_ms` int
- PK: (`date_kst`, `user_id`)

용도:
- 일일 랭킹(자정 초기화)

### 3-4. `score_submissions` (추천)
- `id` uuid (PK)
- `user_id` uuid
- `survival_ms` int
- `hits` int
- `date_kst` date
- `country_code_snapshot` text
- `created_at` timestamptz
- (선택) `ua_hash` text, `ip_hash` text

용도:
- 부정행위 추적/운영 분석/분쟁 처리

---

## 4) 인덱스 설계

필수:
- `best_scores(best_ms DESC)`
- `daily_best_scores(date_kst, best_ms DESC)`
- `profiles(country_code)`

이유:
- 랭킹은 정렬이 전부다.
- 트래픽이 늘어도 정렬 인덱스가 있으면 비용/지연이 크게 줄어든다.

---

## 5) 보안(RLS) 정책

### 5-1. 공통
- 모든 테이블 **RLS 활성화**

### 5-2. profiles
- read: 누구나 가능(랭킹 표시)
- update/insert: 본인만 가능

### 5-3. best_scores / daily_best_scores
- read: 누구나 가능(랭킹)
- insert/update/delete: **클라이언트 금지**
  - Edge Function에서만 service role로 쓰기

### 5-4. score_submissions
- insert: Edge Function만
- read: 기본은 금지(또는 본인만)
- 운영/관리자 조회는 별도 어드민 정책/대시보드로 처리

---

## 6) Edge Functions 설계

### 6-1. `submitScore`
입력(JSON):
- `survivalMs: number`
- `hits: number`
- (옵션) `displayName?: string`
- (옵션) `countryCode?: string`

서버 처리:
1. Auth 토큰 검증 (로그인 필수)
2. `survivalMs` sanity check
   - 음수/비정상 상한 컷(예: 하루 이상 점수 등)
3. `date_kst` 계산
   - DB 또는 서버에서 `Asia/Seoul` 기준 date 계산
4. profiles 갱신(옵션 입력 시)
5. `score_submissions` 로그 insert (추천)
6. `best_scores` upsert (기존보다 높으면 갱신)
7. `daily_best_scores` upsert (오늘 기준, 기존보다 높으면 갱신)
8. 결과 반환:
   - 내 최고기록, 내 오늘 최고기록, 제출 반영 여부

### 6-2. (선택) `getRankings`
읽기 전용 엔드포인트로 묶을 수도 있음.
하지만 MVP는 DB read를 직접 해도 무방(단, rate-limit 고려)

---

## 7) 프론트엔드 통합 단계(React + TS)

### 7-1. supabase client 모듈 생성
- `src/utils/supabase.ts` 에 client 생성
- 앱 시작 시 세션 복원

### 7-2. 로그인 UI
- 로그인/로그아웃 버튼
- 최초 로그인 시 닉네임/국가 설정 모달(ScoreSubmitModal과 결합 가능)

### 7-3. 점수 제출 플로우 변경
현재 LocalStorage 기반 랭킹 로직은 유지하되:
- 게임 오버 → ScoreSubmitModal → 제출 시
  - Edge Function `submitScore` 호출
  - 성공하면 랭킹 패널 데이터 refetch

### 7-4. 랭킹 조회
필요한 3종:
- 전체 Top 100: `best_scores` + `profiles`
- 국가별 Top 50: `profiles(country)` 필터 + join
- 일일 Top 50: `daily_best_scores(date_kst=오늘)` + `profiles`

추가로 구현하면 좋은 것:
- 내 순위(전체/국가/일일) 조회:
  - SQL `rank() over (order by best_ms desc)` 사용 (뷰 또는 함수)

---

## 8) 마이그레이션 전략(LocalStorage → Supabase)

### 8-1. 1단계 (동시 운영)
- LocalStorage 랭킹은 그대로 표시
- 로그인 유저는 Supabase 랭킹도 함께 표시(토글 UI)
- 서버 연동 안정화

### 8-2. 2단계 (전환)
- 기본 랭킹은 Supabase 기반으로 변경
- LocalStorage 랭킹은 "오프라인 기록" 탭으로 격하

### 8-3. 3단계 (정리)
- LocalStorage 랭킹 관련 로직 최소화
- 설정/업적/스킨은 계속 LocalStorage 유지 가능(서버 저장은 선택)

---

## 9) 운영 고려 사항(최소치)

### 9-1. 부정행위(치트) 최소 방어
- 점수 제출은 Edge Function만
- 요청 빈도 제한(예: 10초 내 중복 제출 차단)
- 말도 안 되는 점수 컷(예: 0~6시간 범위 등 현실적 한계)
- (선택) User-Agent/IP hash 기록(프라이버시 고려)

### 9-2. 비용/성능
- 인덱스 + TopN LIMIT로 비용 안정화
- 랭킹 패널은 캐싱(클라 캐시 or SWR) 추천
- 트래픽 커지면 국가별/일일은 별도 뷰/머터리얼라이즈 고려

---

## 10) 작업 체크리스트(권장 순서)

1. Supabase 프로젝트 생성 + env 세팅
2. Auth 설정(구글 or 매직링크)
3. DB 테이블 생성 + 인덱스 생성
4. RLS 정책 적용
5. Edge Function `submitScore` 구현
6. 프론트: 로그인 + 세션 + submitScore 연동
7. 프론트: 랭킹 조회(전체/국가/일일) UI 연결
8. (선택) 내 순위 API/뷰 추가
9. 운영 로그(score_submissions) 기반 치트/이상치 모니터링

---

## 11) 결정된 스펙 정리

- 점수 단위: `ms`(정수)
- 랭킹 종류:
  - 전체 Top 100 (best_scores)
  - 국가별 Top 50 (best_scores + profiles.country_code)
  - 일일 Top 50 (daily_best_scores, KST date)
- 제출 시 자동 반영: Edge Function submitScore
- LocalStorage 랭킹은 "전환 기간" 동안만 유지

---

## 참고: 현재 코드와의 차이점

### 점수 단위 변환
현재 코드는 점수를 **초(seconds)** 단위로 저장하고 있습니다:
- `GameCanvas.tsx`: `finalScore = Math.floor((Date.now() - state.startTime) / 1000)` (초 단위)
- `ranking.ts`: `score: number` (초 단위)

Supabase 연동 시에는 **밀리초(ms)** 단위로 변환해야 합니다:
- 변환 공식: `survivalMs = scoreSeconds * 1000`
- Edge Function 제출 시: `survivalMs`로 전송
- 랭킹 조회 시: 필요시 클라이언트에서 `ms / 1000`으로 표시용 변환

### 관련 파일
- [src/gameSystem/ranking.ts](src/gameSystem/ranking.ts): 현재 LocalStorage 기반 랭킹 구현
- [src/pages/Game/components/ScoreSubmitModal.tsx](src/pages/Game/components/ScoreSubmitModal.tsx): 점수 제출 UI
- [src/utils/api.ts](src/utils/api.ts): 현재 mock API 구현
- [src/pages/Game/components/GameCanvas.tsx](src/pages/Game/components/GameCanvas.tsx): 게임 로직 및 점수 계산
