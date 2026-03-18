// routes/members.cjs — GET /members/*
// 담당: systemAdmin
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  // GET /members/sellers/stats — 대시보드용 활성 셀러 수
  router.get('/sellers/stats', async (req, res) => {
    const { data } = await http.get('/sellers_stats')
    res.json({ success: true, data })
  })

  return router
}
