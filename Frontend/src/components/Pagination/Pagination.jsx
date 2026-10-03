import React from 'react';

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;

    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 p-3 border-top border-light-subtle bg-white">
      {/* Summary & Page Size */}
      <div className="d-flex align-items-center gap-3 text-muted small">
        <span>
          Showing <strong className="text-dark">{startItem}</strong> to{' '}
          <strong className="text-dark">{endItem}</strong> of{' '}
          <strong className="text-dark">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="d-flex align-items-center gap-1 ms-2">
            <span>Show</span>
            <select
              className="form-select form-select-sm py-0 px-2"
              style={{ width: 'auto' }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <nav aria-label="Table pagination">
        <ul className="pagination pagination-sm mb-0 gap-1">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link rounded border-0 text-secondary"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous"
            >
              <i className="bi bi-chevron-left" />
            </button>
          </li>

          {getPageNumbers().map((num) => (
            <li
              key={num}
              className={`page-item ${num === currentPage ? 'active' : ''}`}
            >
              <button
                className={`page-link rounded border-0 ${
                  num === currentPage
                    ? 'bg-primary text-white fw-semibold'
                    : 'text-secondary'
                }`}
                onClick={() => onPageChange(num)}
              >
                {num}
              </button>
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link rounded border-0 text-secondary"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
