import { CONFIG } from '../config.js'
import { validateEmail } from '../utils/helpers.js'

export function initContact() {
  const section = document.querySelector('[data-module="contact"]')
  if (!section) return

  const form = section.querySelector('[data-contact="form"]')
  if (!form) return

  const nameInput = section.querySelector('[data-contact="name"]')
  const emailInput = section.querySelector('[data-contact="email"]')
  const messageInput = section.querySelector('[data-contact="message"]')
  const nameError = section.querySelector('[data-contact="name-error"]')
  const emailError = section.querySelector('[data-contact="email-error"]')
  const messageError = section.querySelector('[data-contact="message-error"]')
  const successMsg = section.querySelector('[data-contact="success"]')
  const submitBtn = section.querySelector('[data-contact="submit"]')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Clear previous errors
    ;[nameError, emailError, messageError, successMsg].forEach((el) =>
      el.classList.add('hidden')
    )

    const name = nameInput.value.trim()
    const email = emailInput.value.trim()
    const message = messageInput.value.trim()

    let hasError = false

    if (!name) {
      nameError.textContent = 'Name is required'
      nameError.classList.remove('hidden')
      hasError = true
    }
    if (!email) {
      emailError.textContent = 'Email is required'
      emailError.classList.remove('hidden')
      hasError = true
    } else if (!validateEmail(email)) {
      emailError.textContent = 'Please enter a valid email address'
      emailError.classList.remove('hidden')
      hasError = true
    }
    if (!message) {
      messageError.textContent = 'Message is required'
      messageError.classList.remove('hidden')
      hasError = true
    }

    if (hasError) return

    submitBtn.disabled = true
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Sending...'

    try {
      await fetch(CONFIG.api.contact, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ name, email, message }),
      })

      successMsg.textContent = 'Message sent successfully!'
      successMsg.classList.remove('hidden')
      form.reset()

      setTimeout(() => successMsg.classList.add('hidden'), 5000)
    } catch {
      nameError.textContent = 'Failed to send message. Please try again.'
      nameError.classList.remove('hidden')
    } finally {
      submitBtn.disabled = false
      submitBtn.innerHTML = originalText
    }
  })
}
