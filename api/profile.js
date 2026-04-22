import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  try {
    const file = join(process.cwd(), 'data', 'profile.json');
    const data = readFileSync(file, 'utf8');
    const profile = JSON.parse(data);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60'); 
    res.status(200).json({ ok: true, data: profile });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to load profile data', details: error.message });
  }
}
