export class ImageUploadService {
  constructor(supabase) {
    this.supabase = supabase;
    this.bucketName = 'images';
    this.maxFileSize = 5 * 1024 * 1024;
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.compressionQuality = 0.8;
  }
  validateImage(file) {
    const errors = [];
    if (!file) { errors.push('No file selected'); return { isValid: false, errors }; }
    if (!this.allowedTypes.includes(file.type)) { errors.push(`Invalid file type. Allowed types: ${this.allowedTypes.map(t=>t.split('/')[1]).join(', ')}`); }
    if (file.size > this.maxFileSize) { errors.push(`File size too large. Maximum size: ${Math.round(this.maxFileSize/(1024*1024))}MB`); }
    if (!file.type.startsWith('image/')) { errors.push('Selected file is not an image'); }
    return { isValid: errors.length === 0, errors, fileInfo: { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } };
  }
  async compressImage(file, maxWidth = 800, maxHeight = 600) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image();
      img.onload = () => { let { width, height } = img; if (width>maxWidth || height>maxHeight) { const r=Math.min(maxWidth/width, maxHeight/height); width*=r; height*=r; }
        canvas.width=width; canvas.height=height; ctx.drawImage(img,0,0,width,height); canvas.toBlob((blob)=>{ if (blob) { resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() })); } else { reject(new Error('Image compression failed')); } }, file.type, this.compressionQuality); };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  }
  generateFileName(originalName, userId, type = 'profile') {
    const timestamp = Date.now(); const randomId = Math.random().toString(36).substring(2, 8); const extension = originalName.split('.').pop().toLowerCase(); const sanitizedUserId = (userId || 'anonymous').replace(/[^a-zA-Z0-9]/g, '');
    return `${type}/${sanitizedUserId}/${timestamp}_${randomId}.${extension}`;
  }
  async uploadImage(file, options = {}) {
    const { userId = 'anonymous', type = 'profile', compress = true, maxWidth = 800, maxHeight = 600 } = options;
    try {
      const validation = this.validateImage(file); if (!validation.isValid) throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
      let fileToUpload = file; if (compress && file.size > 1024 * 1024) { try { fileToUpload = await this.compressImage(file, maxWidth, maxHeight); } catch { fileToUpload = file; } }
      const fileName = this.generateFileName(file.name, userId, type);
      await this.ensureBucketExists();
      const { data, error } = await this.supabase.storage.from(this.bucketName).upload(fileName, fileToUpload, { cacheControl: '3600', upsert: true }); if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data: urlData } = this.supabase.storage.from(this.bucketName).getPublicUrl(fileName);
      return { success: true, url: urlData.publicUrl, path: fileName, originalSize: file.size, compressedSize: fileToUpload.size, fileName: file.name, uploadedAt: new Date().toISOString() };
    } catch (error) { return { success: false, error: error.message, originalFileName: file?.name }; }
  }
  async ensureBucketExists() {
    try {
      const { error } = await this.supabase.storage.getBucket(this.bucketName);
      if (error && error.message.includes('Bucket not found')) {
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, { public: true, allowedMimeTypes: this.allowedTypes, fileSizeLimit: this.maxFileSize });
        if (createError) throw new Error(`Failed to create bucket: ${createError.message}`);
      }
    } catch (error) { /* proceed */ }
  }
  async deleteImage(imagePath) {
    try { if (!imagePath) return { success: true }; const { error } = await this.supabase.storage.from(this.bucketName).remove([imagePath]); if (error) throw new Error(`Failed to delete image: ${error.message}`); return { success: true }; } catch (error) { return { success: false, error: error.message }; }
  }
  async getImageInfo(imagePath) {
    try { const { data, error } = await this.supabase.storage.from(this.bucketName).list('', { search: imagePath }); if (error) throw new Error(`Failed to get image info: ${error.message}`); return { success: true, info: data[0] || null }; } catch (error) { return { success: false, error: error.message }; }
  }
  async listUserImages(userId, type = 'profile') {
    try { const folderPath = `${type}/${userId}`; const { data, error } = await this.supabase.storage.from(this.bucketName).list(folderPath); if (error) throw new Error(`Failed to list images: ${error.message}`);
      return { success: true, images: data.map(file => ({ name: file.name, size: file.metadata?.size || 0, lastModified: file.metadata?.lastModified, url: this.supabase.storage.from(this.bucketName).getPublicUrl(`${folderPath}/${file.name}`).data.publicUrl })) };
    } catch (error) { return { success: false, error: error.message }; }
  }
}

let globalImageUploadService = null;
export const getImageUploadService = (supabase) => { if (!globalImageUploadService && supabase) { globalImageUploadService = new ImageUploadService(supabase); } return globalImageUploadService; };
export default ImageUploadService;

