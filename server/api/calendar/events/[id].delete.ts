import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { useEditableStore } from '../../utils/store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  useEditableStore(event).events.delete(id)

  return { success: true }
})
