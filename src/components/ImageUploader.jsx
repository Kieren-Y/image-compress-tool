import React, { useState, useRef } from 'react';

const ImageUploader = ({ onImageSelect, onBatchSelect }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // 处理选择文件
  const handleFileSelect = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectImage) {
        const image = await window.electronAPI.selectImage();
        if (image) {
          onImageSelect(image);
        }
      } else {
        // 当Electron API不可用时，触发隐藏的文件输入
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      console.error('选择文件出错:', error);
      // 当出现错误时，尝试使用标准文件输入
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // 处理拖拽事件
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // 处理放置事件
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (window.electronAPI && window.electronAPI.handleDroppedFiles) {
      try {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const paths = Array.from(files).map(file => file.path);
          const images = await window.electronAPI.handleDroppedFiles(paths);
          
          if (images.length === 1) {
            onImageSelect(images[0]);
          } else if (images.length > 1) {
            onBatchSelect(images);
          }
        }
      } catch (error) {
        console.error('处理拖放文件出错:', error);
      }
    } else {
      console.error('无法访问Electron API处理拖放文件');
    }
  };

  // 处理文件上传（隐藏的文件输入）
  const handleFileInputChange = async (e) => {
    try {
      const files = e.target.files;
      if (files.length > 0) {
        const paths = Array.from(files).map(file => URL.createObjectURL(file));
        if (paths.length === 1) {
          const image = {
            path: paths[0],
            preview: paths[0],
            name: files[0].name,
            size: files[0].size,
          };
          onImageSelect(image);
        } else if (paths.length > 1) {
          const images = Array.from(files).map((file, index) => ({
            path: paths[index],
            preview: paths[index],
            name: file.name,
            size: file.size,
          }));
          onBatchSelect(images);
        }
      }
    } catch (error) {
      console.error('处理文件输入出错:', error);
    }
    
    // 重置文件输入，以便可以选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className={`upload-container ${isDragging ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="upload-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 3L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="upload-text">拖拽图片到这里<br/>或者</p>
      <button className="upload-button" onClick={handleFileSelect}>
        <span className="button-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        点击选择图片文件
      </button>
      <p className="upload-info">支持JPG、PNG、GIF、WEBP等格式，最大30MB</p>
      
      <input 
        type="file" 
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        accept="image/*"
        multiple
      />
    </div>
  );
};

export default ImageUploader; 