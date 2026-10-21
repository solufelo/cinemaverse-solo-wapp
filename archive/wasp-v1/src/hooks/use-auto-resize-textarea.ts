import { useCallback, useRef } from 'react'

export function useAutoResizeTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }, [])

  return { textareaRef, resizeTextarea }
} 