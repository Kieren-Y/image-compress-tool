import React from 'react';

const BatchResultSummary = ({ stats }) => {
  return (
    <div className="batch-result-summary">
      <div className="summary-box">
        <div className="summary-title">处理完成!</div>
        <div className="summary-content">
          <ul className="summary-list">
            <li>• 总处理: {stats.totalCount}张图片</li>
            <li>• 总原始大小: {stats.totalOriginalSize}</li>
            <li>• 总压缩后大小: {stats.totalCompressedSize}</li>
            <li>• 平均压缩率: {stats.totalCompressionRatio}</li>
            <li>• 处理用时: {stats.processingTime}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BatchResultSummary; 