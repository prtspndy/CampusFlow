import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import Button from '../../components/Buttons/Button';
import Badge from '../../components/Cards/Badge';
import StatusChip from '../../components/Cards/StatusChip';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import TextareaField from '../../components/Forms/TextareaField';
import SearchBox from '../../components/Forms/SearchBox';
import { MOCK_MERCHANDISE } from '../../constants/mockData';
import { showSuccessToast, showDeleteConfirm } from '../../components/Modal/confirmDialog';

const Merchandise = () => {
  const [products, setProducts] = useState(MOCK_MERCHANDISE);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'Apparel',
    memberPrice: 35,
    regularPrice: 45,
    stock: 50,
    sizes: 'S, M, L, XL',
    colors: 'Navy Blue, Charcoal',
    description: '',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400',
  });

  const handleAddNew = () => {
    setFormData({
      id: `MRCH-0${products.length + 1}`,
      name: '',
      category: 'Apparel',
      memberPrice: 30,
      regularPrice: 40,
      stock: 50,
      sizes: 'S, M, L, XL',
      colors: 'Black, White',
      description: '',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (prod) => {
    setFormData({
      ...prod,
      sizes: Array.isArray(prod.sizes) ? prod.sizes.join(', ') : prod.sizes,
      colors: Array.isArray(prod.colors) ? prod.colors.join(', ') : prod.colors,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (prod) => {
    const confirmed = await showDeleteConfirm(`product "${prod.name}"`);
    if (confirmed) {
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      showSuccessToast(`${prod.name} removed from inventory`);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const parsedSizes = typeof formData.sizes === 'string'
      ? formData.sizes.split(',').map((s) => s.trim()).filter(Boolean)
      : formData.sizes;
    const parsedColors = typeof formData.colors === 'string'
      ? formData.colors.split(',').map((c) => c.trim()).filter(Boolean)
      : formData.colors;

    const updatedItem = {
      ...formData,
      sizes: parsedSizes,
      colors: parsedColors,
    };

    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === formData.id);
      if (idx >= 0) {
        const list = [...prev];
        list[idx] = updatedItem;
        return list;
      }
      return [updatedItem, ...prev];
    });

    showSuccessToast('Merchandise item saved successfully');
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="merchandise-page">
      <Breadcrumb
        items={[{ label: 'Store & Operations' }, { label: 'Merchandise' }]}
        title="Club Merchandise & Apparel Catalog"
        actionButton={
          <Button variant="primary" size="sm" icon="bi-bag-plus-fill" onClick={handleAddNew}>
            Add Product
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="cf-card p-3 mb-4 bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <select
            className="cf-select text-xs py-1.5 px-3"
            style={{ width: 'auto' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Apparel">Apparel</option>
            <option value="Headwear">Headwear</option>
            <option value="Accessories">Accessories</option>
            <option value="Stickers">Stickers</option>
          </select>
        </div>

        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search products or SKU..."
          className="ms-auto"
        />
      </div>

      {/* Product Cards Grid */}
      <div className="row g-4 mb-4">
        {filteredProducts.map((prod) => {
          const isLowStock = prod.stock <= 30;
          return (
            <div key={prod.id} className="col-12 col-sm-6 col-xl-4">
              <div className="cf-card cf-card-hover h-100 overflow-hidden d-flex flex-column">
                <div className="position-relative bg-light" style={{ height: '220px' }}>
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-100 h-100 object-fit-cover"
                  />
                  <span className="position-absolute top-0 start-0 m-3 badge bg-white bg-opacity-90 text-dark shadow-sm">
                    {prod.category}
                  </span>
                  <span className="position-absolute top-0 end-0 m-3">
                    <StatusChip status={isLowStock ? 'Low Stock' : 'In Stock'} />
                  </span>
                </div>

                <div className="p-4 d-flex flex-column flex-grow-1">
                  <h5 className="fw-bold text-dark mb-1 fs-6">{prod.name}</h5>
                  <p className="text-muted small mb-3 line-clamp-2">{prod.description}</p>

                  {/* Pricing Details */}
                  <div className="d-flex align-items-baseline gap-2 mb-3">
                    <span className="fs-5 fw-bold text-primary">${prod.memberPrice}</span>
                    <span className="text-xs text-muted">Member Price</span>
                    <span className="text-muted small text-decoration-line-through ms-2">
                      ${prod.regularPrice}
                    </span>
                  </div>

                  {/* Sizes badges */}
                  <div className="mb-3">
                    <span className="text-xs text-muted d-block mb-1">Available Sizes:</span>
                    <div className="d-flex flex-wrap gap-1">
                      {prod.sizes.map((s, idx) => (
                        <span key={idx} className="badge bg-light text-dark border px-2 py-0.5 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Inventory count & card actions */}
                  <div className="mt-auto pt-3 border-top border-light-subtle d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-xs text-muted d-block">Stock Level</span>
                      <strong className={`small ${isLowStock ? 'text-danger' : 'text-success'}`}>
                        {prod.stock} units remaining
                      </strong>
                    </div>

                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border p-1.5 text-secondary"
                        title="Edit Product"
                        onClick={() => handleEdit(prod)}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border p-1.5 text-danger"
                        title="Delete Product"
                        onClick={() => handleDelete(prod)}
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id && products.some((p) => p.id === formData.id) ? 'Edit Merchandise Product' : 'Add New Merchandise Item'}
        subtitle="Manage inventory stocks, pricing tiers, and sizing matrix"
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Merchandise
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <InputField
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Skyline Varsity Heavyweight Hoodie"
            required
          />

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <SelectField
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={['Apparel', 'Headwear', 'Accessories', 'Stickers', 'Drinkware']}
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Stock Quantity"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <InputField
                label="Member Discounted Price ($)"
                type="number"
                value={formData.memberPrice}
                onChange={(e) => setFormData({ ...formData, memberPrice: Number(e.target.value) })}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Regular Non-Member Price ($)"
                type="number"
                value={formData.regularPrice}
                onChange={(e) => setFormData({ ...formData, regularPrice: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <InputField
            label="Available Sizes (Comma-separated)"
            value={formData.sizes}
            onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
            placeholder="S, M, L, XL, 2XL"
          />

          <TextareaField
            label="Product Description & Material"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe fleece fabric, embroidery, washing directions..."
          />
        </form>
      </Modal>
    </div>
  );
};

export default Merchandise;
