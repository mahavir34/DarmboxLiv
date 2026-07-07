const axios = require('axios');

module.exports = async (req, res) => {
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
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 10000
        });
        
        const html = response.data;
        
        // 1. पहला तरीका: पुराना या नया वेरिएबल ढूंढना
        let match = html.match(/(?:current_episode_mp4_url|episode_url|video_url|play_url)\s*=\s*['"]([^'"]+)['"]/i);
        
        // 2. दूसरा तरीका: अगर ऊपर वाला न मिले, तो पूरे पेज में छिपा हुआ कोई भी .mp4 लिंक निकाल लेना
        if (!match) {
            match = html.match(/['"](https?:\/\/[^'"]+\.mp4[^'"]*)['"]/i);
        }
        
        // 3. तीसरा तरीका: JSON डेटा के अंदर से लिंक निकालना
        if (!match) {
            match = html.match(/"url"\s*:\s*"([^"]+\.mp4[^"]*)"/i);
        }

        if (match && match[1]) {
            // गंदे एस्केप कैरेक्टर्स (जैसे \/) को साफ़ करना
            let cleanVideoUrl = match[1].replace(/\\/g, '');
            return res.status(200).json({ success: true, video_url: cleanVideoUrl });
        } else {
            return res.status(404).json({ success: false, error: 'ड्रामाबॉक्स ने कोड बदल दिया है, पेज सोर्स में डायरेक्ट वीडियो लिंक नहीं मिला।' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Fetch Error: ' + error.message });
    }
};
        
