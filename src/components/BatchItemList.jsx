import React from 'react';

const BatchItemList = ({ 
  images, 
  onRemove, 
  onPreview, 
  onToggleSelect,
  processingIndex = -1, 
  showStatus = false, 
  showResults = false,
  readonly = false
}) => {
  // 处理打开图片
  const handleOpenImage = (imagePath) => {
    if (window.electronAPI && window.electronAPI.openFile) {
      window.electronAPI.openFile(imagePath);
    } else {
      console.log('打开图片文件:', imagePath);
    }
  };

  // 获取图片文件类型
  const getFileType = (fileName) => {
    if (!fileName) return 'unknown';
    const extension = fileName.split('.').pop().toLowerCase();
    return extension || 'unknown';
  };

  // 获取图片状态标签
  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return '等待';
      case 'processing': return '处理中...';
      case 'completed': return '✓ 完成';
      case 'error': return '❌ 错误';
      case 'skipped': return '已跳过';
      default: return status;
    }
  };

  // 渲染文件大小
  const renderFileSize = (size, defaultValue = '-') => {
    if (!size || size === '-' || size === '未知') {
      return defaultValue;
    }
    
    if (typeof size === 'number') {
      return `${size.toFixed(2)} MB`;
    }
    
    // 如果是字符串但已经包含单位，直接返回
    if (typeof size === 'string' && size.includes('MB')) {
      return size;
    }
    
    // 尝试解析数字字符串
    const numValue = parseFloat(size);
    if (!isNaN(numValue)) {
      return `${numValue.toFixed(2)} MB`;
    }
    
    return defaultValue;
  };

  // 渲染压缩比例
  const renderCompressionRatio = (image) => {
    if (!image.compressionRatio || image.compressionRatio === '-') {
      return '--';
    }
    
    // 尝试将compressionRatio转换为数字
    const ratio = typeof image.compressionRatio === 'number' 
      ? image.compressionRatio 
      : parseInt(image.compressionRatio, 10);
    
    if (isNaN(ratio)) {
      return '--';
    }
    
    return `~${ratio}%`;
  };

  return (
    <div className="batch-item-list">
      <table className="batch-table">
        <thead>
          <tr>
            {!readonly && !showResults && <th className="select-col">选择</th>}
            <th className="filename-col">文件名</th>
            <th className="size-col">原始大小</th>
            {showResults && <th className="size-col">新大小</th>}
            <th className="type-col">类型</th>
            {showStatus && <th className="status-col">状态</th>}
            {showResults && <th className="ratio-col">减少比例</th>}
            <th className="actions-col">操作</th>
          </tr>
        </thead>
        <tbody>
          {images.map((image, index) => (
            <tr 
              key={image.id || index} 
              className={`batch-item ${processingIndex === index ? 'processing' : ''} ${image.status}`}
            >
              {!readonly && !showResults && (
                <td className="select-col">
                  <input 
                    type="checkbox" 
                    checked={image.selected} 
                    onChange={() => onToggleSelect && onToggleSelect(index)}
                    className="image-select-checkbox"
                  />
                </td>
              )}
              <td className="filename-col">{image.name || `图片 ${index + 1}`}</td>
              <td className="size-col">{renderFileSize(image.originalSize, '未知')}</td>
              {showResults && <td className="size-col">{renderFileSize(image.compressedSize, '-')}</td>}
              <td className="type-col">{getFileType(image.name)}</td>
              {showStatus && <td className="status-col">{getStatusLabel(image.status)}</td>}
              {showResults && <td className="ratio-col">{renderCompressionRatio(image)}</td>}
              <td className="actions-col">
                <button 
                  className="preview-button"
                  onClick={() => onPreview && onPreview(index)}
                >
                  预览
                </button>
                
                {showResults && image.path && (
                  <button 
                    className="open-button"
                    onClick={() => handleOpenImage(image.path)}
                  >
                    打开
                  </button>
                )}
                
                {!readonly && !showResults && (
                  <button 
                    className="remove-button"
                    onClick={() => onRemove && onRemove(index)}
                  >
                    移除
                  </button>
                )}
              </td>
            </tr>
          ))}
          {images.length === 0 && (
            <tr>
              <td colSpan={showResults || showStatus ? 7 : 5} className="no-images">
                没有图片，请添加要处理的图片
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BatchItemList; 