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
 * 셀러 상품 상세 조회
 * @param {string} productId
 * @returns {Promise<AxiosResponse>}
 */
export function getSellerProductDetail(productId) {
  return instance.get(`/products/seller/${productId}`)
}

/**
 * 셀러 상품 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerProduct[] }
 */
export function getSellerProductList() {
  return instance.get('/products/seller/list')
}

/**
 * 셀러 상품 수정
 * @param {string} productId
 * @param {object} payload
 * @returns {Promise<AxiosResponse>}
 */
export function updateSellerProduct(productId, payload) {
  return instance.put(`/products/seller/${productId}`, payload)
}
