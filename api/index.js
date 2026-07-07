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
        const dramabox = require('@zhadev/dramabox');
        const ScraperClass = dramabox.DramaBoxScraper || dramabox.default || dramabox;
        const scraper = new ScraperClass();

        const protoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(scraper));
        const epsFuncKey = protoKeys.find(k => k.toLowerCase().includes('ep')) || protoKeys.find(k => k.toLowerCase().includes('list')) || protoKeys[2];

        if (epsFuncKey && typeof scraper[epsFuncKey] === 'function') {
            const episodes = await scraper[epsFuncKey](dramaUrl);
            
            let finalUrl = null;

            // स्मार्ट डिक्शनरी डिटेक्शन लॉजिक
            if (episodes) {
                // स्थिति 1: अगर एरे (Array) के रूप में डेटा आया हो
                if (Array.isArray(episodes) && episodes.length > 0) {
                    let ep = episodes[0];
                    finalUrl = ep.video_url || ep.play_url || ep.current_episode_mp4_url || ep.url;
                } 
                // स्थिति 2: अगर सीधा ऑब्जेक्ट (Object) हो
                else {
                    finalUrl = episodes.video_url || episodes.play_url || episodes.current_episode_mp4_url || episodes.url;
                }
            }

            // अगर सीधे यूआरएल मिल गया तो वेल एंड गुड, नहीं तो पूरा ऑब्जेक्ट फ्रंटएंड को डिबग के लिए दे दो
            if (finalUrl) {
                return res.status(200).json({ success: true, video_url: finalUrl.replace(/\\/g, '') });
            } else {
                return res.status(200).json({ success: true, video_url: null, raw_response: episodes });
            }
        } else {
            return res.status(500).json({ success: false, error: 'स्क्रैपर फंक्शन लोड नहीं हो पाया।' });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: 'क्लाउड स्क्रैपर एरर: ' + error.message });
    }
};
