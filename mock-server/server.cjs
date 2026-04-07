// server.cjs — 진입점: 미들웨어 등록 + 라우터 마운트 + 서버 시작
//
// 라우터 담당 분리
//   routes/auth.cjs    — POST /member/auth/* (공통)   ← /auth/* alias 유지
//   routes/wms.cjs     — GET  /wms/*         (masterAdmin + whManager + whWorker) ← /wms/asns/* 포함
//   routes/orders.cjs  — GET  /orders/*      (whManager + seller order)
//   routes/members.cjs — GET  /member/*      (masterAdmin + systemAdmin) ← /members/* alias 유지
//   routes/products.cjs — GET/POST /wms/products/*   (seller product) ← /products/* alias 유지
//   routes/integrations.cjs — GET /integrations/* (seller channel)
//   routes/notifications.cjs — GET /notifications/* (seller notifications)
//
// Mock 데이터 구조
//   mock-server/data/common.json       — accounts (공통)
//   mock-server/data/master-admin.json — master admin 전용 데이터
//   mock-server/data/wh-manager.json   — wh manager 전용 데이터
//   mock-server/data/wh-worker.json    — wh worker 전용 데이터
//   mock-server/data/seller.json       — seller 전용 데이터
//   mock-server/data/system-admin.json — system admin 전용 데이터
//   → 서버 시작 시 위 파일들을 병합하여 메모리에서 사용 (db.json은 gitignore)
const jsonServer = require('json-server')
const fs         = require('fs')
const path       = require('path')
const server     = jsonServer.create()
const middlewares = jsonServer.defaults()

const dataDir = path.join(__dirname, 'data')
const merged  = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('.json'))
  .reduce((acc, file) => {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'))
    return { ...acc, ...data }
  }, {})

const router = jsonServer.router(merged)

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000'
const PORT = new URL(BASE_URL).port || 3000

server.use(middlewares)
server.use(jsonServer.bodyParser)

// ── 커스텀 라우터 마운트 ──────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.cjs')(BASE_URL)
const wmsRoutes = require('./routes/wms.cjs')(BASE_URL)
const orderRoutes = require('./routes/orders.cjs')(BASE_URL)
const memberRoutes = require('./routes/members.cjs')(BASE_URL)
const productRoutes = require('./routes/products.cjs')(BASE_URL)
const integrationRoutes = require('./routes/integrations.cjs')(BASE_URL)
const notificationRoutes = require('./routes/notifications.cjs')(BASE_URL)

server.use('/member/auth', authRoutes)
server.use('/member', memberRoutes)
server.use('/wms/products', productRoutes)
server.use('/wms', wmsRoutes)
server.use('/orders', orderRoutes)
server.use('/integrations', integrationRoutes)
server.use('/notifications', notificationRoutes)

// legacy aliases
server.use('/auth', authRoutes)
server.use('/members', memberRoutes)
server.use('/products', productRoutes)

// 나머지는 db.json 기반 자동 REST API
server.use(router)

server.listen(PORT, () => {
  console.log(`\n🚀 CONK Mock Server is running at http://localhost:${PORT}`)
  console.log(`🔑 Test accounts (password: 1234 for all)`)
  console.log(`   SYSTEM_ADMIN : sys.admin@conk.com`)
  console.log(`   MASTER_ADMIN : master.admin@conk.com`)
  console.log(`   WH_MANAGER   : wh.manager@conk.com`)
  console.log(`   WH_WORKER    : WORKER-001`)
  console.log(`   SELLER       : seller@conk.com\n`)
})
