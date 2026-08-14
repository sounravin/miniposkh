/**
 * Utility to process and resize images on client-side (especially high-res iPhone photos)
 * Resizes down to max dimensions (default 800x800) and compresses to lightweight JPEG data URL
 */
export async function resizeImageFile(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.82
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Draw onto canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas 2d context'));
          return;
        }

        // Clean white background for transparent images
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Smoothing settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          sizeKb,
          width,
          height,
        });
      };

      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
