export function getCurrentDateString() {
  const today = new Date()

  const day = today.getUTCDate()
  const month = today.getUTCMonth() + 1
  const year = today.getUTCFullYear()

  const dayString = day < 10 ? '0' + day : day.toString()
  const monthString = month < 10 ? '0' + month : month.toString()

  return dayString + '/' + monthString + '/' + year
}

export function dateToString(date: Date) {
  const day = date.getUTCDate()
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()

  const dayString = day < 10 ? '0' + day : day.toString()
  const monthString = month < 10 ? '0' + month : month.toString()

  return dayString + '/' + monthString + '/' + year
}

export function stringToDate(dateString: string): Date {
  const [day, month, year] = dateString.split('/').map(Number)

  if (!day || !month || !year) {
    throw new Error('Invalid date string format. Expected format: "DD/MM/YYYY"')
  }

  return new Date(year, month - 1, day - 1)
}
