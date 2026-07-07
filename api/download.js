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
        // 1. जब यूजर हरे बटन पर क्लिक करेगा (Download Mode Active)
        if (downloadMode === 'true') {
            // नकली .jpg को साफ़ करना
            let videoFileUrl = dramaUrl;
            if (videoFileUrl.endsWith('.jpg')) {
                videoFileUrl = videoFileUrl.substring(0, videoFileUrl.length - 4);
            }
            if (videoFileUrl.includes('.mp4.jpg')) {
                videoFileUrl = videoFileUrl.replace('.mp4.jpg', '.mp4');
            }
            
            // 403 एरर को बाईपास करने के लिए मजबूत मोबाइल हेडर्स जोड़ना
            const videoResponse = await axios({
                method: 'get',
                url: videoFileUrl,
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://www.dramaboxapp.com',
                    'Referer': 'https://www.dramaboxapp.com/',
                    'Connection': 'keep-alive'
                },
                timeout: 15000
            });

            // ब्राउज़र को मजबूर करना कि वह फाइल को सीधे गैलरी में सेव करे
            res.setHeader('Content-Disposition', 'attachment; filename="dramabox_video.mp4"');
            res.setHeader('Content-Type', 'video/mp4');
            return videoResponse.data.pipe(res);
        }

        // 2. लिंक स्क्रैप करने का सामान्य मोड
        const response = await axios.get(dramaUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
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
        // अगर फिर भी कोई एरर आए तो साफ़ मैसेज देना
        if (downloadMode === 'true') {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ success: false, error: 'Download Stream Failed: ' + error.message });
        }
        return res.status(500).json({ success: false, error: error.message });
    }
};
