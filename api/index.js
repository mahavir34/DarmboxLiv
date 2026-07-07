const axios = require('axios');

module.exports = async (req, res) => {
    const shareUrl = req.query.url;
    if (!shareUrl) {
        return res.status(400).json({ success: false, error: 'URL parameter गायब है' });
    }

    try {
        const response = await axios.get(shareUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = response.data;
        const match = html.match(/current_episode_mp4_url\s*=\s*['"]([^'"]+)['"]/);

        if (match && match[1]) {
            return res.status(200).json({ success: true, video_url: match[1] });
        } else {
            return res.status(404).json({ success: false, error: 'इस लिंक में वीडियो URL नहीं मिला' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Fetch Error: ' + error.message });
    }
};
