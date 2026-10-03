import React, { useState, useMemo } from 'react';
import SearchBox from '../Forms/SearchBox';
import Button from '../Buttons/Button';
import Pagination from '../Pagination/Pagination';
import SkeletonLoader from '../Loader/SkeletonLoader';
import EmptyState from '../Cards/EmptyState';
import { showSuccessToast } from '../Modal/confirmDialog';

const DataTable = ({
  columns = [],
  data = [],
  title,
  subtitle,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  filterComponent,
  headerActions,
  onView,
  onEdit,
  onDelete,
  exportFileName = 'export',
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match your search or filter criteria.',
  defaultPageSize = 10,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter & Search
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) => {
        if (searchKeys.length > 0) {
          return searchKeys.some((k) =>
            String(row[k] || '').toLowerCase().includes(term)
          );
        }
        return Object.values(row).some((val) =>
          String(val || '').toLowerCase().includes(term)
        );
      });
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortConfig.direction === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, searchTerm, searchKeys, sortConfig]);

  // Pagination slicing
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Export mock action
  const handleExport = () => {
    showSuccessToast(`Exported ${filteredData.length} records as CSV (${exportFileName}.csv)`);
  };

  const hasRowActions = Boolean(onView || onEdit || onDelete);

  return (
    <div className="cf-card overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-3 px-4 border-bottom border-light-subtle d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 bg-white">
        <div>
          {title && <h5 className="mb-0 fw-bold fs-6 text-dark">{title}</h5>}
          {subtitle && <p className="mb-0 text-muted small">{subtitle}</p>}
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {filterComponent}
          <SearchBox
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            size="sm"
          />
          <Button
            variant="outline"
            size="sm"
            icon="bi-download"
            onClick={handleExport}
            title="Export CSV"
          >
            Export
          </Button>
          {headerActions}
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <SkeletonLoader type="table" count={5} />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon="bi-folder2-open"
          actionLabel={searchTerm ? 'Clear Search' : undefined}
          onAction={searchTerm ? () => setSearchTerm('') : undefined}
        />
      ) : (
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                {columns.map((col) => {
                  const isSorted = sortConfig.key === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      style={{
                        cursor: col.sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        width: col.width || 'auto',
                      }}
                    >
                      <div className="d-flex align-items-center gap-1">
                        <span>{col.label}</span>
                        {col.sortable && (
                          <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>
                            {isSorted ? (
                              sortConfig.direction === 'asc' ? (
                                <i className="bi bi-sort-up text-primary fw-bold" />
                              ) : (
                                <i className="bi bi-sort-down text-primary fw-bold" />
                              )
                            ) : (
                              <i className="bi bi-arrow-down-up opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {hasRowActions && <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={row.id || idx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {hasRowActions && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="d-inline-flex align-items-center gap-1">
                        {onView && (
                          <button
                            type="button"
                            className="btn btn-sm btn-light border-0 text-primary p-1"
                            title="View Details"
                            onClick={() => onView(row)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            className="btn btn-sm btn-light border-0 text-secondary p-1"
                            title="Edit"
                            onClick={() => onEdit(row)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className="btn btn-sm btn-light border-0 text-danger p-1"
                            title="Delete"
                            onClick={() => onDelete(row)}
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && filteredData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};

export default DataTable;
