/** @vitest-environment node */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
const port = 3101
const baseURL = `http://127.0.0.1:${port}`

let serverProcess

async function waitForServerReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/wms/warehouses`)
      if (response.ok) return
    } catch {
      // server booting
    }
    await delay(250)
  }
  throw new Error('mock server did not start in time')
}

beforeAll(async () => {
  serverProcess = spawn(process.execPath, ['mock-server/server.cjs'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      VITE_API_BASE_URL: baseURL,
    },
    stdio: 'ignore',
  })

  await waitForServerReady()
})

afterAll(async () => {
  if (!serverProcess || serverProcess.killed) return
  serverProcess.kill()
  await delay(300)
})

describe('mock server contract', () => {
  it('supports frontend member auth path', async () => {
    const response = await fetch(`${baseURL}/member/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sys.admin@conk.com',
        password: '1234',
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.token).toBeTruthy()
  })

  it('supports system admin endpoints on member/admin', async () => {
    const response = await fetch(`${baseURL}/member/admin/companies`)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
  })

  it('supports wh manager dispatch flow on wms/manager', async () => {
    const listResponse = await fetch(`${baseURL}/wms/manager/pending-orders`)
    const listBody = await listResponse.json()
    const targetId = listBody[0]?.id

    expect(targetId).toBeTruthy()

    const patchResponse = await fetch(`${baseURL}/wms/manager/pending-orders/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: 'WORKER-001',
        status: 'PREPARING_ITEM',
      }),
    })

    expect(patchResponse.status).toBe(200)

    const refreshedResponse = await fetch(`${baseURL}/wms/manager/pending-orders`)
    const refreshedBody = await refreshedResponse.json()
    expect(refreshedBody.some((item) => item.id === targetId)).toBe(false)
  })

  it('supports wh worker task read and write', async () => {
    const response = await fetch(`${baseURL}/wms/worker/tasks?workerUserId=4`)
    const body = await response.json()
    const task = body[0]

    expect(response.status).toBe(200)
    expect(task).toBeTruthy()

    const updateResponse = await fetch(`${baseURL}/wms/worker/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: '완료',
      }),
    })

    expect(updateResponse.status).toBe(200)
    const updated = await updateResponse.json()
    expect(updated.status).toBe('완료')
  })

  it('supports frontend product path and legacy alias together', async () => {
    const frontendResponse = await fetch(`${baseURL}/wms/products/seller/list`)
    const aliasResponse = await fetch(`${baseURL}/products/seller/list`)

    expect(frontendResponse.status).toBe(200)
    expect(aliasResponse.status).toBe(200)

    const frontendBody = await frontendResponse.json()
    const aliasBody = await aliasResponse.json()
    expect(frontendBody.data.length).toBe(aliasBody.data.length)
  })
})
