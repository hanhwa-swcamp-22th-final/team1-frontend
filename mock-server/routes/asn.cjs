// routes/asn.cjs — GET /asns/*
// 담당: masterAdmin
const { Router } = require('express')
const { MOCK_ASNS } = require('../mock-data/wms.cjs')

const router = Router()

// GET /asns — 전체 목록 (상태 필터 지원: ?status=SUBMITTED)
router.get('/', (req, res) => {
  const { status } = req.query
  const result = status ? MOCK_ASNS.filter(a => a.status === status) : MOCK_ASNS
  res.json({ success: true, data: result })
})

// GET /asns/kpi — 상태별 건수 집계
// ※ /:id 보다 먼저 등록해야 'kpi'가 id로 잡히지 않음
router.get('/kpi', (req, res) => {
  res.json({
    success: true,
    data: {
      total:     MOCK_ASNS.length,
      submitted: MOCK_ASNS.filter(a => a.status === 'SUBMITTED').length,
      received:  MOCK_ASNS.filter(a => a.status === 'RECEIVED').length,
      cancelled: MOCK_ASNS.filter(a => a.status === 'CANCELLED').length,
    },
  })
})

// GET /asns/:id — 단건 상세 조회
router.get('/:id', (req, res) => {
  const asn = MOCK_ASNS.find(a => a.id === req.params.id)
  if (!asn) return res.status(404).json({ success: false, message: 'ASN을 찾을 수 없습니다.' })
  res.json({ success: true, data: asn })
})

module.exports = router
