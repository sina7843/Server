export function useScrollReveal(options: { staggerMs?: number; threshold?: number } = {}) {
  const { staggerMs = 80, threshold = 0.12 } = options
  const containerRef = ref<HTMLElement | null>(null)

  onMounted(() => {
    const container = containerRef.value
    if (!container) return

    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-sr]'))
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        const hidden = entries.filter((e) => !e.isIntersecting)

        // Instant reset when element leaves viewport — no fade-out visible to user
        hidden.forEach((entry) => {
          const el = entry.target as HTMLElement
          el.style.transition = 'none'
          el.classList.remove('sr-visible')
          requestAnimationFrame(() => {
            el.style.transition = ''
          })
        })

        // Batch stagger for elements entering viewport together
        visible.forEach((entry, batchIndex) => {
          const el = entry.target as HTMLElement
          el.style.setProperty('--sr-delay', `${batchIndex * staggerMs}ms`)
          el.classList.add('sr-visible')
        })
      },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    )

    items.forEach((el) => observer.observe(el))
    onUnmounted(() => observer.disconnect())
  })

  return { containerRef }
}
