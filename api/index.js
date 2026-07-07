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
        return res.status(400).json({ success: false, error: 'URL missing' });
    }

    try {
        // 1. पहले शेयर लिंक से नाटक की असली ID (bookId/bid) और एपिसोड नंबर निकालें
        const urlParams = new URL(shareUrl);
        const bookId = urlParams.searchParams.get('bid') || urlParams.searchParams.get('bookId');
        const episodeNum = urlParams.searchParams.get('episodeNumber') || '1';

        if (!bookId) {
            return res.status(400).json({ success: false, error: 'लिंक में ड्रामा ID (bid) नहीं मिली' });
        }

        // 2. सीधे ड्रामाबॉक्स के मोबाइल API सर्वर को हिट करें जहाँ असली वीडियो टोकन होते हैं
        const apiResponse = await axios.post('https://api.dramaboxapp.com/api/v1/theater/episode/video', {
            theater_id: bookId,
            episode_num: parseInt(episodeNum, 10)
        }, {
            headers: {
                'User-Agent': 'DramaBox/2.4.0 (Android; 10)',
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip'
            },
            timeout: 8000
        });

        const apiData = apiResponse.data;
        
        // 3. एपीआई के रिस्पॉन्स से असली वीडियो स्ट्रीम (.m3u8 या .mp4) को निकालना
        let realVideoUrl = null;
        if (apiData && apiData.data) {
            realVideoUrl = apiData.data.video_url || apiData.data.play_url || apiData.data.m3u8_url;
        }

        // 4. बैकअप: अगर मोबाइल एपीआई फेल हो, तो पुराने वेब पेज से केवल शुद्ध .m3u8 लिंक ढूंढना
        if (!realVideoUrl) {
            const webResponse = await axios.get(shareUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }
            });
            const html = webResponse.data;
            const m3u8Match = html.match(/['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i);
            if (m3u8Match) {
                realVideoUrl = m3u8Match[1].replace(/\\/g, '');
            }
        }

        if (realVideoUrl) {
            return res.status(200).json({ success: true, video_url: realVideoUrl });
        } else {
            return res.status(404).json({ 
                success: false, 
                error: 'यह एक प्रीमियम / लॉक्ड एपिसोड है। कृपया कोई फ्री या पहला एपिसोड लिंक ट्राई करें।' 
            });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: 'सर्वर कनेक्ट नहीं हो पाया: ' + error.message });
    }
};
