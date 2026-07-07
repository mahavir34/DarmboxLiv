const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const dramaUrl = req.query.url;
    const downloadMode = req.query.download;

    if (!dramaUrl) {
        return res.status(400).json({ success: false, error: 'URL missing' });
    }

    try {
        // 1. अगर यूजर सीधे डाउनलोड बटन दबाता है, तो हम फाइल को प्रॉक्सी स्ट्रीम करेंगे
        if (downloadMode === 'true') {
            const videoFileUrl = dramaUrl.replace('.mp4.jpg', '.mp4');
            
            const videoResponse = await axios({
                method: 'get',
                url: videoFileUrl,
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://www.dramabox.com/'
                }
            });

            res.setHeader('Content-Disposition', 'attachment; filename="drama_video.mp4"');
            res.setHeader('Content-Type', 'video/mp4');
            return videoResponse.data.pipe(res);
        }

        // 2. साधारण रिक्वेस्ट पर पेज से लिंक स्क्रैप करना
        const response = await axios.get(dramaUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15'
            },
            timeout: 10000
        });
        
        const html = response.data;
        const rawLinks = html.match(/https?:\/\/[^'"]+\.mp4[^'"]*/gi) || [];
        let videoUrl = null;

        for (let link of rawLinks) {
            let cleanLink = link.replace(/\\/g, '');
            if (!cleanLink.includes('cover') && !cleanLink.includes('poster') && !cleanLink.includes('thumb')) {
                videoUrl = cleanLink;
                break;
            }
        }

        if (videoUrl) {
            return res.status(200).json({ success: true, video_url: videoUrl });
        } else {
            return res.status(404).json({ success: false, error: 'Valid stream link not found' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
