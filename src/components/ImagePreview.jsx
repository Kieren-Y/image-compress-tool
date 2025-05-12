import React, { useState, useEffect } from 'react';

const ImagePreview = ({ image, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 重置状态当图片变化时
    setIsLoading(true);
    setZoom(1);
  }, [image]);

  // 处理图片加载完成
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // 放大
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3)); // 最大放大3倍
  };

  // 缩小
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5)); // 最小缩小到0.5倍
  };

  // 重置缩放
  const handleResetZoom = () => {
    setZoom(1);
  };

  // 点击背景关闭
  const handleBackgroundClick = (e) => {
    if (e.target.classList.contains('preview-overlay')) {
      onClose();
    }
  };

  // 阻止图片点击冒泡
  const handleImageClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="preview-overlay" 
      onClick={handleBackgroundClick}
    >
      <div className="preview-container" onClick={handleImageClick}>
        <div className="preview-header">
          <div className="preview-title">{image.name || '图片预览'}</div>
          <div className="preview-controls">
            <button onClick={handleZoomOut} className="zoom-button">缩小 -</button>
            <button onClick={handleResetZoom} className="zoom-button">实际大小 1:1</button>
            <button onClick={handleZoomIn} className="zoom-button">放大 +</button>
            <button onClick={onClose} className="close-button">关闭 ×</button>
          </div>
        </div>
        
        <div className="preview-image-container">
          {isLoading && <div className="preview-loading">加载中...</div>}
          
          <div className="preview-image" style={{ transform: `scale(${zoom})` }}>
            <img 
              src={image.processedPreview || image.preview} 
              alt={image.name || '预览图片'} 
              onLoad={handleImageLoad}
            />
          </div>
        </div>
        
        {image.status === 'completed' && (
          <div className="preview-info">
            <div className="info-item">
              <span className="info-label">原始大小:</span>
              <span>{image.originalSize}</span>
            </div>
            <div className="info-item">
              <span className="info-label">压缩后大小:</span>
              <span>{image.compressedSize}</span>
            </div>
            <div className="info-item">
              <span className="info-label">压缩率:</span>
              <span>{typeof image.compressionRatio === 'number' ? `${image.compressionRatio}%` : image.compressionRatio}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreview; 