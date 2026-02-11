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

현재 프로젝트는 환경 변수가 필요하지 않습니다. 모든 설정은 LocalStorage에 저장됩니다.

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
yarn dlx serve -s build
```
