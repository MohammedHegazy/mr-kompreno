export type Locale = 'en' | 'ar'

export interface MenuProduct {
  id: string
  categoryId: string
  name: Record<Locale, string>
  description: Record<Locale, string>
  price: number
  image: string
  featured?: boolean
  available?: boolean
}

export interface MenuCategory {
  id: string
  name: Record<Locale, string>
  icon: string
}

export const navItems = [
  { id: 'home', en: 'Home', ar: 'الرئيسية' },
  { id: 'menu', en: 'Menu', ar: 'القائمة' },
  { id: 'about', en: 'About', ar: 'من نحن' },
  { id: 'contact', en: 'Contact', ar: 'تواصل' },
] as const

export const menuCategories: MenuCategory[] = [
  { id: 'all', name: { en: 'All', ar: 'الكل' }, icon: 'lucide:layout-grid' },
  { id: 'loaded-potatoes', name: { en: 'Loaded Potatoes', ar: 'بطاطا محمصة' }, icon: 'lucide:flame' },
  { id: 'pizza', name: { en: 'Pizza', ar: 'بيتزا' }, icon: 'lucide:pizza' },
]

export const featuredProducts: MenuProduct[] = [
  {
    id: 'featured-1',
    categoryId: 'loaded-potatoes',
    name: { en: 'Loaded Potato Deluxe', ar: 'بطاطا لودد ديلوكس' },
    description: { en: 'A rich loaded potato with premium toppings and a generous finish.', ar: 'بطاطا محمصة مُزيّنة بتوابل ومكونات غنية بنكهة قوية.' },
    price: 11,
    image: '/items/1611741895267.jpg',
    featured: true,
    available: true,
  },
  {
    id: 'featured-2',
    categoryId: 'pizza',
    name: { en: 'Classic Cheese Pizza', ar: 'بيتزا الجبنة الكلاسيكية' },
    description: { en: 'Warm, cheesy slices with a golden crust and savory finish.', ar: 'شرائح بيتزا دافئة مع قشرة ذهبية ونكهة جبن غنية.' },
    price: 14,
    image: '/items/1611741895310.jpg',
    featured: true,
    available: true,
  },
  {
    id: 'featured-3',
    categoryId: 'pizza',
    name: { en: 'Family Combo', ar: 'باقة العائلة' },
    description: { en: 'A balanced combo designed for sharing, filled with comfort-food favorites.', ar: 'باقة متوازنة مناسبة للمشاركة وتجمع بين أفضل المذاق المريح.' },
    price: 18,
    image: '/items/1615503114698.jpg',
    featured: true,
    available: true,
  },
]

export const products: MenuProduct[] = [
  {
    id: 'p01',
    categoryId: 'loaded-potatoes',
    name: { en: 'Loaded Potato Deluxe', ar: 'بطاطا لودد ديلوكس' },
    description: { en: 'Creamy potato topped with fresh ingredients and a balanced savory finish.', ar: 'بطاطا كريمية مع مكونات طازجة ونهاية مميزة بنكهة مالحة.' },
    price: 11,
    image: '/items/1611741895267.jpg',
    featured: true,
    available: true,
  },
  {
    id: 'p02',
    categoryId: 'loaded-potatoes',
    name: { en: 'Fire Chicken Potato', ar: 'بطاطا الدجاج الحار' },
    description: { en: 'A spicy potato favorite with bold flavor and rich texture.', ar: 'بطاطا مميزة بنكهة حارة وقوام غني ومشبع.' },
    price: 13,
    image: '/items/1611741895445.jpg',
    available: true,
  },
  {
    id: 'p03',
    categoryId: 'loaded-potatoes',
    name: { en: 'Garden Potato', ar: 'بطاطا الحديقة' },
    description: { en: 'Fresh toppings and vibrant ingredients bring a lighter finish.', ar: 'مكونات طازجة وألوان نابضة للحفاظ على طعم خفيف ومريح.' },
    price: 12,
    image: '/items/1611741895475.jpg',
    available: true,
  },
  {
    id: 'p04',
    categoryId: 'pizza',
    name: { en: 'Classic Cheese Pizza', ar: 'بيتزا الجبنة الكلاسيكية' },
    description: { en: 'Golden crust, melted cheese, and a comforting, classic profile.', ar: 'قشرة ذهبية وجبنة ذائبة وطعم كلاسيكي مريح.' },
    price: 14,
    image: '/items/1611741895310.jpg',
    available: true,
  },
  {
    id: 'p05',
    categoryId: 'pizza',
    name: { en: 'Loaded Pizza Mix', ar: 'بيتزا المزيج اللودد' },
    description: { en: 'A stacked, indulgent pizza with layered flavor and a rich finish.', ar: 'بيتزا غنية تتضمن طبقات نكهات متنوعة مع لمسة نهائية مشبعة.' },
    price: 16,
    image: '/items/1611741895534.jpg',
    available: true,
  },
  {
    id: 'p06',
    categoryId: 'pizza',
    name: { en: 'Mushroom Supreme', ar: 'بيتزا المشروم سوبريم' },
    description: { en: 'Earthy mushrooms and savory notes crafted into a rich pizza experience.', ar: 'مشروم وملمس غني يضفي تجربة بيتزا متوازنة وراقية.' },
    price: 15,
    image: '/items/1615503114622.jpg',
    available: true,
  },
  {
    id: 'p07',
    categoryId: 'pizza',
    name: { en: 'Family Combo', ar: 'باقة العائلة' },
    description: { en: 'A combo built for sharing with signature comfort-food flavors.', ar: 'باقة تجمع بين المذاقات المميزة وتجربة مشاركة أصلية.' },
    price: 18,
    image: '/items/1615503114698.jpg',
    available: true,
  },
  {
    id: 'p08',
    categoryId: 'loaded-potatoes',
    name: { en: 'Crispy Side Plate', ar: 'طبق جانبي مقرمش' },
    description: { en: 'A quick, satisfying extra to round out your meal.', ar: 'إضافة خفيفة ومشبعة تكمل الوجبة بطريقة ممتعة.' },
    price: 7,
    image: '/items/1615503115214.jpg',
    available: true,
  },
  {
    id: 'p09',
    categoryId: 'loaded-potatoes',
    name: { en: 'Signature Extras', ar: 'إضافات مميزة' },
    description: { en: 'Small add-ons designed to enhance the main meal.', ar: 'إضافات صغيرة تضيف نكهة وتوازن للوجبة الرئيسية.' },
    price: 6,
    image: '/items/1615503115309.jpg',
    available: true,
  },
]

export const textContent = {
  en: {
    nav: {
      home: 'Home',
      menu: 'Menu',
      about: 'About',
      contact: 'Contact',
    },
    hero: {
      eyebrow: 'MR.KOMPRENO',
      title: 'Bold flavor. Big comfort.',
      subtitle: 'A modern digital menu celebrating loaded potatoes, pizza, and warm fast-casual comfort food.',
      primary: 'Browse menu',
      secondary: 'Contact us',
    },
    about: {
      eyebrow: 'About us',
      title: 'Comfort food with personality.',
      body: 'MR.KOMPRENO brings a vibrant, approachable food experience that balances bold ingredients, rich comfort, and a memorable brand character.',
      highlight: 'Made for sharing, made for cravings.',
    },
    menu: {
      eyebrow: 'Our menu',
      title: 'Signature favorites',
      priceLabel: 'USD',
      cta: 'View details',
    },
    contact: {
      eyebrow: 'Visit & connect',
      title: 'Find your next favorite bite.',
      phone: 'Phone',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      facebook: 'Facebook',
      button: 'Follow us',
      pending: 'To be confirmed',
    },
    footer: {
      designed: 'Digital experience by',
      provider: 'Our Studio',
      rights: 'All rights reserved',
    },
  },
  ar: {
    nav: {
      home: 'الرئيسية',
      menu: 'القائمة',
      about: 'من نحن',
      contact: 'تواصل',
    },
    hero: {
      eyebrow: 'MR.KOMPRENO',
      title: 'نكهة قوية. راحة كبيرة.',
      subtitle: 'قائمة رقمية حديثة تحتفي بالبطاطا المحمصة والبيتزا والطعام المريح والودود.',
      primary: 'تصفح القائمة',
      secondary: 'تواصل معنا',
    },
    about: {
      eyebrow: 'من نحن',
      title: 'طعام مريح بشخصية قوية.',
      body: 'تجمع MR.KOMPRENO تجربة طعام نابضة بالحياة وودودة مع مكونات غنية وطعم مريح وشخصية علامة تجارية لا تُنسى.',
      highlight: 'مصنوع للمشاركة، ومصنوع للشهيات.',
    },
    menu: {
      eyebrow: 'قائمتنا',
      title: 'المفضلات المميزة',
      priceLabel: 'دولار',
      cta: 'عرض التفاصيل',
    },
    contact: {
      eyebrow: 'تواصل معنا',
      title: 'اعثر على القطعة المفضلة التالية.',
      phone: 'الهاتف',
      whatsapp: 'واتساب',
      instagram: 'إنستغرام',
      facebook: 'فيسبوك',
      button: 'تابعنا',
      pending: 'سيتم التأكيد لاحقًا',
    },
    footer: {
      designed: 'تجربة رقمية من',
      provider: 'استوديونا',
      rights: 'جميع الحقوق محفوظة',
    },
  },
}

export const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/mrkompreno/', icon: 'simple-icons:instagram' },
  { label: 'Facebook', href: 'https://www.facebook.com/KOMPRENO.MR', icon: 'simple-icons:facebook' },
  { label: 'WhatsApp', href: 'https://wa.me/963955403020', icon: 'simple-icons:whatsapp' },
]
