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
        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 10000
        });
        
        const html = response.data;
        
        // 🔍 एडवांस पैटर्न 1: JSON कॉन्फ़िगरेशन या डेटा-एट्रीब्यूट के अंदर से वीडियो लिंक्स खोजना
        let videoLink = null;
        
        // स्क्रिप्ट और JSON डेटा ब्लॉक को टारगेट करना
        const jsonMatch = html.match(/["'](?:contentUrl|downloadUrl|file|src)["']\s*:\s*["'](https?:\/\/.*?\.(?:mp4|m3u8|webm).*?)["']/i);
        if (jsonMatch && jsonMatch[1]) {
            videoLink = jsonMatch[1];
        }
        
        // 🔍 एडवांस पैटर्न 2: सामान्य HTML5 वीडियो सोर्स टैग्स को खोजना
        if (!videoLink) {
            const srcMatch = html.match(/<source\s+[^>]*src=["'](https?:\/\/.*?)["']/i);
            if (srcMatch && srcMatch[1]) {
                videoLink = srcMatch[1];
            }
        }
        
        // 🔍 एडवांस पैटर्न 3: रेगुलर एक्सप्रेशन के ज़रिए रॉ मीडिया स्ट्रिंग्स को पकड़ना
        if (!videoLink) {
            const rawMatch = html.match(/https?:\/\/[^'"]+?\.(?:mp4|m3u8)[^'"]*/i);
            if (rawMatch && rawMatch[0]) {
                videoLink = rawMatch[0];
            }
        }
        
        if (videoLink) {
            // एस्केप कैरेक्टर्स (जैसे \/) को साफ़ करना
            let cleanLink = videoLink.replace(/\\/g, '').replace(/['"]/g, '').trim();
            return res.status(200).json({ success: true, video_url: cleanLink });
        } else {
            return res.status(444).json({ 
                success: false, 
                error: 'सुरक्षा लॉक: Klipist ने इस वीडियो के डायरेक्ट सोर्स को एन्क्रिप्ट कर दिया है। आप इस वीडियो का लिंक सीधे अपने ऐप के इन-ऐप वेबव्यू (WebView Browser) में चला सकते हैं!' 
            });
        }

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: 'सर्वर रिस्पॉन्स एरर या लिंक इनवैलिड है।' 
        });
    }
};
