const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('mock-server/db.json')
const middlewares = jsonServer.defaults()

const PORT = 3000

// 미들웨어 등록 (CORS, 정적 파일 제공 등 기본 설정)
server.use(middlewares)

// Body 파싱을 위한 미들웨어
server.use(jsonServer.bodyParser)

// 1. 글로벌 인위적 지연 (Delay) 미들웨어
// 프론트엔드의 전역 로딩 스피너(LoadingSpinner) 동작을 확인하기 위해
// 모든 요청에 500ms의 지연을 추가합니다.
server.use((req, res, next) => {
  setTimeout(next, 500)
})

// 2. 로그인 커스텀 라우트
// POST /auth/login 요청을 가로채서 가짜 토큰을 발급합니다.
// 모든 계정의 비밀번호는 1234로 통일 (LoginView.vue 토글 계정과 동일)
const MOCK_ACCOUNTS = {
  'sys.admin@conk.com':      { token: 'mock-token-sys',    user: { id: 1, email: 'sys.admin@conk.com',      name: '시스템 관리자', role: 'SYSTEM_ADMIN', status: 'ACTIVE', organization: 'CONK 본사'      } },
  'master.admin@conk.com':   { token: 'mock-token-master', user: { id: 2, email: 'master.admin@conk.com',   name: '총괄 관리자',   role: 'MASTER_ADMIN', status: 'ACTIVE', organization: 'GLS Mega Hub'   } },
  'wh.manager@conk.com':     { token: 'mock-token-whm',    user: { id: 3, email: 'wh.manager@conk.com',     name: '창고 관리자',   role: 'WH_MANAGER',   status: 'ACTIVE', organization: 'GLS Mega Hub'   } },
  'WORKER-001':               { token: 'mock-token-worker', user: { id: 4, email: null,                      name: '창고 작업자',   role: 'WH_WORKER',    status: 'ACTIVE', organization: 'GLS Mega Hub'   } },
  'seller@conk.com':         { token: 'mock-token-seller', user: { id: 5, email: 'seller@conk.com',         name: '셀러 담당자',   role: 'SELLER',       status: 'ACTIVE', organization: 'BrandCo Korea'  } },
}

server.post('/auth/login', (req, res) => {
  const { email, password } = req.body
  const account = MOCK_ACCOUNTS[email]

  if (account && password === '1234') {
    return res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        token: account.token,
        user: account.user,
      },
    })
  }

  // 실패 시 401 Unauthorized 반환
  return res.status(401).json({
    success: false,
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
  })
})

// 나머지 모든 라우트는 db.json을 기반으로 자동 생성된 REST API 사용
server.use(router)

server.listen(PORT, () => {
  console.log(`\n🚀 CONK Mock Server is running at http://localhost:${PORT}`)
  console.log(`⏳ Global delay: 500ms`)
  console.log(`🔑 Test accounts (password: 1234 for all)`)
  console.log(`   SYSTEM_ADMIN : sys.admin@conk.com`)
  console.log(`   MASTER_ADMIN : master.admin@conk.com`)
  console.log(`   WH_MANAGER   : wh.manager@conk.com`)
  console.log(`   WH_WORKER    : WORKER-001`)
  console.log(`   SELLER       : seller@conk.com\n`)
})
