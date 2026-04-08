import { readFileSync } from 'fs';
import { join, extname } from 'path';

const contentTypes = {
  '.jpg': 'image/jpeg', 
  '.jpeg': 'image/jpeg', 
  '.png': 'image/png', 
  '.svg': 'image/svg+xml', 
  '.webp': 'image/webp'
};

export default function handler(req, res) {
  try {
    // Safely extract the intended media path
    const urlPath = req.query.path || req.url.split('?')[0].replace('/api/media', '/media');
    
    if (!urlPath.startsWith('/media/')) {
        return res.status(403).send('Forbidden');
    }

    const file = join(process.cwd(), urlPath);
    const data = readFileSync(file);
    const ext = extname(file).toLowerCase();
    
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.status(200).send(data);
  } catch (error) {
    res.status(404).send('Media not found');
  }
}
