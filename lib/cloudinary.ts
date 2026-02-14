export const uploadToCloudinary = async (file: File, folder: string = 'marketplace') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'products');
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url;
};