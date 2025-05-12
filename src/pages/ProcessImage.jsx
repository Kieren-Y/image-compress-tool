import React, { useState, useEffect } from 'react';
import CompressionOptions from '../components/CompressionOptions';
import ProgressBar from '../components/ProgressBar';
import ComparisonView from '../components/ComparisonView';

const ProcessImage = ({ selectedImage, onBack, onProcessComplete, theme, settings }) => {
  const [stage, setStage] = useState('options'); // 'options', 'processing', 'result'
  const [compressionOptions, setCompressionOptions] = useState({
    quality: 75, // 默认质量：中等
    mode: 'lossy', // 默认模式：有损压缩
    format: 'jpg' // 默认格式：JPG
  });
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [result, setResult] = useState(null);
  const [compressedImageData, setCompressedImageData] = useState(null);
  const [savePath, setSavePath] = useState(null);

  // 模拟压缩处理过程
  const handleStartCompression = () => {
    setStage('processing');
    let currentProgress = 0;
    
    // 模拟进度更新
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      setTimeRemaining(Math.max(0, Math.round((100 - currentProgress) / 10)));
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        // 计算文件大小，根据用户选择的压缩质量
        let originalSize = '2.5 MB';
        let origSizeInMB = 2.5;
        
        if (selectedImage && selectedImage.size) {
          origSizeInMB = (selectedImage.size / (1024 * 1024)).toFixed(2);
          originalSize = `${origSizeInMB} MB`;
        }

        // 基于压缩质量直接计算压缩后的大小
        // 较低的压缩质量 = 较小的文件大小
        // 用户选择的质量值(0-100)决定保留的信息量
        // 例如: 质量40% = 保留40%的信息 = 文件大小约为原始的40%
        const qualityFactor = compressionOptions.quality / 100;
        
        // 根据压缩质量对文件大小进行简单线性映射
        // 实际压缩算法会更复杂，这里简化处理
        const compressedRatio = 1 - (0.6 * qualityFactor);
        
        // 计算压缩后的大小
        const compSizeInMB = (origSizeInMB * qualityFactor).toFixed(2);
        const compressedSize = `${compSizeInMB} MB`;
        
        // 计算压缩率 (减小的百分比)
        const compressionRatio = Math.round(100 - qualityFactor * 100);
        
        // 模拟压缩后的图片数据
        setCompressedImageData(selectedImage.preview);
        
        // 模拟压缩结果
        const resultData = {
          originalSize: originalSize,
          compressedSize: compressedSize,
          compressionRatio: compressionRatio,
          qualityFactor: qualityFactor, // 保存质量因子以便显示
          qualityScore: compressionOptions.quality > 70 ? '优' : (compressionOptions.quality > 40 ? '良好' : '一般')
        };
        
        setResult(resultData);
        setStage('result');
      }
    }, 200);
  };

  // 重置处理流程
  const handleRecompress = () => {
    setStage('options');
    setProgress(0);
    setSavePath(null);
  };

  // 创建处理结果对象
  const createResultObject = (path) => {
    if (!result || !compressedImageData) return null;
    
    return {
      name: selectedImage.name,
      preview: compressedImageData,
      thumbnail: compressedImageData,
      path: path,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio,
      qualityScore: result.qualityScore,
      timestamp: new Date().toISOString()
    };
  };

  // 处理保存
  const handleSave = async () => {
    try {
      // 如果已经有保存路径，则直接覆盖保存
      let finalPath = savePath;
      
      if (savePath) {
        await window.electronAPI.saveImage(
          compressedImageData.replace(/^data:image\/\w+;base64,/, ''), 
          savePath
        );
        alert(`图片已更新保存至: ${savePath}`);
      } else {
        // 否则打开另存为对话框
        finalPath = await handleSaveAs();
      }
      
      // 如果保存成功且有回调函数，则将处理结果传回主页面
      if (finalPath && onProcessComplete) {
        const resultObject = createResultObject(finalPath);
        if (resultObject) {
          onProcessComplete(resultObject);
        }
      }
    } catch (error) {
      console.error('保存图片时出错:', error);
      alert('保存图片失败，请重试');
    }
  };

  // 处理另存为
  const handleSaveAs = async () => {
    if (!compressedImageData) {
      alert('没有可保存的图片');
      return null;
    }

    try {
      // 准备文件名
      const fileExt = compressionOptions.format.toLowerCase();
      const defaultName = selectedImage.name 
        ? `compressed_${selectedImage.name.split('.')[0]}.${fileExt}` 
        : `compressed_image.${fileExt}`;
      
      // 调用Electron的保存对话框
      const saveFilePath = await window.electronAPI.saveImage(
        compressedImageData.replace(/^data:image\/\w+;base64,/, ''),
        defaultName
      );
      
      if (saveFilePath) {
        setSavePath(saveFilePath);
        alert(`图片已保存至: ${saveFilePath}`);
        
        // 保存成功后，自动返回主页
        if (onProcessComplete) {
          const resultObject = createResultObject(saveFilePath);
          if (resultObject) {
            onProcessComplete(resultObject);
          }
        }
        
        return saveFilePath;
      }
      return null;
    } catch (error) {
      console.error('另存为图片时出错:', error);
      alert('保存图片失败，请重试');
      return null;
    }
  };

  // 直接返回主页，不保存处理结果
  const handleDiscard = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="process-container">
      {/* 顶部导航栏 */}
      <div className="top-nav">
        <button onClick={handleDiscard} className="back-button">返回 ←</button>
      </div>

      {stage === 'options' && (
        <div className="options-layout">
          <div className="preview-area">
            <div className="image-preview">
              {selectedImage && selectedImage.preview ? (
                <img src={selectedImage.preview} alt="原始图片" />
              ) : (
                <div className="no-preview">无法预览图片</div>
              )}
            </div>
            <div className="preview-label">原始图片预览</div>
          </div>
          
          <div className="settings-area">
            <CompressionOptions 
              options={compressionOptions}
              onChange={setCompressionOptions}
              settings={settings}
            />
            <button 
              className="start-compression-button"
              onClick={handleStartCompression}
            >
              开始压缩
            </button>
          </div>
        </div>
      )}

      {stage === 'processing' && (
        <div className="processing-layout">
          <div className="preview-area">
            <div className="image-preview">
              {selectedImage && selectedImage.preview ? (
                <img src={selectedImage.preview} alt="原始图片" />
              ) : (
                <div className="no-preview">无法预览图片</div>
              )}
            </div>
            <div className="preview-label">原始图片预览</div>
          </div>
          
          <div className="progress-area">
            <h3>处理中...</h3>
            <ProgressBar progress={progress} />
            <div className="processing-info">
              <p>预计剩余时间: {timeRemaining}秒</p>
              <p>正在处理: {selectedImage.name || '图片'}</p>
            </div>
            <button 
              className="cancel-button"
              onClick={handleDiscard}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {stage === 'result' && (
        <div className="result-layout">
          <div className="result-header">
            <h3>压缩结果</h3>
            <div className="view-controls">
              <button className="zoom-button">放大 🔍</button>
              <button className="actual-size-button">1:1</button>
            </div>
          </div>
          
          <ComparisonView 
            originalImage={selectedImage ? selectedImage.preview : ''}
            compressedImage={compressedImageData} // 现在使用处理后的图片数据
            originalSize={result.originalSize}
            compressedSize={result.compressedSize}
            qualityFactor={result.qualityFactor}
          />
          
          <div className="compression-stats">
            <p>文件大小: {result.originalSize} → {result.compressedSize}</p>
            <p>压缩率: {result.compressionRatio}%</p>
            <p>压缩质量: {compressionOptions.quality}%</p>
            <p>质量评分: {result.qualityScore}</p>
            {savePath && (
              <p className="save-path">保存位置: {savePath}</p>
            )}
          </div>
          
          <div className="action-buttons">
            <button className="save-as-button" onClick={handleSaveAs}>另存为...</button>
            <button className="save-button" onClick={handleSave}>
              {savePath ? '更新保存' : '保存'}
            </button>
            <button className="apply-all-button">应用到所有</button>
            <button className="recompress-button" onClick={handleRecompress}>重新压缩</button>
            <button className="discard-button" onClick={handleDiscard}>放弃</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessImage; 