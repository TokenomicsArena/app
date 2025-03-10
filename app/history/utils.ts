/**
 * Format a date relative to the current time
 * @param date The date to format
 * @returns A formatted string representation of the date
 */
export function formatDate(date: Date): string {
  const now = new Date()
  const itemDate = new Date(date)
  const diffTime = Math.abs(now.getTime() - itemDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 7) {
    // Less than a minute
    const diffSeconds = Math.floor(diffTime / 1000)
    if (diffSeconds < 60) {
      return `${diffSeconds} ${diffSeconds === 1 ? 'second' : 'seconds'} ago`
    }
    
    // Less than an hour
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
    }
    
    // Less than a day
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    }
    
    // Less than 7 days
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else {
    return itemDate.toISOString().split("T")[0].replace(/-/g, ".")
  }
}
