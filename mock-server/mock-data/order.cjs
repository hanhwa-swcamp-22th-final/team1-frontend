// mock-data/order.cjs — 주문/출고 관련 mock 데이터
// 사용처: routes/orders.cjs

const OUTBOUND_STATS = {
  pendingOutboundCount: 203,
  trend: '+15', trendLabel: '전주 대비', trendType: 'up',
}

module.exports = { OUTBOUND_STATS }
