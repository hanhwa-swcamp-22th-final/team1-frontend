// routes/products.cjs — GET /products/*
// 담당: seller product
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  // GET /products/seller/list — 셀러 상품 목록 조회
  router.get('/seller/list', async (req, res) => {
    const { data } = await http.get('/seller_products')
    res.json({ success: true, data })
  })

  return router
}
