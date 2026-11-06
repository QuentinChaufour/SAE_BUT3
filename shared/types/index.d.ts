import type UserRole from './role'

declare module '#app' {

  /**
   * Interface enrichissant l'utilisateur de auth-utils
   *
   * Un utilisateur est identifié possède un numéro identifiant,
   * un role définissant ses actions au sein de
   * l'application, ainsi que son nom/prénom
   */
  interface PageMeta {
    role?: UserRole | UserRole[]
  }
}

export {}


//---------- Calendar ----------//

export type CalendarView = 'day' | 'week' | 'month' | 'year'

export interface DateRange {
  start: Date
  end: Date
}

export interface Calendar {
  id: string
  name: string
  color: 'info' | 'success' | 'warning' | 'error' | 'primary' | 'secondary'
}

// export interface CalendarEvent {
//   id: string
//   calendarId: string
//   title: string
//   description?: string
//   start: string
//   end: string
//   allDay?: boolean
// }

export interface CalendarEvent {
  id: string
  calendarId: string
  title: string
  description?: string
  start: string
  end: string
  allDay?: boolean
  salle: string
  etu: string
  tuteur: string
  candideUn?: string
  candideDeux?: string
}

