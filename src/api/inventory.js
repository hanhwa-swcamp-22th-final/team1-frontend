/**
 * inventory.js — 재고 현황 API 모듈
 */
import instance from './instance'


export function getInventories() {
  return instance.get('/inventories')
}

export function getInventoryDetail(id) {
  return instance.get(`/inventories/${id}`)
}