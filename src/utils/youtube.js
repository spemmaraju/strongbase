// Pulling an 11-character video id out of whatever YouTube hands you.
// ---------------------------------------------------------------------------
// You copy a link from the app, the share sheet, the address bar or a Shorts
// page and they all look different. Everything below normalises to the bare id,
// which is what the embed URL actually needs.
//
//   https://www.youtube.com/watch?v=ID&t=42
//   https://youtu.be/ID?si=xxxx
//   https://www.youtube.com/embed/ID
//   https://www.youtube.com/shorts/ID
//   https://m.youtube.com/watch?app=desktop&v=ID
//   ID                                            (already bare)
// ---------------------------------------------------------------------------

const ID_RE = /^[A-Za-z0-9_-]{11}$/

/** @returns {string|null} the video id, or null if nothing usable was found */
export function parseYouTubeId(input) {
  if (!input) return null
  const raw = String(input).trim()
  if (!raw) return null

  // Already a bare id
  if (ID_RE.test(raw)) return raw

  let url
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\.|^m\./, '').toLowerCase()

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return ID_RE.test(id || '') ? id : null
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v')
    if (v && ID_RE.test(v)) return v

    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
      return ID_RE.test(parts[1]) ? parts[1] : null
    }
  }

  return null
}

/** True when the input is empty or resolves to a usable id. */
export function isValidVideoInput(input) {
  const raw = String(input ?? '').trim()
  return raw === '' || parseYouTubeId(raw) !== null
}

export const watchUrl = id => `https://www.youtube.com/watch?v=${id}`
