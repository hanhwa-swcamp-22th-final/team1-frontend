### 1. [Seller 라우트 진입 오류]

**Problem**  
Seller 라우트 추가 후 대응하는 뷰 파일이 없어 진입이 실패했고, 로그인 화면도 아직 placeholder 상태였음

**Impact**  
Seller 화면 확인과 빌드 테스트가 막혔음

**Reproduction**  
- Seller 라우트를 추가한 상태에서 대응 뷰 파일 없이 실행함
- `/login` 진입 시 로그인 화면이 구현되지 않아 Seller 테스트가 어려웠음

**Cause**  
- 라우트와 실제 뷰 파일 상태가 맞지 않았음
- Seller용 로그인 테스트 경로가 없었음

**Fix**  
- 누락된 Seller 뷰 파일을 생성함
- `localStorage`에 Seller 세션을 직접 넣어 임시 로그인 상태로 확인함

**Verification**  
- Seller 라우트 진입이 가능함
- 빌드와 화면 확인이 정상 동작함

**Prevention**  
라우트 추가 시 대응 뷰 파일을 함께 만들고 바로 확인함

**Related**  
- `src/router/routes/seller.js`
- `src/views/seller/*`
- `src/views/auth/LoginView.vue`

### [Seller Dashboard end tag 오류]

**Problem**  
Dashboard 하단 카드 영역 수정 후 Vue 템플릿에 빨간줄이 발생함

**Impact**  
`npm run build`가 `Element is missing end tag` 오류로 실패함

**Reproduction**  
- `table-grid` 안에서 `기간별 입고 재고 목록` 카드를 `최근 활동` 카드 내부에 중첩함

**Cause**  
카드 2개가 형제가 아니라 중첩되면서 `div` 닫는 태그 구조가 깨졌음

**Fix**  
- `최근 활동` 카드와 `기간별 입고 재고 목록` 카드를 `table-grid`의 형제 요소로 분리함
- 상단 헤더 액션 버튼 class 줄바꿈도 한 줄로 정리함

**Verification**  
- `npm run build` 정상 통과

**Prevention**  
대시보드 카드 추가 시 `table-grid` 내부 구조를 먼저 맞춘 뒤 빌드로 바로 확인함

**Related**  
- `src/views/seller/SellerDashboardView.vue`

### [Seller 로그인 후 404 이동]

**Problem**  
Seller 로그인 직후 404 페이지로 이동함

**Impact**  
로그인은 성공해도 Seller 화면 진입이 불가능해 보였음

**Reproduction**  
- 미구현 Seller 경로로 먼저 접근해 `/login?redirect=...` 상태가 됨
- 이후 Seller 계정으로 로그인함

**Cause**  
`LoginView.vue`가 `route.query.redirect`를 우선 사용해, 존재하지 않는 Seller 경로로 다시 이동했음

**Fix**  
- 주소창에서 `/login`으로 직접 진입한 뒤 다시 로그인
- 또는 `redirect` 쿼리를 제거하고 로그인

**Verification**  
- `/login`에서 Seller 로그인 시 `seller-dashboard`로 정상 이동

**Prevention**  
미구현 Seller 경로 접근 후 로그인 테스트할 때는 `redirect` 쿼리 포함 여부를 먼저 확인함

**Related**  
- `src/views/auth/LoginView.vue`
- `src/router/routes/seller.js`
- `src/router/index.js`

### [Seller 업로드 주문 저장 버튼 비활성화]

**Problem**  
업로드 주문 저장 버튼이 업로드 전 상태에서 아예 눌리지 않았음

**Impact**  
사용자가 버튼 클릭으로 안내 메시지를 확인할 수 없었고, 업로드 저장 흐름이 막힌 것처럼 보였음

**Reproduction**  
- Seller 주문 등록 화면 진입
- 엑셀 파일 업로드 전에 `업로드 주문 저장` 버튼 확인

**Cause**  
템플릿에서 `isPreviewSample` 상태일 때 버튼에 `disabled`가 걸려 있었음

**Fix**  
- 버튼 비활성화 조건에서 `isPreviewSample`을 제거함
- 업로드 데이터가 없을 때는 `handleBulkSubmit()`의 기존 에러 메시지로 안내하도록 유지함

**Verification**  
- 업로드 전에도 버튼 클릭 가능
- 업로드 데이터가 없으면 `저장할 업로드 주문이 없습니다.` 메시지 노출

**Prevention**  
행동 버튼은 완전 비활성화보다 클릭 후 원인 메시지를 보여주는 흐름이 더 적절한지 먼저 확인함

**Related**  
- `src/views/seller/SellerOrderRegisterView.vue`

### [git pull 실패]

**Problem**  
현재 브랜치에서 `git pull`이 동작하지 않았음

**Impact**  
원격 변경사항을 바로 가져오지 못했음

**Reproduction**  
- `feature/seller-orders` 브랜치에서 `git pull` 실행

**Cause**  
현재 브랜치에 원격 추적 브랜치(upstream)가 설정되지 않았음

**Fix**  
- `git branch --set-upstream-to=origin/feature/seller-orders feature/seller-orders`
- 이후 `git pull` 실행

**Verification**  
- `origin/feature/seller-orders` 브랜치가 실제로 존재함
- `git branch -vv`에서 현재 브랜치 upstream 미설정 확인

**Prevention**  
새 브랜치 생성 후 첫 push 또는 pull 전에 upstream 연결 여부를 먼저 확인함

**Related**  
- `feature/seller-orders`
