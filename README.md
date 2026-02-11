# One More Second

브라우저 기반 탄막 회피 생존 게임

## 🎮 게임 소개

**One More Second**는 React + TypeScript로 만들어진 브라우저 게임입니다. 위/아래에서 생성되는 탄환을 피하며 최대한 오래 생존하는 것이 목표입니다.

### 주요 기능

#### ✅ 1순위: 랭킹 시스템
- **전체 랭킹**: Top 100 기록 저장
- **국가별 랭킹**: 국가 코드별 Top 50
- **일일 랭킹**: 날짜별 Top 50 (자정 초기화)
- **실시간 업데이트**: 게임 종료 시 자동 반영
- LocalStorage 기반 (백엔드 연동 준비 완료)

#### ✅ 2순위: 설정 시스템
**그래픽 설정**:
- 파티클 효과 on/off
- 피격 플래시 효과 강도 (0~100%)
- 프레임 제한 (30/60/무제한)

**사운드 설정**:
- BGM 볼륨 (0~100%)
- 효과음 볼륨 (0~100%)
- 개별 사운드 on/off
- Web Audio API 기반

**프로필 관리**:
- 프로필 초기화
- 데이터 내보내기 (JSON)
- 데이터 가져오기 (JSON)

#### ✅ 3순위: 테스트 코드
- **단위 테스트**: 게임 시스템 로직 (Jest)
  - economy.test.ts: 코인 계산 로직
  - achievements.test.ts: 업적 해금 조건
  - dailyChallenge.test.ts: 시드 기반 챌린지 생성
  - ranking.test.ts: 랭킹 정렬/필터링
  - storage.test.ts: 로컬스토리지 CRUD

- **컴포넌트 테스트**: UI 컴포넌트 (React Testing Library)
  - Modal.test.tsx: 모달 열기/닫기
  - RankingPanel.test.tsx: 랭킹 표시
  - StatsPanel.test.tsx: 통계/업적 표시

- **통합 테스트**: 게임 플로우
  - Game/index.test.tsx: 게임 시작 → 게임오버 → 점수 제출 → 랭킹 반영

#### ✅ 4순위: 국제화 (i18n)
- **지원 언어**: 한국어, 영어, 일본어, 중국어 간체
- **자동 언어 감지**: 브라우저 언어 기반
- **언어 선택**: 설정 메뉴에서 변경 가능
- **번역 범위**: 모든 UI 텍스트, 게임 메시지, 업적, 에러 메시지

### 게임 시스템

**경제 시스템**:
- 생존 1초 = 1코인
- 무피격 보너스: 10초 이상 생존 + 피격 0회 = +10코인
- 데일리 챌린지: 목표 달성 시 20~67코인

**스킨 상점**:
1. Classic Blue (무료, 기본)
2. Mint (120코인)
3. Sunset (180코인)
4. Neon (250코인)

**업적 시스템** (6가지):
- 첫 판: 게임 1회 플레이
- 10초/30초/60초 생존
- 무피격 20초: 20초 생존 + 피격 0회
- 수집가: 스킨 2개 보유

**데일리 챌린지**:
- 날짜 기반 시드로 매일 고정된 목표 생성
- 목표: 15~45초 생존
- 보상: 목표 시간 × 1.5 코인

## 🚀 시작하기

### 필수 요구사항

- Node.js 16+
- Yarn

### 설치

```bash
# 레포지토리 클론
git clone <repository-url>
cd one-more-second

# 의존성 설치
yarn install

# i18n 라이브러리 설치 (필수)
yarn add react-i18next i18next i18next-browser-languagedetector
```

### 개발 서버 실행

```bash
yarn start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 게임을 플레이할 수 있습니다.

### Firebase 연동 (선택)

Google 로그인 + Firestore 랭킹/프로필 동기화를 사용하려면
[`FIREBASE_SETUP.md`](FIREBASE_SETUP.md)를 따라 Firebase 프로젝트를 먼저 생성하세요.

기본 환경변수 템플릿은 [`.env.example`](.env.example)에서 확인할 수 있습니다.

### 테스트 실행

```bash
# 모든 테스트 실행
yarn test

# 커버리지 확인
yarn test --coverage
```

### 프로덕션 빌드

```bash
yarn build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

## 📁 프로젝트 구조

```
src/
├── App.tsx                    # 메인 앱 컴포넌트
├── index.tsx                  # 엔트리 포인트
├── components/                # 공통 컴포넌트
│   ├── Layout.tsx            # 헤더/푸터/3단 레이아웃
│   ├── Modal.tsx             # 모달 컴포넌트
│   ├── RankingPanel.tsx      # 랭킹 패널
│   └── StatsPanel.tsx        # 통계/업적 패널
├── pages/                     # 페이지 컴포넌트
│   └── Game/                 # 게임 페이지
│       ├── index.tsx         # 게임 메인 로직
│       └── components/       
│           ├── GameCanvas.tsx        # 캔버스 렌더링 & 게임 루프
│           ├── PlayerStatus.tsx      # 상태 표시
│           ├── ScoreSubmitModal.tsx  # 점수 제출 모달
│           └── SystemMenuModal.tsx   # 시스템 메뉴
├── gameSystem/               # 게임 시스템 로직
│   ├── types.ts             # 타입 정의
│   ├── storage.ts           # 로컬스토리지 관리
│   ├── economy.ts           # 경제 시스템
│   ├── skins.ts             # 스킨 정의
│   ├── achievements.ts      # 업적 시스템
│   ├── dailyChallenge.ts    # 데일리 챌린지
│   ├── ranking.ts           # 랭킹 시스템
│   ├── settings.ts          # 설정 관리
│   └── audio.ts             # 사운드 시스템
├── i18n/                     # 국제화
│   ├── index.ts             # i18next 설정
│   └── locales/             # 번역 파일
│       ├── ko.json          # 한국어
│       ├── en.json          # 영어
│       ├── ja.json          # 일본어
│       └── zh-CN.json       # 중국어 간체
├── utils/
│   └── api.ts               # API 호출
└── types/
    └── score.ts             # 점수 관련 타입
```

## 🎯 게임 조작법

- **방향키**: 플레이어 이동
- **R**: 게임오버 후 재시작
- **ESC**: 메뉴 열기 (구현 예정)

## 🛠️ 기술 스택

- **프론트엔드**: React 19.1.0, TypeScript 4.4.2
- **라우팅**: React Router DOM 7.6.2
- **상태 관리**: React Hooks, LocalStorage
- **UI**: React Select, React World Flags
- **국제화**: react-i18next, i18next
- **테스트**: Jest, React Testing Library
- **빌드**: Create React App (react-scripts 5.0.1)
- **HTTP**: Axios 1.10.0

## 📊 테스트 커버리지 목표

- 게임 시스템 로직: 90% 이상
- UI 컴포넌트: 70% 이상

## 🔮 향후 계획

1. **백엔드 구현**: 실제 서버 API 연동
2. **모바일 지원**: 터치 컨트롤 추가
3. **추가 게임 모드**: 타임 어택, 엔드리스 등
4. **소셜 기능**: 친구 초대, 대결 모드
5. **더 많은 스킨**: 시즌별 스킨, 이벤트 스킨

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request는 언제나 환영합니다!

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.
