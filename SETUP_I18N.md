# i18n 설정 가이드

## 1단계: 패키지 설치

다음 명령어로 i18n 라이브러리를 설치하세요:

```bash
yarn add react-i18next i18next i18next-browser-languagedetector
```

또는 npm을 사용하는 경우:

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

## 2단계: i18n 설정 파일 활성화

`src/i18n/index.ts` 파일을 열고 주석을 해제하세요:

1. 파일 상단의 주석 `/*` 제거
2. 파일 하단의 주석 `*/` 제거
3. 임시 더미 export 라인 삭제: `export default {};`

## 3단계: index.tsx에서 i18n 초기화

`src/index.tsx` 파일에 다음 import를 추가하세요:

```typescript
import './i18n';
```

전체 코드:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';  // 이 줄 추가
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
```

## 4단계: 컴포넌트에서 사용

컴포넌트에서 번역을 사용하려면:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
    </div>
  );
}
```

## 현재 상태

i18n 패키지가 설치되지 않아도 게임은 정상적으로 작동합니다.
모든 UI는 현재 한국어로 하드코딩되어 있습니다.

패키지를 설치하고 위 단계를 따르면 다국어 지원이 활성화됩니다.
