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

// ──────────────────────────────────────────────────────────────────────────────
// 창고 상세 — /wms/warehouses/:id/inventory
// ──────────────────────────────────────────────────────────────────────────────
const WAREHOUSE_INVENTORY = {
  1: [
    { sku: 'KR-MASK-001', available: 348, allocated:  52, total: 400 },
    { sku: 'KR-SNCK-012', available: 185, allocated:  15, total: 200 },
    { sku: 'KR-COSM-034', available:   8, allocated:   4, total:  12 }, // 부족
    { sku: 'KR-FOOD-007', available: 624, allocated:  76, total: 700 },
    { sku: 'KR-BEAU-089', available:  91, allocated:   9, total: 100 },
    { sku: 'KR-ELEC-021', available:   5, allocated:   2, total:   7 }, // 부족
    { sku: 'KR-HOME-056', available: 210, allocated:  40, total: 250 },
    { sku: 'KR-PETS-003', available: 430, allocated:  70, total: 500 },
    { sku: 'KR-KIDS-044', available:  77, allocated:  23, total: 100 },
    { sku: 'KR-SPRT-018', available: 302, allocated:  48, total: 350 },
    { sku: 'KR-HBAL-062', available: 155, allocated:  25, total: 180 },
    { sku: 'KR-BOOK-091', available:  68, allocated:  12, total:  80 },
  ],
  2: [
    { sku: 'KR-FOOD-007', available: 320, allocated:  80, total: 400 },
    { sku: 'KR-SNCK-012', available: 140, allocated:  60, total: 200 },
    { sku: 'KR-BEAU-089', available:  55, allocated:  45, total: 100 },
    { sku: 'KR-HOME-056', available: 180, allocated:  20, total: 200 },
    { sku: 'KR-PETS-003', available: 220, allocated:  30, total: 250 },
    { sku: 'KR-KIDS-044', available:  12, allocated:   8, total:  20 }, // 부족
    { sku: 'KR-SPRT-018', available:  95, allocated:  55, total: 150 },
    { sku: 'KR-MASK-001', available: 280, allocated:  20, total: 300 },
  ],
  3: [
    { sku: 'KR-COSM-034', available:   6, allocated:   4, total:  10 }, // 부족
    { sku: 'KR-ELEC-021', available:   3, allocated:   2, total:   5 }, // 부족
    { sku: 'KR-HBAL-062', available:   9, allocated:   6, total:  15 }, // 부족
    { sku: 'KR-MASK-001', available: 410, allocated:  90, total: 500 },
    { sku: 'KR-SNCK-012', available: 290, allocated:  10, total: 300 },
    { sku: 'KR-FOOD-007', available: 480, allocated:  20, total: 500 },
    { sku: 'KR-BEAU-089', available:  75, allocated:  25, total: 100 },
    { sku: 'KR-HOME-056', available: 130, allocated:  20, total: 150 },
    { sku: 'KR-PETS-003', available: 340, allocated:  60, total: 400 },
    { sku: 'KR-BOOK-091', available:  55, allocated:  15, total:  70 },
  ],
}

server.get('/wms/warehouses/:id/inventory', (req, res) => {
  const data = WAREHOUSE_INVENTORY[Number(req.params.id)]
  if (!data) return res.status(404).json({ message: 'Warehouse not found' })
  res.json({ data })
})

// ──────────────────────────────────────────────────────────────────────────────
// 창고 상세 — /wms/warehouses/:id/outbound
// ──────────────────────────────────────────────────────────────────────────────
const WAREHOUSE_OUTBOUND = {
  1: {
    today: [
      { orderId: 'ORD-2026-03810', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03811', seller: '서울식품코리아', status: '패킹중'   },
      { orderId: 'ORD-2026-03812', seller: 'K뷰티글로벌',   status: '피킹중'   },
      { orderId: 'ORD-2026-03813', seller: '한국미용상사',   status: '출고지시' },
      { orderId: 'ORD-2026-03814', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03815', seller: 'K뷰티글로벌',   status: '패킹중'   },
      { orderId: 'ORD-2026-03816', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03817', seller: '한국미용상사',   status: '피킹중'   },
      { orderId: 'ORD-2026-03818', seller: '서울식품코리아', status: '출고지시' },
      { orderId: 'ORD-2026-03819', seller: 'K뷰티글로벌',   status: '출고완료' },
    ],
    week: [
      { orderId: 'ORD-2026-03800', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03801', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03802', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03803', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03804', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03805', seller: 'K뷰티글로벌',   status: '패킹중'   },
      { orderId: 'ORD-2026-03806', seller: '서울식품코리아', status: '피킹중'   },
      { orderId: 'ORD-2026-03807', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03808', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03809', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03810', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03811', seller: '서울식품코리아', status: '패킹중'   },
      { orderId: 'ORD-2026-03812', seller: 'K뷰티글로벌',   status: '피킹중'   },
      { orderId: 'ORD-2026-03813', seller: '한국미용상사',   status: '출고지시' },
      { orderId: 'ORD-2026-03814', seller: '서울식품코리아', status: '출고완료' },
    ],
    month: [
      { orderId: 'ORD-2026-03770', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03771', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03772', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03773', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03774', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03775', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03776', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03777', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03778', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03779', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03780', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03781', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03782', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03783', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03784', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03785', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03786', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03787', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03788', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03789', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03790', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03791', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03792', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03793', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03794', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03795', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03796', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03797', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03798', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03799', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03800', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03801', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03802', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03803', seller: '한국스포츠',     status: '출고완료' },
      { orderId: 'ORD-2026-03804', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03805', seller: 'K뷰티글로벌',   status: '패킹중'   },
      { orderId: 'ORD-2026-03806', seller: '서울식품코리아', status: '피킹중'   },
      { orderId: 'ORD-2026-03807', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03808', seller: 'K뷰티글로벌',   status: '출고완료' },
      { orderId: 'ORD-2026-03809', seller: '서울식품코리아', status: '출고완료' },
      { orderId: 'ORD-2026-03810', seller: '한국미용상사',   status: '출고완료' },
      { orderId: 'ORD-2026-03811', seller: '서울식품코리아', status: '패킹중'   },
    ],
  },
  2: {
    today: [
      { orderId: 'ORD-2026-04201', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04202', seller: '텍사스K마트',    status: '피킹중'   },
      { orderId: 'ORD-2026-04203', seller: '드림푸드',       status: '출고지시' },
      { orderId: 'ORD-2026-04204', seller: '한국홈리빙',     status: '패킹중'   },
      { orderId: 'ORD-2026-04205', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04206', seller: '드림푸드',       status: '출고완료' },
    ],
    week: [
      { orderId: 'ORD-2026-04190', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04191', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04192', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04193', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04194', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04195', seller: '드림푸드',       status: '패킹중'   },
      { orderId: 'ORD-2026-04196', seller: '한국홈리빙',     status: '피킹중'   },
      { orderId: 'ORD-2026-04197', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04198', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04199', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04200', seller: '드림푸드',       status: '출고완료' },
    ],
    month: [
      { orderId: 'ORD-2026-04170', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04171', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04172', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04173', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04174', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04175', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04176', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04177', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04178', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04179', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04180', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04181', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04182', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04183', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04184', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04185', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04186', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04187', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04188', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04189', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04190', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04191', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04192', seller: '한국홈리빙',     status: '출고완료' },
      { orderId: 'ORD-2026-04193', seller: '드림푸드',       status: '출고완료' },
      { orderId: 'ORD-2026-04194', seller: '텍사스K마트',    status: '출고완료' },
      { orderId: 'ORD-2026-04195', seller: '드림푸드',       status: '패킹중'   },
      { orderId: 'ORD-2026-04196', seller: '한국홈리빙',     status: '피킹중'   },
      { orderId: 'ORD-2026-04197', seller: '텍사스K마트',    status: '출고완료' },
    ],
  },
  3: {
    today: [
      { orderId: 'ORD-2026-05101', seller: 'NY코리아몰',     status: '지연'     },
      { orderId: 'ORD-2026-05102', seller: '이스트K뷰티',    status: '출고지시' },
      { orderId: 'ORD-2026-05103', seller: 'NY코리아몰',     status: '피킹중'   },
      { orderId: 'ORD-2026-05104', seller: '뉴저지한국마트', status: '지연'     },
      { orderId: 'ORD-2026-05105', seller: '이스트K뷰티',    status: '패킹중'   },
      { orderId: 'ORD-2026-05106', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05107', seller: '뉴저지한국마트', status: '출고지시' },
      { orderId: 'ORD-2026-05108', seller: '이스트K뷰티',    status: '피킹중'   },
    ],
    week: [
      { orderId: 'ORD-2026-05088', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05089', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05090', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05091', seller: 'NY코리아몰',     status: '지연'     },
      { orderId: 'ORD-2026-05092', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05093', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05094', seller: '뉴저지한국마트', status: '패킹중'   },
      { orderId: 'ORD-2026-05095', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05096', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05097', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05098', seller: '이스트K뷰티',    status: '지연'     },
      { orderId: 'ORD-2026-05099', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05100', seller: '뉴저지한국마트', status: '출고완료' },
    ],
    month: [
      { orderId: 'ORD-2026-05060', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05061', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05062', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05063', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05064', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05065', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05066', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05067', seller: '이스트K뷰티',    status: '지연'     },
      { orderId: 'ORD-2026-05068', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05069', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05070', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05071', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05072', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05073', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05074', seller: '뉴저지한국마트', status: '지연'     },
      { orderId: 'ORD-2026-05075', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05076', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05077', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05078', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05079', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05080', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05081', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05082', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05083', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05084', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05085', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05086', seller: '뉴저지한국마트', status: '지연'     },
      { orderId: 'ORD-2026-05087', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05088', seller: '이스트K뷰티',    status: '출고완료' },
      { orderId: 'ORD-2026-05089', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05090', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05091', seller: '이스트K뷰티',    status: '지연'     },
      { orderId: 'ORD-2026-05092', seller: '뉴저지한국마트', status: '출고완료' },
      { orderId: 'ORD-2026-05093', seller: 'NY코리아몰',     status: '출고완료' },
      { orderId: 'ORD-2026-05094', seller: '이스트K뷰티',    status: '패킹중'   },
      { orderId: 'ORD-2026-05095', seller: '뉴저지한국마트', status: '출고완료' },
    ],
  },
}

server.get('/wms/warehouses/:id/outbound', (req, res) => {
  const data = WAREHOUSE_OUTBOUND[Number(req.params.id)]
  if (!data) return res.status(404).json({ message: 'Warehouse not found' })
  res.json({ data })
})

// ──────────────────────────────────────────────────────────────────────────────
// 창고 상세 — /wms/warehouses/:id/orders
// ──────────────────────────────────────────────────────────────────────────────
const WAREHOUSE_ORDERS = {
  1: {
    stats: { waiting: 8, inProgress: 11, done: 5 },
    list: [
      { orderId: 'ORD-2026-03810', sku: 'KR-MASK-001', qty:  50, dest: 'Los Angeles, CA',    status: '출고완료', worker: '작업자 A' },
      { orderId: 'ORD-2026-03811', sku: 'KR-SNCK-012', qty:  30, dest: 'San Francisco, CA',  status: '패킹중',   worker: '작업자 B' },
      { orderId: 'ORD-2026-03812', sku: 'KR-COSM-034', qty:  10, dest: 'San Diego, CA',      status: '피킹중',   worker: '작업자 C' },
      { orderId: 'ORD-2026-03813', sku: 'KR-FOOD-007', qty:  80, dest: 'Phoenix, AZ',        status: '출고지시', worker: '-'       },
      { orderId: 'ORD-2026-03814', sku: 'KR-BEAU-089', qty:  20, dest: 'Las Vegas, NV',      status: '출고완료', worker: '작업자 D' },
      { orderId: 'ORD-2026-03815', sku: 'KR-ELEC-021', qty:   5, dest: 'Portland, OR',       status: '패킹중',   worker: '작업자 A' },
      { orderId: 'ORD-2026-03816', sku: 'KR-HOME-056', qty:  40, dest: 'Seattle, WA',        status: '출고완료', worker: '작업자 B' },
      { orderId: 'ORD-2026-03817', sku: 'KR-PETS-003', qty:  70, dest: 'Denver, CO',         status: '피킹중',   worker: '작업자 C' },
      { orderId: 'ORD-2026-03818', sku: 'KR-KIDS-044', qty:  25, dest: 'Salt Lake City, UT', status: '출고지시', worker: '-'       },
      { orderId: 'ORD-2026-03819', sku: 'KR-SPRT-018', qty:  48, dest: 'Tucson, AZ',         status: '출고완료', worker: '작업자 D' },
    ],
  },
  2: {
    stats: { waiting: 3, inProgress: 5, done: 4 },
    list: [
      { orderId: 'ORD-2026-04201', sku: 'KR-FOOD-007', qty: 100, dest: 'Dallas, TX',         status: '출고완료', worker: '작업자 E' },
      { orderId: 'ORD-2026-04202', sku: 'KR-SNCK-012', qty:  60, dest: 'Houston, TX',        status: '피킹중',   worker: '작업자 F' },
      { orderId: 'ORD-2026-04203', sku: 'KR-BEAU-089', qty:  20, dest: 'Austin, TX',         status: '출고지시', worker: '-'       },
      { orderId: 'ORD-2026-04204', sku: 'KR-HOME-056', qty:  35, dest: 'San Antonio, TX',    status: '패킹중',   worker: '작업자 E' },
      { orderId: 'ORD-2026-04205', sku: 'KR-PETS-003', qty:  55, dest: 'Fort Worth, TX',     status: '출고완료', worker: '작업자 F' },
      { orderId: 'ORD-2026-04206', sku: 'KR-SPRT-018', qty:  40, dest: 'Oklahoma City, OK',  status: '출고완료', worker: '작업자 E' },
      { orderId: 'ORD-2026-04207', sku: 'KR-MASK-001', qty:  30, dest: 'New Orleans, LA',    status: '출고지시', worker: '-'       },
    ],
  },
  3: {
    stats: { waiting: 12, inProgress: 8, done: 2 },
    list: [
      { orderId: 'ORD-2026-05101', sku: 'KR-COSM-034', qty:   6, dest: 'New York, NY',       status: '지연',     worker: '작업자 G' },
      { orderId: 'ORD-2026-05102', sku: 'KR-ELEC-021', qty:   3, dest: 'Newark, NJ',         status: '출고지시', worker: '-'       },
      { orderId: 'ORD-2026-05103', sku: 'KR-HBAL-062', qty:   9, dest: 'Jersey City, NJ',    status: '피킹중',   worker: '작업자 H' },
      { orderId: 'ORD-2026-05104', sku: 'KR-MASK-001', qty:  90, dest: 'Brooklyn, NY',       status: '지연',     worker: '작업자 G' },
      { orderId: 'ORD-2026-05105', sku: 'KR-SNCK-012', qty:  50, dest: 'Queens, NY',         status: '패킹중',   worker: '작업자 H' },
      { orderId: 'ORD-2026-05106', sku: 'KR-FOOD-007', qty: 120, dest: 'Bronx, NY',          status: '출고완료', worker: '작업자 G' },
      { orderId: 'ORD-2026-05107', sku: 'KR-BEAU-089', qty:  25, dest: 'Staten Island, NY',  status: '출고지시', worker: '-'       },
      { orderId: 'ORD-2026-05108', sku: 'KR-HOME-056', qty:  40, dest: 'Yonkers, NY',        status: '피킹중',   worker: '작업자 H' },
      { orderId: 'ORD-2026-05109', sku: 'KR-PETS-003', qty:  60, dest: 'Buffalo, NY',        status: '출고완료', worker: '작업자 G' },
    ],
  },
}

server.get('/wms/warehouses/:id/orders', (req, res) => {
  const data = WAREHOUSE_ORDERS[Number(req.params.id)]
  if (!data) return res.status(404).json({ message: 'Warehouse not found' })
  res.json({ data })
})

// ──────────────────────────────────────────────────────────────────────────────
// 창고 상세 — /wms/warehouses/:id/locations
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Bin 배열 생성 헬퍼
 * @param {string} zone     - 'A'|'B'|'C'
 * @param {number} rack     - 1-5
 * @param {number} usedCount - 'used' bin 수 (나머지는 'avail', 마지막 1개는 'off')
 */
function makeBins(zone, rack, usedCount) {
  const rackStr = String(rack).padStart(2, '0')
  return Array.from({ length: 6 }, (_, i) => {
    const binNum = String(i + 1).padStart(2, '0')
    const id     = `${zone}-${rackStr}-${binNum}`
    const state  = i === 5 ? 'off' : i < usedCount ? 'used' : 'avail'
    return { id, state }
  })
}

const WAREHOUSE_LOCATIONS = {
  // WH1 LA (전체 72%): Zone A=60% / Zone B=75% / Zone C=80%
  1: [
    {
      zone: 'A', label: 'Zone A — 일반보관 구역', utilPct: 60, available: 12, total: 30,
      racks: [
        { name: 'RACK A-01', bins: makeBins('A', 1, 4) },
        { name: 'RACK A-02', bins: makeBins('A', 2, 3) },
        { name: 'RACK A-03', bins: makeBins('A', 3, 4) },
        { name: 'RACK A-04', bins: makeBins('A', 4, 3) },
        { name: 'RACK A-05', bins: makeBins('A', 5, 4) },
      ],
    },
    {
      zone: 'B', label: 'Zone B — 냉장보관 구역', utilPct: 75, available: 7, total: 30,
      racks: [
        { name: 'RACK B-01', bins: makeBins('B', 1, 5) },
        { name: 'RACK B-02', bins: makeBins('B', 2, 4) },
        { name: 'RACK B-03', bins: makeBins('B', 3, 5) },
        { name: 'RACK B-04', bins: makeBins('B', 4, 4) },
        { name: 'RACK B-05', bins: makeBins('B', 5, 5) },
      ],
    },
    {
      zone: 'C', label: 'Zone C — 대형물류 구역', utilPct: 80, available: 5, total: 25,
      racks: [
        { name: 'RACK C-01', bins: makeBins('C', 1, 5) },
        { name: 'RACK C-02', bins: makeBins('C', 2, 5) },
        { name: 'RACK C-03', bins: makeBins('C', 3, 4) },
        { name: 'RACK C-04', bins: makeBins('C', 4, 5) },
        { name: 'RACK C-05', bins: makeBins('C', 5, 5) },
      ],
    },
  ],
  // WH2 Dallas (전체 48%): Zone A=45% / Zone B=52% / Zone C=48%
  2: [
    {
      zone: 'A', label: 'Zone A — 일반보관 구역', utilPct: 45, available: 16, total: 30,
      racks: [
        { name: 'RACK A-01', bins: makeBins('A', 1, 2) },
        { name: 'RACK A-02', bins: makeBins('A', 2, 3) },
        { name: 'RACK A-03', bins: makeBins('A', 3, 2) },
        { name: 'RACK A-04', bins: makeBins('A', 4, 3) },
        { name: 'RACK A-05', bins: makeBins('A', 5, 3) },
      ],
    },
    {
      zone: 'B', label: 'Zone B — 냉장보관 구역', utilPct: 52, available: 13, total: 28,
      racks: [
        { name: 'RACK B-01', bins: makeBins('B', 1, 3) },
        { name: 'RACK B-02', bins: makeBins('B', 2, 3) },
        { name: 'RACK B-03', bins: makeBins('B', 3, 4) },
        { name: 'RACK B-04', bins: makeBins('B', 4, 3) },
        { name: 'RACK B-05', bins: makeBins('B', 5, 2) },
      ],
    },
    {
      zone: 'C', label: 'Zone C — 대형물류 구역', utilPct: 48, available: 13, total: 25,
      racks: [
        { name: 'RACK C-01', bins: makeBins('C', 1, 2) },
        { name: 'RACK C-02', bins: makeBins('C', 2, 3) },
        { name: 'RACK C-03', bins: makeBins('C', 3, 3) },
        { name: 'RACK C-04', bins: makeBins('C', 4, 2) },
        { name: 'RACK C-05', bins: makeBins('C', 5, 3) },
      ],
    },
  ],
  // WH3 NY CAUTION (전체 88%): Zone A=85% / Zone B=90% / Zone C=88%
  3: [
    {
      zone: 'A', label: 'Zone A — 일반보관 구역', utilPct: 85, available: 4, total: 30,
      racks: [
        { name: 'RACK A-01', bins: makeBins('A', 1, 5) },
        { name: 'RACK A-02', bins: makeBins('A', 2, 5) },
        { name: 'RACK A-03', bins: makeBins('A', 3, 5) },
        { name: 'RACK A-04', bins: makeBins('A', 4, 4) },
        { name: 'RACK A-05', bins: makeBins('A', 5, 5) },
      ],
    },
    {
      zone: 'B', label: 'Zone B — 냉장보관 구역', utilPct: 90, available: 2, total: 22,
      racks: [
        { name: 'RACK B-01', bins: makeBins('B', 1, 5) },
        { name: 'RACK B-02', bins: makeBins('B', 2, 5) },
        { name: 'RACK B-03', bins: makeBins('B', 3, 5) },
        { name: 'RACK B-04', bins: makeBins('B', 4, 4) },
        { name: 'RACK B-05', bins: makeBins('B', 5, 5) },
      ],
    },
    {
      zone: 'C', label: 'Zone C — 대형물류 구역', utilPct: 88, available: 3, total: 25,
      racks: [
        { name: 'RACK C-01', bins: makeBins('C', 1, 5) },
        { name: 'RACK C-02', bins: makeBins('C', 2, 5) },
        { name: 'RACK C-03', bins: makeBins('C', 3, 5) },
        { name: 'RACK C-04', bins: makeBins('C', 4, 4) },
        { name: 'RACK C-05', bins: makeBins('C', 5, 5) },
      ],
    },
  ],
}

server.get('/wms/warehouses/:id/locations', (req, res) => {
  const data = WAREHOUSE_LOCATIONS[Number(req.params.id)]
  if (!data) return res.status(404).json({ message: 'Warehouse not found' })
  res.json({ data })
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
