// routes/notifications.cjs — GET /notifications/*
// 담당: seller notifications
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  // GET /notifications/seller/list — 셀러 알림 목록 조회
  router.get('/seller/list', async (req, res) => {
    const { data } = await http.get('/seller_notifications')
    res.json({ success: true, data })
  })

  return router
}
