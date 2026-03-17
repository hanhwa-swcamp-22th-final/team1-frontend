// routes/auth.cjs — POST /auth/login
// 담당: 공통 (인증)
const { Router } = require('express')
const { MOCK_ACCOUNTS } = require('../mock-data/member.cjs')

const router = Router()

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body
  const account = MOCK_ACCOUNTS[email]

  if (account && password === '1234') {
    return res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: { token: account.token, user: account.user },
    })
  }

  return res.status(401).json({
    success: false,
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
  })
})

module.exports = router
