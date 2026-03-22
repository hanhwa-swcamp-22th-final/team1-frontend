// routes/products.cjs — GET/POST /products/*
// 담당: seller product
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  function buildSellerProductStatus(payload) {
    if (!payload.isActive) return 'INACTIVE'
    return 'OUT_OF_STOCK'
  }

  function buildSellerProductDetail(payload) {
    const keywords = [
      payload.categoryLabel,
      payload.amazonSync ? 'Amazon Sync' : '',
      payload.imageNames?.length ? 'Image Attached' : '',
    ].filter(Boolean)

    return {
      brand: payload.brand || 'LUMIERE BEAUTY',
      barcode: payload.barcode || '미등록',
      originCountry: payload.originCountryLabel || payload.originCountry || '미등록',
      hsCode: payload.hsCode || '3304.99.9000',
      customsValue: Number(payload.customsValue ?? 0),
      unitWeightLbs: Number(payload.weight ?? 0),
      dimensions: payload.dimensions || '미등록',
      leadTimeDays: 0,
      shelfLifeMonths: 0,
      description: payload.description || '상품 설명이 아직 등록되지 않았습니다.',
      memo: payload.amazonSync ? 'Amazon 연동 대상 신규 상품' : '신규 등록 상품',
      keywords,
    }
  }

  // POST /products/seller/register — 셀러 상품 등록
  router.post('/seller/register', async (req, res) => {
    try {
      const payload = req.body || {}

      if (!payload.sku || !payload.productName || !payload.category || !payload.salePrice) {
        return res.status(400).json({
          success: false,
          message: '필수 상품 정보가 누락되었습니다.',
        })
      }

      const { data: list } = await http.get('/seller_products')
      const normalizedSku = String(payload.sku ?? '').trim().toUpperCase()

      if (list.some((item) => String(item.sku ?? '').trim().toUpperCase() === normalizedSku)) {
        return res.status(409).json({
          success: false,
          message: '이미 등록된 SKU입니다.',
        })
      }

      const createdProduct = {
        id: `seller-product-${list.length + 1}`,
        sku: String(payload.sku ?? '').trim(),
        productName: String(payload.productName ?? '').trim(),
        category: payload.categoryLabel || payload.category || '미분류',
        warehouseName: '미지정',
        salePrice: Number(payload.salePrice ?? 0),
        costPrice: Number(payload.costPrice ?? 0),
        availableStock: 0,
        allocatedStock: 0,
        status: buildSellerProductStatus(payload),
        detail: buildSellerProductDetail(payload),
      }

      const { data: created } = await http.post('/seller_products', createdProduct)

      return res.status(201).json({
        success: true,
        message: '상품이 등록되었습니다.',
        data: created,
      })
    } catch {
      return res.status(500).json({
        success: false,
        message: '상품 등록 중 오류가 발생했습니다.',
      })
    }
  })

  // GET /products/seller/list — 셀러 상품 목록 조회
  router.get('/seller/list', async (req, res) => {
    const { data } = await http.get('/seller_products')
    res.json({ success: true, data })
  })

  return router
}
