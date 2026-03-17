// server.cjs — 진입점: 미들웨어 등록 + 라우터 마운트 + 서버 시작
//
// 라우터 담당 분리
//   routes/auth.cjs    — POST /auth/*        (공통)
//   routes/asn.cjs     — GET  /asns/*        (masterAdmin)
//   routes/wms.cjs     — GET  /wms/*         (masterAdmin + 대시보드 공용)
//   routes/orders.cjs  — GET  /orders/*      (whManager)
//   routes/members.cjs — GET  /members/*     (systemAdmin)
const jsonServer = require('json-server')
const server     = jsonServer.create()
const router     = jsonServer.router('mock-server/db.json')
const middlewares = jsonServer.defaults()

const PORT = 3000

server.use(middlewares)
server.use(jsonServer.bodyParser)

// 글로벌 인위적 지연 500ms — LoadingSpinner 동작 확인용
server.use((req, res, next) => {
  setTimeout(next, 500)
})

// ── 커스텀 라우터 마운트 ──────────────────────────────────────────────────────
server.use('/auth',    require('./routes/auth'))
server.use('/asns',    require('./routes/asn'))
server.use('/wms',     require('./routes/wms'))
server.use('/orders',  require('./routes/orders'))
server.use('/members', require('./routes/members'))

// 나머지는 db.json 기반 자동 REST API
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
