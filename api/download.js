function getLink() {
    const urlInput = document.getElementById('dramaUrl').value.trim();
    const resultBox = document.getElementById('resultBox');
    const player = document.getElementById('dramaPlayer');
    
    resultBox.style.display = 'none';
    if(!urlInput) { alert('कृपया पहले लिंक पेस्ट करें!'); return; }
    
    // अगर लिंक ऐप डीप लिंक है, तो उसे सीधे ब्लॉक करें
    if (urlInput.includes('android/open') || urlInput.includes('app.dramaboxdb.com')) {
        alert('यह एक ऐप प्रोटेक्टेड डीप लिंक है। कृपया सामान्य ब्राउज़र शेयर लिंक का उपयोग करें!');
        return;
    }
    
    try {
        const urlObj = new URL(urlInput);
        const bookId = urlObj.searchParams.get('bid') || urlObj.searchParams.get('bookId');
        const cindex = urlObj.searchParams.get('cindex') || '0';
        
        if (!bookId) {
            alert('त्रुटि: लिंक में ड्रामा ID (bid) नहीं मिली!');
            return;
        }
        
        let embedUrl = `https://www.dramaboxdb.com/play?bid=${bookId}&cindex=${cindex}`;
        player.src = embedUrl;
        resultBox.style.display = 'block';
        
    } catch (err) {
        alert('कृपया एक सही ड्रामा यूआरएल लिंक डालें!');
    }
}
