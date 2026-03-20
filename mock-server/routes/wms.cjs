// routes/wms.cjs — GET /wms/*
// 담당: masterAdmin (창고 목록/상세 + ASN) + 대시보드 공용 통계
const { Router } = require('express')
const axios = require('axios')

/**
 * SKU 카탈로그 맵 빌드 (sku → {productName, category})
 * sku_catalog 배열을 json-server에서 로드하여 오브젝트 맵으로 변환
 */
async function buildSkuCatalogMap(http) {
  const { data } = await http.get('/sku_catalog')
  const map = {}
  data.forEach(item => { map[item.sku] = { productName: item.productName, category: item.category } })
  return map
}

/**
 * SKU 재고 변동 이력 생성 (mock)
 * @param {string} sku
 * @param {object} stock — { available, allocated, total }
 * @returns {Array}
 */
function generateChangeHistory(sku, stock) {
  const base = new Date('2026-03-18')
  const d = (daysAgo) => {
    const t = new Date(base); t.setDate(t.getDate() - daysAgo)
    return t.toISOString().slice(0, 10)
  }
  const total = stock?.total ?? 0
  return [
    { date: d(0), type: 'OUT',    qty: -(stock?.allocated ?? 0),  reason: 'ORD-2026-03818 피킹 출고', worker: '작업자 A', balanceAfter: total },
    { date: d(1), type: 'IN',     qty: 50,   reason: 'ASN-2026-022 입고 완료',   worker: '작업자 B', balanceAfter: total + (stock?.allocated ?? 0) },
    { date: d(3), type: 'OUT',    qty: -30,  reason: 'ORD-2026-03790 피킹 출고', worker: '작업자 C', balanceAfter: total + (stock?.allocated ?? 0) + 30 },
    { date: d(5), type: 'IN',     qty: 100,  reason: 'ASN-2026-017 입고 완료',   worker: '작업자 B', balanceAfter: total + (stock?.allocated ?? 0) + 130 },
    { date: d(7), type: 'ADJUST', qty: -3,   reason: '재고 실사 조정',             worker: '관리자',   balanceAfter: total + (stock?.allocated ?? 0) + 33 },
  ]
}

/**
 * ASN 입고 이력 생성 (mock)
 */
function generateAsnHistory(sku) {
  return [
    { asnId: 'ASN-2026-022', date: '2026-03-17', plannedQty: 50,  actualQty: 50,  status: 'RECEIVED' },
    { asnId: 'ASN-2026-017', date: '2026-03-13', plannedQty: 100, actualQty: 100, status: 'RECEIVED' },
    { asnId: 'ASN-2026-011', date: '2026-03-06', plannedQty: 80,  actualQty: 78,  status: 'RECEIVED' },
    { asnId: 'ASN-2026-005', date: '2026-02-25', plannedQty: 120, actualQty: 120, status: 'RECEIVED' },
  ]
}

module.exports = function (BASE_URL) {
  const http = axios.create({ baseURL: BASE_URL })
  const router = Router()

  // ── ASN (/wms/asns/*) ───────────────────────────────────────────────────────
  router.use('/asns', require('./asn.cjs')(BASE_URL))

  // ── 대시보드용 통계 ──────────────────────────────────────────────────────────

  // GET /wms/asn/stats
  router.get('/asn/stats', async (req, res) => {
    const { data } = await http.get('/wms_asn_stats')
    res.json({ success: true, data })
  })

  // GET /wms/inventory/stats
  router.get('/inventory/stats', async (req, res) => {
    const { data } = await http.get('/wms_inv_stats')
    res.json({ success: true, data })
  })

  // ── 창고 운영 현황 (대시보드) ────────────────────────────────────────────────

  // GET /wms/warehouses/status
  router.get('/warehouses/status', async (req, res) => {
    const { data } = await http.get('/wms_status')
    res.status(200).json({ success: true, message: '창고 운영 현황 조회 성공', data })
  })

  // ── 창고 목록 ────────────────────────────────────────────────────────────────

  // GET /wms/warehouses/summary  ※ /warehouses/:id 보다 먼저 등록
  router.get('/warehouses/summary', async (req, res) => {
    const { data } = await http.get('/wms_summary')
    res.status(200).json({ success: true, message: '창고 목록 요약 조회 성공', data })
  })

  // GET /wms/warehouses
  router.get('/warehouses', async (req, res) => {
    const { data } = await http.get('/warehouses')
    res.status(200).json({ success: true, message: '창고 목록 조회 성공', data })
  })

  // ── 창고 상세 ────────────────────────────────────────────────────────────────

  // GET /wms/warehouses/:id/inventory — productName 포함 (sku_catalog에서 로드)
  router.get('/warehouses/:id/inventory', async (req, res) => {
    const [invRes, catalogMap] = await Promise.all([
      http.get(`/warehouse_inventory?warehouseId=${req.params.id}`),
      buildSkuCatalogMap(http),
    ])
    if (!invRes.data.length) return res.status(404).json({ message: 'Warehouse not found' })
    const enriched = invRes.data.map(item => ({
      ...item,
      productName: catalogMap[item.sku]?.productName ?? item.sku,
    }))
    res.json({ data: enriched })
  })

  // GET /wms/warehouses/:id/outbound
  router.get('/warehouses/:id/outbound', async (req, res) => {
    const { data: rows } = await http.get(`/warehouse_outbound?warehouseId=${req.params.id}`)
    if (!rows.length) return res.status(404).json({ message: 'Warehouse not found' })
    const today = rows.filter(r => r.period === 'today').map(({ orderId, seller, status }) => ({ orderId, seller, status }))
    const week  = rows.filter(r => r.period === 'week' ).map(({ orderId, seller, status }) => ({ orderId, seller, status }))
    const month = rows.filter(r => r.period === 'month').map(({ orderId, seller, status }) => ({ orderId, seller, status }))
    res.json({ data: { today, week, month } })
  })

  // GET /wms/warehouses/:id/orders — productName 포함 (sku_catalog에서 로드)
  router.get('/warehouses/:id/orders', async (req, res) => {
    const [statsRes, listRes, catalogMap] = await Promise.all([
      http.get(`/warehouse_order_stats?warehouseId=${req.params.id}`),
      http.get(`/warehouse_order_list?warehouseId=${req.params.id}`),
      buildSkuCatalogMap(http),
    ])
    if (!statsRes.data.length) return res.status(404).json({ message: 'Warehouse not found' })
    const { waiting, inProgress, done } = statsRes.data[0]
    const list = listRes.data.map(o => ({
      ...o,
      productName: catalogMap[o.sku]?.productName ?? o.sku,
    }))
    res.json({ data: { stats: { waiting, inProgress, done }, list } })
  })

  // GET /wms/warehouses/:id/orders/:orderId — 주문 상세 (1주문 N SKU)
  // 전체 warehouse_order_detail 로드 후 JS에서 필터링 (json-server 쿼리 이슈 방지)
  router.get('/warehouses/:id/orders/:orderId', async (req, res) => {
    const warehouseId = Number(req.params.id)
    const { orderId } = req.params

    const [allDetailsRes, catalogMap] = await Promise.all([
      http.get('/warehouse_order_detail'),
      buildSkuCatalogMap(http),
    ])

    const order = allDetailsRes.data.find(
      d => d.orderId === orderId && d.warehouseId === warehouseId
    )
    if (!order) return res.status(404).json({ message: 'Order not found' })

    // productName 주입 (location 필드는 order 데이터의 원본 그대로 전달)
    const skuItems = order.skuItems.map(item => ({
      ...item,
      productName: catalogMap[item.sku]?.productName ?? item.sku,
    }))

    res.json({
      data: {
        orderId:     order.orderId,
        warehouseId: order.warehouseId,
        seller:      order.seller,
        sellerCode:  order.sellerCode,
        dest:        order.dest,
        channel:     order.channel,
        status:      order.status,
        orderedAt:   order.orderedAt,
        skuItems,
      },
    })
  })

  // GET /wms/warehouses/:id/locations
  router.get('/warehouses/:id/locations', async (req, res) => {
    const { data } = await http.get(`/warehouse_zones?warehouseId=${req.params.id}`)
    if (!data.length) return res.status(404).json({ message: 'Warehouse not found' })
    res.json({ data })
  })

  // ── SKU 상세 (상품 상세 모달용) ──────────────────────────────────────────────

  // GET /wms/warehouses/:id/sku/:sku
  // locations: bins 배열 형식으로 반환 (1 SKU → 복수 bin 지원)
  router.get('/warehouses/:id/sku/:sku', async (req, res) => {
    const warehouseId = Number(req.params.id)
    const sku = req.params.sku

    const [catalogRes, locationsRes, invRes, orderListRes] = await Promise.all([
      http.get('/sku_catalog'),
      http.get('/sku_locations'),
      http.get(`/warehouse_inventory?warehouseId=${warehouseId}`),
      http.get(`/warehouse_order_list?warehouseId=${warehouseId}`),
    ])

    const catalogItem = catalogRes.data.find(c => c.sku === sku)
    if (!catalogItem) return res.status(404).json({ message: 'SKU not found' })

    const invItem = invRes.data.find(i => i.sku === sku) ?? null

    // 주문 출고 이력 (해당 창고 + SKU)
    const orderHistory = orderListRes.data
      .filter(o => o.sku === sku)
      .map(o => ({ orderId: o.orderId, qty: o.qty, dest: o.dest, status: o.status }))

    // 로케이션: 복수 bin 배열
    const locationEntry = locationsRes.data.find(
      l => l.warehouseId === warehouseId && l.sku === sku
    )
    const locations = locationEntry?.bins ?? []

    res.json({
      data: {
        sku,
        productName: catalogItem.productName,
        category:    catalogItem.category,
        locations,
        stock: invItem
          ? { available: invItem.available, allocated: invItem.allocated, total: invItem.total }
          : null,
        changeHistory: generateChangeHistory(sku, invItem),
        asnHistory:    generateAsnHistory(sku),
        orderHistory,
      },
    })
  })

  // ── 창고 등록 ────────────────────────────────────────────────────────────────

  // POST /wms/warehouses
  router.post('/warehouses', async (req, res) => {
    const body = req.body

    // 주(State) → 인근 공항 코드 매핑
    const airportMap = { CA: 'LAX', TX: 'DAL', NY: 'JFK', GA: 'ATL', IL: 'ORD' }
    const airport = airportMap[body.state] ?? 'GEN'

    // 전체 창고 수 기반으로 순번 생성
    const { data: list } = await http.get('/warehouses')
    const seq = String(list.length + 1).padStart(3, '0')
    const code = `WH-${airport}-${seq}`

    const { data: created } = await http.post('/warehouses', {
      code,
      name:        body.name,
      location:    `${body.city}, ${body.state}`,
      address:     body.address,
      city:        body.city,
      state:       body.state,
      sqft:        Number(body.sqft),
      timezone:    body.timezone,
      openTime:    body.openTime,
      closeTime:   body.closeTime,
      status:      'ACTIVE',
      stats:       { inventory: 0, todayOutbound: 0, pendingAsn: 0, sellerCount: 0 },
      locationUtil: 0,
      manager: body.managerName
        ? { name: body.managerName, email: body.managerEmail, phone: '', lastLogin: '-', status: 'ACTIVE' }
        : null,
    })

    res.status(201).json({ success: true, message: '창고가 등록되었습니다.', data: created })
  })

  // GET /wms/storage-billing — 창고 보관료 청구 현황
  router.get('/storage-billing', async (req, res) => {
    const { data } = await http.get('/storage_billing')
    res.json({ success: true, data })
  })

  // GET /wms/fee-settings — 요금 설정 조회
  router.get('/fee-settings', async (req, res) => {
    const { data } = await http.get('/fee_settings')
    res.json({ success: true, data })
  })

  // PUT /wms/fee-settings — 요금 설정 저장
  router.put('/fee-settings', async (req, res) => {
    await http.put('/fee_settings', req.body)
    res.json({ success: true, message: '요금 설정이 저장되었습니다.' })
  })

  return router
}
