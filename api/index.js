const axios = require('axios');

module.exports = async (req, res) => {
    // CORS Headers ताकि फ्रंटएंड-बैकएंड में कोई ब्लॉक न हो
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const shareUrl = req.query.url;
    if (!shareUrl) {
        return res.status(400).json({ success: false, error: 'URL parameter गायब है' });
    }

    try {
        const response = await axios.get(shareUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            timeout: 8000 // 8 सेकंड का टाइमआउट ताकि सर्वर अटका न रहे
        });
        
        const html = response.data;
        // ड्रामाबॉक्स के वीडियो यूआरएल को खोजने का पैटर्न
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
