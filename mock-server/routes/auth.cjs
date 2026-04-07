// routes/auth.cjs — POST /auth/login
// 담당: 공통 (인증)
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  // POST /auth/invite — 계정 초대 (이메일 발송 시뮬레이션)
  router.post('/invite', (req, res) => {
    const { role, organizationId, name, email } = req.body
    if (!role || !organizationId || !name || !email) {
      return res.status(400).json({ success: false, message: '필수 항목이 누락되었습니다.' })
    }
    return res.status(201).json({
      success: true,
      message: `${name}(${email}) 에게 초대 메일이 발송되었습니다.`,
      data: { role, organizationId, name, email },
    })
  })

  // POST /auth/login
  router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const { data: accounts } = await http.get(`/accounts?loginId=${encodeURIComponent(email)}`)
    const account = accounts[0]

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

  return router
}
