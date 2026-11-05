import { defineEventHandler } from 'nuxt/server'
import { useStore } from '../utils/store'

export default defineEventHandler((event): Calendar[] => {
  return useStore(event).calendars
})
