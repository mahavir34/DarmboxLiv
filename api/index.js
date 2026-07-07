const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const dramaUrl = req.query.url;
    if (!dramaUrl) {
        return res.status(400).json({ success: false, error: 'URL parameter गायब है' });
    }

    try {
        const response = await axios.get(dramaUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
            },
            timeout: 10000
        });
        
        const html = response.data;
        let videoUrl = null;

        // पूरे पेज में से सारे लिंक्स निकालें जो .mp4 या .mp4.jpg पैटर्न के हों
        const rawLinks = html.match(/https?:\/\/[^'"]+\.mp4[^'"]*/gi) || [];

        for (let link of rawLinks) {
            let cleanLink = link.replace(/\\/g, '');
            
            // अगर लिंक में 'cover' या 'poster' नहीं है और .mp4 आया है
            if (!cleanLink.includes('cover') && !cleanLink.includes('poster') && !cleanLink.includes('thumb')) {
                // अगर ड्रामाबॉक्स ने पीछे .jpg लगाया है, तो उसे काटकर हटा दो ताकि असली वीडियो बाहर आ जाए
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
            return res.status(404).json({ success: false, error: 'इस पेज में कोई वैलिड वीडियो लिंक फ़िल्टर नहीं हो सका।' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'क्लाउड फेच एरर: ' + error.message });
    }
};
