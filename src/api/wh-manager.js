/**
 * wh-manager.js — 창고 관리자 API 모듈
 */
import instance from './instance'

export function getWhmDashboard() {
  return instance.get('/whm_dashboard')
}