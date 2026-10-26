export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export const MAX_CHAT_MESSAGES = 81
export const MAX_CHAT_CHARACTERS = 24_000
const storageKey = 'portfolio-chat-session-v1'

export function trimChatHistory(messages: ChatMessage[]): ChatMessage[] {
  const history = [...messages]
  let characters = history.reduce((sum, message) => sum + message.content.length, 0)
  while (
    history.length > 1 &&
    (history.length > MAX_CHAT_MESSAGES || characters > MAX_CHAT_CHARACTERS)
  ) {
    const removed = history.splice(0, 2)
    characters -= removed.reduce((sum, message) => sum + message.content.length, 0)
  }
  return history
}

export function readChatHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw || raw.length > 128_000) return []
    const messages: unknown = JSON.parse(raw)
    if (
      !Array.isArray(messages) ||
      messages.length > MAX_CHAT_MESSAGES ||
      messages.some(
        (message, index) =>
          !message ||
          message.role !== (index % 2 === 0 ? 'user' : 'assistant') ||
          typeof message.content !== 'string' ||
          !message.content.trim() ||
          message.content.length > (message.role === 'user' ? 2000 : 8000),
      )
    )
      return []
    return trimChatHistory(messages)
  } catch {
    return []
  }
}

export function saveChatHistory(messages: ChatMessage[]) {
  try {
    if (messages.length)
      sessionStorage.setItem(storageKey, JSON.stringify(trimChatHistory(messages)))
    else sessionStorage.removeItem(storageKey)
  } catch {
    // Chat still works in memory when browser storage is unavailable.
  }
}
