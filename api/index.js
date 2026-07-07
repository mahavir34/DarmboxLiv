const axios = require('axios');

module.exports = async (req, res) => {
    // अगर कोई सीधा वेबसाइट खोले तो उसे सुंदर नीली डाउनलोडर स्क्रीन दिखाओ
    if (req.method === 'GET' && !req.query.url) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DramaBox Downloader</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding: 15px; box-sizing: border-box; }
        .card { background-color: #1e293b; padding: 25px; border: 1px solid #334155; width: 100%; max-width: 400px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); text-align: center; }
        h1 { color: #22d3ee; font-size: 24px; margin-bottom: 5px; }
        p { color: #94a3b8; font-size: 13px; margin-bottom: 25px; }
        input { width: 100%; padding: 12px; background-color: #020617; border: 1px solid #475569; border-radius: 8px; color: white; margin-bottom: 15px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background-color: #0891b2; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; font-size: 15px; }
        button:hover { background-color: #06b6d4; }
        #resultBox { margin-top: 20px; padding: 15px; background-color: #020617; border: 1px solid #065f46; border-radius: 8px; display: none; }
        #resultBox p { color: #34d399; font-weight: bold; margin-bottom: 10px; }
        .download-btn { display: block; width: 100%; padding: 12px; background-color: #059669; border-radius: 8px; color: white; text-decoration: none; font-weight: bold; box-sizing: border-box; }
        .download-btn:hover { background-color: #10b981; }
    </style>
</head>
<body>
    <div class="card">
        <h1>DramaBox Downloader</h1>
        <p>क्लाउड पावर्ड - नो टर्मक्स रिक्वायर्ड</p>
        
        <input type="text" id="dramaUrl" placeholder="यहाँ ड्रामा लिंक पेस्ट करें...">
        <button onclick="getLink()">वीडियो लिंक निकालें</button>

        <div id="resultBox">
            <p>✓ वीडियो लिंक मिल गया!</p>
            <a id="downloadBtn" href="#" target="_blank" class="download-btn">वीडियो डाउनलोड / प्ले करें</a>
        </div>
    </div>

    <script>
        async function getLink() {
            const urlInput = document.getElementById('dramaUrl').value;
            const resultBox = document.getElementById('resultBox');
            const downloadBtn = document.getElementById('downloadBtn');
            
            if(!urlInput) { alert('कृपया पहले लिंक पेस्ट करें!'); return; }
            
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const foundUrls = urlInput.match(urlRegex);
            if (!foundUrls) { alert('कृपया एक सही URL लिंक डालें!'); return; }
            const cleanUrl = foundUrls[0];
            
            try {
                // अब एपीआई भी इसी सेम यूआरएल पर काम करेगी
                const response = await fetch('/?url=' + encodeURIComponent(cleanUrl));
                const data = await response.json();
                
                if(data.success && data.video_url) {
                    downloadBtn.href = data.video_url;
                    resultBox.style.display = 'block';
                } else {
                    alert('त्रुटि: ' + (data.error || 'वीडियो लिंक नहीं मिल पाया।'));
                }
            } catch(err) {
                alert('सर्वर कनेक्ट नहीं हो पाया: ' + err.message);
            }
        }
    </script>
</body>
</html>
        `);
    }

    // अगर यूआरएल पैरामीटर आया है, तो बैकएंड कोडिंग चलाओ (वीडियो फेच करो)
    const shareUrl = req.query.url;
    if (!shareUrl) {
        return res.status(400).json({ success: false, error: 'URL parameter is missing' });
    }

    try {
        const response = await axios.get(shareUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = response.data;
        const match = html.match(/current_episode_mp4_url\s*=\s*['"]([^'"]+)['"]/);

        if (match && match[1]) {
            return res.status(200).json({ success: true, video_url: match[1] });
        } else {
            return res.status(404).json({ success: false, error: 'Video URL not found in this drama link' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server Fetch Error: ' + error.message });
    }
};
