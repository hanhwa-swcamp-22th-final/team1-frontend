// routes/orders.cjs — GET /orders/*
// 담당: whManager
const { Router } = require('express')
const { OUTBOUND_STATS } = require('../mock-data/order.cjs')

const router = Router()

// GET /orders/outbound/stats — 대시보드용 출고 예정 통계
router.get('/outbound/stats', (req, res) => {
  res.json({ success: true, data: OUTBOUND_STATS })
})

module.exports = router
