// routes/members.cjs — GET /members/*
// 담당: systemAdmin
const { Router } = require('express')
const axios = require('axios')

function success(data) {
  return { success: true, data }
}

function failure(code, message) {
  return { success: false, code, message }
}

function toQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value)
    }
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function getCollection(http, collection, params = {}) {
  const { data } = await http.get(`/${collection}${toQuery(params)}`)
  return data
}

async function getOne(http, collection, id) {
  const data = await getCollection(http, collection, { id })
  return data[0] ?? null
}

async function patchOne(http, collection, id, payload) {
  const current = await getOne(http, collection, id)
  if (!current) return null
  const { data } = await http.patch(`/${collection}/${encodeURIComponent(id)}`, payload)
  return data
}

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

  // GET /members/sellers/fee-summary — 대시보드용 셀러별 3PL 비용 요약
  router.get('/sellers/fee-summary', async (req, res) => {
    const { data } = await http.get('/seller_fee_summary')
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

  // ── 시스템 관리자 (/member/admin/*) ────────────────────────────────────────

  router.get('/admin/companies', async (req, res) => {
    const data = await getCollection(http, 'sys_companies', req.query)
    res.json(success(data))
  })

  router.get('/admin/companies/:id', async (req, res) => {
    const company = await getOne(http, 'sys_companies', req.params.id)
    if (!company) return res.status(404).json(failure('COMPANY_NOT_FOUND', '업체를 찾을 수 없습니다.'))
    return res.json(success(company))
  })

  router.post('/admin/companies', async (req, res) => {
    try {
      const list = await getCollection(http, 'sys_companies')
      const nextId = Math.max(0, ...list.map((item) => Number(item.id) || 0)) + 1
      const payload = {
        id: req.body?.id ?? nextId,
        ...req.body,
      }
      const { data } = await http.post('/sys_companies', payload)
      return res.status(201).json(success(data))
    } catch {
      return res.status(500).json(failure('COMPANY_CREATE_FAILED', '업체 등록 중 오류가 발생했습니다.'))
    }
  })

  router.patch('/admin/companies/:id', async (req, res) => {
    try {
      const data = await patchOne(http, 'sys_companies', req.params.id, req.body)
      if (!data) return res.status(404).json(failure('COMPANY_NOT_FOUND', '업체를 찾을 수 없습니다.'))
      return res.json(success(data))
    } catch {
      return res.status(500).json(failure('COMPANY_UPDATE_FAILED', '업체 수정 중 오류가 발생했습니다.'))
    }
  })

  router.get('/admin/users', async (req, res) => {
    const data = await getCollection(http, 'sys_users', req.query)
    res.json(success(data))
  })

  router.post('/admin/users', async (req, res) => {
    try {
      const list = await getCollection(http, 'sys_users')
      const nextId = Math.max(0, ...list.map((item) => Number(item.id) || 0)) + 1
      const payload = {
        id: req.body?.id ?? nextId,
        ...req.body,
      }
      const { data } = await http.post('/sys_users', payload)
      return res.status(201).json(success(data))
    } catch {
      return res.status(500).json(failure('USER_CREATE_FAILED', '사용자 등록 중 오류가 발생했습니다.'))
    }
  })

  router.patch('/admin/users/:id', async (req, res) => {
    try {
      const data = await patchOne(http, 'sys_users', req.params.id, req.body)
      if (!data) return res.status(404).json(failure('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.'))
      return res.json(success(data))
    } catch {
      return res.status(500).json(failure('USER_UPDATE_FAILED', '사용자 수정 중 오류가 발생했습니다.'))
    }
  })

  router.get('/admin/company-logs', async (req, res) => {
    const data = await getCollection(http, 'sys_company_logs', req.query)
    res.json(success(data))
  })

  router.post('/admin/company-logs', async (req, res) => {
    try {
      const { data } = await http.post('/sys_company_logs', req.body)
      return res.status(201).json(success(data))
    } catch {
      return res.status(500).json(failure('COMPANY_LOG_CREATE_FAILED', '업체 로그 기록 중 오류가 발생했습니다.'))
    }
  })

  router.get('/admin/fee-profiles', async (req, res) => {
    const data = await getCollection(http, 'sys_fee_profiles', req.query)
    res.json(success(data))
  })

  router.patch('/admin/fee-profiles/:id', async (req, res) => {
    try {
      const data = await patchOne(http, 'sys_fee_profiles', req.params.id, req.body)
      if (!data) return res.status(404).json(failure('FEE_PROFILE_NOT_FOUND', '요금 프로필을 찾을 수 없습니다.'))
      return res.json(success(data))
    } catch {
      return res.status(500).json(failure('FEE_PROFILE_UPDATE_FAILED', '요금 프로필 수정 중 오류가 발생했습니다.'))
    }
  })

  return router
}
