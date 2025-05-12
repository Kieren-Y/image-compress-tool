import React, { useState, useRef } from 'react';

const ComparisonView = ({ originalImage, compressedImage, originalSize, compressedSize, qualityFactor }) => {
  const [viewMode, setViewMode] = useState('split'); // 'split' 或 'slider'
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (viewMode === 'slider' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, position)));
    }
  };

  const renderImage = (src, alt) => {
    if (!src) {
      return <div className="no-image">图片不可用</div>;
    }
    return <img src={src} alt={alt} />;
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'split' ? 'slider' : 'split');
  };

  // 计算显示的压缩百分比
  const getCompressedPercentage = () => {
    if (qualityFactor !== undefined) {
      return Math.round(qualityFactor * 100);
    }
    
    try {
      // 提取数字部分
      const origSizeStr = originalSize.replace(/[^\d.]/g, '');
      const compSizeStr = compressedSize.replace(/[^\d.]/g, '');
      
      const origSize = parseFloat(origSizeStr);
      const compSize = parseFloat(compSizeStr);
      
      if (isNaN(origSize) || isNaN(compSize) || origSize === 0) {
        return 0;
      }
      
      return Math.round((compSize / origSize) * 100);
    } catch (e) {
      console.error('计算压缩率时出错:', e);
      return 0;
    }
  };

  // 分屏视图
  if (viewMode === 'split') {
    return (
      <div className="comparison-container-split">
        <div className="view-mode-toggle">
          <button onClick={toggleViewMode}>切换到滑块视图</button>
        </div>
        
        <div className="comparison-split">
          <div className="split-image-container">
            <div className="split-image">
              {renderImage(originalImage, "原始图片")}
            </div>
            <div className="split-label">
              <h4>原始图片</h4>
              <p>{originalSize} (100%)</p>
            </div>
          </div>
          
          <div className="split-divider"></div>
          
          <div className="split-image-container">
            <div className="split-image">
              {renderImage(compressedImage, "压缩后图片")}
            </div>
            <div className="split-label">
              <h4>压缩后图片</h4>
              <p>{compressedSize} ({getCompressedPercentage()}%)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 滑块视图
  return (
    <div 
      className="comparison-container" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      <div className="view-mode-toggle">
        <button onClick={toggleViewMode}>切换到分屏视图</button>
      </div>
      
      <div className="comparison-image original">
        {renderImage(originalImage, "原始图片")}
        <div className="image-label">{originalSize}</div>
      </div>
      
      <div 
        className="comparison-image compressed" 
        style={{ width: `${sliderPosition}%` }}
      >
        {renderImage(compressedImage, "压缩后图片")}
        <div className="image-label">{compressedSize}</div>
      </div>
      
      <div 
        className="comparison-slider"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="slider-handle"></div>
      </div>
    </div>
  );
};

export default ComparisonView; 