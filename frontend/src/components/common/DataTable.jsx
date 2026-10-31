import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState.jsx';
import Button from './Button.jsx';

export function DataTable({
  columns = [],
  data = [],
  searchKey = '',
  searchPlaceholder = 'Search records...',
  pageSize = 8,
  emptyMessage = 'No records found'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchKey && item[searchKey]) {
        return String(item[searchKey]).toLowerCase().includes(term);
      }
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <div className="table-search-input">
          <Search className="table-search-icon" />
          <input
            type="text"
            className="form-input"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredData.length}</strong> entries
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={col.width ? { width: col.width } : {}}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render
                        ? col.render(row)
                        : row[col.accessor] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: '2rem' }}>
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              icon={ChevronLeft}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              icon={ChevronRight}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
