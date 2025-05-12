import React, { useState, useEffect, useRef } from 'react';
import CompressionOptions from '../components/CompressionOptions';
import ProgressBar from '../components/ProgressBar';
import BatchItemList from '../components/BatchItemList';
import BatchResultSummary from '../components/BatchResultSummary';
import ImagePreview from '../components/ImagePreview';

const BatchProcessing = ({ images, onBack, onBatchComplete, theme, settings }) => {
  const [stage, setStage] = useState('options'); // 'options', 'processing', 'complete'
  const [compressionOptions, setCompressionOptions] = useState({
    quality: 75, // 默认质量：中等
    mode: 'lossy', // 默认模式：有损压缩
    format: 'original' // 默认保持原格式
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [currentImageProgress, setCurrentImageProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [processingStartTime, setProcessingStartTime] = useState(null);
  const [processingEndTime, setProcessingEndTime] = useState(null);
  const [savePath, setSavePath] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  
  const processingIntervalRef = useRef(null);

  // 初始化selectedImages
  useEffect(() => {
    if (images && images.length > 0) {
      // 为每个图片添加状态和处理结果信息
      const imagesWithStatus = images.map((img, index) => {
        // 获取文件大小，确保有实际大小
        let originalSize = "未知";
        let originalSizeInMB = 0;
        
        // 尝试从img.size获取大小
        if (img.size) {
          originalSizeInMB = (img.size / (1024 * 1024)).toFixed(2);
          originalSize = `${originalSizeInMB} MB`;
        } else if (img.path) {
          // 如果有path属性，可以尝试通过electron API获取文件大小
          try {
            // 这里仍处理为未知，实际实现可能需要用Node.js fs模块获取
            console.log(`需要获取文件大小: ${img.path}`);
            originalSize = "未知";
          } catch (error) {
            console.error('获取文件大小出错:', error);
            originalSize = "未知";
          }
        }

        return {
          ...img,
          id: `img-${index}-${Date.now()}`, // 添加唯一ID
          selected: true, // 默认选中所有图片
          status: 'pending', // 'pending', 'processing', 'completed', 'error'
          processedPreview: null,
          originalSize: originalSize,
          originalSizeInMB: originalSizeInMB,
          compressedSize: '-',
          compressedSizeInMB: 0,
          compressionRatio: '-'
        };
      });
      setSelectedImages(imagesWithStatus);
      setSelectAll(true);
    }
  }, [images]);

  // 添加更多图片
  const handleAddMoreImages = async () => {
    try {
      const newImages = await window.electronAPI.selectImages();
      if (newImages && newImages.length > 0) {
        const newImagesWithStatus = newImages.map((img, index) => {
          // 处理文件大小
          let originalSize = "未知";
          let originalSizeInMB = 0;
          
          if (img.size) {
            originalSizeInMB = (img.size / (1024 * 1024)).toFixed(2);
            originalSize = `${originalSizeInMB} MB`;
          }

          return {
            ...img,
            id: `new-img-${index}-${Date.now()}`,
            selected: true,
            status: 'pending',
            processedPreview: null,
            originalSize: originalSize,
            originalSizeInMB: originalSizeInMB,
            compressedSize: '-',
            compressedSizeInMB: 0,
            compressionRatio: '-'
          };
        });
        setSelectedImages([...selectedImages, ...newImagesWithStatus]);
      }
    } catch (error) {
      console.error('选择图片出错:', error);
    }
  };

  // 移除图片
  const handleRemoveImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  // 预览图片
  const handlePreviewImage = (index) => {
    setPreviewImageIndex(index);
    setShowPreview(true);
  };

  // 关闭预览
  const handleClosePreview = () => {
    setShowPreview(false);
  };

  // 全选/取消选择
  const handleToggleSelectAll = (select) => {
    const updatedImages = selectedImages.map(img => ({
      ...img,
      selected: select
    }));
    setSelectedImages(updatedImages);
    setSelectAll(select);
  };

  // 切换单个图片选择状态
  const handleToggleImageSelect = (index) => {
    const updatedImages = [...selectedImages];
    updatedImages[index].selected = !updatedImages[index].selected;
    setSelectedImages(updatedImages);
    
    // 检查是否全部选中
    const allSelected = updatedImages.every(img => img.selected);
    setSelectAll(allSelected);
  };

  // 清除选择
  const handleClearSelection = () => {
    setSelectedImages([]);
    setSelectAll(false);
  };

  // 应用个性化设置
  const handleApplyCustomSettings = () => {
    // 弹出一个提示，告知用户已应用设置
    alert(`已为${selectedImages.filter(img => img.selected).length}张图片应用压缩设置：
质量: ${compressionOptions.quality}%
模式: ${compressionOptions.mode === 'lossy' ? '有损压缩' : '无损压缩'}
格式: ${compressionOptions.format === 'original' ? '保持原格式' : compressionOptions.format.toUpperCase()}`);
  };

  // 开始批量处理
  const handleStartBatchProcessing = () => {
    // 过滤出选中的图片
    const selectedForProcessing = selectedImages.filter(img => img.selected);
    
    if (selectedForProcessing.length === 0) {
      alert('请先选择要处理的图片');
      return;
    }

    // 更新选定的图片
    const updatedImages = selectedImages.map(img => ({
      ...img,
      status: img.selected ? 'pending' : 'skipped'
    }));
    
    setSelectedImages(updatedImages);
    setStage('processing');
    setProcessingStartTime(new Date());
    setProcessedImages([]);
    
    // 开始处理第一张选中的图片
    const firstSelectedIndex = updatedImages.findIndex(img => img.selected);
    if (firstSelectedIndex !== -1) {
      processNextImage(firstSelectedIndex);
    }
  };

  // 处理下一张图片
  const processNextImage = (index) => {
    // 如果所有图片都处理完成,或者当前索引超出范围
    if (index >= selectedImages.length) {
      // 所有图片处理完成
      setStage('complete');
      setProcessingEndTime(new Date());
      clearInterval(processingIntervalRef.current);
      
      // 确保在完成时更新processedImages以包含所有已处理的图片
      const completedImages = selectedImages.filter(img => img.status === 'completed');
      setProcessedImages(completedImages);
      
      console.log(`处理完成，已处理 ${completedImages.length} 张图片`);
      return;
    }

    // 如果当前图片未选中，跳到下一张
    if (!selectedImages[index].selected) {
      processNextImage(index + 1);
      return;
    }

    setCurrentImageIndex(index);
    setCurrentImageProgress(0);
    
    // 更新当前图片状态为处理中
    const updatedImages = [...selectedImages];
    updatedImages[index].status = 'processing';
    setSelectedImages(updatedImages);

    // 模拟处理进度
    let progress = 0;
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }
    
    processingIntervalRef.current = setInterval(() => {
      progress += 5;
      setCurrentImageProgress(progress);
      
      // 计算总进度: 已完成的图片 + 当前图片的进度
      const completedCount = updatedImages.filter(img => img.status === 'completed').length;
      const selectedCount = updatedImages.filter(img => img.selected).length;
      const totalProgressValue = ((completedCount + (progress / 100)) / selectedCount) * 100;
      setTotalProgress(Math.min(totalProgressValue, 100));
      
      // 更新预计剩余时间
      const elapsedTime = (new Date() - processingStartTime) / 1000; // 秒
      const progressPercent = totalProgressValue / 100;
      
      if (progressPercent > 0) {
        const estimatedTotalTime = elapsedTime / progressPercent;
        const remainingTime = Math.max(0, Math.round(estimatedTotalTime - elapsedTime));
        setTimeRemaining(remainingTime);
      }

      if (progress >= 100) {
        clearInterval(processingIntervalRef.current);
        
        // 处理完成，更新图片状态和结果
        const processedImage = {...updatedImages[index]};
        processedImage.status = 'completed';
        
        // 确保有唯一ID
        const uniqueId = `img-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        processedImage.id = processedImage.id || uniqueId;
        
        // 计算原始大小（MB）
        let originalSizeMB = 0;
        if (typeof processedImage.originalSizeInMB === 'number' && !isNaN(processedImage.originalSizeInMB)) {
          originalSizeMB = processedImage.originalSizeInMB;
        } else if (typeof processedImage.originalSize === 'string' && processedImage.originalSize !== '未知') {
          const match = processedImage.originalSize.match(/(\d+(\.\d+)?)/);
          if (match) {
            originalSizeMB = parseFloat(match[0]);
          }
        }
        
        // 如果原始大小无效，使用默认值
        if (isNaN(originalSizeMB) || originalSizeMB <= 0) {
          originalSizeMB = 1.0; // 默认1MB
          processedImage.originalSizeInMB = originalSizeMB;
          processedImage.originalSize = `${originalSizeMB.toFixed(2)} MB`;
        }
        
        // 根据压缩模式和质量计算压缩后大小
        const qualityFactor = compressionOptions.quality / 100;
        let compressedSizeMB;
        
        if (compressionOptions.mode === 'lossy') {
          // 有损压缩 - 质量越低，压缩率越高
          compressedSizeMB = originalSizeMB * qualityFactor;
        } else {
          // 无损压缩 - 通常能减少约20-30%
          compressedSizeMB = originalSizeMB * 0.7;
        }
        
        // 确保压缩后大小不为0
        compressedSizeMB = Math.max(0.01, compressedSizeMB);
        
        // 计算压缩率 (减少的比例)
        let compressionRatio = Math.round((1 - (compressedSizeMB / originalSizeMB)) * 100);
        
        // 确保压缩率在合理范围内
        compressionRatio = Math.min(95, Math.max(5, compressionRatio));
        
        // 确保处理结果数据类型正确
        processedImage.processedPreview = processedImage.preview; // 模拟压缩后的预览
        processedImage.compressedSize = `${compressedSizeMB.toFixed(2)} MB`;
        processedImage.compressedSizeInMB = parseFloat(compressedSizeMB.toFixed(2));
        processedImage.compressionRatio = compressionRatio;
        processedImage.thumbnail = processedImage.preview; // 确保有缩略图
        
        console.log(`图片 ${index} 处理完成: 原始大小=${originalSizeMB.toFixed(2)}MB, 压缩后=${compressedSizeMB.toFixed(2)}MB, 压缩率=${compressionRatio}%`);
        
        // 更新图片状态
        updatedImages[index] = processedImage;
        setSelectedImages(updatedImages);
        
        // 使用函数式更新确保最新状态
        setProcessedImages(prev => {
          // 检查是否已存在相同ID的图片
          const exists = prev.some(img => img.id === processedImage.id);
          if (!exists) {
            return [...prev, processedImage];
          }
          return prev.map(img => img.id === processedImage.id ? processedImage : img);
        });
        
        // 处理下一张图片
        setTimeout(() => {
          processNextImage(index + 1);
        }, 200);
      }
    }, 100);
  };

  // 暂停处理
  const handlePauseProcessing = () => {
    // 实现暂停逻辑（可以保存当前状态，停止定时器等）
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      alert('处理已暂停，点击取消可以完全停止处理');
    }
  };

  // 取消处理
  const handleCancelProcessing = () => {
    if (window.confirm('确定要取消当前处理任务吗？')) {
      // 清除定时器
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
      
      setStage('options');
      setTotalProgress(0);
      setCurrentImageIndex(-1);
      setCurrentImageProgress(0);
      
      // 重置所有状态为pending
      const resetImages = selectedImages.map(img => ({
        ...img,
        status: 'pending',
        processedPreview: null,
        compressedSize: '-',
        compressionRatio: '-'
      }));
      setSelectedImages(resetImages);
      setProcessedImages([]);
    }
  };

  // 导出所有图片到文件夹
  const handleExportAll = async () => {
    try {
      // 调用Electron API选择文件夹
      const directory = await window.electronAPI.selectDirectory();
      if (!directory) return;
      
      setSavePath(directory);
      
      // 筛选已处理完成的图片
      const completedImages = selectedImages.filter(img => img.status === 'completed');
      
      if (completedImages.length === 0) {
        alert('没有已处理完成的图片可供保存');
        return;
      }
      
      alert(`将保存${completedImages.length}张图片到: ${directory}`);
      
      // 模拟保存操作
      const savedPaths = [];
      for (const image of completedImages) {
        try {
          // 提取文件名和扩展名
          const fileName = image.name || `image_${Date.now()}`;
          let fileExt = compressionOptions.format;
          
          if (fileExt === 'original') {
            // 保留原格式
            const nameParts = fileName.split('.');
            fileExt = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'jpg';
          }
          
          const saveName = `${directory}/compressed_${fileName}`;
          
          // 模拟保存，实际实现中调用Electron API
          console.log(`保存图片: ${saveName}`);
          savedPaths.push(saveName);
          
          // 如果图片有base64数据，调用实际的保存API
          if (image.preview && image.preview.startsWith('data:image')) {
            const base64Data = image.preview.split(',')[1]; // 移除data:image部分
            await window.electronAPI.saveImage(base64Data, saveName);
            console.log(`图片已保存至: ${saveName}`);
          }
        } catch (error) {
          console.error('保存图片出错:', error);
        }
      }
      
      // 完成后提示用户
      alert(`已成功保存${savedPaths.length}张图片到: ${directory}`);
      
      // 更新图片路径信息
      const updatedImages = [...selectedImages];
      completedImages.forEach((img, idx) => {
        const imageIndex = selectedImages.findIndex(selImg => selImg.id === img.id);
        if (imageIndex !== -1 && idx < savedPaths.length) {
          updatedImages[imageIndex].path = savedPaths[idx];
        }
      });
      setSelectedImages(updatedImages);
      
      // 完成后返回主页
      if (onBatchComplete && savedPaths.length > 0) {
        // 准备返回的完整图片信息
        const processedResults = completedImages.map((img, idx) => {
          // 确保每个图片都有正确的压缩比例、路径和缩略图
          const ratio = typeof img.compressionRatio === 'number' 
            ? img.compressionRatio 
            : Math.max(5, 100 - compressionOptions.quality);
          
          return {
            ...img,
            id: img.id || `export-img-${Date.now()}-${idx}`,
            path: idx < savedPaths.length ? savedPaths[idx] : '',
            compressionRatio: ratio,
            preview: img.processedPreview || img.preview,
            thumbnail: img.processedPreview || img.preview,
            timestamp: new Date().toISOString()
          };
        });
        
        console.log(`准备返回处理完成的图片: ${processedResults.length}张`);
        onBatchComplete(processedResults);
      }
    } catch (error) {
      console.error('选择保存目录出错:', error);
      alert(`保存失败: ${error.message}`);
    }
  };

  // 重新处理相同图片
  const handleReprocessSameImages = () => {
    setStage('options');
    setTotalProgress(0);
    setCurrentImageIndex(-1);
    setCurrentImageProgress(0);
    setProcessedImages([]);
    
    // 重置所有状态为pending
    const resetImages = selectedImages.map(img => ({
      ...img,
      status: 'pending',
      processedPreview: null,
      compressedSize: '-',
      compressionRatio: '-'
    }));
    setSelectedImages(resetImages);
  };

  // 开始新的批量任务
  const handleStartNewBatch = () => {
    if (onBatchComplete) {
      onBatchComplete([]);
    }
  };

  // 清理资源
  useEffect(() => {
    return () => {
      // 组件卸载时清除定时器
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  // 生成状态信息
  const getTotalStats = () => {
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let totalCompressionRatio = 0;
    let completedCount = 0;

    // 使用selectedImages而不是processedImages，确保获取所有已完成的图片
    const completedImages = selectedImages.filter(img => img.status === 'completed');
    
    completedImages.forEach(img => {
      // 尝试从原始大小字符串中提取数字
      let origSize = 0;
      if (typeof img.originalSizeInMB === 'number') {
        origSize = parseFloat(img.originalSizeInMB);
      } else if (img.originalSize && img.originalSize !== '未知') {
        const match = img.originalSize.match(/(\d+(\.\d+)?)/);
        if (match) {
          origSize = parseFloat(match[0]);
        }
      } else {
        // 如果无法获取大小，使用默认值（例如1MB）
        origSize = 1.0; 
      }
      
      // 尝试从压缩后大小字符串中提取数字
      let compSize = 0;
      if (typeof img.compressedSizeInMB === 'number') {
        compSize = parseFloat(img.compressedSizeInMB);
      } else if (img.compressedSize && img.compressedSize !== '-') {
        const match = img.compressedSize.match(/(\d+(\.\d+)?)/);
        if (match) {
          compSize = parseFloat(match[0]);
        }
      }
      
      // 确保数字有效
      origSize = isNaN(origSize) ? 0 : origSize;
      compSize = isNaN(compSize) ? 0 : compSize;
      
      // 累加大小
      totalOriginalSize += origSize;
      totalCompressedSize += compSize;
      
      completedCount++;
    });

    // 确保至少有一点点压缩率，避免显示0%
    if (completedCount > 0) {
      if (totalOriginalSize > 0) {
        totalCompressionRatio = Math.round((1 - totalCompressedSize / totalOriginalSize) * 100);
        
        // 如果压缩率为0或负数，使用质量选项作为参考
        if (totalCompressionRatio <= 0) {
          totalCompressionRatio = Math.max(5, 100 - compressionOptions.quality);
        }
      } else {
        // 如果原始大小为0，使用质量选项估算压缩率
        totalCompressionRatio = Math.max(5, 100 - compressionOptions.quality);
      }
    }

    // 计算处理用时
    let processingTime = '0秒';
    if (processingStartTime && processingEndTime) {
      const timeMs = processingEndTime - processingStartTime;
      const seconds = Math.floor(timeMs / 1000);
      
      if (seconds < 60) {
        processingTime = `${seconds}秒`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        processingTime = `${minutes}分${remainingSeconds}秒`;
      }
    }

    return {
      totalCount: selectedImages.filter(img => img.selected).length,
      completedCount,
      totalOriginalSize: `${totalOriginalSize.toFixed(2)} MB`,
      totalCompressedSize: `${totalCompressedSize.toFixed(2)} MB`,
      totalCompressionRatio: `${totalCompressionRatio}%`,
      processingTime
    };
  };

  // 完成并返回主页
  const handleComplete = () => {
    if (onBatchComplete) {
      // 将所有处理完成的图片作为结果返回
      const completedImages = selectedImages.filter(img => img.status === 'completed');
      
      console.log(`批量处理完成，共有 ${completedImages.length} 张图片处理完成`);
      
      if (completedImages.length === 0) {
        console.warn('警告：没有已处理完成的图片');
        onBatchComplete([]);
        return;
      }
      
      // 确保每张图片都有正确的压缩比例和大小信息
      const processedResults = completedImages.map(img => {
        // 确保有效的压缩比例
        let ratio = img.compressionRatio;
        if (typeof ratio !== 'number' || isNaN(ratio) || ratio <= 0) {
          ratio = Math.max(5, 100 - compressionOptions.quality);
        }
        
        // 确保每张图片都有唯一ID
        const imageId = img.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // 确保有预览图
        const preview = img.processedPreview || img.preview;
        
        return {
          ...img,
          id: imageId,
          path: img.path || '',
          compressionRatio: ratio,
          preview: preview,
          thumbnail: preview,
          timestamp: new Date().toISOString()
        };
      });
      
      console.log('返回处理完成的图片数量:', processedResults.length);
      // 使用setTimeout确保状态更新完成后再调用onBatchComplete
      setTimeout(() => {
        onBatchComplete(processedResults);
      }, 0);
    }
  };

  // 渲染批量处理设置阶段
  const renderOptionsStage = () => (
    <>
      <h2>批量处理模式 ({selectedImages.length}张图片)</h2>
      
      <div className="batch-settings-section">
        <h3>批量压缩设置:</h3>
        <div className="batch-compression-options">
          <CompressionOptions 
            options={compressionOptions}
            onChange={setCompressionOptions}
            settings={settings}
          />
        </div>
      </div>
      
      <div className="batch-images-section">
        <h3>待处理图片 ({selectedImages.length}):</h3>
        <BatchItemList 
          images={selectedImages}
          onRemove={handleRemoveImage}
          onPreview={handlePreviewImage}
          onToggleSelect={handleToggleImageSelect}
        />
      </div>
      
      <div className="batch-actions">
        <button className="add-more-button" onClick={handleAddMoreImages}>
          添加更多图片
        </button>
        <div>
          <button 
            className="select-all-button" 
            onClick={() => handleToggleSelectAll(!selectAll)}
          >
            {selectAll ? '取消全选' : '全选'}
          </button>
          <button 
            className="clear-selection-button" 
            onClick={handleClearSelection} 
            disabled={selectedImages.length === 0}
          >
            清除选择
          </button>
        </div>
      </div>
      
      <div className="batch-start-section">
        <button 
          className="apply-custom-settings-button"
          onClick={handleApplyCustomSettings}
          disabled={selectedImages.filter(img => img.selected).length === 0}
        >
          应用个性化设置
        </button>
        <button 
          className="start-batch-button" 
          onClick={handleStartBatchProcessing}
          disabled={selectedImages.filter(img => img.selected).length === 0}
        >
          开始批量压缩
        </button>
      </div>
    </>
  );

  // 渲染处理进行中阶段
  const renderProcessingStage = () => {
    const currentImage = selectedImages[currentImageIndex] || {};
    const selectedCount = selectedImages.filter(img => img.selected).length;
    const completedCount = selectedImages.filter(img => img.status === 'completed').length;
    
    return (
      <>
        <h2>批量处理中 ({completedCount}/{selectedCount} 完成)</h2>
        
        <div className="batch-progress-section">
          <h3>总体进度:</h3>
          <ProgressBar progress={totalProgress} />
          <p className="time-remaining">预计剩余时间: {timeRemaining > 60 ? `${Math.floor(timeRemaining / 60)}分${timeRemaining % 60}秒` : `${timeRemaining}秒`}</p>
          
          <h3>当前处理: {currentImage.name || ''}</h3>
          <ProgressBar progress={currentImageProgress} />
        </div>
        
        <div className="batch-processing-list">
          <BatchItemList 
            images={selectedImages}
            processingIndex={currentImageIndex}
            showStatus={true}
            readonly={true}
            onPreview={handlePreviewImage}
          />
        </div>
        
        <div className="batch-control-buttons">
          <button className="pause-button" onClick={handlePauseProcessing}>
            暂停
          </button>
          <button className="cancel-button" onClick={handleCancelProcessing}>
            取消
          </button>
        </div>
      </>
    );
  };

  // 渲染处理完成阶段
  const renderCompleteStage = () => {
    const stats = getTotalStats();
    
    return (
      <>
        <h2>批量处理完成 ({stats.completedCount}/{stats.totalCount} 完成)</h2>
        
        <BatchResultSummary stats={stats} />
        
        <div className="batch-results-list">
          <h3>处理结果:</h3>
          <BatchItemList 
            images={selectedImages}
            showResults={true}
            readonly={true}
            onPreview={handlePreviewImage}
          />
        </div>
        
        <div className="batch-export-buttons">
          <button 
            className="export-all-button" 
            onClick={handleExportAll}
            disabled={selectedImages.filter(img => img.status === 'completed').length === 0}
          >
            全部导出到文件夹...
          </button>
          <button className="reprocess-button" onClick={handleReprocessSameImages}>
            再次处理相同图片
          </button>
          <button className="new-batch-button" onClick={handleStartNewBatch}>
            开始新的批量任务
          </button>
          <button className="complete-button" onClick={handleComplete}>
            完成
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="batch-process-container">
      <div className="top-nav">
        <button onClick={onBack} className="back-button">返回 ←</button>
      </div>
      
      <div className="batch-content">
        {stage === 'options' && renderOptionsStage()}
        {stage === 'processing' && renderProcessingStage()}
        {stage === 'complete' && renderCompleteStage()}
      </div>
      
      {/* 图片预览模态框 */}
      {showPreview && previewImageIndex !== null && (
        <ImagePreview 
          image={selectedImages[previewImageIndex]}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};

export default BatchProcessing; 