# PixiJS Migration 계획서

## 1. 목적
- 기존 `canvas + requestAnimationFrame` 중심 구현을 `PixiJS` 기반 렌더/업데이트 파이프라인으로 전환한다.
- 단순 렌더 교체가 아니라, 게임 프로세스를 **상태기계 + 시스템 분리 구조**로 재설계한다.
- `game-planning.md`의 핵심 전략(로드아웃 기믹, 단일 랭킹 가중치, 스킨 trait 확장)을 엔진 레벨에서 수용 가능한 구조로 만든다.

## 2. 전환 범위
- 포함:
  - 실시간 루프/입력/충돌/탄환 스폰/난이도 상승 로직 전면 재구성
  - `GameCanvas`를 Pixi 기반 컴포넌트로 교체
  - 스킨/기믹/점수 계산을 엔진 컨텍스트로 일원화
  - 결과 제출 데이터(기본점수 + 보정점수 + 기믹 목록) 확장
- 제외(1차):
  - Firebase 아키텍처 대수술(Functions 도입 등)
  - 멀티플레이/서버 시뮬레이션

## 3. 현재 구조 요약 (기준점)
- 렌더/업데이트: `src/pages/Game/components/GameCanvas.tsx`
- HUD/시작 UI: `src/components/GamePanel.tsx`
- 런 결과 처리: `src/pages/Game/index.tsx`
- 점수 제출 UI: `src/pages/Game/components/ScoreSubmitModal.tsx`
- 프로필/스킨 타입: `src/gameSystem/types.ts`, `src/gameSystem/skins.ts`
- 랭킹 로컬 모델: `src/gameSystem/ranking.ts`

현재는 `GameCanvas` 내부에 입력/물리/렌더/상태가 응집되어 있어, 기믹/trait 확장 시 결합도가 높아지는 상태다.

## 4. 목표 아키텍처

### 4.1 런타임 계층 분리
- `Presentation (React UI)`:
  - 시작/종료/모달/HUD/상점/랭킹 표시
- `Game Runtime (Pixi + Systems)`:
  - 프레임 업데이트, 엔티티 관리, 충돌, 난이도, modifier 적용
- `Domain (gameSystem)`:
  - 프로필/스킨/랭킹 산식/보상 계산/스토리지

### 4.2 상태 머신
- `BOOT` -> `READY` -> `PLAYING` -> `GAME_OVER`
- 모달 열림 시 `PLAYING`에서 `PAUSED` 전환 가능
- 키 입력은 상태 기준으로만 처리:
  - `READY`에서 `Enter`
  - `GAME_OVER`에서 `R`

### 4.3 시스템 단위 분리
- `InputSystem`: 키 상태/액션 이벤트
- `MovementSystem`: 플레이어 이동, 대시 등 trait 반영
- `SpawnSystem`: 탄환 생성, 패턴 선택, 난이도 스케일
- `BulletSystem`: 탄환 이동/수명 정리
- `CollisionSystem`: 피격 판정 및 무적 프레임 처리
- `ScoreSystem`: 생존시간, 기본점수/보정점수 계산
- `RenderSystem(Pixi)`: 스프라이트/그래픽 동기화

## 5. 데이터 모델 변경안

### 5.1 GameplayModifiers 추가 (`src/gameSystem/types.ts`)
- 신규 타입:
  - `GameplayModifier`
  - `GameplayModifierId` (`slow-time`, `panic-dash`, `greed-core`)
  - `ActiveLoadout` (`enabledModifierIds: GameplayModifierId[]`)

### 5.2 스킨 trait 확장 (`src/gameSystem/types.ts`, `src/gameSystem/skins.ts`)
- `SkinDefinition` 확장:
  - `tags?: string[]`
  - `effects?: SkinEffect[]` (초기에는 랭킹 비영향 trait만)
- `getSkin()` 결과를 런타임 초기화 컨텍스트로 전달하여 modifier 계산에 포함

### 5.3 점수 구조 확장 (`src/gameSystem/ranking.ts`, `src/types/score.ts`)
- 기존 `score` 단일값 외 세부 필드 추가:
  - `baseScore` (생존초)
  - `adjustmentScore` (기믹 보정 합)
  - `usedGimmicks` (id + weight snapshot)
  - `finalScore` (기존 `score`와 동일 의미로 저장)

## 6. 구현 단계 (권장 순서)

### Phase 0. 사전 정리 (0.5~1일)
- [ ] PixiJS 의존성 추가 (`pixi.js`)
- [ ] 엔진 실험용 feature flag 도입 (`USE_PIXI_ENGINE`)
- [ ] 기존 `GameCanvas` 회귀 기준(점수 증가, 피격, 게임오버) 테스트 스냅샷 확보

### Phase 1. Pixi 런타임 골격 (1~2일)
- [ ] `src/pages/Game/components/PixiGameCanvas.tsx` 생성
- [ ] Pixi `Application` 생명주기(마운트/언마운트)와 React props 연결
- [ ] 상태 머신(`READY/PLAYING/GAME_OVER/PAUSED`) 도입
- [ ] 기존 `GamePanel`에서 `GameCanvas` 대체 가능하게 분기

### Phase 2. 기존 게임성 1:1 이식 (2~3일)
- [ ] 이동/탄환/충돌/목숨/난이도 증가 로직을 시스템으로 분해 구현
- [ ] 현재 난이도 파라미터 동등 이식:
  - 시작 스폰 500ms, 3초마다 50ms 감소, 하한 100ms
- [ ] 기존 조작감과 점수 계산(생존 초) 동일성 확인

### Phase 3. 로드아웃 기믹 MVP (2~3일)
- [ ] `GamePanel` 시작 화면에 ON/OFF 토글 UI 추가
- [ ] 선택값을 로컬 저장(`settings/storage`) 및 런 시작 시 주입
- [ ] 초기 3개 기믹 구현:
  - `Slow Time`: 탄속 85%
  - `Panic Dash`: 쿨다운 대시 1회
  - `Greed Core`: 코인 +30%

### Phase 4. 단일 랭킹 가중치 점수 반영 (1~2일)
- [ ] `baseScore`, `adjustmentScore`, `finalScore` 계산 함수 도입
- [ ] `ScoreSubmitModal`에 점수 상세 표기 추가
- [ ] 랭킹 엔트리 저장 시 사용 기믹/가중치 스냅샷 기록

### Phase 5. 스킨 trait 일원화 (1~2일)
- [ ] `skins.ts`에 visual + optional trait 구조 반영
- [ ] 상점/장착 UI에 trait 설명 텍스트 추가
- [ ] 초기 trait는 랭킹 영향 없는 효과만 허용

### Phase 6. 안정화/튜닝 (2~4일)
- [ ] 런타임 KPI 맞춤(중앙값 45초 목표)
- [ ] 저사양 성능 점검(FPS, 메모리, 탄환 수 상한)
- [ ] 밸런스 점검(필수 기믹/필수 스킨 발생 여부)

## 7. 파일 단위 변경 가이드
- 신규:
  - `src/pages/Game/components/PixiGameCanvas.tsx`
  - `src/gameRuntime/*` (state, systems, entities, config)
  - `src/gameSystem/modifiers.ts` (기믹 정의/가중치)
- 수정:
  - `src/components/GamePanel.tsx` (시작 UI + 로드아웃)
  - `src/pages/Game/index.tsx` (런 결과 처리 확장)
  - `src/pages/Game/components/ScoreSubmitModal.tsx` (점수 상세)
  - `src/gameSystem/types.ts` (타입 확장)
  - `src/gameSystem/skins.ts` (trait 반영)
  - `src/gameSystem/ranking.ts` (세부 점수 필드)
  - `src/services/rankingService.ts` / `src/services/userDataService.ts` (클라우드 필드 호환)

## 8. 점수 계산 기준 (초안)
- `baseScore = survivalSeconds`
- `adjustmentScore = Σ(baseScore * gimmickWeight)`
- `finalScore = baseScore + adjustmentScore`
- 시즌 중 `gimmickWeight`는 고정, 변경은 시즌 시작 시에만 적용

## 9. 호환/마이그레이션 전략
- 기존 사용자 데이터 호환:
  - `PlayerProfile.version` 유지, 신규 필드는 기본값으로 머지
  - 기존 랭킹 문서는 `finalScore=score`로 해석하는 fallback 유지
- 릴리즈 전략:
  - 1차: 내부 플래그로 Pixi 엔진 hidden 배포
  - 2차: 일부 사용자/환경에서 활성화
  - 3차: 기본 엔진 전환 후 구 `GameCanvas` 제거

## 10. 테스트 전략
- 단위 테스트:
  - modifier 계산, 점수 산식, skin trait 적용, 충돌/피격 판정
- 통합 테스트:
  - Enter 시작 -> 생존 -> 피격 -> GameOver -> 점수 팝업
  - 기믹 on/off별 finalScore 계산 검증
- 회귀 테스트:
  - 기존 기능(업적, 데일리 챌린지, 코인 지급, 랭킹 갱신) 유지 확인
- 성능 테스트:
  - 탄환 수 증가 구간 FPS 하락 임계치 모니터링

## 11. 주요 리스크와 대응
- 리스크: Pixi 전환 중 입력/충돌 체감이 달라져 게임 감각 저하
  - 대응: 기존 파라미터 동등 이식 + A/B 체감 비교
- 리스크: 특정 기믹/스킨이 필수 메타가 되는 문제
  - 대응: 랭킹 비영향 trait부터 도입, 시즌 단위 가중치 재설계
- 리스크: 점수 구조 복잡화로 사용자 이해 비용 증가
  - 대응: `기본 + 보정` 표기를 UI에 고정 노출

## 12. 완료 기준 (Definition of Done)
- [ ] Pixi 엔진이 기본 게임 루프를 완전히 대체
- [ ] 기존 핵심 루프(시작/회피/피격/종료/재시작) 정상 동작
- [ ] 로드아웃 3종 + 스킨 trait 구조 + 점수 상세 반영 완료
- [ ] 랭킹 저장/조회가 신규 필드를 포함해 정상 동작
- [ ] KPI 기준(런타임/재도전 흐름) 검증 리포트 확보

---

## 제안 일정 (예시: 2주 스프린트 x 2)
- 스프린트 1: Phase 0~2 (엔진 전환 + 동등성 확보)
- 스프린트 2: Phase 3~5 (기믹/점수/스킨 확장)
- 안정화 버퍼: Phase 6 (튜닝/버그/밸런스)
