# Image Compressor

A modern desktop application for compressing and optimizing images efficiently with an intuitive user interface.

![Image Compressor Logo](public/assets/image_compress_logo2.png)

## Features

- **Single Image Processing**: Compress individual images with customizable settings
- **Batch Processing**: Optimize multiple images at once with unified settings
- **Customizable Compression**: Adjust quality, compression mode, and output format
- **Before/After Comparison**: View the original and compressed versions side by side
- **Compression History**: Keep track of previously processed images
- **Dark/Light Theme**: Supports light and dark themes with automatic system theme detection
- **Cross-Platform**: Works on Windows, macOS, and Linux

## UI Screenshots

The application features a modern, user-friendly interface with both light and dark themes.

*Screenshots will be added here once the application reaches release stage.*

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/image-compress-tool.git
cd image-compress-tool
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

Start the application in development mode:

```bash
npm run dev
```

This will concurrently launch:
- The Vite development server for the frontend (accessible at http://localhost:5173)
- The Electron application which loads the UI from the development server

## Building for Production

Build the application for production:

```bash
npm run build
```

This will:
1. Build the React frontend using Vite
2. Package the application using electron-builder

## Technologies Used

- **Electron**: Cross-platform desktop application framework
- **React**: UI library for building the user interface
- **Vite**: Next-generation frontend tooling
- **CSS**: Custom styling with modern CSS features

## Usage

1. **Single Image Processing**:
   - Drag and drop an image or click to select an image
   - Adjust compression settings (quality, mode, format)
   - Preview the compression result
   - Save the compressed image

2. **Batch Processing**:
   - Select multiple images using the "批量上传" (Batch Upload) button
   - Configure common compression settings for all images
   - Process them simultaneously
   - Export all compressed images to a folder

3. **Settings**:
   - Customize default compression settings
   - Change theme (Light/Dark/System)
   - Configure application preferences

## Interface Language

The application currently uses Chinese for its interface. Key terms include:

- 批量上传 (Batch Upload) - For processing multiple images
- 返回 (Return) - To go back to the previous screen
- 开始批量压缩 (Start Batch Compression) - Begin processing multiple images
- 暂停 (Pause) - Pause the current compression process
- 取消 (Cancel) - Cancel the current operation
- 完成 (Complete) - Finish the current task

## Project Structure

- `/src`: React application source code
  - `/components`: Reusable UI components
  - `/pages`: Main application pages
  - `/assets`: CSS and other static assets
- `/electron`: Electron-specific code
  - `main.js`: Main electron process
- `/public`: Static assets served directly

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ | © 2025 Image Compressor 