const https = require('https');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, error: 'Link missing' });

    try {
        // Cloudflare और अन्य सिक्योरिटी को बायपास करने के लिए एक रीयल-टाइम प्रॉक्सी का उपयोग
        const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);

        https.get(proxyUrl, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const htmlSource = json.contents || '';

                    // 1. पहला तरीका: स्क्रिप्ट ब्लॉक से INITIAL_STATE खोजना
                    const jsonMatch = htmlSource.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
                    if (jsonMatch) {
                        const state = JSON.parse(jsonMatch[1]);
                        const episodes = state.drama?.episodeList || state.player?.episodeList || [];
                        const currentVideo = episodes[0]?.videoUrl || episodes[0]?.playUrl || '';
                        if (currentVideo) {
                            return res.status(200).json({ success: true, video_url: currentVideo.replace(/\\\\/g, '') });
                        }
                    }

                    // 2. दूसरा तरीका: रॉ सोर्स में सीधे .mp4 या .m3u8 खोजना (इमेज लिंक्स को छोड़कर)
                    const matches = htmlSource.match(/(https?:\/\/[^\s\"'>]+\.(?:mp4|m3u8)[^\s\"'>]*)/gi) || [];
                    const videoUrl = matches.find(link => !link.includes('.jpg') && !link.includes('.png') && !link.includes('.jpeg') && !link.includes('google') && !link.includes('facebook'));

                    if (videoUrl) {
                        return res.status(200).json({ success: true, video_url: videoUrl.replace(/\\\\/g, '') });
                    }

                    // 3. तीसरा तरीका: JSON स्ट्रिंग प्रॉपर्टी खोजना
                    const cleanMatch = htmlSource.match(/\"video_url\"\:\"(.*?)\"/) || htmlSource.match(/\"current_episode_mp4\"\:\"(.*?)\"/);
                    if (cleanMatch) {
                        return res.status(200).json({ success: true, video_url: cleanMatch[1].replace(/\\\\/g, '') });
                    }

                    return res.status(404).json({ success: false, error: 'Video source hidden by server. Try another episode link.' });

                } catch (e) {
                    return res.status(500).json({ success: false, error: 'Parsing failed: ' + e.message });
                }
            });
        }).on('error', err => res.status(500).json({ success: false, error: err.message }));

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
