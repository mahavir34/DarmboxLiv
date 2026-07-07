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
            
            // यहाँ हम कोई फ़िल्टर नहीं लगाएँगे, सीधा पूरा डेटा फ्रंटएंड को भेज देंगे ताकि हम उसकी चाबियाँ (Keys) देख सकें
            return res.status(200).json({ success: true, debug_data: episodes });
        } else {
            return res.status(500).json({ success: false, error: 'स्क्रैपर फंक्शन लोड नहीं हो पाया।' });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: 'क्लाउड स्क्रैपर एरर: ' + error.message });
    }
};
