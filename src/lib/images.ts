export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function prepareImage(
  file: File,
): Promise<{ image: Blob; width: number; height: number }> {
  if (!imageTypes.includes(file.type)) throw new Error('请选择 JPG、PNG、WebP 或 AVIF 图片。');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('图片不能超过 20 MB，请缩小后重试。');
  if (!file.size) throw new Error('这张图片是空文件，请选择其他图片。');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {
      throw new Error('无法读取这张图片，文件可能已损坏。');
    });
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('无法识别图片尺寸。');
    const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器无法处理图片，请换用最新的浏览器。');
    context.drawImage(img, 0, 0, width, height);
    const image = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('图片处理失败，请重试。'))),
        'image/webp',
        0.92,
      ),
    );
    return { image, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
