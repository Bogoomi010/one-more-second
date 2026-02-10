# Tailwind CSS v4 Design Tokens 가이드

이 문서는 프로젝트의 Color Style과 Design Style 스케치를 기반으로 Tailwind CSS v4 설정을 위한 가이드입니다.

## 1. CSS Variables 설정 (globals.css)

```css
@import "tailwindcss";

:root {
  /* Background Colors */
  --color-bg-primary: #0f172a;        /* slate-900 */
  --color-bg-secondary: #1e293b99;     /* slate-800 (60% opacity) */
  --color-bg-card: #ffffff0d;         /* white (5% opacity) */
  --color-bg-card-alt: #ffffff1a;      /* white (10% opacity) */
  
  /* Text Colors */
  --color-text-primary: #ffffff;       /* white */
  --color-text-secondary: #f1f5f9;    /* slate-100 */
  --color-text-muted: #cbd5e1;        /* slate-300 */
  --color-text-disabled: #94a3b8;     /* slate-400 */
  --color-text-placeholder: #64748b;  /* slate-500 */
  
  /* Accent Colors */
  --color-accent-green: #4ade80;      /* green-400 */
  --color-accent-blue: #38bdf8;        /* sky-400 */
  --color-accent-green-alpha: #4ade801a; /* green-400 (10% opacity) */
  --color-accent-blue-alpha: #38bdf899;   /* sky-400 (60% opacity) */
  
  /* Border Colors */
  --color-border-primary: #ffffff1a;    /* white (10% opacity) */
  --color-border-secondary: #ffffff0d; /* white (5% opacity) */
  --color-border-accent: #38bdf8;      /* sky-400 */
  
  /* Gradients */
  --gradient-primary: linear-gradient(90deg, #4ade80 0%, #38bdf8 100%);
}

@layer base {
  html, body {
    height: 100%;
  }
  
  /* Font Families */
  .font-primary {
    font-family: "Quicksand", sans-serif;
  }
  
  .font-secondary {
    font-family: "Fira Code", monospace;
  }
  
  .font-tertiary {
    font-family: "Inter", sans-serif;
  }
}
```

## 2. Font Loading (layout.tsx 또는 _document.tsx)

### Next.js 사용 시:

```tsx
import { Quicksand, Fira_Code, Inter } from "next/font/google";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }) {
  return (
    <html className={`${quicksand.variable} ${firaCode.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 일반 HTML 사용 시:

```html
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;900&family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
```

## 3. Tailwind 사용 예시

### Background Colors
```tsx
<div className="bg-[var(--color-bg-primary)]">        {/* #0f172a */}
<div className="bg-[var(--color-bg-secondary)]">      {/* #1e293b99 */}
<div className="bg-[var(--color-bg-card)]">            {/* #ffffff0d */}
<div className="bg-[var(--color-bg-card-alt)]">        {/* #ffffff1a */}
```

### Text Colors
```tsx
<p className="text-[var(--color-text-primary)]">       {/* #ffffff */}
<p className="text-[var(--color-text-secondary)]">    {/* #f1f5f9 */}
<p className="text-[var(--color-text-muted)]">        {/* #cbd5e1 */}
<p className="text-[var(--color-text-disabled)]">     {/* #94a3b8 */}
<p className="text-[var(--color-text-placeholder)]">  {/* #64748b */}
```

### Accent Colors
```tsx
<span className="text-[var(--color-accent-green)]">    {/* #4ade80 */}
<span className="text-[var(--color-accent-blue)]">    {/* #38bdf8 */}
<div className="bg-[var(--color-accent-green-alpha)]"> {/* #4ade801a */}
<div className="bg-[var(--color-accent-blue-alpha)]"> {/* #38bdf899 */}
```

### Border Colors
```tsx
<div className="border border-[var(--color-border-primary)]">    {/* #ffffff1a */}
<div className="border border-[var(--color-border-secondary)]">  {/* #ffffff0d */}
<div className="border border-[var(--color-border-accent)]">     {/* #38bdf8 */}
```

### Gradients
```tsx
<div className="bg-[var(--gradient-primary)]">
  {/* linear-gradient(90deg, #4ade80 0%, #38bdf8 100%) */}
</div>
```

### Typography
```tsx
<h1 className="font-primary text-[32px] font-bold">Title</h1>
<p className="font-secondary text-[10px] font-normal">Code</p>
<span className="font-tertiary text-[14px] font-medium">Body</span>
```

### Font Sizes
```tsx
<p className="text-[9px]">   {/* 9px */}
<p className="text-[10px]"> {/* 10px */}
<p className="text-[11px]"> {/* 11px */}
<p className="text-[12px]"> {/* 12px */}
<p className="text-[14px]"> {/* 14px */}
<p className="text-[18px]"> {/* 18px */}
<p className="text-[20px]"> {/* 20px */}
<p className="text-[24px]"> {/* 24px */}
<p className="text-[32px]"> {/* 32px */}
<p className="text-[48px]"> {/* 48px */}
```

### Font Weights
```tsx
<p className="font-normal">   {/* 400 */}
<p className="font-medium">  {/* 500 */}
<p className="font-semibold"> {/* 600 */}
<p className="font-bold">    {/* 700 */}
<p className="font-black">   {/* 900 */}
```

### Spacing (Gap & Padding)
```tsx
<div className="gap-1 p-1">        {/* 4px */}
<div className="gap-1.5 p-1.5">    {/* 6px */}
<div className="gap-2 p-2">        {/* 8px */}
<div className="gap-[10px] p-[10px]"> {/* 10px */}
<div className="gap-3 p-3">       {/* 12px */}
<div className="gap-[14px] p-[14px]"> {/* 14px */}
<div className="gap-4 p-4">      {/* 16px */}
<div className="gap-5 p-5">      {/* 20px */}
<div className="gap-6 p-6">      {/* 24px */}
<div className="gap-8 p-8">      {/* 32px */}
<div className="gap-[40px] p-[40px]"> {/* 40px */}
<div className="gap-[48px] p-[48px]"> {/* 48px */}
```

### Border Radius
```tsx
<div className="rounded-[3px]">  {/* 3px */}
<div className="rounded-[4px]">  {/* 4px */}
<div className="rounded-lg">    {/* 8px */}
<div className="rounded-xl">     {/* 12px */}
<div className="rounded-2xl">   {/* 16px */}
<div className="rounded-[24px]"> {/* 24px */}
<div className="rounded-[32px]"> {/* 32px */}
```

### Letter Spacing
```tsx
<h1 className="tracking-[2px]">PRESS</h1> {/* 2px letter spacing */}
```

## 4. 컴포넌트 예시

### Card Component
```tsx
<div className="rounded-[24px] bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] p-6 gap-4 flex flex-col">
  <h2 className="font-primary text-[20px] font-bold text-[var(--color-text-primary)]">
    Card Title
  </h2>
  <p className="font-tertiary text-[14px] font-medium text-[var(--color-text-muted)]">
    Card content
  </p>
</div>
```

### Button Component
```tsx
<button className="rounded-xl bg-[var(--gradient-primary)] px-6 py-3 font-secondary text-[18px] font-bold tracking-[2px] text-[var(--color-text-primary)]">
  CLICK ME
</button>
```

### Panel Component
```tsx
<div className="rounded-[24px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] p-6 gap-6 flex flex-col">
  <div className="flex items-center gap-2">
    <span className="text-[var(--color-accent-green)] font-primary text-[20px] font-bold">
      Title
    </span>
  </div>
  <div className="rounded-xl bg-[var(--color-bg-card)] p-4">
    Content
  </div>
</div>
```

## 5. 주요 규칙

1. **CSS Variables 사용**: 모든 색상은 CSS 변수로 정의하고 `bg-[var(--color-name)]` 형식으로 사용
2. **Font Families**: `@layer base`에서 유틸리티 클래스로 정의하고 `.font-primary`, `.font-secondary` 등으로 사용
3. **Spacing**: Tailwind 기본 스케일 사용 가능한 경우 사용, 그 외는 `[Npx]` 형식 사용
4. **Border Radius**: Tailwind 기본 클래스 사용 가능한 경우 사용, 그 외는 `rounded-[Npx]` 형식 사용
5. **Gradients**: CSS 변수로 정의하고 `bg-[var(--gradient-name)]` 형식으로 사용

## 6. 참고사항

- 모든 색상 값은 8자리 hex 형식(투명도 포함) 또는 6자리 hex 형식 사용
- 폰트 스택은 CSS 변수로 저장하지 않고 `@layer base`에서 직접 정의
- Tailwind v4는 `@import "tailwindcss";` 구문 사용 (v3의 `@tailwind` 대신)
- Preflight는 자동으로 포함되므로 별도 리셋 불필요
