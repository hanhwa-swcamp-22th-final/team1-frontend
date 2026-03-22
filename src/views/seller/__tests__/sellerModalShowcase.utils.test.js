import { describe, expect, it } from 'vitest'

import {
  createSellerModalShowcaseChannelForm,
  createSellerModalShowcaseSamples,
  SELLER_MODAL_SHOWCASE_GROUPS,
} from '@/utils/seller/sellerModalShowcase.utils.js'

describe('sellerModalShowcase utils', () => {
  it('쇼케이스 그룹 구성에 필요한 모달 키를 모두 포함한다', () => {
    const keys = SELLER_MODAL_SHOWCASE_GROUPS.flatMap((group) => group.items.map((item) => item.key))

    expect(keys).toEqual([
      'order-detail',
      'product-detail',
      'asn-detail',
      'inventory-detail',
      'order-cancel-confirm',
      'product-status-confirm',
      'asn-cancel-confirm',
      'asn-csv-confirm',
      'channel-connect',
      'upload-result',
    ])
  })

  it('채널 연결 폼 기본값을 반환한다', () => {
    expect(createSellerModalShowcaseChannelForm()).toEqual({
      storeAlias: 'Qoo10 KR Store',
      contactEmail: 'ops@qoo10-demo.com',
      syncMode: 'AUTO',
    })
  })

  it('쇼케이스 샘플 데이터에 상세 모달과 업로드 요약 값이 준비된다', () => {
    const samples = createSellerModalShowcaseSamples()

    expect(samples.order.id).toBe('seller-order-3')
    expect(samples.orderDetail.items[0].amount).toBe(29)
    expect(samples.product.id).toBe('seller-product-2')
    expect(samples.asn.id).toBe('seller-asn-1')
    expect(samples.inventory.id).toBe('seller-inventory-2')
    expect(samples.channelCard.key).toBe('QOO10')
    expect(samples.uploadSummary).toEqual({
      fileName: 'seller-orders-upload.xlsx',
      rowCount: 2,
      totalQuantity: 5,
      uniqueSkuCount: 2,
      uniqueRecipientCount: 2,
      firstOrderNo: 'ORD-20260319-101',
    })
  })
})
