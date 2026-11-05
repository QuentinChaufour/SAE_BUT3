import { defineEventHandler, readValidatedBody, setResponseStatus } from 'nuxt/server'
import { eventSchema } from '~~/shared/utils/schemas'
import { useEditableStore } from '../utils/store'

export default defineEventHandler(async (event): Promise<CalendarEvent> => {
  const body = await readValidatedBody(event, eventSchema)

  useEditableStore(event).events.set(body.id, body)

  setResponseStatus(event, 201)

  return body
})
