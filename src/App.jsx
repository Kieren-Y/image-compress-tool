import React, { useState, useRef, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ProcessImage from './pages/ProcessImage';
import BatchProcessing from './pages/BatchProcessing';
import Settings from './pages/Settings';

function App() {
  const [theme, setTheme] = useState('light');
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'process', 'batch', 'settings'
  const [selectedImage, setSelectedImage] = useState(null);
  const [batchImages, setBatchImages] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [appSettings, setAppSettings] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // 批量上传按钮的ref
  const fileInputRef = useRef(null);

  // 从本地存储加载处理过的图片历史记录
  useEffect(() => {
    try {
      const savedImages = localStorage.getItem('processedImages');
      if (savedImages) {
        setProcessedImages(JSON.parse(savedImages));
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  }, []);

  // 从本地存储加载应用设置
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setAppSettings(parsedSettings);
        
        // 应用保存的主题设置
        if (parsedSettings.general && parsedSettings.general.theme) {
          if (parsedSettings.general.theme === 'system') {
            // 检测系统主题
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
          } else {
            setTheme(parsedSettings.general.theme);
          }
        }
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }, []);

  // 保存处理过的图片历史记录到本地存储
  useEffect(() => {
    try {
      if (processedImages.length > 0) {
        localStorage.setItem('processedImages', JSON.stringify(processedImages));
      }
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  }, [processedImages]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setCurrentPage('process');
  };

  const handleBatchSelect = (images) => {
    setBatchImages(images);
    setCurrentPage('batch');
  };

  const handleProcessComplete = (result) => {
    if (result) {
      // 确保不重复添加相同的图片
      setProcessedImages(prevImages => {
        // 检查是否已存在相同ID或路径的图片
        const exists = prevImages.some(img => 
          (result.id && img.id === result.id) || 
          (result.path && img.path === result.path)
        );
        
        if (exists) {
          // 更新现有图片
          return prevImages.map(img => 
            (result.id && img.id === result.id) || (result.path && img.path === result.path) 
              ? { ...result, timestamp: new Date().toISOString() } 
              : img
          );
        } else {
          // 添加新图片到列表前端
          return [{ ...result, timestamp: new Date().toISOString() }, ...prevImages];
        }
      });
    }
    setCurrentPage('home');
    setSelectedImage(null);
  };

  const handleBatchComplete = (batchImages) => {
    console.log('批量处理完成，返回图片数量:', batchImages.length, batchImages);
    
    if (batchImages && batchImages.length > 0) {
      // 使用新数组替换历史记录，确保批处理的图片排在最前面
      setProcessedImages(prevImages => {
        // 创建批处理图片的副本，添加时间戳和确保有ID
        const newBatchImages = batchImages.map(batchImage => {
          // 确保每个图片有唯一ID
          const imageId = batchImage.id || `batch-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          return {
            ...batchImage,
            id: imageId,
            timestamp: new Date().toISOString()
          };
        });
        
        // 过滤掉已存在的图片(根据ID或路径)，避免重复
        const existingIds = new Set(newBatchImages.map(img => img.id));
        const existingPaths = new Set(newBatchImages.filter(img => img.path).map(img => img.path));
        
        const filteredPrevImages = prevImages.filter(img => {
          // 保留不在新批处理图片中的旧图片
          return !existingIds.has(img.id) && 
                 !(img.path && existingPaths.has(img.path));
        });
        
        // 合并新的批处理图片和过滤后的旧图片
        const combinedImages = [...newBatchImages, ...filteredPrevImages];
        
        // 记录历史记录状态
        console.log(`历史记录更新: 新增 ${newBatchImages.length} 张图片，总共 ${combinedImages.length} 张图片`);
        
        return combinedImages;
      });
    }
    
    // 返回到主页面
    setCurrentPage('home');
    setBatchImages([]);
  };

  const handleBatchUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      // 如果ref不可用，则使用其他方式触发批量上传
      handleBatchUpload();
    }
  };

  const handleBatchUpload = async () => {
    try {
      // 使用Electron的文件选择对话框
      const images = await window.electronAPI.selectImages();
      if (images && images.length > 0) {
        handleBatchSelect(images);
      }
    } catch (error) {
      console.error('批量选择文件出错:', error);
    }
  };

  // 打开设置页面
  const handleOpenSettings = () => {
    setCurrentPage('settings');
  };

  // 保存应用设置
  const handleSaveSettings = (settings) => {
    setAppSettings(settings);
    
    // 更新主题
    if (settings.general.theme === 'system') {
      // 检测系统主题
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(settings.general.theme);
    }
    
    // 保存到本地存储
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  // 显示帮助信息
  const handleShowHelp = () => {
    setShowHelp(true);
  };

  // 关闭帮助信息
  const handleCloseHelp = () => {
    setShowHelp(false);
  };

  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-circle">
            <img src="/assets/image_compress_logo.svg" alt="Image Compressor Logo" className="app-logo" />
          </div>
          <h1>Image Compressor</h1>
        </div>
        <div className="header-actions">
          <div className="header-buttons">
            <button className="icon-button theme-button" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? 
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3C10.8065 4.19347 10.136 5.81217 10.136 7.5C10.136 11.0899 13.0461 14 16.636 14C18.3238 14 19.9425 13.3295 21.136 12.136C20.3252 16.3304 16.6584 19.5 12.136 19.5C7.02944 19.5 2.88602 15.3566 2.88602 10.25C2.88602 5.7276 6.05561 2.06083 10.25 1.25C9.05651 2.44347 12 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                : 
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 21V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16.9498 7.05029L18.364 5.63608" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5.63608 18.364L7.05029 16.9498" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M19 12L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M3 12L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16.9498 16.9498L18.364 18.364" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5.63608 5.63608L7.05029 7.05029" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              }
            </button>
            <button className="icon-button settings-button" onClick={handleOpenSettings} aria-label="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="icon-button help-button" onClick={handleShowHelp} aria-label="Help">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9C14 9.39815 13.8837 9.76913 13.6831 10.0808C13.0854 11.0097 12 11.8954 12 13V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 17L12 17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-content">
        {currentPage === 'home' ? (
          <>
            <ImageUploader 
              onImageSelect={handleImageSelect} 
              onBatchSelect={handleBatchSelect}
            />
            
            <section className="history-section">
              <h2>上次处理的图片列表 ({processedImages.length})</h2>
              <div className="thumbnails-container">
                {processedImages.map((image, index) => (
                  <div key={image.id || index} className="thumbnail-item">
                    <img src={image.thumbnail || image.preview} alt={`处理后图片 ${index + 1}`} />
                    <div className="thumbnail-info">
                      已压缩 {image.compressionRatio || 0}%
                    </div>
                  </div>
                ))}
                {processedImages.length === 0 && (
                  <div className="no-history">尚无处理记录</div>
                )}
              </div>
              <div className="batch-actions">
                <button 
                  className="batch-upload-button"
                  onClick={handleBatchUpload}
                >
                  批量上传
                </button>
                <button 
                  className="clear-button" 
                  onClick={() => setProcessedImages([])}
                  disabled={processedImages.length === 0}
                >
                  清除全部
                </button>
              </div>
            </section>
          </>
        ) : currentPage === 'process' ? (
          <ProcessImage 
            selectedImage={selectedImage} 
            onBack={() => setCurrentPage('home')}
            onProcessComplete={handleProcessComplete}
            theme={theme}
            settings={appSettings?.compression}
          />
        ) : currentPage === 'batch' ? (
          <BatchProcessing 
            images={batchImages}
            onBack={() => setCurrentPage('home')}
            onBatchComplete={handleBatchComplete}
            theme={theme}
            settings={appSettings?.compression}
          />
        ) : (
          <Settings 
            onBack={() => setCurrentPage('home')}
            initialSettings={appSettings}
            onSaveSettings={handleSaveSettings}
            theme={theme}
          />
        )}
      </main>
      
      <footer className="app-footer">
        <div className="status-bar">
          {currentPage === 'home' 
            ? `准备就绪 - 已处理 ${processedImages.length} 张图片` 
            : currentPage === 'process'
              ? '图片处理中 - 选择压缩选项并开始处理'
              : currentPage === 'batch'
              ? '批量处理模式 - 设置批量压缩选项并处理多张图片'
              : '设置 - 配置应用选项'}
        </div>
        <div className="copyright">
          © {new Date().getFullYear()} Image Compressor | <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> | Made with ❤️
        </div>
      </footer>

      {/* 帮助模态框 */}
      {showHelp && (
        <div className="help-overlay" onClick={handleCloseHelp}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h2>使用帮助</h2>
              <button className="close-help-button" onClick={handleCloseHelp}>×</button>
            </div>
            <div className="help-content">
              <h3>基本使用</h3>
              <ul>
                <li>单击主页面中的上传区域或拖放图片到上传区域以开始压缩单张图片</li>
                <li>使用"批量上传"按钮一次处理多张图片</li>
                <li>处理完成后，可以在历史记录中查看处理过的图片</li>
              </ul>
              
              <h3>压缩设置</h3>
              <ul>
                <li>质量：调整压缩质量，数值越高，图片质量越好，但文件大小也越大</li>
                <li>模式：选择有损压缩（文件更小）或无损压缩（保持原始质量）</li>
                <li>格式：选择输出格式（JPG、PNG、WebP或保持原格式）</li>
              </ul>
              
              <h3>批量处理</h3>
              <ul>
                <li>选择多张图片进行批量处理</li>
                <li>可以为批处理设置统一的压缩参数</li>
                <li>完成后可以导出到指定文件夹</li>
              </ul>
              
              <h3>快捷键</h3>
              <ul>
                <li><kbd>Ctrl/Cmd</kbd> + <kbd>O</kbd>：打开文件</li>
                <li><kbd>Ctrl/Cmd</kbd> + <kbd>S</kbd>：保存当前文件</li>
                <li><kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>：另存为</li>
                <li><kbd>Ctrl/Cmd</kbd> + <kbd>,</kbd>：打开设置</li>
                <li><kbd>Esc</kbd>：返回主页</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 