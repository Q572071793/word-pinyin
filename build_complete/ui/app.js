class PinyinUI {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.currentProcessedData = null; // Store processed data for download
  }

  initializeElements() {
    this.textInput = document.getElementById('textInput');
    this.convertBtn = document.getElementById('convertBtn');
    this.previewContainer = document.getElementById('previewContainer');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.loadDocxBtn = document.getElementById('loadDocxBtn');
    this.docxFileInput = document.getElementById('docxFileInput');
    this.fileName = document.getElementById('fileName');
    this.clearBtn = document.getElementById('clearBtn');
    this.realTimeIndicator = document.getElementById('realTimeIndicator');
    this.currentCharsPerLine = 39; // 默认每行39字（最佳字数）
  }

  bindEvents() {
    this.convertBtn.addEventListener('click', () => {
      this.convertText();
    });

    // 添加实时显示功能
    this.textInput.addEventListener('input', () => {
      this.handleRealTimeConversion();
    });

    this.loadDocxBtn.addEventListener('click', () => {
      this.docxFileInput.click();
    });

    this.docxFileInput.addEventListener('change', (event) => {
      this.handleDocxFile(event.target.files[0]);
    });

    this.downloadBtn.addEventListener('click', () => {
      this.downloadDocx();
    });

    // PDF下载按钮
    this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
    this.downloadPdfBtn.addEventListener('click', () => {
      this.downloadPdf();
    });

    this.clearBtn.addEventListener('click', () => {
      this.clearAll();
    });
  }

  async convertText() {
    const text = this.textInput.value.trim();
    if (!text) {
      alert('请输入要转换的文本');
      return;
    }

    try {
      // Show loading state
      this.convertBtn.textContent = '转换中...';
      this.convertBtn.disabled = true;

      // Call backend API to convert text to pinyin
      const response = await fetch('/api/pinyin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          text: text,
          format: 'html',
          options: {
            maxLineLength: this.currentCharsPerLine
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Display the HTML result with line length control
        this.displayResultWithLineControl(result.data, result.structuredData);
        
        // Store processed data for download
        this.currentProcessedData = result.structuredData;
        
        // Show download button
        this.downloadBtn.style.display = 'inline-block';
      } else {
        alert('转换失败: ' + result.error);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      alert('转换过程中出现错误: ' + error.message);
    } finally {
      // Reset button state
      this.convertBtn.textContent = '转换为拼音';
      this.convertBtn.disabled = false;
    }
  }

  async handleDocxFile(file) {
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('请选择DOCX格式的文件');
      return;
    }

    this.fileName.textContent = file.name;

    try {
      this.loadDocxBtn.textContent = '加载中...';
      this.loadDocxBtn.disabled = true;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pinyin/docx/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Display the converted content
        this.previewContainer.innerHTML = result.data;
        this.textInput.value = result.originalText;
        this.downloadBtn.style.display = 'inline-block';
        alert('DOCX文件加载成功！');
      } else {
        alert('文件加载失败: ' + result.error);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('文件上传过程中出现错误: ' + error.message);
    } finally {
      this.loadDocxBtn.textContent = '加载DOCX文件';
      this.loadDocxBtn.disabled = false;
    }
  }

  // PDF下载功能
  async downloadPdf() {
    const text = this.textInput.value.trim();
    if (!text) {
      alert('请输入要转换的文本');
      return;
    }

    if (!this.currentProcessedData) {
      alert('请先转换文本');
      return;
    }

    try {
      this.downloadPdfBtn.textContent = '生成中...';
      this.downloadPdfBtn.disabled = true;

      const response = await fetch('/api/pinyin/pdf', {
        method: 'POST',       headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          processedData: this.currentProcessedData,
          options: {
            fontSize: 12,
            fontFamily: 'Microsoft YaHei',
            lineHeight: 1.5,
            margin: 50
          }
        })
      });

      const result = await response.json();

      if (result.success && result.base64Data) {
        // 将Base64数据转换为Blob
        const byteCharacters = atob(result.base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || '拼音标注文档.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('✅ PDF文件下载成功！');
      } else {
        alert('PDF生成失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('PDF Download error:', error);
      alert('PDF下载过程中出现错误: ' + error.message);
    } finally {
      this.downloadPdfBtn.textContent = '📑 下载PDF';
      this.downloadPdfBtn.disabled = false;
    }
  }

  async downloadDocx() {
    const text = this.textInput.value.trim();
    if (!text) {
      alert('请输入要转换的文本');
      return;
    }

    try {
      this.downloadBtn.textContent = '下载中...';
      this.downloadBtn.disabled = true;

      const response = await fetch('/api/pinyin/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          processedData: this.currentProcessedData
        })
      });

      const result = await response.json();

      if (result.success && result.base64Data) {
        // 将Base64数据转换为Blob
        const byteCharacters = atob(result.base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || '拼音标注文档.docx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('下载失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('下载过程中出现错误: ' + error.message);
    } finally {
      this.downloadBtn.textContent = '📄 下载DOCX';
      this.downloadBtn.disabled = false;
    }
  }

  // 实时转换处理（带防抖）
  handleRealTimeConversion() {
    // 清除之前的定时器
    if (this.realTimeTimeout) {
      clearTimeout(this.realTimeTimeout);
    }
    
    // 隐藏之前的指示器
    this.realTimeIndicator.style.display = 'none';
    
    // 设置新的定时器，延迟500ms执行转换
    this.realTimeTimeout = setTimeout(() => {
      const text = this.textInput.value.trim();
      if (text) {
        // 显示实时转换指示器
        this.realTimeIndicator.style.display = 'flex';
        this.convertTextRealTime();
      } else {
        // 如果文本为空，显示空状态
        this.previewContainer.innerHTML = `
          <div class="empty-state">
            <p>👆 请在上方输入中文文本并点击"转换为拼音"按钮</p>
            <p>或者加载DOCX文件进行转换</p>
          </div>
        `;
        this.downloadBtn.style.display = 'none';
      }
    }, 500);
  }

  // 实时转换文本
  async convertTextRealTime() {
    const text = this.textInput.value.trim();
    if (!text) return;

    try {
      // 调用后端API进行转换
      const response = await fetch('/api/pinyin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          format: 'html',
          options: {
            maxLineLength: this.currentCharsPerLine
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // 隐藏实时转换指示器
        this.realTimeIndicator.style.display = 'none';
        
        // 显示转换结果
        this.previewContainer.innerHTML = result.data;
        
        // 存储处理后的数据以供下载
        this.currentProcessedData = result.structuredData;
        
        // 显示下载按钮
        this.downloadBtn.style.display = 'inline-block';
      }
    } catch (error) {
      console.error('实时转换错误:', error);
      // 不显示错误提示，避免干扰用户输入
    }
  }

  displayResultWithLineControl(htmlData, structuredData) {
    // 直接显示结果，不再重新组织
    this.previewContainer.innerHTML = htmlData;
    this.currentProcessedData = structuredData;
  }

  clearAll() {
    this.textInput.value = '';
    this.previewContainer.innerHTML = `
      <div class="empty-state">
        <p>👆 请在上方输入中文文本并点击"转换为拼音"按钮</p>
        <p>或者加载DOCX文件进行转换</p>
      </div>
    `;
    this.downloadBtn.style.display = 'none';
    this.currentProcessedData = null;
    this.fileName.textContent = '';
    this.docxFileInput.value = '';
  }
}

// Initialize the UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new PinyinUI();
});