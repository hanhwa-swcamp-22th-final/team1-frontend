import instance from './instance.js'

/**
 * 셀러 상품 등록
 * @param {object} payload
 * @returns {Promise<AxiosResponse>}
 */
export function createSellerProduct(payload) {
  return instance.post('/products/seller/register', payload)
}

/**
 * 셀러 상품 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerProduct[] }
 */
export function getSellerProductList() {
  return instance.get('/products/seller/list')
}
