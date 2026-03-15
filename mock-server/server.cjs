const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('mock-server/db.json');
const middlewares = jsonServer.defaults();

const PORT = 3000;

// 미들웨어 등록 (CORS, 정적 파일 제공 등 기본 설정)
server.use(middlewares);

// Body 파싱을 위한 미들웨어
server.use(jsonServer.bodyParser);

// 1. 글로벌 인위적 지연 (Delay) 미들웨어
// 프론트엔드의 전역 로딩 스피너(LoadingSpinner) 동작을 확인하기 위해
// 모든 요청에 500ms의 지연을 추가합니다.
server.use((req, res, next) => {
  setTimeout(next, 500);
});

// 2. 로그인 커스텀 라우트
// POST /auth/login 요청을 가로채서 가짜 토큰을 발급합니다.
server.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  // 임시 하드코딩된 계정 검증
  if (email === 'admin@conk.com' && password === '1234') {
    return res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        token: 'mock-jwt-token-for-admin-12345',
        user: {
          id: 1,
          email: 'admin@conk.com',
          name: '시스템 최고관리자',
          role: 'SYSTEM_ADMIN',
          status: 'ACTIVE',
          organization: 'CONK 본사'
        }
      }
    });
  }

  // 실패 시 401 Unauthorized 반환
  return res.status(401).json({
    success: false,
    message: '이메일 또는 비밀번호가 올바르지 않습니다.'
  });
});

// 나머지 모든 라우트는 db.json을 기반으로 자동 생성된 REST API 사용
server.use(router);

server.listen(PORT, () => {
  console.log(`\n🚀 CONK Mock Server is running at http://localhost:${PORT}`);
  console.log(`⏳ Global delay: 500ms`);
  console.log(`🔑 Test login: admin@conk.com / 1234\n`);
});