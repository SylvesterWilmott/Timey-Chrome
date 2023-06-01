'use strict'

/* global chrome */

import * as storage from './js/storage.js'
import * as action from './js/action.js'
import * as offscreen from './js/offscreen.js'
import * as message from './js/message.js'
import * as notifications from './js/notifications.js'

chrome.alarms.onAlarm.addListener(onAlarm)
chrome.runtime.onMessage.addListener(onMessageReceived)

async function onAlarm () {
  const storedPreferences = await storage
    .load('preferences', storage.preferenceDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  if (storedPreferences.chime.status === true) {
    playSound('chime')
  }

  if (storedPreferences.notifications.status === true) {
    const permissionGranted = await verifyNotificationsPermission()
      .catch((error) => {
        console.error('An error occurred:', error)
      })

    if (permissionGranted) {
      const title = chrome.i18n.getMessage('EXT_NAME_SHORT')
      const message = chrome.i18n.getMessage('TIMER_COMPLETE')

      try {
        await notifications.send(title, message)
      } catch (error) {
        console.error('An error occurred:', error)
      }
    }
  }

  try {
    action.setIcon('../images/icon32_complete.png')
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

function verifyNotificationsPermission () {
  return new Promise((resolve, reject) => {
    chrome.permissions.contains(
      {
        permissions: ['notifications']
      },
      (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        if (result) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
    )
  })
}

const playSound = throttle(sendSoundToOffscreenDocument, 100)

async function sendSoundToOffscreenDocument (sound) {
  const documentPath = 'audio-player.html'
  const hasDocument = await offscreen
    .hasDocument(documentPath)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  if (!hasDocument) {
    try {
      await offscreen.create(documentPath)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }

  try {
    await message.send({ msg: 'play_sound', sound })
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

function throttle (func, delay) {
  let lastExecTime = 0
  return function () {
    const context = this
    const args = arguments
    const now = Date.now()
    if (now - lastExecTime >= delay) {
      lastExecTime = now
      func.apply(context, args)
    }
  }
}

async function onMessageReceived (message, sender, sendResponse) {
  sendResponse()

  if (message === 'play-click') {
    playSound('click')
  } else if (message === 'play-error') {
    playSound('error')
  }
}
