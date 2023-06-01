'use strict'

/* global chrome */

export function send (title, message) {
  return new Promise((resolve, reject) => {
    chrome.notifications.create('notificationId',
      {
        type: 'basic',
        title,
        message,
        iconUrl: chrome.runtime.getURL('../images/notification.png')
      },
      (notificationId) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        resolve()
      }
    )
  })
}
