export const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // 使用「最大邊長」策略，而非固定的 MAX_WIDTH
        // 這樣可以確保 直式(1080x1920) 與 橫式(1920x1080) 都能保持相同的清晰度
        const MAX_DIMENSION = 1920;
        
        let width = img.width;
        let height = img.height;

        // 計算縮放比例 (維持長寬比)
        if (width > height) {
          // 橫式圖片
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          // 直式圖片
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 1. 繪製原始圖片
          ctx.drawImage(img, 0, 0, width, height);

          // 2. 加上時間戳記 (浮水印)
          const now = new Date();
          const dateStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
          const timeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
          const timestamp = `${dateStr} ${timeStr}`;

          // 依據「長邊」來計算字體大小
          const longSide = Math.max(width, height);
          
          // 字體大小約為長邊的 2.5%，最小 24px
          const fontSize = Math.max(24, Math.floor(longSide * 0.025));
          
          // 修正：邊距統一使用長邊的 3.5% 來計算
          // 之前用 width * 0.03 在直式照片會太小 (例如 1080 * 0.03 = 32px)，導致字體貼邊
          // 改用 longSide (例如 1920 * 0.035 = 67px) 確保足夠空間
          const padding = Math.floor(longSide * 0.035);

          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          
          // 描邊 (黑色)，確保在淺色背景也能看見
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = Math.max(3, fontSize / 8);
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(timestamp, width - padding, height - padding);

          // 填色 (白色)
          ctx.fillStyle = 'white';
          ctx.fillText(timestamp, width - padding, height - padding);
        }
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas compression failed'));
          },
          'image/jpeg',
          0.8 // 稍微提高品質以確保文字清晰
        );
      };
      img.onerror = (e) => reject(new Error('Image load failed'));
    };
    reader.onerror = (error) => reject(error);
  });
};

export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};