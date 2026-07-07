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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            },
            timeout: 10000
        });
        
        const html = response.data;
        let finalVideoUrl = null;

        // 1. पूरे पेज में से सारे संभावित वीडियो लिंक्स (.mp4 या .m3u8) को एरे में निकालें
        const allUrls = html.match(/https?:\/\/[^'"]+\.(?:mp4|m3u8)[^'"]*/gi) || [];

        // 2. फ़िल्टर: ऐसा लिंक ढूंढें जिसमें 'cover', 'poster', 'image', या 'thumb' शब्द न हो
        for (let url of allUrls) {
            let cleanUrl = url.replace(/\\/g, ''); // गंदे एस्केप कैरेक्टर्स साफ़ करें
            if (!cleanUrl.includes('cover') && !cleanUrl.includes('poster') && !cleanUrl.includes('image') && !cleanUrl.includes('thumb')) {
                finalVideoUrl = cleanUrl;
                break; // पहला शुद्ध वीडियो लिंक मिलते ही लूप रोक दें
            }
        }

        // 3. बैकअप तरीका: अगर ऊपर फ़िल्टर काम न करे, तो वेरिएबल स्पेसिफिक सर्च करें
        if (!finalVideoUrl) {
            const specMatch = html.match(/(?:current_episode_mp4_url|episode_url|play_url)\s*=\s*['"]([^'"]+)['"]/i);
            if (specMatch && !specMatch[1].includes('jpg') && !specMatch[1].includes('png')) {
                finalVideoUrl = specMatch[1].replace(/\\/g, '');
            }
        }

        if (finalVideoUrl) {
            return res.status(200).json({ success: true, video_url: finalVideoUrl });
        } else {
            return res.status(404).json({ success: false, error: 'पेज में केवल इमेज मिली, असली वीडियो स्ट्रीम लिंक नहीं मिल पाया।' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Fetch Error: ' + error.message });
    }
};
