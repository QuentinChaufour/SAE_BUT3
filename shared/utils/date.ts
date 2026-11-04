
export function getCurrentDateString() {
  const today = new Date()
  
  return (today.getUTCDay() + 1) + '/' + (today.getUTCMonth() + 1) + '/' + today.getUTCFullYear()
}

export function dateToString(date: Date){
  return (date.getUTCDay() + 1) + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear()
}