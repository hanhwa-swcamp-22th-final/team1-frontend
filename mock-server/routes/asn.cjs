// routes/asn.cjs — GET /asns/*
// 담당: masterAdmin
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  // GET /asns — 전체 목록 (상태 필터 지원: ?status=SUBMITTED)
  router.get('/', async (req, res) => {
    const { status } = req.query
    const url = status ? `/asns?status=${status}` : '/asns'
    const { data } = await http.get(url)
    res.json({ success: true, data })
  })

  // GET /asns/kpi — 상태별 건수 집계
  // ※ /:id 보다 먼저 등록해야 'kpi'가 id로 잡히지 않음
  router.get('/kpi', async (req, res) => {
    const { data: asns } = await http.get('/asns')
    res.json({
      success: true,
      data: {
        total:     asns.length,
        submitted: asns.filter(a => a.status === 'SUBMITTED').length,
        received:  asns.filter(a => a.status === 'RECEIVED').length,
        cancelled: asns.filter(a => a.status === 'CANCELLED').length,
      },
    })
  })

  // GET /asns/:id — 단건 상세 조회
  router.get('/:id', async (req, res) => {
    const { data: asns } = await http.get(`/asns?id=${req.params.id}`)
    const asn = asns[0]
    if (!asn) return res.status(404).json({ success: false, message: 'ASN을 찾을 수 없습니다.' })
    res.json({ success: true, data: asn })
  })

  return router
}
