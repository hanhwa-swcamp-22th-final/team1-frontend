// routes/wms.cjs — GET /wms/*
// 담당: masterAdmin (창고 목록/상세 + ASN) + 대시보드 공용 통계
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL, headers: { 'x-internal': 'true' } })
  const router = Router()

  // ── ASN (/wms/asns/*) ───────────────────────────────────────────────────────
  router.use('/asns', require('./asn.cjs')(BASE_URL))

  // ── 대시보드용 통계 ──────────────────────────────────────────────────────────

  // GET /wms/asn/stats
  router.get('/asn/stats', async (req, res) => {
    const { data } = await http.get('/wms_asn_stats')
    res.json({ success: true, data })
  })

  // GET /wms/inventory/stats
  router.get('/inventory/stats', async (req, res) => {
    const { data } = await http.get('/wms_inv_stats')
    res.json({ success: true, data })
  })

  // ── 창고 운영 현황 (대시보드) ────────────────────────────────────────────────

  // GET /wms/warehouses/status
  router.get('/warehouses/status', async (req, res) => {
    const { data } = await http.get('/wms_status')
    res.status(200).json({ success: true, message: '창고 운영 현황 조회 성공', data })
  })

  // ── 창고 목록 ────────────────────────────────────────────────────────────────

  // GET /wms/warehouses/summary  ※ /warehouses/:id 보다 먼저 등록
  router.get('/warehouses/summary', async (req, res) => {
    const { data } = await http.get('/wms_summary')
    res.status(200).json({ success: true, message: '창고 목록 요약 조회 성공', data })
  })

  // GET /wms/warehouses
  router.get('/warehouses', async (req, res) => {
    const { data } = await http.get('/warehouses')
    res.status(200).json({ success: true, message: '창고 목록 조회 성공', data })
  })

  // ── 창고 상세 ────────────────────────────────────────────────────────────────

  router.get('/warehouses/:id/inventory', async (req, res) => {
    const { data } = await http.get(`/warehouse_inventory?warehouseId=${req.params.id}`)
    if (!data.length) return res.status(404).json({ message: 'Warehouse not found' })
    res.json({ data })
  })

  router.get('/warehouses/:id/outbound', async (req, res) => {
    const { data: rows } = await http.get(`/warehouse_outbound?warehouseId=${req.params.id}`)
    if (!rows.length) return res.status(404).json({ message: 'Warehouse not found' })
    const today = rows.filter(r => r.period === 'today').map(({ orderId, seller, status }) => ({ orderId, seller, status }))
    const week  = rows.filter(r => r.period === 'week' ).map(({ orderId, seller, status }) => ({ orderId, seller, status }))
    const month = rows.filter(r => r.period === 'month').map(({ orderId, seller, status }) => ({ orderId, seller, status }))
    res.json({ data: { today, week, month } })
  })

  router.get('/warehouses/:id/orders', async (req, res) => {
    const [statsRes, listRes] = await Promise.all([
      http.get(`/warehouse_order_stats?warehouseId=${req.params.id}`),
      http.get(`/warehouse_order_list?warehouseId=${req.params.id}`),
    ])
    if (!statsRes.data.length) return res.status(404).json({ message: 'Warehouse not found' })
    const { waiting, inProgress, done } = statsRes.data[0]
    res.json({ data: { stats: { waiting, inProgress, done }, list: listRes.data } })
  })

  router.get('/warehouses/:id/locations', async (req, res) => {
    const { data } = await http.get(`/warehouse_zones?warehouseId=${req.params.id}`)
    if (!data.length) return res.status(404).json({ message: 'Warehouse not found' })
    res.json({ data })
  })

  return router
}
