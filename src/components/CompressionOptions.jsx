import React, { useEffect } from 'react';

const CompressionOptions = ({ options, onChange, settings }) => {
  // 如果有设置且组件初始化，应用设置的默认值
  useEffect(() => {
    if (settings && options) {
      // 只在初始化时应用设置，避免覆盖用户手动更改的值
      const initialOptions = { ...options };
      let needsUpdate = false;

      if (settings.defaultQuality !== undefined && initialOptions.quality === 75) {
        initialOptions.quality = settings.defaultQuality;
        needsUpdate = true;
      }

      if (settings.defaultMode !== undefined && initialOptions.mode === 'lossy') {
        initialOptions.mode = settings.defaultMode;
        needsUpdate = true;
      }

      if (settings.defaultFormat !== undefined && initialOptions.format === 'original') {
        initialOptions.format = settings.defaultFormat;
        needsUpdate = true;
      }

      if (needsUpdate && onChange) {
        onChange(initialOptions);
      }
    }
  }, [settings, onChange]);

  const handleQualityChange = (e) => {
    onChange({ ...options, quality: parseInt(e.target.value) });
  };

  const handleModeChange = (e) => {
    onChange({ ...options, mode: e.target.value });
  };

  const handleFormatChange = (e) => {
    onChange({ ...options, format: e.target.value });
  };

  return (
    <div className="compression-options">
      <h3>压缩设置:</h3>
      
      <div className="option-group">
        <label>压缩质量:</label>
        <div className="quality-slider">
          <span>低</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={options.quality} 
            onChange={handleQualityChange}
          />
          <span>高</span>
        </div>
        <div className="quality-value">{options.quality}%</div>
      </div>
      
      <div className="option-group">
        <label>压缩模式:</label>
        <div className="mode-radio">
          <label>
            <input 
              type="radio" 
              name="compression-mode" 
              value="lossy" 
              checked={options.mode === 'lossy'} 
              onChange={handleModeChange}
            />
            有损压缩
          </label>
          <label>
            <input 
              type="radio" 
              name="compression-mode" 
              value="lossless" 
              checked={options.mode === 'lossless'} 
              onChange={handleModeChange}
            />
            无损压缩
          </label>
        </div>
      </div>
      
      <div className="option-group">
        <label>输出格式:</label>
        <div className="format-select">
          <select value={options.format} onChange={handleFormatChange}>
            <option value="original">保持原格式</option>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CompressionOptions; 