### [Seller 라우트 진입 오류]

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
