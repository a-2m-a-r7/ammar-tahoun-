import fs from 'fs/promises';

async function copyAssets() {
  await fs.mkdir('dist/api', { recursive: true }).catch(() => {});
  
  // Profile API is handled by serverless functions (api/profile.js)
  // or dynamically by server.js, so we no longer bundle it as a static file.
  
  try {
    await fs.cp('media', 'dist/media', { recursive: true });
    console.log('Successfully copied media to dist/media');
  } catch (e) {
    console.log('Failed to copy media:', e.message);
  }
  
  try {
    await fs.cp('data', 'dist/data', { recursive: true });
  } catch (e) {}
}

copyAssets();
