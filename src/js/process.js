'use strict'

export function parse (string) {
  const normalized = string.toLowerCase().replace(/\s+/g, ' ')

  const numberRegex = /^\d+(?:\.\d+)?$/m
  const timeRegex = /^@(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i
  const durationRegex = /\b(\d+(?:\.\d+)?)(?:\s*(d(?:ay)?s?|h(?:ou?rs?)?|m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?))\b/g
  const timeFormatRegex = /^(\d{1,3}):(\d{2}):(\d{2})$|^(\d{1,2}):(\d{2})$|^(\d{1,2}):(\d{2}):(\d{2})$/

  const numberMatch = normalized.match(numberRegex)
  const timeMatch = normalized.match(timeRegex)
  const durationPartsMatch = Array.from(normalized.matchAll(durationRegex))
  const timeFormatMatch = normalized.match(timeFormatRegex)

  if (numberMatch) {
    return parseFloat(numberMatch[0])
  }

  if (timeMatch) {
    const currentTime = new Date()
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()

    let inputHour = parseInt(timeMatch[1], 10)
    const inputMinute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null

    if (inputHour > 23 || inputMinute > 59) {
      return null // Invalid time
    }

    if (meridiem === 'pm' && inputHour < 12) {
      inputHour += 12
    } else if (meridiem === 'am' && inputHour === 12) {
      inputHour = 0
    }

    const currentTimeInSeconds = currentHour * 60 * 60 + currentMinute * 60
    const inputTimeInSeconds = inputHour * 60 * 60 + inputMinute * 60

    return (inputTimeInSeconds - currentTimeInSeconds + 86400) % 86400
  }

  if (durationPartsMatch.length > 0) {
    let seconds = 0

    for (const match of durationPartsMatch) {
      const value = parseFloat(match[1])
      const unit = match[2]

      let duration = 0
      if (unit.startsWith('d')) {
        duration = value * 24 * 60 * 60
      } else if (unit.startsWith('h')) {
        duration = value * 60 * 60
      } else if (unit.startsWith('m')) {
        duration = value * 60
      } else if (unit.startsWith('s')) {
        duration = value
      }

      seconds += duration
    }

    return seconds
  }

  if (timeFormatMatch) {
    let seconds = 0
    if (timeFormatMatch[1]) {
      const hours = parseInt(timeFormatMatch[1], 10)
      const minutes = parseInt(timeFormatMatch[2], 10)
      const timeSeconds = parseInt(timeFormatMatch[3], 10)
      seconds = hours * 60 * 60 + minutes * 60 + timeSeconds
    } else if (timeFormatMatch[4]) {
      const minutes = parseInt(timeFormatMatch[4], 10)
      const timeSeconds = parseInt(timeFormatMatch[5], 10)
      seconds = minutes * 60 + timeSeconds
    } else if (timeFormatMatch[6]) {
      const days = parseInt(timeFormatMatch[6], 10)
      const hours = parseInt(timeFormatMatch[7], 10)
      const minutes = parseInt(timeFormatMatch[8], 10)
      const timeSeconds = parseInt(timeFormatMatch[9], 10)
      seconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + timeSeconds
    }

    return seconds
  }

  return null
}
