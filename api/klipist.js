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
        // Klipist पेज का कोड मंगाना
        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        
        const html = response.data;
        
        // 🔍 जुगाड़ 1: सीधे वीडियो एक्सटेंशन खोजना
        let match = html.match(/https?:\/\/[^'"]+\.(?:mp4|m3u8|webm)[^'"]/i);
        
        // 🔍 जुगाड़ 2: अगर सीधा लिंक न मिले, तो प्लेयर का वीडीयो सोर्स टैग या डेटा अट्रिब्यूट खोजना
        if (!match) {
            match = html.match(/src=["'](https?:\/\/.*?\/embed\/.*?)["']/i) || 
                    html.match(/data-src=["'](https?:\/\/.*?\.mp4.*?)["']/i);
        }
        
        if (match && match[0]) {
            let videoLink = match[0].replace(/\\/g, '').replace(/['"]/g, '');
            // अगर मैच में सिर्फ src="" का हिस्सा आया है तो क्लीन करना
            if(videoLink.startsWith('src=')) {
                videoLink = videoLink.replace('src=', '');
            }
            return res.status(200).json({ success: true, video_url: videoLink });
        } else {
            // 🔒 अगर कुछ न मिले, तो सुरक्षा के लिए ओरिजिनल लिंक को ही एम्बेड प्लेयर की तरह इस्तेमाल करने की कोशिश करना
            return res.status(200).json({ success: true, video_url: targetUrl });
        }

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: 'सर्वर कनेक्ट करने में समस्या हुई।' 
        });
    }
};
