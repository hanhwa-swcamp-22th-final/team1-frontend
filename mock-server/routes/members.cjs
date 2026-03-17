// routes/members.cjs — GET /members/*
// 담당: systemAdmin
const { Router } = require('express')
const { SELLERS_STATS } = require('../mock-data/member.cjs')

const router = Router()

// GET /members/sellers/stats — 대시보드용 활성 셀러 수
router.get('/sellers/stats', (req, res) => {
  res.json({ success: true, data: SELLERS_STATS })
})

module.exports = router
