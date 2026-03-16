import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import { login, getSellerStats } from '@/api/member'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
  },
}))

describe('member API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login은 POST /auth/login을 호출한다', async () => {
    const payload = { email: 'test@test.com', password: '1234' }
    await login(payload)
    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/auth/login', payload)
  })

  it('getSellerStats는 GET /members/sellers/stats를 호출한다', async () => {
    await getSellerStats()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/members/sellers/stats')
  })
})
