// routes/orders.cjs — GET /orders/*
// 담당: whManager
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  // GET /orders/outbound/stats — 대시보드용 출고 예정 통계
  router.get('/outbound/stats', async (req, res) => {
    const { data } = await http.get('/outbound_stats')
    res.json({ success: true, data })
  })

  // GET /orders/list — 주문 목록 조회 (masterAdmin)
  router.get('/list', async (req, res) => {
    const { data } = await http.get('/orders')
    res.json({ success: true, data })
  })

  // GET /orders/kpi — 주문 KPI 집계 (masterAdmin)
  router.get('/kpi', async (req, res) => {
    const { data } = await http.get('/orders_kpi')
    res.json({ success: true, data })
  })

  return router
}
