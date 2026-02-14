# Changelog

이 프로젝트는 의미 있는 변경 시 Semantic Versioning(`MAJOR.MINOR.PATCH`)을 따릅니다.

## [0.3.0] - 2026-02-14

### Added
- 헤더 `Market` 버튼 클릭 시 별도 상점 팝업이 열리는 흐름 분리
- 헤더 `Menu` 버튼 왼쪽에 음소거 버튼 추가
- 업적 다수 추가(생존/누적 플레이/누적 시간/코인/수집 계열 확장)
- 랭킹/점수 제출 화면에 국가 코드 대신 국기 이모지 표시 강화

### Changed
- 게임 시작 시 게임 화면에서 마우스 커서 숨김 처리
- 생명 아이콘(`icon_life`)이 실제 목숨 수와 연동되도록 UI 구조 개선
- 하트(생명 아이콘) 간격 조정(2px)
- 10초 미만 구간 코인 획득 제한
- 헤더 타이틀(ONE MORE SECOND) 클릭 시 홈으로 이동
- 헤더 메뉴/접근성 라벨 다국어(i18n) 적용 보강

### Fixed
- 업적 로직 중 `무피격 20초`, `1분 생존` 판정 보정
- 깨진 i18n 텍스트/인코딩 문제 다수 수정(특히 system menu, achievements)
- 게임/일일 챌린지 테스트 불안정(날짜 의존, i18n 의존) 보정

### Security
- 의존성 취약점 대응:
  - `qs` 상향
  - `nth-check` 상향
  - `postcss` 상향
  - `webpack-dev-server` 상향
- `react-scripts`와 `webpack-dev-server@5` 호환을 위한 `patch-package` 적용
- 개발 서버 기본 바인딩 보안 설정(`HOST=127.0.0.1`, `WDS_SOCKET_HOST=127.0.0.1`)

---

## Release Notes Template

아래 템플릿을 복사해서 다음 버전에 사용하세요.

```md
## [x.y.z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Security
- ...

### Known Issues
- ...
```
