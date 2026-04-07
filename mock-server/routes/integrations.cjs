// routes/integrations.cjs — GET /integrations/*
// 담당: seller channel integration
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  // GET /integrations/seller/channels — 셀러 채널 연결 카드 조회
  router.get('/seller/channels', async (req, res) => {
    const { data } = await http.get('/seller_channel_sync_cards')
    res.json({ success: true, data })
  })

  // GET /integrations/seller/orders — 셀러 채널 통합 주문 조회
  router.get('/seller/orders', async (req, res) => {
    const { data } = await http.get('/seller_channel_orders')
    res.json({ success: true, data })
  })

  return router
}
