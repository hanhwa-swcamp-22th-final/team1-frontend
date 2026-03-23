// routes/products.cjs — GET/POST /products/*
// 담당: seller product
const { Router } = require('express')
const axios = require('axios')

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  function buildSellerProductStatus(payload, currentProduct = {}) {
    if (!payload.isActive) return 'INACTIVE'

    const availableStock = Number(currentProduct.availableStock ?? 0)
    if (availableStock <= 0) return 'OUT_OF_STOCK'
    if (payload.lowStockAlert && availableStock <= Number(payload.stockAlertThreshold ?? 0)) return 'LOW_STOCK'
    return 'ACTIVE'
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
      asin: payload.asin || '',
      imageNames: Array.isArray(payload.imageNames) ? payload.imageNames : [],
      lowStockAlert: Boolean(payload.lowStockAlert),
      amazonSync: Boolean(payload.amazonSync),
      stockAlertThreshold: Number(payload.stockAlertThreshold ?? 10),
      minOrderQuantity: Number(payload.minOrderQuantity ?? 1),
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

  // GET /products/seller/:id — 셀러 상품 상세 조회
  router.get('/seller/:id', async (req, res) => {
    try {
      const { data: list } = await http.get('/seller_products')
      const product = list.find((item) => item.id === req.params.id)

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '상품 정보를 찾을 수 없습니다.',
        })
      }

      return res.json({
        success: true,
        data: product,
      })
    } catch {
      return res.status(500).json({
        success: false,
        message: '상품 정보를 불러오는 중 오류가 발생했습니다.',
      })
    }
  })

  // PUT /products/seller/:id — 셀러 상품 수정
  router.put('/seller/:id', async (req, res) => {
    try {
      const payload = req.body || {}

      if (!payload.sku || !payload.productName || !payload.category || !payload.salePrice) {
        return res.status(400).json({
          success: false,
          message: '필수 상품 정보가 누락되었습니다.',
        })
      }

      const { data: list } = await http.get('/seller_products')
      const currentProduct = list.find((item) => item.id === req.params.id)
      if (!currentProduct) {
        return res.status(404).json({
          success: false,
          message: '수정할 상품 정보를 찾을 수 없습니다.',
        })
      }

      const normalizedSku = String(payload.sku ?? '').trim().toUpperCase()
      const hasDuplicateSku = list.some((item) => {
        return item.id !== req.params.id
          && String(item.sku ?? '').trim().toUpperCase() === normalizedSku
      })

      if (hasDuplicateSku) {
        return res.status(409).json({
          success: false,
          message: '이미 등록된 SKU입니다.',
        })
      }

      const updatedProduct = {
        ...currentProduct,
        sku: String(payload.sku ?? '').trim(),
        productName: String(payload.productName ?? '').trim(),
        category: payload.categoryLabel || payload.category || '미분류',
        salePrice: Number(payload.salePrice ?? 0),
        costPrice: Number(payload.costPrice ?? 0),
        status: buildSellerProductStatus(payload, currentProduct),
        detail: buildSellerProductDetail(payload),
      }

      const { data: updated } = await http.put(`/seller_products/${req.params.id}`, updatedProduct)

      return res.json({
        success: true,
        message: '상품 정보가 수정되었습니다.',
        data: updated,
      })
    } catch {
      return res.status(500).json({
        success: false,
        message: '상품 수정 중 오류가 발생했습니다.',
      })
    }
  })

  return router
}
