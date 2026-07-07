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
        // टर्मक्स वाला असली एनक्रिप्टेड स्क्रैपर टूल लोड कर रहे हैं
        const dramabox = require('@zhadev/dramabox');
        const ScraperClass = dramabox.DramaBoxScraper || dramabox.default || dramabox;
        const scraper = new ScraperClass();

        // उनके फंक्शन्स की कीज (Keys) ऑटो-डिटेक्ट करना जैसा टर्मक्स स्क्रिप्ट में है
        const protoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(scraper));
        const epsFuncKey = protoKeys.find(k => k.toLowerCase().includes('ep')) || protoKeys.find(k => k.toLowerCase().includes('list')) || protoKeys[2];

        if (epsFuncKey && typeof scraper[epsFuncKey] === 'function') {
            // असली एपीआई हिट करके एपिसोड डेटा निकालना
            const episodes = await scraper[epsFuncKey](dramaUrl);
            
            // डेटा को चेक करके वीडियो यूआरएल फ़िल्टर करना
            if (episodes && episodes.length > 0) {
                // पहले एपिसोड या एक्टिव एपिसोड का वीडियो पाथ निकालना
                let targetEpisode = episodes[0];
                let videoUrl = targetEpisode.video_url || targetEpisode.play_url || targetEpisode.current_episode_mp4_url || targetEpisode.url;
                
                if (videoUrl) {
                    return res.status(200).json({ success: true, video_url: videoUrl.replace(/\\/g, '') });
                }
            }
            
            // अगर सीधे ऑब्जेक्ट में डेटा हो
            if (episodes && (episodes.video_url || episodes.play_url)) {
                let videoUrl = episodes.video_url || episodes.play_url;
                return res.status(200).json({ success: true, video_url: videoUrl.replace(/\\/g, '') });
            }

            return res.status(404).json({ success: false, error: 'स्क्रैपर से डेटा तो मिला, पर वीडियो URL फ़िल्टर नहीं हो पाया।' });
        } else {
            return res.status(500).json({ success: false, error: 'स्क्रैपर फंक्शन लोड नहीं हो पाया।' });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: 'क्लाउड स्क्रैपर एरर: ' + error.message });
    }
};
