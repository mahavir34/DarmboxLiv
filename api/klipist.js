const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ success: false, error: 'URL missing' });
    }

    try {
        // Klipist पेज का HTML कोड मंगाना
        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const html = response.data;
        
        // 🔍 HTML कोड के अंदर छिपे हुए .mp4 या .m3u8 लिंक को ढूंढना
        const match = html.match(/https?:\/\/[^'"]+\.(?:mp4|m3u8)[^'"]/i);
        
        if (match && match[0]) {
            let videoLink = match[0].replace(/\\/g, '').replace(/['"]/g, '');
            return res.status(200).json({ success: true, video_url: videoLink });
        } else {
            return res.status(444).json({ success: false, error: 'Klipist वीडियो सोर्स लिंक कोड में नहीं मिल सका।' });
        }

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: 'सर्वर कनेक्ट करने में समस्या हुई या लिंक गलत है।' 
        });
    }
};
