const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const dramaUrl = req.query.url;
    if (!dramaUrl) {
        return res.status(400).json({ success: false, error: 'URL parameter गायब है' });
    }

    try {
        // सीधे ड्रामाबॉक्स के शेयर लिंक का HTML डाउनलोड कर रहे हैं
        const response = await axios.get(dramaUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000
        });
        
        const html = response.data;
        let videoUrl = null;

        // तरीके 1: स्क्रिप्ट टैग्स के अंदर छिपे हुए JSON या वेरिएबल्स को ढूंढना
        const matchPatterns = [
            /current_episode_mp4_url\s*=\s*['"]([^'"]+)['"]/i,
            /play_url\s*=\s*['"]([^'"]+)['"]/i,
            /video_url\s*=\s*['"]([^'"]+)['"]/i,
            /"video_url"\s*:\s*"([^"]+)"/i,
            /"play_url"\s*:\s*"([^"]+)"/i
        ];

        for (let pattern of matchPatterns) {
            let match = html.match(pattern);
            if (match && match[1] && !match[1].includes('.jpg') && !match[1].includes('.png') && !match[1].includes('.jpeg')) {
                videoUrl = match[1].replace(/\\/g, '');
                break;
            }
        }

        // तरीका 2: अगर वेरिएबल्स नहीं मिले, तो पूरे पेज में से सारे .mp4 और .m3u8 लिंक्स निकाल कर गंदे लिंक्स साफ़ करना
        if (!videoUrl) {
            const rawLinks = html.match(/https?:\/\/[^'"]+\.(?:mp4|m3u8)[^'"]*/gi) || [];
            for (let link of rawLinks) {
                let cleanLink = link.replace(/\\/g, '');
                // फ़िल्टर: इमेज वाले कीवर्ड्स को बाहर निकालो
                if (!cleanLink.includes('cover') && !cleanLink.includes('poster') && !cleanLink.includes('image') && !cleanLink.includes('thumb')) {
                    videoUrl = cleanLink;
                    break;
                }
            }
        }

        if (videoUrl) {
            return res.status(200).json({ success: true, video_url: videoUrl });
        } else {
            // डिबग के लिए: अगर कुछ न मिले तो पेज का छोटा हिस्सा भेजें ताकि हम देख सकें कोड कैसा है
            return res.status(200).json({ 
                success: false, 
                error: 'पेज में वीडियो का असली स्ट्रीम लिंक नहीं मिल पाया।',
                html_preview: html.substring(0, 1000) // पहले 1000 अक्षर
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'क्लाउड फेच एरर: ' + error.message });
    }
};
