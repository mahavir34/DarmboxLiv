const https = require('https');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, error: 'Link missing' });

    try {
        // ड्रामाबॉक्स को लगेगा कि रिक्वेस्ट उनके असली मोबाइल ऐप से आ रही है
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': 'https://www.dramaboxapp.com/',
                'Origin': 'https://www.dramaboxapp.com'
            }
        };

        https.get(url, options, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                // पेज के अंदर से डायरेक्ट वीडियो सोर्स (.mp4 या .m3u8) खोजना
                const matches = data.match(/(https?:\/\/[^\s\"'>]+\.(?:mp4|m3u8)[^\s\"'>]*)/gi) || [];
                const videoUrl = matches.find(link => !link.includes('.jpg') && !link.includes('.png') && !link.includes('.jpeg'));

                if (videoUrl) {
                    return res.status(200).json({ success: true, video_url: videoUrl.replace(/\\\\/g, '') });
                }

                // बैकअप तरीका अगर लिंक ऑब्जेक्ट के अंदर छिपा हो
                const jsonMatch = data.match(/\"video_url\"\:\"(.*?)\"/);
                if (jsonMatch) {
                    return res.status(200).json({ success: true, video_url: jsonMatch[1].replace(/\\\\/g, '') });
                }

                return res.status(444).json({ success: false, error: 'Video URL not found in source' });
            });
        }).on('error', err => res.status(500).json({ success: false, error: err.message }));

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
