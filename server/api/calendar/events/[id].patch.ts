import { defineEventHandler, getRouterParam, readValidatedBody } from 'nuxt/server'
import { eventSchema } from '~~/shared/utils/schemas'
import { useEditableStore } from '../../utils/store'

export default defineEventHandler(async (event): Promise<CalendarEvent> => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  const body = await readValidatedBody(event, eventSchema)

  if (body.id !== id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID does not match request path'
    })
  }

  useEditableStore(event).events.set(id, body)

  return body
})
