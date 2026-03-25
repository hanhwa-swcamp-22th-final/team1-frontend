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

function toQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => search.append(key, item))
      } else {
        search.append(key, value)
      }
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

  // GET /wms/seller/asns — 셀러 ASN 목록 조회
  router.get('/seller/asns', async (req, res) => {
    const { data } = await http.get('/seller_asns')
    res.json({ success: true, data })
  })

  // POST /wms/seller/asns — 셀러 ASN 등록
  router.post('/seller/asns', async (req, res) => {
    try {
      const payload = req.body || {}

      if (!payload.asnNo || !payload.warehouseName || !payload.expectedDate || !payload.skuCount) {
        return res.status(400).json({
          success: false,
          message: '필수 ASN 정보가 누락되었습니다.',
        })
      }

      const { data: list } = await http.get('/seller_asns')
      const normalizedAsnNo = String(payload.asnNo ?? '').trim().toUpperCase()

      if (list.some((item) => String(item.asnNo ?? '').trim().toUpperCase() === normalizedAsnNo)) {
        return res.status(409).json({
          success: false,
          message: '이미 등록된 ASN 번호입니다.',
        })
      }

      const createdAsn = {
        id: `seller-asn-${list.length + 1}`,
        asnNo: String(payload.asnNo ?? '').trim(),
        warehouseName: String(payload.warehouseName ?? '').trim(),
        expectedDate: String(payload.expectedDate ?? '').trim(),
        createdAt: new Date().toISOString().slice(0, 10),
        skuCount: Number(payload.skuCount ?? 0),
        totalQuantity: Number(payload.totalQuantity ?? 0),
        status: payload.status || 'SUBMITTED',
        referenceNo: String(payload.referenceNo ?? '').trim() || `REF-${String(payload.asnNo ?? '').trim().slice(-6)}`,
        note: String(payload.note ?? '').trim(),
        detail: payload.detail ?? null,
      }

      const { data: created } = await http.post('/seller_asns', createdAsn)

      return res.status(201).json({
        success: true,
        message: 'ASN이 등록되었습니다.',
        data: created,
      })
    } catch {
      return res.status(500).json({
        success: false,
        message: 'ASN 등록 중 오류가 발생했습니다.',
      })
    }
  })

  // GET /wms/seller/inventories — 셀러 재고 목록 조회
  router.get('/seller/inventories', async (req, res) => {
    const { data } = await http.get('/seller_inventories')
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

  // ── 재고 목록 (/wms/inventories/*) ──────────────────────────────────────────

  router.get('/inventories', async (req, res) => {
    const data = await getCollection(http, 'wh_inventories', req.query)
    res.json({ success: true, data })
  })

  router.get('/inventories/:id', async (req, res) => {
    const inventory = await getOne(http, 'wh_inventories', req.params.id)
    if (!inventory) return res.status(404).json({ success: false, message: '재고 정보를 찾을 수 없습니다.' })
    return res.json({ success: true, data: inventory })
  })

  // ── 창고 관리자 (/wms/manager/*) ───────────────────────────────────────────

  router.get('/manager/dashboard', async (req, res) => {
    const { data } = await http.get('/whm_dashboard')
    res.json(data)
  })

  router.get('/manager/pending-orders', async (req, res) => {
    const data = await getCollection(http, 'wh_pending_orders', req.query)
    const filtered = req.query.status ? data : data.filter((item) => item.status === 'CONFIRMED')
    res.json(filtered)
  })

  router.patch('/manager/pending-orders/:id', async (req, res) => {
    try {
      const worker = req.body?.workerId
        ? await getOne(http, 'wh_workers', req.body.workerId)
        : null
      const payload = worker ? { ...req.body, workerName: worker.name } : req.body
      const data = await patchOne(http, 'wh_pending_orders', req.params.id, payload)
      if (!data) return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' })
      return res.json(data)
    } catch {
      return res.status(500).json({ success: false, message: '출고 지시 처리 중 오류가 발생했습니다.' })
    }
  })

  router.post('/manager/pending-orders/bulk', async (req, res) => {
    try {
      const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : []
      const worker = req.body?.workerId
        ? await getOne(http, 'wh_workers', req.body.workerId)
        : null
      const payload = worker ? { ...req.body, workerName: worker.name } : req.body
      const updated = await Promise.all(
        orderIds.map((id) => patchOne(http, 'wh_pending_orders', id, payload))
      )
      return res.json(updated.filter(Boolean))
    } catch {
      return res.status(500).json({ success: false, message: '일괄 출고 지시 처리 중 오류가 발생했습니다.' })
    }
  })

  router.get('/manager/workers', async (req, res) => {
    const data = await getCollection(http, 'wh_workers', req.query)
    res.json(data)
  })

  router.get('/manager/picking-lists', async (req, res) => {
    const data = await getCollection(http, 'wh_picking_lists', req.query)
    res.json(data)
  })

  router.get('/manager/picking-lists/:id', async (req, res) => {
    const pickingList = await getOne(http, 'wh_picking_lists', req.params.id)
    if (!pickingList) return res.status(404).json({ success: false, message: '피킹 리스트를 찾을 수 없습니다.' })
    return res.json(pickingList)
  })

  router.get('/manager/invoice-orders', async (req, res) => {
    const data = await getCollection(http, 'wh_invoice_orders', req.query)
    res.json(data)
  })

  router.patch('/manager/invoice-orders/:id', async (req, res) => {
    try {
      const data = await patchOne(http, 'wh_invoice_orders', req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '송장 발행 대상을 찾을 수 없습니다.' })
      return res.json(data)
    } catch {
      return res.status(500).json({ success: false, message: '송장 정보 저장 중 오류가 발생했습니다.' })
    }
  })

  router.post('/manager/invoice-orders/bulk-label', async (req, res) => {
    try {
      const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : []
      const labelIssuedAt = new Date().toISOString().slice(0, 10)
      const updated = await Promise.all(
        orderIds.map((id) => patchOne(http, 'wh_invoice_orders', id, { labelStatus: 'ISSUED', labelIssuedAt }))
      )
      return res.json(updated.filter(Boolean))
    } catch {
      return res.status(500).json({ success: false, message: '일괄 라벨 발행 중 오류가 발생했습니다.' })
    }
  })

  router.get('/manager/outbound-confirm-orders', async (req, res) => {
    const data = await getCollection(http, 'wh_outbound_confirm_orders', req.query)
    res.json(data)
  })

  router.patch('/manager/outbound-confirm-orders/:id', async (req, res) => {
    try {
      const data = await patchOne(http, 'wh_outbound_confirm_orders', req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '출고 확정 대상을 찾을 수 없습니다.' })
      return res.json(data)
    } catch {
      return res.status(500).json({ success: false, message: '출고 확정 처리 중 오류가 발생했습니다.' })
    }
  })

  router.post('/manager/outbound-confirm-orders/bulk-confirm', async (req, res) => {
    try {
      const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : []
      const status = req.body?.status ?? 'CONFIRMED'
      const updated = await Promise.all(
        orderIds.map((id) => patchOne(http, 'wh_outbound_confirm_orders', id, { status }))
      )
      return res.json(updated.filter(Boolean))
    } catch {
      return res.status(500).json({ success: false, message: '일괄 출고 확정 중 오류가 발생했습니다.' })
    }
  })

  router.get('/manager/worker-accounts', async (req, res) => {
    const data = await getCollection(http, 'wh_worker_accounts', req.query)
    res.json(data)
  })

  router.post('/manager/worker-accounts', async (req, res) => {
    try {
      const list = await getCollection(http, 'wh_worker_accounts')
      const nextSeq = String(list.length + 1).padStart(3, '0')
      const payload = {
        id: req.body?.id ?? `WK-A-${nextSeq}`,
        presenceStatus: req.body?.presenceStatus ?? 'IDLE',
        accountStatus: req.body?.accountStatus ?? 'ACTIVE',
        lastWorkAt: req.body?.lastWorkAt ?? null,
        registeredAt: req.body?.registeredAt ?? new Date().toISOString().slice(0, 10),
        zones: req.body?.zones ?? [],
        memo: req.body?.memo ?? '',
        ...req.body,
      }
      const { data } = await http.post('/wh_worker_accounts', payload)
      return res.status(201).json(data)
    } catch {
      return res.status(500).json({ success: false, message: '작업자 계정 생성 중 오류가 발생했습니다.' })
    }
  })

  router.patch('/manager/worker-accounts/:id', async (req, res) => {
    try {
      const data = await patchOne(http, 'wh_worker_accounts', req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '작업자 계정을 찾을 수 없습니다.' })
      return res.json(data)
    } catch {
      return res.status(500).json({ success: false, message: '작업자 계정 수정 중 오류가 발생했습니다.' })
    }
  })

  router.get('/manager/tasks', async (req, res) => {
    const data = await getCollection(http, 'wh_tasks', req.query)
    res.json(data)
  })

  router.patch('/manager/tasks/:id', async (req, res) => {
    try {
      const data = await patchOne(http, 'wh_tasks', req.params.id, req.body)
      if (!data) return res.status(404).json({ success: false, message: '작업을 찾을 수 없습니다.' })
      return res.json(data)
    } catch {
      return res.status(500).json({ success: false, message: '작업 배정 저장 중 오류가 발생했습니다.' })
    }
  })

  router.get('/manager/inbound-asns', async (req, res) => {
    const data = await getCollection(http, 'wh_inbound_asns', req.query)
    res.json(data)
  })

  router.get('/manager/bin-fixed-assignments', async (req, res) => {
    const data = await getCollection(http, 'wh_bin_fixed_assignments', req.query)
    res.json(data)
  })

  router.post('/manager/bin-fixed-assignments', async (req, res) => {
    try {
      const payload = {
        memo: '',
        latestRefDoc: '',
        fallbackWorkerName: '',
        ...req.body,
      }
      const { data } = await http.post('/wh_bin_fixed_assignments', payload)
      return res.status(201).json(data)
    } catch {
      return res.status(500).json({ success: false, message: 'Bin 고정 배정 생성 중 오류가 발생했습니다.' })
    }
  })

  router.patch('/manager/bin-fixed-assignments/:bin', async (req, res) => {
    try {
      const data = await patchOne(http, 'wh_bin_fixed_assignments', req.params.bin, req.body)
      if (!data) return res.status(404).json({ success: false, message: 'Bin 고정 배정을 찾을 수 없습니다.' })
      return res.json(data)
    } catch {
      return res.status(500).json({ success: false, message: 'Bin 고정 배정 수정 중 오류가 발생했습니다.' })
    }
  })

  router.get('/manager/locations', async (req, res) => {
    const data = await getCollection(http, 'wh_locations', req.query)
    res.json(data)
  })

  router.get('/manager/inventories', async (req, res) => {
    const data = await getCollection(http, 'wh_inventories', req.query)
    res.json(data)
  })

  router.get('/manager/inventories/:id', async (req, res) => {
    const inventory = await getOne(http, 'wh_inventories', req.params.id)
    if (!inventory) return res.status(404).json({ success: false, message: '재고 정보를 찾을 수 없습니다.' })
    return res.json(inventory)
  })

  // ── 창고 작업자 (/wms/worker/*) ────────────────────────────────────────────

  router.get('/worker/tasks', async (req, res) => {
    const data = await getCollection(http, 'wh_worker_tasks', req.query)
    res.json(data)
  })

  router.patch('/worker/tasks/:id', async (req, res) => {
    try {
      const current = await getOne(http, 'wh_worker_tasks', req.params.id)
      if (!current) return res.status(404).json({ success: false, message: '작업을 찾을 수 없습니다.' })
      const payload = { ...req.body }
      if (Object.prototype.hasOwnProperty.call(req.body, 'bins')) payload.bins = req.body.bins
      if (Object.prototype.hasOwnProperty.call(req.body, 'packOrders')) payload.packOrders = req.body.packOrders
      const { data } = await http.patch(`/wh_worker_tasks/${encodeURIComponent(req.params.id)}`, payload)
      return res.json(data)
    } catch {
      return res.status(500).json({ success: false, message: '작업 정보 저장 중 오류가 발생했습니다.' })
    }
  })

  return router
}
