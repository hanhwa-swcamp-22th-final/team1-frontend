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

  // GET /members/sellers/revenue — 셀러별 당월 매출
  router.get('/sellers/revenue', async (req, res) => {
    const { data } = await http.get('/seller_revenue')
    res.json({ success: true, data })
  })

  // GET /members/sellers/receivables — 셀러별 미수금 현황
  router.get('/sellers/receivables', async (req, res) => {
    const { data } = await http.get('/seller_receivables')
    res.json({ success: true, data })
  })

  // GET /members/sellers — 셀러 목록 (AccountInvite.vue 드롭다운, SellerList.vue)
  router.get('/sellers', async (req, res) => {
    const { data } = await http.get('/sellers')
    res.json({ success: true, data })
  })

  // POST /members/sellers — 셀러 등록 (SellerRegister.vue)
  router.post('/sellers', async (req, res) => {
    try {
      const { data: list } = await http.get('/sellers')
      const newSeller = {
        id: list.length + 1,
        ...req.body,
        customerCode: `CUST-${String(list.length + 1).padStart(3, '0')}`,
      }
      await http.post('/sellers', newSeller)
      res.status(201).json({ success: true, message: '셀러가 등록되었습니다.', data: newSeller })
    } catch {
      res.status(500).json({ success: false, message: '셀러 등록 중 오류가 발생했습니다.' })
    }
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
