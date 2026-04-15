function resolveSellerName(seller = {}) {
  return seller.brandNameKo || seller.brandNameEn || seller.sellerInfo || seller.id || '-'
}

function resolveSellerCode(seller = {}) {
  return seller.customerCode || seller.id || '-'
}

export function buildSellerDirectory(sellers = []) {
  return new Map(
    sellers.map((seller) => [
      seller.id,
      {
        sellerId: seller.id,
        sellerCode: resolveSellerCode(seller),
        sellerName: resolveSellerName(seller),
      },
    ]),
  )
}

export function normalizeSellerRevenueRows(revenueRows = [], sellerDirectory = new Map()) {
  return revenueRows.map((row) => {
    const seller = sellerDirectory.get(row.sellerId) ?? {}

    return {
      sellerId: row.sellerId,
      sellerCode: seller.sellerCode || row.sellerId,
      sellerName: seller.sellerName || row.sellerId,
      monthRevenue: Number(row.monthRevenue ?? 0),
      totalOrders: Number(row.totalOrders ?? 0),
      avgOrderValue: Number(row.avgOrderValue ?? 0),
    }
  })
}

export function normalizeSellerFeeRows(billingRows = [], sellerDirectory = new Map()) {
  const grouped = new Map()

  billingRows.forEach((row) => {
    const sellerId = row.sellerId
    const seller = sellerDirectory.get(sellerId) ?? {}
    const current = grouped.get(sellerId) ?? {
      sellerId,
      sellerCode: seller.sellerCode || sellerId,
      sellerName: seller.sellerName || sellerId,
      estimatedCost: 0,
      storageFee: 0,
      pickingFee: 0,
      packingFee: 0,
      momGrowth: null,
      turnoverRate: null,
      warehouseCount: 0,
      billingMonth: row.billingMonth ?? null,
    }

    current.estimatedCost += Number(row.totalFee ?? 0)
    current.storageFee += Number(row.storageFee ?? 0)
    current.pickingFee += Number(row.pickingFee ?? 0)
    current.packingFee += Number(row.packingFee ?? 0)
    current.warehouseCount += 1

    grouped.set(sellerId, current)
  })

  return [...grouped.values()]
}

export function getCurrentBillingMonth(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}
