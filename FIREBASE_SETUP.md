# Firebase 연동 가이드 (CRA + Vercel/Netlify)

이 문서는 Firebase 프로젝트가 없는 상태에서 시작해, 현재 프로젝트(`one-more-second`)를
Google 로그인 + Firestore까지 연결하는 전체 절차를 설명합니다.

## 1) Firebase 콘솔에서 프로젝트 생성

1. Firebase 콘솔 접속: `https://console.firebase.google.com/`
2. `프로젝트 추가` 클릭
3. 프로젝트 이름 입력 (예: `one-more-second-prod`)
4. Google Analytics는 필요 시 활성화 (MVP는 비활성화 가능)
5. 프로젝트 생성 완료

## 2) Web App 등록

1. 프로젝트 대시보드 > `앱 추가` > Web(`</>`) 선택
2. 앱 닉네임 입력 (예: `one-more-second-web`)
3. Firebase Hosting 체크는 선택 사항
4. 등록 완료 후 제공되는 `firebaseConfig` 값을 복사

> 이 값은 로컬 `.env.local`에 넣습니다. 커밋하지 마세요.

## 3) Authentication 활성화 (Google)

1. 좌측 메뉴 `Authentication` > `시작하기`
2. `Sign-in method` 탭 > `Google` 활성화
3. 프로젝트 지원 이메일 선택 후 저장

### Authorized domains 설정 (중요)

`Authentication > Settings > Authorized domains` 에 아래 도메인을 추가:

- `localhost` (로컬 개발)
- `<your-app>.vercel.app` (Vercel 기본 도메인)
- `<your-app>.netlify.app` (Netlify 기본 도메인)
- 커스텀 도메인 사용 시 해당 도메인도 추가

## 4) Firestore Database 생성

1. 좌측 메뉴 `Firestore Database` > `데이터베이스 만들기`
2. 모드: `프로덕션 모드` 선택
3. Region 선택
   - 권장: 사용자와 가까운 리전(예: asia-northeast 계열)

## 5) 프로젝트 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값 입력:

```bash
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

템플릿은 [`.env.example`](.env.example) 참고.

## 6) 코드 연동 포인트

- Firebase 초기화: [`src/lib/firebase.ts`](src/lib/firebase.ts)
- Auth 상태 컨텍스트: [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx)
- 인증 서비스: [`src/services/authService.ts`](src/services/authService.ts)
- 사용자/점수 저장 서비스: [`src/services/userDataService.ts`](src/services/userDataService.ts)
- 랭킹 조회 서비스: [`src/services/rankingService.ts`](src/services/rankingService.ts)
- 점수 제출 UI(로그인 유도): [`src/pages/Game/components/ScoreSubmitModal.tsx`](src/pages/Game/components/ScoreSubmitModal.tsx)

## 7) 데이터 계약 (Local -> Firestore 매핑)

### Local `oms.profile.v1` -> Firestore

- 소스 타입: [`src/gameSystem/types.ts`](src/gameSystem/types.ts) `PlayerProfile`
- 대상:
  - `users/{uid}`
    - `coins`, `bestScore`, `totalRuns`, `totalSecondsSurvived`
    - `selectedSkinId`, `ownedSkins`, `updatedAt`
  - `users/{uid}/achievements/{achievementId}`
    - `unlockedAt`
  - `users/{uid}/daily/{dateKey}`
    - `targetSeconds`, `rewardCoins`, `completed`, `updatedAt`

### 점수 제출 타입 -> Firestore

- 소스 타입: [`src/types/score.ts`](src/types/score.ts) `ScoreRecord`
- 대상:
  - `scoreSubmissions/{docId}`
    - `uid`, `nickname`, `country`, `score`, `createdAt`, `clientVersion`
  - 랭킹 조회는 초기 단계에서 `scoreSubmissions` 직접 조회 사용
    - 이후 트래픽 증가 시 Cloud Functions로 `leaderboard_*` materialized 컬렉션 도입 권장

## 8) Firestore Rules / Indexes 적용

- Rules 파일: [`firebase/firestore.rules`](firebase/firestore.rules)
- Indexes 파일: [`firebase/firestore.indexes.json`](firebase/firestore.indexes.json)

Firebase CLI 사용 시:

```bash
npm i -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 9) Vercel / Netlify 배포 설정

### Vercel
1. Project > Settings > Environment Variables
2. `REACT_APP_FIREBASE_*` 전부 등록
3. 재배포


## 10) 운영 순서 (롤아웃)

1. 로컬 기록 + 클라우드 기록 병행
2. 랭킹 조회는 Firestore 우선, 실패 시 local fallback

## 11) 검증 체크리스트

- [ ] 비로그인 상태에서 플레이/게임오버 가능
- [ ] ScoreSubmitModal에서 Google 로그인 유도 노출
- [ ] 로그인 후 점수 제출 시 `scoreSubmissions` 문서 생성
- [ ] `scoreSubmissions` 조회 데이터가 랭킹 패널에 반영
- [ ] 오프라인/권한 오류 시 로컬 fallback 동작
- [ ] Vercel/Netlify 배포 환경에서 Google 로그인 팝업 정상 동작
