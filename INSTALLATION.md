# 설치 가이드

## 필수 패키지 설치

프로젝트를 실행하기 전에 다음 명령어로 i18n 라이브러리를 설치해야 합니다:

```bash
yarn add react-i18next i18next i18next-browser-languagedetector
```

## 설치 후 확인

설치가 완료되면 다음 명령어로 개발 서버를 실행할 수 있습니다:

```bash
yarn start
```

## 문제 해결

### 네트워크 오류

패키지 설치 중 네트워크 오류가 발생하는 경우:

```bash
# yarn으로 재시도
yarn install
```

### 권한 오류

권한 오류가 발생하는 경우:

```bash
yarn install --ignore-engines
```

### 타입 오류

TypeScript 타입 오류가 발생하는 경우, `src/custom.d.ts` 파일을 확인하세요.

## 개발 환경 설정

### VSCode 추천 확장

- ESLint
- Prettier
- TypeScript and JavaScript Language Features

### 환경 변수

로컬 플레이만 사용하는 경우 환경변수 없이 실행 가능합니다.

Firebase 연동(구글 로그인/클라우드 저장)을 사용할 경우 아래 파일을 설정하세요.

- `.env.local` (템플릿: `.env.example`)
- 설정 절차: `FIREBASE_SETUP.md`

## 테스트 실행

```bash
# 모든 테스트 실행
yarn test

# 특정 테스트 파일 실행
yarn test economy.test.ts

# 커버리지 확인
yarn test --coverage
```

## 빌드

```bash
# 프로덕션 빌드
yarn build

# 빌드 결과 미리보기
yarn global add serve
serve -s build
```

## submitScore 함수 배포/검증

- `firebase/functions/index.js`의 `submitScore`는 `onCall`(v2)와 `cors: ALLOWED_ORIGINS` 옵션을 사용하도록 유지합니다.
- 운영 반영은 아래 순서로 진행합니다.

```bash
cd /Users/kbk-admin/Workspaces/one-more-second
firebase deploy --only functions
```

배포 확인 체크리스트
1. Firebase Console > Functions > `asia-northeast3` > `submitScore` 트리거가 존재하는지 확인
2. 트리거 소스에서 `onCall` 형태로 배포되었는지 확인
3. `cors` 허용 목록에 `https://onemoresecond.site`, `https://www.onemoresecond.site`가 있는지 확인
