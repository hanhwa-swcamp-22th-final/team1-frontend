// server.cjs — 진입점: 미들웨어 등록 + 라우터 마운트 + 서버 시작
//
// 라우터 담당 분리
//   routes/auth.cjs    — POST /auth/*        (공통)
//   routes/wms.cjs     — GET  /wms/*         (masterAdmin + 대시보드 공용) ← /wms/asns/* 포함
//   routes/orders.cjs  — GET  /orders/*      (whManager)
//   routes/members.cjs — GET  /members/*     (systemAdmin)
const jsonServer = require('json-server')
const server     = jsonServer.create()
const router     = jsonServer.router('mock-server/db.json')
const middlewares = jsonServer.defaults()

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000'
const PORT = new URL(BASE_URL).port || 3000

server.use(middlewares)
server.use(jsonServer.bodyParser)

// ── 커스텀 라우터 마운트 ──────────────────────────────────────────────────────
server.use('/auth',    require('./routes/auth.cjs')(BASE_URL))
server.use('/wms',     require('./routes/wms.cjs')(BASE_URL))
server.use('/orders',  require('./routes/orders.cjs')(BASE_URL))
server.use('/members', require('./routes/members.cjs')(BASE_URL))

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
