const axios = require('axios');

module.exports = async (req, res) => {
    // CORS हेडर्स सेट करना ताकि फ्रंटएंड बिना किसी एरर के डेटा ले सके
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const shareUrl = req.query.url;
    if (!shareUrl) {
        return res.status(400).json({ success: false, error: 'URL गायब है' });
    }

    try {
        // ड्रामाबॉक्स के पेज का डेटा मोबाइल ब्राउज़र बनकर डाउनलोड करना
        const response = await axios.get(shareUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
            },
            timeout: 10000
        });
        
        const html = response.data;
        
        // पेज के अंदर से सभी वीडियो लिंक्स (.mp4 या .m3u8) को खोजना
        const rawLinks = html.match(/https?:\/\/[^'"]+\.(?:mp4|m3u8)[^'"]/gi) || html.match(/https?:\/\/[^'"]+\.mp4\.jpg[^'"]/gi) || [];
        let videoUrl = null;

        for (let link of rawLinks) {
            let cleanLink = link.replace(/\\/g, '').replace(/['"]/g, '');
            
            // थंबनेल, कवर और पोस्टर्स वाली इमेज को फ़िल्टर करके हटाना
            if (!cleanLink.includes('cover') && !cleanLink.includes('poster') && !cleanLink.includes('thumb')) {
                
                // अगर पीछे नकली .jpg लगा है तो उसे काटकर शुद्ध .mp4 बनाना
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
            return res.status(404).json({ success: false, error: 'इस पेज में कोई चालू वीडियो स्ट्रीम लिंक नहीं मिला।' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'क्लाउड फेच एरर: ' + error.message });
    }
};
