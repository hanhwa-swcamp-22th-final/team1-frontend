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

// 3. ASN mock 데이터
const MOCK_ASNS = [
  {
    id: 'ASN-2024-0312-001',
    seller: '이수빈',
    company: 'Glow Beauty',
    sku: '앰플 세럼 30ml 외 2종',
    plannedQty: 1000,
    actualQty: null,
    expectedDate: '2026-03-14',
    registeredDate: '2026-03-10',
    status: 'pending',
  },
  {
    id: 'ASN-2024-0311-005',
    seller: '박정호',
    company: 'K-Style',
    sku: '티셔츠 L 외 3종',
    plannedQty: 500,
    actualQty: null,
    expectedDate: '2026-03-13',
    registeredDate: '2026-03-09',
    status: 'transit',
  },
  {
    id: 'ASN-2024-0310-003',
    seller: '최민수',
    company: 'Eco Pure',
    sku: '텀블러 350ml',
    plannedQty: 200,
    actualQty: 185,
    expectedDate: '2026-03-12',
    registeredDate: '2026-03-08',
    status: 'mismatch',
  },
  {
    id: 'ASN-2024-0309-002',
    seller: '이수빈',
    company: 'Glow Beauty',
    sku: '마스크팩 10매입',
    plannedQty: 800,
    actualQty: 800,
    expectedDate: '2026-03-12',
    registeredDate: '2026-03-07',
    status: 'received',
  },
  {
    id: 'ASN-2024-0308-001',
    seller: '강은채',
    company: 'K-Farm',
    sku: '특산 진액 30팩',
    plannedQty: 300,
    actualQty: 298,
    expectedDate: '2026-03-11',
    registeredDate: '2026-03-06',
    status: 'received',
  },
  {
    id: 'ASN-2024-0307-004',
    seller: '김지훈',
    company: 'Beauty Lab',
    sku: 'BB크림 외 1종',
    plannedQty: 400,
    actualQty: null,
    expectedDate: '2026-03-16',
    registeredDate: '2026-03-05',
    status: 'pending',
  },
]

// GET /asns — 전체 목록 (상태 필터 지원: ?status=pending)
server.get('/asns', (req, res) => {
  const { status } = req.query
  const result = status
    ? MOCK_ASNS.filter(a => a.status === status)
    : MOCK_ASNS
  res.json({ success: true, data: result })
})

// GET /asns/kpi — 상태별 건수 집계
server.get('/asns/kpi', (req, res) => {
  res.json({
    success: true,
    data: {
      total:    MOCK_ASNS.length,
      pending:  MOCK_ASNS.filter(a => a.status === 'pending').length,
      transit:  MOCK_ASNS.filter(a => a.status === 'transit').length,
      received: MOCK_ASNS.filter(a => a.status === 'received').length,
      mismatch: MOCK_ASNS.filter(a => a.status === 'mismatch').length,
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
          { label: '재고 부족 경고', value: '7', unit: 'SKU', alert: true },
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
          { label: '재고 부족 경고', value: '3', unit: 'SKU', alert: true },
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
// GET /asns/:id — 단건 상세 조회
server.get('/asns/:id', (req, res) => {
  const asn = MOCK_ASNS.find(a => a.id === req.params.id)
  if (!asn) return res.status(404).json({ success: false, message: 'ASN을 찾을 수 없습니다.' })
  res.json({ success: true, data: asn })
})

// 8. GET /wms/warehouses/summary — 창고 목록 페이지 요약 카드 (wms-service)
//    ※ /wms/warehouses 보다 먼저 등록해야 함 (더 구체적인 경로 우선)
server.get('/wms/warehouses/summary', (req, res) => {
  res.status(200).json({
    success: true,
    message: '창고 목록 요약 조회 성공',
    data: {
      totalCount: 4,
      activeCount: 3,
      totalInventory: 18420,
      todayOutbound: 203,
      avgLocationUtil: 69,
    },
  })
})

// 9. GET /wms/warehouses — 창고 목록 (카드 그리드 + 관리자 테이블 공용)
server.get('/wms/warehouses', (req, res) => {
  res.status(200).json({
    success: true,
    message: '창고 목록 조회 성공',
    data: [
      {
        id: 1,
        code: 'WH-US-LA-001',
        name: 'LA West Coast Hub',
        location: 'Los Angeles, CA',
        status: 'ACTIVE',
        stats: { inventory: 8240, todayOutbound: 89, pendingAsn: 3, sellerCount: 6 },
        locationUtil: 72,
        manager: {
          name: '김태영',
          email: 't.kim@glsm-la.com',
          phone: '+1-213-555-0182',
          lastLogin: '오늘 14:22',
          status: 'ACTIVE',
        },
      },
      {
        id: 2,
        code: 'WH-US-TX-002',
        name: 'Central Dallas Center',
        location: 'Dallas, TX',
        status: 'ACTIVE',
        stats: { inventory: 5180, todayOutbound: 54, pendingAsn: 1, sellerCount: 4 },
        locationUtil: 48,
        manager: {
          name: '박지훈',
          email: 'j.park@glsm-tx.com',
          phone: '+1-214-555-0391',
          lastLogin: '2시간 전',
          status: 'ACTIVE',
        },
      },
      {
        id: 3,
        code: 'WH-US-NY-003',
        name: 'East NY Hub',
        location: 'Newark, NJ',
        status: 'CAUTION',
        stats: { inventory: 5000, todayOutbound: 60, pendingAsn: 2, sellerCount: 5 },
        locationUtil: 88,
        manager: {
          name: '이소윤',
          email: 's.lee@glsm-ny.com',
          phone: '+1-201-555-0844',
          lastLogin: '오늘 09:11',
          status: 'CAUTION',
        },
      },
      {
        id: 4,
        code: 'WH-US-IL-004',
        name: 'Chicago Midwest Depot',
        location: 'Chicago, IL',
        status: 'INACTIVE',
        stats: { inventory: 0, todayOutbound: 0, pendingAsn: 0, sellerCount: 0 },
        locationUtil: 0,
        manager: null,
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
