'use strict'

/* global chrome */

import * as process from './process.js'
import * as duration from './duration.js'
import * as storage from './storage.js'
import * as i18n from './localize.js'
import * as navigation from './navigation.js'
import * as alarms from './alarms.js'
import * as action from './action.js'
import * as message from './message.js'

document.addEventListener('DOMContentLoaded', init)

let currentDurationInSeconds = null

async function init () {
  try {
    await Promise.all([i18n.localize(), restorePreferences()])
  } catch (error) {
    console.error('An error occurred:', error)
  }

  navigation.init()
  registerListeners()
  ready()
}

async function ready () {
  postponeAnimationUntilReady()

  try {
    await updateDisplayBasedOnAlarmStartus()
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function updateDisplayBasedOnAlarmStartus () {
  const alarm = await alarms.get('timer').catch((error) => {
    console.error('An error occurred:', error)
  })

  if (alarm) {
    const titleEl = document.getElementById('title')
    const startStopToggleEl = document.querySelector('[data-localize="START"]')
    startStopToggleEl.innerText = chrome.i18n.getMessage('STOP')

    function updateDurationDisplay () {
      const currentTime = Date.now()
      const remainingTime = alarm.scheduledTime - currentTime
      const remainingSeconds = Math.floor(remainingTime / 1000)
      const durationString = duration.formatted(remainingSeconds)
      titleEl.innerText = durationString
    }

    updateDurationDisplay()
    setInterval(updateDurationDisplay, 100)

    try {
      await updateInputWithPreviousCommand()
    } catch (error) {
      console.error('An error occurred:', error)
    }
  } else {
    try {
      await Promise.all([
        storage.clear('current-command'),
        action.setIcon('../images/icon32.png')
      ])
    } catch (error) {
      console.error('An error occurred:', error)
    }

    randomiseCommandInputPlaceholder()

    document.getElementById('commandInput').focus()
  }
}

async function updateInputWithPreviousCommand () {
  const storedCommand = await storage
    .load('current-command', '')
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  if (storedCommand.length) {
    const commandInputEl = document.getElementById('commandInput')
    commandInputEl.value = storedCommand
    commandInputEl.readOnly = true
  }
}

function randomiseCommandInputPlaceholder () {
  const placeholders = [
    '@6:30',
    '@5pm',
    '@11am',
    '1 hour 30 minutes',
    '2.5hours',
    '2m30s',
    '30mins',
    '1d',
    '2 days',
    '0:60',
    '01:00:00'
  ]

  const randomIndex = Math.floor(Math.random() * placeholders.length)
  const randomPlaceholder = placeholders[randomIndex]

  const commandInputEl = document.getElementById('commandInput')
  commandInputEl.placeholder = randomPlaceholder
}

function postponeAnimationUntilReady () {
  const animatedElements = document.querySelectorAll('.no-transition')

  for (const el of animatedElements) {
    const pseudoBefore = window.getComputedStyle(el, ':before').content
    const pseudoAfter = window.getComputedStyle(el, ':after').content
    const hasBeforeContent = pseudoBefore !== 'none' && pseudoBefore !== ''
    const hasAfterContent = pseudoAfter !== 'none' && pseudoAfter !== ''

    if (hasBeforeContent || hasAfterContent) {
      el.addEventListener(
        'transitionend',
        function () {
          el.classList.remove('no-transition')
        },
        { once: true }
      )
    }

    el.classList.remove('no-transition')
  }
}

function registerListeners () {
  const on = (target, event, handler) => {
    if (typeof target === 'string') {
      document.getElementById(target).addEventListener(event, handler, false)
    } else {
      target.addEventListener(event, handler, false)
    }
  }

  const onAll = (target, event, handler) => {
    const elements = document.querySelectorAll(target)

    for (const el of elements) {
      el.addEventListener(event, handler, false)
    }
  }

  on(document, 'keydown', onDocumentKeydown)
  on('commandInput', 'input', onCommandInput)
  onAll('div.nav-index', 'click', onActionClicked)
  onAll('input[type="checkbox"]', 'change', onCheckBoxChanged)

  chrome.alarms.onAlarm.addListener(onAlarm)
}

function onCommandInput (e) {
  const minSeconds = 60
  const maxSeconds = 2592000 // Equivalent to 30 days
  const value = this.value
  const seconds = process.parse(value)
  const durationString = duration.formatted(seconds)
  const titleEl = document.getElementById('title')

  if (
    value === '' ||
    seconds === null ||
    seconds > maxSeconds ||
    seconds < minSeconds
  ) {
    titleEl.innerText = chrome.i18n.getMessage('EXT_NAME_SHORT')
    currentDurationInSeconds = null
  } else {
    titleEl.innerText = durationString
    currentDurationInSeconds = seconds
  }
}

async function restorePreferences () {
  const storedPreferences = await storage
    .load('preferences', storage.preferenceDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  for (const preferenceName in storedPreferences) {
    const preferenceObj = storedPreferences[preferenceName]
    const preferenceElement = document.getElementById(preferenceName)

    if (preferenceElement) {
      preferenceElement.checked = preferenceObj.status
    }
  }
}

async function onCheckBoxChanged (e) {
  const target = e.target
  const targetId = target.id

  const storedPreferences = await storage
    .load('preferences', storage.preferenceDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
      target.checked = !target.checked
    })

  const preference = storedPreferences[targetId]

  if (!preference) return

  if (preference.permissions !== null) {
    if (preference.permissions.includes('notifications')) {
      if (target.checked) {
        const permissionGranted = await requestPermission().catch((error) => {
          console.error('An error occurred:', error)
          target.checked = !target.checked
        })

        console.log(permissionGranted)

        if (permissionGranted) {
          preference.status = true

          try {
            await storage.save('preferences', storedPreferences)
          } catch (error) {
            console.error('An error occurred:', error)
          }
        } else {
          target.checked = !target.checked
        }
      } else {
        const permissionRemoved = requestPermission().catch((error) => {
          console.error('An error occurred:', error)
          target.checked = !target.checked
        })

        if (permissionRemoved) {
          preference.status = false

          try {
            await storage.save('preferences', storedPreferences)
          } catch (error) {
            console.error('An error occurred:', error)
          }
        } else {
          target.checked = !target.checked
        }
      }
    }
  } else {
    preference.status = target.checked

    try {
      await storage.save('preferences', storedPreferences)
    } catch (error) {
      console.error('An error occurred:', error)
      target.checked = !target.checked
    }
  }
}

function requestPermission () {
  return new Promise((resolve, reject) => {
    chrome.permissions.request(
      {
        permissions: ['notifications']
      },
      (granted) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }

        if (granted) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
    )
  })
}

async function onActionClicked (e) {
  const target = e.target
  const targetId = target.id

  if (targetId === 'startStopToggle') {
    const alarm = await alarms.get('timer').catch((error) => {
      console.error('An error occurred:', error)
    })

    try {
      if (alarm) {
        await Promise.all([clearTimer(), message.send('play-click')])

        window.close()
      } else if (currentDurationInSeconds) {
        await Promise.all([newTimer(), message.send('play-click')])

        window.close()
      } else {
        await message.send('play-error')
      }
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}

function onDocumentKeydown (e) {
  if (e.key === 'Enter') {
    document.getElementById('startStopToggle').click()
  }
}

async function clearTimer () {
  try {
    await Promise.all([
      action.setIcon('../images/icon32.png'),
      alarms.clear('timer')
    ])
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function newTimer () {
  const originalInput = document.getElementById('commandInput').value
  const delayInSeconds = currentDurationInSeconds
  const delayInMilliseconds = delayInSeconds * 1000
  const targetTime = Date.now() + delayInMilliseconds

  try {
    await Promise.all([
      action.setIcon('../images/icon32_active.png'),
      alarms.create('timer', targetTime),
      storage.save('current-command', originalInput)
    ])
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

function onAlarm () {
  setTimeout(function () {
    window.location.reload()
  }, 0)
}
