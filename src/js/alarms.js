'use strict'

/* global chrome */

export function create (name, time) {
  return new Promise((resolve, reject) => {
    chrome.alarms.create(
      name,
      {
        when: time
      },
      function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        resolve()
      }
    )
  })
}

export function get (name) {
  return new Promise((resolve, reject) => {
    chrome.alarms.get(name, function (alarm) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message)
      }
      resolve(alarm)
    })
  })
}

export function clear (name) {
  return new Promise((resolve, reject) => {
    chrome.alarms.clear(name, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message)
      }
      resolve()
    })
  })
}
