import profile from '../data/profile.json' assert { type: 'json' };

export default function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60'); 
    res.status(200).json({ ok: true, data: profile });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to process profile data', details: error.message });
  }
}
