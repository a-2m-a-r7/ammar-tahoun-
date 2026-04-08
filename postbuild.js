import fs from 'fs/promises';

async function copyAssets() {
  await fs.mkdir('dist/api', { recursive: true }).catch(() => {});
  
  try {
    await fs.copyFile('data/profile.json', 'dist/api/profile');
    console.log('Successfully copied profile.json to dist/api/profile');
  } catch (e) {
    console.error('Failed to copy profile data:', e.message);
  }
  
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
