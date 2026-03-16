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

// 3. GET /orders/outbound/stats — 출고 통계 (order-service)
server.get('/orders/outbound/stats', (req, res) => {
  res.status(200).json({
    success: true,
    message: '출고 통계 조회 성공',
    data: {
      pendingOutboundCount: 1284,
      trend: '+12.4%',
      trendLabel: 'vs 어제',
      trendType: 'up',
    },
  })
})

// 4. GET /wms/asn/stats — ASN 통계 (wms-service)
server.get('/wms/asn/stats', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ASN 통계 조회 성공',
    data: {
      unprocessedCount: 42,
      trend: '2건 증가',
      trendLabel: '지연 1시간',
      trendType: 'down',
    },
  })
})

// 5. GET /wms/inventory/stats — 재고 부족 통계 (wms-service)
server.get('/wms/inventory/stats', (req, res) => {
  res.status(200).json({
    success: true,
    message: '재고 통계 조회 성공',
    data: {
      lowStockSkuCount: 18,
      trend: '4건 증가',
      trendLabel: '긴급 보충 필요',
      trendType: 'down',
    },
  })
})

// 6. GET /members/sellers/stats — 셀러 통계 (member-service)
server.get('/members/sellers/stats', (req, res) => {
  res.status(200).json({
    success: true,
    message: '셀러 통계 조회 성공',
    data: {
      activeSellerCount: 156,
      newThisMonth: 3,
      trendType: 'up',
    },
  })
})

// 7. GET /wms/warehouses/status — 창고 운영 현황 (wms-service)
server.get('/wms/warehouses/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: '창고 운영 현황 조회 성공',
    data: [
      {
        id: 1,
        name: 'LA West Coast Hub',
        tag: '메인 거점',
        progress: 92,
        status: 'active',
        statusLabel: '정상 운영중',
        kpis: [
          { label: '출고 대기 건수', value: '142', unit: '건' },
          { label: '미처리 ASN', value: '12', unit: '건' },
          { label: '재고 부족 경고', value: '3', unit: 'SKU', alert: true },
          { label: '집하 마감중', carriers: [{ name: 'USPS', time: '16:00' }, { name: 'FedEx', time: '18:30' }] },
        ],
      },
      {
        id: 2,
        name: 'Central Dallas Center',
        tag: null,
        progress: 65,
        status: 'active',
        statusLabel: '정상 운영중',
        kpis: [
          { label: '출고 대기 건수', value: '81', unit: '건' },
          { label: '미처리 ASN', value: '4', unit: '건' },
          { label: '재고 부족 경고', value: '1', unit: 'SKU', alert: true },
          { label: '집하 마감중', carriers: [{ name: 'UPS', time: '17:30' }, { name: 'FedEx', time: '19:10' }] },
        ],
      },
      {
        id: 3,
        name: 'East NY Hub',
        tag: null,
        progress: 48,
        status: 'idle',
        statusLabel: '주의 모니터링',
        kpis: [
          { label: '출고 대기 건수', value: '96', unit: '건' },
          { label: '미처리 ASN', value: '26', unit: '건' },
          { label: '재고 부족 경고', value: '8', unit: 'SKU', alert: true },
          { label: '집하 마감중', carriers: [{ name: 'USPS', time: '15:30' }, { name: 'DHL', time: '17:00' }] },
        ],
      },
    ],
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
