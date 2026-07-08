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
        return res.status(400).json({ success: false, error: 'URL is missing' });
    }

    try {
        // 1. शेयर लिंक से ड्रामा की ID (bid) और एपिसोड नंबर निकालें
        const urlParams = new URL(shareUrl);
        const bookId = urlParams.searchParams.get('bid') || urlParams.searchParams.get('bookId');
        const episodeNum = urlParams.searchParams.get('episodeNumber') || '1';

        if (!bookId) {
            return res.status(400).json({ success: false, error: 'लिंक में ड्रामा ID (bid) नहीं मिली' });
        }

        // 2. ड्रामाबॉक्स के ऑफिशियल मोबाइल गेटवे को हिट करें जहाँ से साइन्ड (Signed) टोकन मिलते हैं
        const apiResponse = await axios.post('https://api.dramaboxapp.com/api/v1/theater/episode/video', {
            theater_id: bookId,
            episode_num: parseInt(episodeNum, 10)
        }, {
            headers: {
                'User-Agent': 'DramaBox/2.4.0 (Android; 10; Mobile)',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        const apiData = apiResponse.data;
        let realUrl = null;

        if (apiData && apiData.data) {
            // मोबाइल रिस्पॉन्स से असली वैलिड मल्टिप्लायर या वीडियो पाथ निकालना
            realUrl = apiData.data.video_url || apiData.data.play_url || apiData.data.m3u8_url;
        }

        // 3. बैकअप: अगर मोबाइल गेटवे काम न करे तो साधारण स्क्रैपिंग पर जाएँ
        if (!realUrl) {
            const webResponse = await axios.get(shareUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }
            });
            const html = webResponse.data;
            const match = html.match(/current_episode_mp4_url\s*=\s*['"]([^'"]+)['"]/i) || html.match(/play_url\s*=\s*['"]([^'"]+)['"]/i);
            if (match && match[1]) {
                realUrl = match[1].replace(/\\/g, '');
            }
        }

        if (realUrl) {
            return res.status(200).json({ success: true, video_url: realUrl });
        } else {
            return res.status(404).json({ success: false, error: 'वीडियो स्ट्रीम टोकन एक्सपायर हो चुका है या यह एक लॉक्ड एपिसोड है।' });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: 'सर्वर रिस्पॉन्स फेल: ' + error.message });
    }
};
