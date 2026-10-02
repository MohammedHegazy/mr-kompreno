export type Locale = 'en' | 'ar'

export const useKompLocale = () => {
  const locale = useState<Locale>('kompreno-locale', () => 'ar')
  const dir = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'))
  const isArabic = computed(() => locale.value === 'ar')

  const switchLocale = (next: Locale) => {
    locale.value = next
  }

  return {
    locale,
    dir,
    isArabic,
    switchLocale,
  }
}
