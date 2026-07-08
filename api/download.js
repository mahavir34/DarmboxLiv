const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const shareUrl = req.query.url;
    const isDownload = req.query.download === 'true';

    if (!shareUrl) {
        return res.status(400).json({ success: false, error: 'URL missing' });
    }

    try {
        // अगर फ्रंटएंड सीधे वीडियो डाउनलोड करना चाहता है (प्रॉक्सी स्ट्रीमिंग मोड)
        if (isDownload) {
            const videoResponse = await axios({
                method: 'get',
                url: shareUrl,
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.dramaboxapp.com/'
                },
                timeout: 30000 // बड़ा टाइमआउट ताकि फाइल पूरी स्ट्रीम हो सके
            });

            // ब्राउज़र को मजबूर करना कि वह फाइल को सीधे .mp4 नाम से डाउनलोड करे
            res.setHeader('Content-Disposition', 'attachment; filename="dramabox_episode.mp4"');
            res.setHeader('Content-Type', 'video/mp4');
            return videoResponse.data.pipe(res);
        }

        // लिंक स्क्रैप करने का सामान्य मोड
        const response = await axios.get(shareUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const html = response.data;
        const rawLinks = html.match(/https?:\/\/[^'"]+\.(?:mp4|m3u8)[^'"]/gi) || html.match(/https?:\/\/[^'"]+\.mp4\.jpg[^'"]/gi) || [];
        let videoUrl = null;

        for (let link of rawLinks) {
            let cleanLink = link.replace(/\\/g, '').replace(/['"]/g, '');
            if (!cleanLink.includes('cover') && !cleanLink.includes('poster') && !cleanLink.includes('thumb')) {
                if (cleanLink.endsWith('.jpg')) {
                    cleanLink = cleanLink.substring(0, cleanLink.length - 4);
                } else if (cleanLink.includes('.mp4.jpg')) {
                    cleanLink = cleanLink.replace('.mp4.jpg', '.mp4');
                }
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
        if (isDownload) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ success: false, error: 'Download failed: ' + error.message });
        }
        return res.status(500).json({ success: false, error: error.message });
    }
};
