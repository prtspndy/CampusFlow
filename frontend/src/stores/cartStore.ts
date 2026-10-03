import { create } from 'zustand'
import type { OrderItem, ProductSize } from '../types/models'

export interface CartItem extends OrderItem {
  image?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (productId: string, size: ProductSize) => void
  updateQuantity: (productId: string, size: ProductSize, quantity: number) => void
  clearCart: () => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  totalAmount: () => number
  totalItems: () => number
}

const STORAGE_KEY = 'campusflow_cart'

export const useCartStore = create<CartState>((set, get) => {
  let initialItems: CartItem[] = []
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        initialItems = JSON.parse(saved)
      } catch {
        initialItems = []
      }
    }
  }

  const persist = (items: CartItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  return {
    items: initialItems,
    isOpen: false,
    addItem: (newItem) => {
      set((state) => {
        const existingIndex = state.items.findIndex(
          (i) => i.productId === newItem.productId && i.size === newItem.size
        )
        let updated: CartItem[]
        if (existingIndex > -1) {
          updated = [...state.items]
          updated[existingIndex].quantity += newItem.quantity
        } else {
          updated = [...state.items, newItem]
        }
        persist(updated)
        return { items: updated, isOpen: true }
      })
    },
    removeItem: (productId, size) => {
      set((state) => {
        const updated = state.items.filter(
          (i) => !(i.productId === productId && i.size === size)
        )
        persist(updated)
        return { items: updated }
      })
    },
    updateQuantity: (productId, size, quantity) => {
      set((state) => {
        if (quantity <= 0) {
          const updated = state.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          )
          persist(updated)
          return { items: updated }
        }
        const updated = state.items.map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity }
            : item
        )
        persist(updated)
        return { items: updated }
      })
    },
    clearCart: () => {
      persist([])
      set({ items: [] })
    },
    setOpen: (isOpen) => set({ isOpen }),
    toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
    totalAmount: () => {
      return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    },
    totalItems: () => {
      return get().items.reduce((sum, item) => sum + item.quantity, 0)
    },
  }
})
