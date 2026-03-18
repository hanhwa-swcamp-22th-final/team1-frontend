// server.cjs — 진입점: 미들웨어 등록 + 라우터 마운트 + 서버 시작
//
// 라우터 담당 분리
//   routes/auth.cjs    — POST /auth/*        (공통)
//   routes/wms.cjs     — GET  /wms/*         (masterAdmin + 대시보드 공용) ← /wms/asns/* 포함
//   routes/orders.cjs  — GET  /orders/*      (whManager)
//   routes/members.cjs — GET  /members/*     (systemAdmin)
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
