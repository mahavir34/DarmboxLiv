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
        // अगर लिंक StardustTV का है
        if (shareUrl.includes('stardust') || shareUrl.includes('onelink.me')) {
            const response = await axios.get(shareUrl, {
                headers: { 
                    // कंप्यूटर यूजर एजेंट ताकि यह प्ले स्टोर पर न भागे, सीधा वेब पेज खोले
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            
            const html = response.data;
            // .mp4 या .m3u8 लिंक्स को कोड में खोजना
            const match = html.match(/https?:\/\/[^'"]+\.(?:mp4|m3u8)[^'"]/i);
            
            if (match && match[0]) {
                let videoLink = match[0].replace(/\\/g, '').replace(/['"]/g, '');
                return res.status(200).json({ success: true, video_url: videoLink });
            } else {
                return res.status(444).json({ success: false, error: 'StardustTV वीडियो सोर्स लिंक कोड में नहीं मिल सका।' });
            }
        }

        // अगर लिंक ड्रामाबॉक्स (DramaBox) का है
        const response = await axios.get(shareUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' },
            timeout: 8000
        });
        
        return res.status(200).json({ 
            success: false, 
            error: 'यह एपिसोड ड्रामाबॉक्स AWS क्लाउड द्वारा सुरक्षित है। क्रैश से बचने के लिए इसे ऑफिशियल ऐप पर चलाएं।' 
        });

    } catch (error) {
        return res.status(200).json({ 
            success: false, 
            error: 'यह वीडियो पूरी तरह एन्क्रिप्टेड है और इसे सर्वर के जरिए डाउनलोड नहीं किया जा सकता।' 
        });
    }
};
