## UI 컴포넌트 작성 규칙

1. 참고 이미지를 기준으로 디자인과 구조를 최대한 동일하게 구현한다.
2. HTML/CSS는 간결하게 작성하고 재사용성과 유지보수성을 우선한다.
3. 컬러, 크기, 간격 등은 `variables.css`의 Semantic 토큰만 사용하며 Primitive 직접 참조는 금지한다.
4. 필요한 토큰이 없으면 임의로 생성하지 않고 제안한다.
5. 기존 프로젝트의 구조, 클래스 및 네이밍 규칙을 유지한다.
6. 컴포넌트의 Variant와 Size는 클래스로 구분하고, 내부 요소와 상태는 구조 기반 선택자를 우선 활용한다.
7. 웹표준을 준수하고 기본적인 웹접근성을 적용한다.
8. 반응형은 Mobile First 및 `min-width` 기준으로 작성한다.
9. 기존 코드의 제거, 변경, 리팩터링 및 중복 정리는 제안 후 승인받아 반영한다.
10. 요청 범위만 작업하고 코드는 최소한으로 제공하며, 설명과 주석은 필요한 경우에만 작성한다.
11. 외부 라이브러리는 공식 버전을 사용한다.
12. 아이콘은 `icons.css`의 CSS 마스크 방식(`mask`, `-webkit-mask`)을 따른다. SVG 파일은 마스크 소스로 사용하고, 인라인 SVG나 별도 `<i>` 요소는 추가하지 않는다.
13. 아이콘이 필요한 요소에 `data-icon`을 지정하고 `::before` 가상 요소로 표시한다. 아이콘 소스와 공통 스타일은 `icons.css`에서 관리한다.
14. 아이콘 색상은 `background-color: var(--icon-color, currentColor)`로 적용한다. 기본적으로 부모의 `color`를 따르며, `--icon-color`에 Semantic 컬러 토큰을 지정해 별도로 변경할 수 있다. 크기는 `--icon-size`에 기존 크기 토큰을 지정한다.
15. 장식용 아이콘에는 텍스트 콘텐츠를 생성하지 않는다(`content: ""`). 아이콘만 있는 버튼은 버튼 자체에 `aria-label`로 접근 가능한 이름을 제공한다.
16. 별도 요청이 없으면 폼 컨트롤을 포함한 모든 보더의 두께는 `1px`로 직접 지정한다. 보더 두께는 3항의 토큰 사용 원칙에서 예외로 하며, `calc()` 등 불필요한 계산식을 사용하지 않는다.
17. 폰트 크기는 `calc()` 등 계산식으로 지정하지 않고, `variables.css`의 기존 Semantic 토큰을 직접 사용한다. 필요한 폰트 크기 토큰이 없으면 임의의 값이나 계산식으로 대체하지 않고 제안한다.

## 페이지 구조 및 공통 레이아웃

- 멀티 페이지 구조(MPA)를 사용한다. 메뉴별 폴더에 `index.html`을 작성하고, 페이지 이동은 `<a href="…">`로 연결한다.
- 사용자 페이지는 `WEB-INF/html/user/{메뉴 폴더}/index.html`에 배치한다. 현재 메뉴 폴더는 `dashboard`, `assessment`, `education`, `diagnosis`, `reports`, `helpdesk`이다.
- 공통 사이드바와 헤더는 `WEB-INF/html/user/sidebar.html`, `header.html`의 HTML 조각으로 관리한다. CSS와 동작 스크립트도 각각 별도 파일로 관리한다.
- HTML 퍼블리싱에서는 Fetch 기반 클라이언트 사이드 HTML Include 방식을 사용한다. 공통 로더는 `resources/user/js/temp/temp.js`이며, 페이지에서 `defer`로 불러온다.
- 삽입 위치에 `data-include="../sidebar.html"`, `data-include="../header.html"`을 지정한다. Fetch 경로는 현재 페이지 URL을 기준으로 해석되므로 폴더 깊이에 맞게 작성한다.
- 삽입된 HTML의 링크와 리소스 경로도 현재 페이지 URL을 기준으로 해석된다. 공통 조각의 메뉴 링크와 리소스는 루트 기준 경로를 사용한다.
- `temp.js`는 문서 로딩과 오류 처리만 담당한다. 공통 문서 로딩 완료 후 발생하는 `includes:loaded` 이벤트로 필요한 컴포넌트를 초기화한다. 메뉴와 헤더 동작은 각 컴포넌트 스크립트에서 처리한다.
- 현재 메뉴의 선택 상태는 페이지 URL에 따라 `aria-current="page"`로 표시한다.
- `temp.js`는 HTML 퍼블리싱 전용이다. HTTP 서버에서 확인하며, 실제 서비스 연계 시 공통 레이아웃을 서버 템플릿 등 서비스 구조에 맞게 전환한다.

## CSS 로드 규칙

- 각 HTML 문서는 `/resources/user/css/user.css` 하나만 stylesheet로 로드한다. 공통 HTML 조각에는 stylesheet 링크를 추가하지 않는다.
- 나머지 CSS는 `user.css` 안에서 `@import`로 관리한다. import는 `@charset` 다음, 일반 스타일 선언보다 앞에 작성한다.
- 로드 순서는 토큰 → 초기화 → 아이콘 → 공통 컴포넌트 → 레이아웃·개별 컴포넌트 → 페이지 스타일 순서로 유지한다.
- 공통으로 import되는 페이지 전용 CSS는 해당 페이지의 루트 속성·구조로 적용 범위를 제한해 다른 화면에 영향을 주지 않도록 한다. 컴포넌트 가이드는 `body[data-component-guide]`를 기준으로 한다.
