import instance from './instance.js'

/**
 * 셀러 상품 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerProduct[] }
 */
export function getSellerProductList() {
  return instance.get('/products/seller/list')
}
