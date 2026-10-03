import React from 'react';

const SkeletonLoader = ({ type = 'table', count = 5, className = '' }) => {
  if (type === 'card') {
    return (
      <div className={`row g-3 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-xl-3">
            <div className="cf-card p-4 h-100 placeholder-glow">
              <div className="d-flex justify-content-between mb-3">
                <span className="placeholder col-6 bg-light rounded" style={{ height: '14px' }} />
                <span className="placeholder rounded-circle bg-light" style={{ width: '40px', height: '40px' }} />
              </div>
              <span className="placeholder col-8 bg-light rounded mb-3" style={{ height: '28px' }} />
              <div className="border-top pt-2">
                <span className="placeholder col-4 bg-light rounded" style={{ height: '12px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`cf-card p-0 overflow-hidden ${className}`}>
        <div className="table-responsive">
          <table className="cf-table placeholder-glow w-100 mb-0">
            <thead>
              <tr>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <th key={idx}>
                    <span className="placeholder col-8 bg-secondary bg-opacity-10 rounded" style={{ height: '14px', display: 'inline-block' }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {Array.from({ length: 5 }).map((_, colIdx) => (
                    <td key={colIdx}>
                      <span
                        className="placeholder bg-light rounded"
                        style={{
                          width: `${50 + (colIdx * 12) % 40}%`,
                          height: '16px',
                          display: 'inline-block'
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={`placeholder-glow ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <p key={idx} className="placeholder col-12 bg-light rounded mb-2" style={{ height: '16px' }} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
