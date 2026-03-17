/**
 * inventory.js — 재고 현황 API 모듈
 *
 * 현재: mock 데이터 직접 반환 (Promise 래핑)
 * 추후 백엔드 연동 시 아래처럼 교체:
 *   import instance from './instance'
 *   export function getInventories(params) { return instance.get('/inventories', { params }) }
 *   export function getInventoryDetail(id)  { return instance.get(`/inventories/${id}`) }
 */

const MOCK_INVENTORIES = [
  {
    id: 1,
    sku: 'SKU-GB-001',
    name: '앰플 세럼 30ml',
    seller: '(주)글로우뷰티',
    availableQty: 23,
    allocatedQty: 5,
    damagedQty: 0,
    totalQty: 28,
    locations: [{ bin: 'A-3-2', qty: 28, asnId: 'ASN-2024-0309-002', receivedDate: '2026-03-09' }],
    threshold: 100,
    status: 'shortage',
    history: [
      { date: '2026-03-12 10:10', type: '주문 할당', qty: -5, docId: 'ORD-20240312-085' },
      { date: '2026-03-09 16:45', type: '입고 확정', qty: 28, docId: 'ASN-2024-0309-002' },
    ],
  },
  {
    id: 2,
    sku: 'SKU-GB-002',
    name: '마스크팩 10매입',
    seller: '(주)글로우뷰티',
    availableQty: 710,
    allocatedQty: 90,
    damagedQty: 2,
    totalQty: 802,
    locations: [
      { bin: 'A-3-3', qty: 500, asnId: 'ASN-2024-0307-001', receivedDate: '2026-03-07' },
      { bin: 'B-1-2', qty: 302, asnId: 'ASN-2024-0310-004', receivedDate: '2026-03-10' },
    ],
    threshold: 200,
    status: 'normal',
    history: [
      { date: '2026-03-13 09:00', type: '주문 할당', qty: -30, docId: 'ORD-20240313-012' },
      { date: '2026-03-10 14:20', type: '입고 확정', qty: 302, docId: 'ASN-2024-0310-004' },
      { date: '2026-03-07 11:00', type: '입고 확정', qty: 500, docId: 'ASN-2024-0307-001' },
    ],
  },
  {
    id: 3,
    sku: 'SKU-GB-003',
    name: '토너 100ml',
    seller: '(주)글로우뷰티',
    availableQty: 195,
    allocatedQty: 5,
    damagedQty: 0,
    totalQty: 200,
    locations: [{ bin: 'B-2-1', qty: 200, asnId: 'ASN-2024-0308-003', receivedDate: '2026-03-08' }],
    threshold: 50,
    status: 'normal',
    history: [
      { date: '2026-03-14 08:30', type: '주문 할당', qty: -5, docId: 'ORD-20240314-007' },
      { date: '2026-03-08 13:15', type: '입고 확정', qty: 200, docId: 'ASN-2024-0308-003' },
    ],
  },
  {
    id: 4,
    sku: 'SKU-KS-001',
    name: '티셔츠 L사이즈',
    seller: 'K-Style',
    availableQty: 32,
    allocatedQty: 10,
    damagedQty: 1,
    totalQty: 43,
    locations: [{ bin: 'C-1-4', qty: 43, asnId: 'ASN-2024-0306-002', receivedDate: '2026-03-06' }],
    threshold: 30,
    status: 'caution',
    history: [
      { date: '2026-03-15 10:00', type: '주문 할당', qty: -10, docId: 'ORD-20240315-003' },
      { date: '2026-03-06 15:30', type: '입고 확정', qty: 43, docId: 'ASN-2024-0306-002' },
    ],
  },
  {
    id: 5,
    sku: 'SKU-EP-001',
    name: '텀블러 350ml',
    seller: '에코팩',
    availableQty: 55,
    allocatedQty: 20,
    damagedQty: 0,
    totalQty: 75,
    locations: [{ bin: 'D-2-1', qty: 75, asnId: 'ASN-2024-0310-003', receivedDate: '2026-03-10' }],
    threshold: 50,
    status: 'caution',
    history: [
      { date: '2026-03-16 09:45', type: '주문 할당', qty: -20, docId: 'ORD-20240316-011' },
      { date: '2026-03-10 16:00', type: '입고 확정', qty: 75, docId: 'ASN-2024-0310-003' },
    ],
  },
  {
    id: 6,
    sku: 'SKU-KF-001',
    name: '홍삼 진액 30포',
    seller: 'K-Farm',
    availableQty: 12,
    allocatedQty: 0,
    damagedQty: 0,
    totalQty: 12,
    locations: [{ bin: 'A-1-1', qty: 12, asnId: 'ASN-2024-0308-001', receivedDate: '2026-03-08' }],
    threshold: 100,
    status: 'shortage',
    history: [
      { date: '2026-03-08 12:00', type: '입고 확정', qty: 12, docId: 'ASN-2024-0308-001' },
    ],
  },
  {
    id: 7,
    sku: 'SKU-BL-001',
    name: 'BB크림 30ml',
    seller: '뷰티랩',
    availableQty: 380,
    allocatedQty: 20,
    damagedQty: 3,
    totalQty: 403,
    locations: [{ bin: 'B-3-2', qty: 403, asnId: 'ASN-2024-0309-005', receivedDate: '2026-03-09' }],
    threshold: 80,
    status: 'normal',
    history: [
      { date: '2026-03-13 11:30', type: '주문 할당', qty: -20, docId: 'ORD-20240313-020' },
      { date: '2026-03-09 10:00', type: '입고 확정', qty: 403, docId: 'ASN-2024-0309-005' },
    ],
  },
]

export function getInventories(params = {}) {
  let list = [...MOCK_INVENTORIES]

  if (params.seller) {
    list = list.filter(i => i.seller === params.seller)
  }
  if (params.status && params.status !== 'all') {
    list = list.filter(i => i.status === params.status)
  }
  if (params.q) {
    const q = params.q.toLowerCase()
    list = list.filter(i =>
      i.sku.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.seller.toLowerCase().includes(q),
    )
  }

  return Promise.resolve({ data: list })
}

export function getInventoryDetail(id) {
  const item = MOCK_INVENTORIES.find(i => i.id === id)
  return Promise.resolve({ data: item ?? null })
}