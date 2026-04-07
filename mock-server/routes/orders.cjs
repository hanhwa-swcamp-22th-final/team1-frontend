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

  // GET /orders/revenue/current — 대시보드용 당월 총 매출
  router.get('/revenue/current', async (req, res) => {
    const { data } = await http.get('/revenue_current')
    res.json({ success: true, data })
  })

  // GET /orders/revenue/monthly — 월별 매출 추이 (6개월)
  router.get('/revenue/monthly', async (req, res) => {
    const { data } = await http.get('/revenue_monthly')
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

  // POST /orders/seller/manual — 셀러 단건 주문 등록
  router.post('/seller/manual', async (req, res) => {
    const payload = req.body || {}

    if (!payload.orderNo || !payload.sku || !payload.quantity) {
      return res.status(400).json({
        success: false,
        message: '필수 주문 정보가 누락되었습니다.',
      })
    }

    return res.status(201).json({
      success: true,
      data: {
        orderNo: payload.orderNo,
        savedCount: 1,
        receivedAt: new Date().toISOString(),
      },
      message: '주문이 등록되었습니다.',
    })
  })

  // POST /orders/seller/bulk — 셀러 엑셀 주문 일괄 등록
  router.post('/seller/bulk', async (req, res) => {
    const orders = Array.isArray(req.body?.orders) ? req.body.orders : []

    if (!orders.length) {
      return res.status(400).json({
        success: false,
        message: '등록할 주문이 없습니다.',
      })
    }

    return res.status(201).json({
      success: true,
      data: {
        savedCount: orders.length,
        receivedAt: new Date().toISOString(),
      },
      message: '업로드 주문이 등록되었습니다.',
    })
  })

  // GET /orders/seller/list — 셀러 주문 목록 조회
  router.get('/seller/list', async (req, res) => {
    const { data } = await http.get('/seller_orders')
    res.json({ success: true, data })
  })

  // GET /orders/whm — 창고 관리자 주문 목록
  router.get('/whm', async (req, res) => {
    const { data } = await http.get('/wh_orders')
    res.json({ success: true, data })
  })

  return router
}
