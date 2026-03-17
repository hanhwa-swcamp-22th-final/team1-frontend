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

  // GET /members/sellers — 셀러 목록 (AccountInvite.vue 드롭다운, SellerList.vue)
  router.get('/sellers', async (req, res) => {
    const { data } = await http.get('/sellers')
    res.json({ success: true, data })
  })

  // GET /members/users — 소속 사용자 목록 (UserList.vue)
  router.get('/users', async (req, res) => {
    const { data } = await http.get('/users')
    res.json({ success: true, data })
  })

  // POST /members/users/:id/reset-password — 비밀번호 초기화
  router.post('/users/:id/reset-password', async (req, res) => {
    try {
      await http.patch(`/users/${req.params.id}`, { accountStatus: 'TEMP_PASSWORD' })
      res.json({ success: true, message: '비밀번호가 초기화되었습니다.' })
    } catch {
      res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
    }
  })

  // POST /members/users/:id/deactivate — 계정 비활성화
  router.post('/users/:id/deactivate', async (req, res) => {
    try {
      await http.patch(`/users/${req.params.id}`, { accountStatus: 'INACTIVE' })
      res.json({ success: true, message: '계정이 비활성화되었습니다.' })
    } catch {
      res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
    }
  })

  // POST /members/users/:id/reactivate — 계정 재활성화
  router.post('/users/:id/reactivate', async (req, res) => {
    try {
      await http.patch(`/users/${req.params.id}`, { accountStatus: 'ACTIVE' })
      res.json({ success: true, message: '계정이 재활성화되었습니다.' })
    } catch {
      res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
    }
  })

  return router
}
