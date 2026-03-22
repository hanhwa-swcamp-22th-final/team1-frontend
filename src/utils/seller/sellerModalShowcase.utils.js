/**
 * Seller 모달 쇼케이스 화면용 샘플 데이터와 카드 구성을 관리한다.
 * 기존 Seller mock 유틸을 재사용해 모달 확인 화면만 별도로 묶는다.
 */
import { SELLER_ASN_LIST_ROWS, getSellerAsnDetailById } from '@/utils/seller/asnList.utils.js'
import { SELLER_CHANNEL_SYNC_CARDS } from '@/utils/seller/channelOrders.utils.js'
import { SELLER_INVENTORY_LIST_ROWS, getSellerInventoryDetailById } from '@/utils/seller/inventoryList.utils.js'
import { SELLER_ORDER_LIST_ROWS, getSellerOrderDetailById } from '@/utils/seller/orderList.utils.js'
import { buildOrderUploadResultSummary } from '@/utils/seller/orderRegister.utils.js'
import { SELLER_PRODUCT_LIST_ROWS, getSellerProductDetailById } from '@/utils/seller/productList.utils.js'

export const SELLER_MODAL_SHOWCASE_GROUPS = [
  {
    key: 'detail',
    title: '상세 모달',
    description: '주문, 상품, ASN, 재고 상세 모달을 한 화면에서 확인합니다.',
    items: [
      {
        key: 'order-detail',
        label: '주문 상세',
        sizeLabel: 'Tall',
        description: '출고 5단계와 주문 상품 구성을 함께 확인합니다.',
      },
      {
        key: 'product-detail',
        label: '상품 상세',
        sizeLabel: 'Tall',
        description: '가격, 재고, 통관, 운영 메모를 한 번에 검토합니다.',
      },
      {
        key: 'asn-detail',
        label: 'ASN 상세',
        sizeLabel: 'Tall',
        description: '운송 정보, 서류, 입고 품목 테이블을 함께 보여줍니다.',
      },
      {
        key: 'inventory-detail',
        label: '재고 상세',
        sizeLabel: 'Tall',
        description: '재고 수량, 위치, 회전 지표를 한 번에 확인합니다.',
      },
    ],
  },
  {
    key: 'confirm',
    title: '확인 모달',
    description: 'Seller 목록 화면에서 사용하는 확인/경고 모달을 모아 둡니다.',
    items: [
      {
        key: 'order-cancel-confirm',
        label: '주문 취소 확인',
        sizeLabel: 'Compact',
        description: '취소 가능 주문의 상태 변경 전 최종 확인에 사용합니다.',
      },
      {
        key: 'product-status-confirm',
        label: '상품 상태 변경 확인',
        sizeLabel: 'Compact',
        description: '비활성 또는 재활성 전 최종 확인에 사용합니다.',
      },
      {
        key: 'asn-cancel-confirm',
        label: 'ASN 취소 확인',
        sizeLabel: 'Compact',
        description: '제출 상태 ASN만 취소 가능한 흐름을 확인합니다.',
      },
      {
        key: 'asn-csv-confirm',
        label: 'ASN CSV 확인',
        sizeLabel: 'Compact',
        description: 'CSV 내보내기 전 안내 문구와 액션 구성을 확인합니다.',
      },
    ],
  },
  {
    key: 'integration',
    title: '연동 모달',
    description: '채널 연결과 엑셀 업로드 결과 확인 모달을 검토합니다.',
    items: [
      {
        key: 'channel-connect',
        label: '채널 연결',
        sizeLabel: 'Default',
        description: '스토어 별칭, 운영 이메일, 동기화 정책을 입력합니다.',
      },
      {
        key: 'upload-result',
        label: '엑셀 업로드 결과',
        sizeLabel: 'Default',
        description: '업로드 주문 수와 SKU/수령인 요약을 확인합니다.',
      },
    ],
  },
]

export function createSellerModalShowcaseChannelForm() {
  return {
    storeAlias: 'Qoo10 KR Store',
    contactEmail: 'ops@qoo10-demo.com',
    syncMode: 'AUTO',
  }
}

export function createSellerModalShowcaseSamples() {
  const order = SELLER_ORDER_LIST_ROWS.find((row) => row.id === 'seller-order-3') ?? SELLER_ORDER_LIST_ROWS[0]
  const product = SELLER_PRODUCT_LIST_ROWS.find((row) => row.id === 'seller-product-2') ?? SELLER_PRODUCT_LIST_ROWS[0]
  const asn = SELLER_ASN_LIST_ROWS.find((row) => row.id === 'seller-asn-1') ?? SELLER_ASN_LIST_ROWS[0]
  const inventory =
    SELLER_INVENTORY_LIST_ROWS.find((row) => row.id === 'seller-inventory-2') ?? SELLER_INVENTORY_LIST_ROWS[0]
  const channelCard =
    SELLER_CHANNEL_SYNC_CARDS.find((card) => card.key === 'QOO10') ?? SELLER_CHANNEL_SYNC_CARDS[0]
  const orderDetail = getSellerOrderDetailById(order.id, order)
  const productDetail = getSellerProductDetailById(product.id, product)
  const asnDetail = getSellerAsnDetailById(asn.id, asn)
  const inventoryDetail = getSellerInventoryDetailById(inventory.id, inventory)
  const uploadSummary = buildOrderUploadResultSummary(
    [
      {
        orderNo: 'ORD-20260319-101',
        recipient: '홍길동',
        sku: 'LB-AMP-30',
        quantity: '2',
      },
      {
        orderNo: 'ORD-20260319-102',
        recipient: '김영희',
        sku: 'LB-MSK-5P',
        quantity: '3',
      },
    ],
    'seller-orders-upload.xlsx',
  )

  return {
    order: { ...order },
    orderDetail: {
      ...orderDetail,
      items: orderDetail.items.map((item) => ({ ...item })),
    },
    product: { ...product },
    productDetail: { ...productDetail },
    asn: { ...asn },
    asnDetail: {
      ...asnDetail,
      items: asnDetail.items.map((item) => ({ ...item })),
      documents: [...asnDetail.documents],
    },
    inventory: { ...inventory },
    inventoryDetail: { ...inventoryDetail },
    channelCard: {
      ...channelCard,
      actions: channelCard.actions.map((action) => ({ ...action })),
    },
    uploadSummary,
  }
}
