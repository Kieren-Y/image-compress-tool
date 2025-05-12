import React, { useState, useEffect } from 'react';

const Settings = ({ onBack, initialSettings, onSaveSettings, theme }) => {
  const [settings, setSettings] = useState({
    general: {
      language: 'zh-CN',
      theme: theme || 'dark',
      cachePath: '/Users/username/AppData/Local/ImageCompressor/Cache',
      clearCacheOnExit: false,
      checkUpdatesOnStart: true
    },
    compression: {
      defaultQuality: 75,
      defaultMode: 'lossy',
      defaultFormat: 'original',
      keepExif: true,
      autoSave: false,
      addCompressedSuffix: true
    },
    performance: {
      parallelProcessing: 4,
      memoryLimit: 500,
      processingPriority: 'medium'
    }
  });

  // 当初始设置或主题变更时更新状态
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    } else if (theme) {
      setSettings(prev => ({
        ...prev,
        general: {
          ...prev.general,
          theme
        }
      }));
    }
  }, [initialSettings, theme]);

  // 处理设置更改的函数
  const handleChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // 保存设置
  const handleSave = () => {
    if (onSaveSettings) {
      onSaveSettings(settings);
    }
    alert('设置已保存');
  };

  // 恢复默认设置
  const handleResetDefaults = () => {
    if (window.confirm('确定要恢复所有设置为默认值吗？这将覆盖您当前的所有设置。')) {
      setSettings({
        general: {
          language: 'zh-CN',
          theme: 'light',
          cachePath: '/Users/username/AppData/Local/ImageCompressor/Cache',
          clearCacheOnExit: false,
          checkUpdatesOnStart: true
        },
        compression: {
          defaultQuality: 75,
          defaultMode: 'lossy',
          defaultFormat: 'original',
          keepExif: true,
          autoSave: false,
          addCompressedSuffix: true
        },
        performance: {
          parallelProcessing: 4,
          memoryLimit: 500,
          processingPriority: 'medium'
        }
      });
    }
  };

  // 浏览文件夹
  const handleBrowseFolder = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        const directory = await window.electronAPI.selectDirectory();
        if (directory) {
          handleChange('general', 'cachePath', directory);
        }
      } else {
        alert('此功能需要Electron API支持');
      }
    } catch (error) {
      console.error('选择目录出错:', error);
    }
  };

  return (
    <div className="settings-container">
      <div className="top-nav">
        <h2>设置</h2>
        <button onClick={onBack} className="back-button">返回 ←</button>
      </div>

      <div className="settings-content">
        {/* 通用设置 */}
        <div className="settings-section">
          <h3>【 通用设置 】</h3>

          <div className="setting-group">
            <label>语言:</label>
            <select 
              value={settings.general.language} 
              onChange={(e) => handleChange('general', 'language', e.target.value)}
            >
              <option value="zh-CN">中文 (简体)</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          <div className="setting-group">
            <label>主题:</label>
            <div className="radio-options">
              <label>
                <input 
                  type="radio" 
                  name="theme" 
                  value="light"
                  checked={settings.general.theme === 'light'} 
                  onChange={() => handleChange('general', 'theme', 'light')}
                />
                浅色
              </label>
              <label>
                <input 
                  type="radio" 
                  name="theme" 
                  value="dark"
                  checked={settings.general.theme === 'dark'} 
                  onChange={() => handleChange('general', 'theme', 'dark')}
                />
                深色
              </label>
              <label>
                <input 
                  type="radio" 
                  name="theme" 
                  value="system"
                  checked={settings.general.theme === 'system'} 
                  onChange={() => handleChange('general', 'theme', 'system')}
                />
                跟随系统
              </label>
            </div>
          </div>

          <div className="setting-group">
            <label>缓存位置:</label>
            <div className="path-input">
              <input 
                type="text" 
                value={settings.general.cachePath} 
                onChange={(e) => handleChange('general', 'cachePath', e.target.value)}
                readOnly
              />
              <button onClick={handleBrowseFolder}>浏览...</button>
            </div>
          </div>

          <div className="setting-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={settings.general.clearCacheOnExit} 
                onChange={(e) => handleChange('general', 'clearCacheOnExit', e.target.checked)}
              />
              退出时清除缓存
            </label>
          </div>

          <div className="setting-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={settings.general.checkUpdatesOnStart} 
                onChange={(e) => handleChange('general', 'checkUpdatesOnStart', e.target.checked)}
              />
              启动时检查更新
            </label>
          </div>
        </div>

        {/* 压缩设置 */}
        <div className="settings-section">
          <h3>【 压缩设置 】</h3>

          <div className="setting-group">
            <label>默认压缩质量:</label>
            <div className="quality-slider">
              <span>低</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.compression.defaultQuality} 
                onChange={(e) => handleChange('compression', 'defaultQuality', parseInt(e.target.value))}
              />
              <span>高</span>
            </div>
            <div className="quality-value">{settings.compression.defaultQuality}%</div>
          </div>

          <div className="setting-group">
            <label>默认压缩模式:</label>
            <div className="radio-options">
              <label>
                <input 
                  type="radio" 
                  name="compress-mode" 
                  value="lossy"
                  checked={settings.compression.defaultMode === 'lossy'} 
                  onChange={() => handleChange('compression', 'defaultMode', 'lossy')}
                />
                有损压缩 (平衡大小和质量)
              </label>
              <label>
                <input 
                  type="radio" 
                  name="compress-mode" 
                  value="lossless"
                  checked={settings.compression.defaultMode === 'lossless'} 
                  onChange={() => handleChange('compression', 'defaultMode', 'lossless')}
                />
                无损压缩 (保持原始质量)
              </label>
            </div>
          </div>

          <div className="setting-group">
            <label>默认输出格式:</label>
            <select 
              value={settings.compression.defaultFormat} 
              onChange={(e) => handleChange('compression', 'defaultFormat', e.target.value)}
            >
              <option value="original">原格式保持</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div className="setting-group">
            <label>高级设置:</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.compression.keepExif} 
                  onChange={(e) => handleChange('compression', 'keepExif', e.target.checked)}
                />
                保留EXIF元数据
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.compression.autoSave} 
                  onChange={(e) => handleChange('compression', 'autoSave', e.target.checked)}
                />
                处理完成后自动保存
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.compression.addCompressedSuffix} 
                  onChange={(e) => handleChange('compression', 'addCompressedSuffix', e.target.checked)}
                />
                在文件名后添加压缩标识
              </label>
            </div>
          </div>
        </div>

        {/* 性能设置 */}
        <div className="settings-section">
          <h3>【 性能设置 】</h3>

          <div className="setting-group">
            <label>并行处理数量:</label>
            <div className="radio-options horizontal">
              <label>
                <input 
                  type="radio" 
                  name="parallel" 
                  value="1"
                  checked={settings.performance.parallelProcessing === 1} 
                  onChange={() => handleChange('performance', 'parallelProcessing', 1)}
                />
                1
              </label>
              <label>
                <input 
                  type="radio" 
                  name="parallel" 
                  value="2"
                  checked={settings.performance.parallelProcessing === 2} 
                  onChange={() => handleChange('performance', 'parallelProcessing', 2)}
                />
                2
              </label>
              <label>
                <input 
                  type="radio" 
                  name="parallel" 
                  value="4"
                  checked={settings.performance.parallelProcessing === 4} 
                  onChange={() => handleChange('performance', 'parallelProcessing', 4)}
                />
                4
              </label>
              <label>
                <input 
                  type="radio" 
                  name="parallel" 
                  value="8"
                  checked={settings.performance.parallelProcessing === 8} 
                  onChange={() => handleChange('performance', 'parallelProcessing', 8)}
                />
                8
              </label>
              <label>
                <input 
                  type="radio" 
                  name="parallel" 
                  value="auto"
                  checked={settings.performance.parallelProcessing === 'auto'} 
                  onChange={() => handleChange('performance', 'parallelProcessing', 'auto')}
                />
                自动(推荐)
              </label>
            </div>
          </div>

          <div className="setting-group">
            <label>内存使用限制:</label>
            <select 
              value={settings.performance.memoryLimit} 
              onChange={(e) => handleChange('performance', 'memoryLimit', parseInt(e.target.value))}
            >
              <option value="250">250 MB</option>
              <option value="500">500 MB</option>
              <option value="1000">1000 MB</option>
              <option value="2000">2000 MB</option>
            </select>
          </div>

          <div className="setting-group">
            <label>处理优先级:</label>
            <div className="radio-options horizontal">
              <label>
                <input 
                  type="radio" 
                  name="priority" 
                  value="low"
                  checked={settings.performance.processingPriority === 'low'} 
                  onChange={() => handleChange('performance', 'processingPriority', 'low')}
                />
                低
              </label>
              <label>
                <input 
                  type="radio" 
                  name="priority" 
                  value="medium"
                  checked={settings.performance.processingPriority === 'medium'} 
                  onChange={() => handleChange('performance', 'processingPriority', 'medium')}
                />
                中
              </label>
              <label>
                <input 
                  type="radio" 
                  name="priority" 
                  value="high"
                  checked={settings.performance.processingPriority === 'high'} 
                  onChange={() => handleChange('performance', 'processingPriority', 'high')}
                />
                高
              </label>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="reset-button" onClick={handleResetDefaults}>恢复默认值</button>
          <button className="save-button" onClick={handleSave}>保存设置</button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 