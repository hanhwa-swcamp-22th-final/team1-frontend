// routes/auth.cjs — POST /auth/login
// 담당: 공통 (인증)
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

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
