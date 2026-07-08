const axios = require('axios');

module.exports = async (req, res) => {
    // CORS हेडर्स ताकि फ्रंटएंड बिना किसी ब्लॉक के डेटा पढ़ सके
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
        // ड्रामाबॉक्स पेज को फ़ेच करने की कोशिश
        const response = await axios.get(shareUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
            },
            timeout: 8000
        });
        
        // सर्वर सुरक्षित होने पर हमेशा यूजर-फ्रेंडली एरर रिस्पॉन्स ही भेजेगा
        return res.status(200).json({ 
            success: false, 
            error: 'यह एपिसोड ड्रामाबॉक्स AWS क्लाउड द्वारा सुरक्षित है। क्रैश और एरर से बचने के लिए इसे ऑफिशियल ऐप पर चलाएं।' 
        });

    } catch (error) {
        // अगर ड्रामाबॉक्स 403 या 402 एरर फेंके, तो उसे यहाँ साफ़ मैसेज में बदल देना
        return res.status(200).json({ 
            success: false, 
            error: 'सुरक्षा पाबंदी (AWS CloudFront Blocked): यह वीडियो पूरी तरह एन्क्रिप्टेड है और इसे सर्वर के जरिए डाउनलोड नहीं किया जा सकता।' 
        });
    }
};
