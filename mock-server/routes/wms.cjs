// routes/wms.cjs — GET /wms/*
// 담당: masterAdmin (창고 목록/상세 + ASN) + 대시보드 공용 통계
//   /wms/asns/*       — ASN 조회 (routes/asn.cjs 위임)
//   /wms/warehouses/* — 창고 목록/상세
//   /wms/asn/stats    — 대시보드용 통계
const { Router } = require('express')
const {
  WMS_ASN_STATS,
  WMS_INV_STATS,
  WMS_STATUS,
  WMS_SUMMARY,
  WMS_LIST,
  WAREHOUSE_INVENTORY,
  WAREHOUSE_OUTBOUND,
  WAREHOUSE_ORDERS,
  WAREHOUSE_LOCATIONS,
} = require('../mock-data/wms.cjs')

const router = Router()

// ── ASN (/wms/asns/*) ─────────────────────────────────────────────────────────
router.use('/asns', require('./asn.cjs'))

// ── 대시보드용 통계 ────────────────────────────────────────────────────────────

// GET /wms/asn/stats
router.get('/asn/stats', (req, res) => {
  res.json({ success: true, data: WMS_ASN_STATS })
})

// GET /wms/inventory/stats
router.get('/inventory/stats', (req, res) => {
  res.json({ success: true, data: WMS_INV_STATS })
})

// ── 창고 운영 현황 (대시보드) ──────────────────────────────────────────────────

// GET /wms/warehouses/status
router.get('/warehouses/status', (req, res) => {
  res.status(200).json({ success: true, message: '창고 운영 현황 조회 성공', data: WMS_STATUS })
})

// ── 창고 목록 ──────────────────────────────────────────────────────────────────

// GET /wms/warehouses/summary  ※ /warehouses/:id 보다 먼저 등록
router.get('/warehouses/summary', (req, res) => {
  res.status(200).json({ success: true, message: '창고 목록 요약 조회 성공', data: WMS_SUMMARY })
})

// GET /wms/warehouses
router.get('/warehouses', (req, res) => {
  res.status(200).json({ success: true, message: '창고 목록 조회 성공', data: WMS_LIST })
})

// ── 창고 상세 ──────────────────────────────────────────────────────────────────

router.get('/warehouses/:id/inventory', (req, res) => {
  const data = WAREHOUSE_INVENTORY[Number(req.params.id)]
  if (!data) return res.status(404).json({ message: 'Warehouse not found' })
  res.json({ data })
})

router.get('/warehouses/:id/outbound', (req, res) => {
  const data = WAREHOUSE_OUTBOUND[Number(req.params.id)]
  if (!data) return res.status(404).json({ message: 'Warehouse not found' })
  res.json({ data })
})

router.get('/warehouses/:id/orders', (req, res) => {
  const data = WAREHOUSE_ORDERS[Number(req.params.id)]
  if (!data) return res.status(404).json({ message: 'Warehouse not found' })
  res.json({ data })
})

router.get('/warehouses/:id/locations', (req, res) => {
  const data = WAREHOUSE_LOCATIONS[Number(req.params.id)]
  if (!data) return res.status(404).json({ message: 'Warehouse not found' })
  res.json({ data })
})

module.exports = router
