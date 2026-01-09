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
      this.downloadBtn.textContent = '下载DOCX';
      this.downloadBtn.disabled = false;
    }
  }