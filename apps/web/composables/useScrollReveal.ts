export function useScrollReveal(options: { staggerMs?: number; threshold?: number } = {}) {
  const { staggerMs = 80, threshold = 0.06 } = options
  const containerRef = ref<HTMLElement | null>(null)

  onMounted(() => {
    const container = containerRef.value
    if (!container) return

    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-sr]'))
    items.forEach((el, i) => {
      el.style.setProperty('--sr-delay', `${i * staggerMs}ms`)
    })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        items.forEach((el) => el.classList.add('sr-visible'))
        observer.disconnect()
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(container)
    onUnmounted(() => observer.disconnect())
  })

  return { containerRef }
}
