import instance from './instance.js'

export async function getWhWorkerTasks(params = {}) {
  return instance.get('/wh_worker_tasks', { params })
}

export async function updateWhWorkerTask(id, payload) {
  return instance.patch(`/wh_worker_tasks/${id}`, payload)
}
