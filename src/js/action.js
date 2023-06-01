'use strict'

/* global chrome */

export function setIcon (relPath) {
  const path = chrome.runtime.getURL(relPath)
  return new Promise((resolve, reject) => {
    chrome.action.setIcon(
      {
        path
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

export function updateActionTitle (title) {
  return new Promise((resolve, reject) => {
    chrome.action.setTitle(
      {
        title
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
