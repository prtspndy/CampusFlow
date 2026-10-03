import React, { useEffect, useState } from 'react'
import { PackagePlus, Save } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/forms/FormField'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { formatMoney } from '../../../lib/format'
import { api, isApiError } from '../../../lib/api'
import type { Product } from '../../../types/models'
import type { ProductSize } from '../../../types/enums'

const SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

type StockRow = { size: ProductSize; stock: number; expectedStock: number }
type EditableProduct = Omit<Product, 'sizes'> & { sizes: StockRow[] }

function withBaseline(product: Product): EditableProduct {
  return {
    ...product,
    sizes: product.sizes.map((size) => ({
      size: size.size,
      stock: size.stock,
      expectedStock: size.stock,
    })),
  }
}

export const AdminStockPage: React.FC = () => {
  const [products, setProducts] = useState<EditableProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Apparel',
    sku: '',
    memberPrice: '800',
    standardPrice: '1000',
    stock: '10',
  })

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get<{ products: Product[] }>('/products?limit=100&status=ACTIVE')
      .then((data) => setProducts(data.products.map(withBaseline)))
      .catch((err: unknown) => setError(isApiError(err) ? err.message : 'Inventory could not be loaded.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const saveStock = async (product: EditableProduct) => {
    setSavingId(product.id)
    setNotice(null)
    setError(null)
    try {
      for (const size of product.sizes) {
        if (size.stock === size.expectedStock) continue
        await api.patch(`/products/${product.id}/stock`, {
          size: size.size,
          stock: size.stock,
          expectedStock: size.expectedStock,
        })
      }
      setNotice(`${product.name} stock saved.`)
      load()
    } catch (err: unknown) {
      if (isApiError(err) && err.code === 'STOCK_CONFLICT') {
        setError(`${err.message} The quantities on screen were reloaded.`)
        load()
        return
      }
      setError(isApiError(err) ? err.message : 'Stock could not be saved.')
    } finally {
      setSavingId(null)
    }
  }

  const createProduct = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await api.post('/products', {
        name: form.name,
        description: form.description,
        category: form.category,
        sku: form.sku || undefined,
        memberPrice: Number(form.memberPrice),
        standardPrice: Number(form.standardPrice),
        variants: SIZES.map((size) => ({ size, stock: Number(form.stock) || 0 })),
      })
      setForm({ ...form, name: '', description: '', sku: '' })
      setNotice('Product created.')
      load()
    } catch (err: unknown) {
      setError(isApiError(err) ? err.message : 'Product could not be created.')
    } finally {
      setCreating(false)
    }
  }

  const deactivate = async (productId: string) => {
    await api.patch(`/products/${productId}`, { status: 'INACTIVE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-mint-deep)]">
          Merchandise Management
        </span>
        <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
          Inventory & Size Stock
        </h1>
      </div>

      {notice && <p className="text-body-sm text-[var(--color-success)]">{notice}</p>}
      {error && <p className="text-body-sm text-[var(--color-error)]">{error}</p>}

      <form onSubmit={(event) => void createProduct(event)} className="rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-6 space-y-4">
        <h2 className="text-heading-3 font-display font-bold flex items-center gap-2">
          <PackagePlus className="w-4 h-4" /> Add product
        </h2>
        <FormField label="Name" htmlFor="product-name" required>
          <Input id="product-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </FormField>
        <FormField label="Description" htmlFor="product-description" required>
          <Input id="product-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </FormField>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FormField label="Category" htmlFor="product-category">
            <Input id="product-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </FormField>
          <FormField label="SKU" htmlFor="product-sku">
            <Input id="product-sku" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
          </FormField>
          <FormField label="Member price (INR)" htmlFor="member-price">
            <Input id="member-price" type="number" min="0" value={form.memberPrice} onChange={(event) => setForm({ ...form, memberPrice: event.target.value })} />
          </FormField>
          <FormField label="Standard price (INR)" htmlFor="standard-price">
            <Input id="standard-price" type="number" min="0" value={form.standardPrice} onChange={(event) => setForm({ ...form, standardPrice: event.target.value })} />
          </FormField>
        </div>
        <Button type="submit" variant="primary" disabled={creating}>
          {creating ? 'Creating…' : 'Create product'}
        </Button>
      </form>

      {loading && <p className="text-body-md text-[var(--color-muted)]">Loading inventory…</p>}
      {!loading && products.length === 0 && (
        <EmptyState icon={<PackagePlus className="w-6 h-6" />} title="No active products" description="Create a product to start selling." />
      )}

      <div className="space-y-6">
        {products.map((product) => (
          <div key={product.id} className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-heading-3 font-display font-bold">{product.name}</h3>
                <p className="text-caption text-[var(--color-muted)]">
                  Standard: {formatMoney(product.standardPrice)} · Member: {formatMoney(product.memberPrice)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => void deactivate(product.id)}>Deactivate</Button>
                <Button variant="primary" disabled={savingId === product.id} onClick={() => void saveStock(product)}>
                  <Save className="w-4 h-4" /> {savingId === product.id ? 'Saving…' : 'Save quantities'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {product.sizes.map((size) => (
                <label key={size.size} className="p-3 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-hairline)] text-center space-y-2">
                  <span className="text-body-sm font-bold">Size {size.size}</span>
                  <input
                    type="number"
                    min="0"
                    value={size.stock}
                    onChange={(event) => {
                      const stock = Math.max(0, Number(event.target.value) || 0)
                      setProducts((current) =>
                        current.map((entry) =>
                          entry.id === product.id
                            ? {
                                ...entry,
                                sizes: entry.sizes.map((row): StockRow =>
                                  row.size === size.size ? { size: row.size, stock, expectedStock: row.expectedStock } : row,
                                ),
                              }
                            : entry,
                        ),
                      )
                    }}
                    className="w-16 h-9 text-center font-mono font-bold rounded-[8px] border border-[var(--color-hairline-strong)]"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
