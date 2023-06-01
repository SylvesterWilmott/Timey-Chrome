'use strict'

/* global chrome */

export function formatted (durationInSeconds) {
  const seconds = durationInSeconds % 60
  const minutes = Math.floor((durationInSeconds / 60) % 60)
  const hours = Math.floor(durationInSeconds / 3600)

  const formattedDuration =
    hours.toString().padStart(2, '0') +
    ':' +
    minutes.toString().padStart(2, '0') +
    ':' +
    seconds.toString().padStart(2, '0')

  return formattedDuration
}
