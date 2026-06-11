const resolveUrl = (rawUrl) => {
    if (!rawUrl) return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    let url = rawUrl;
    const BASE_URL = 'https://sutraverse.co.in';

    if (url.includes('firebasestorage.googleapis.com')) {
      return url;
    }

    // Strip out base urls to get a clean relative path
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        // Only strip if it's not a generic http link that's unrelated
        if (url.includes('localhost') || url.includes('sutraverse.co.in') || url.includes('192.168.')) {
            const match = url.match(/^https?:\/\/[^\/]+(.*)/);
            if (match && match[1]) {
                url = match[1];
            }
        }
      } catch (e) {}
    }

    let relativePath = url;
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }
    if (relativePath.includes('api/downloads/')) {
      relativePath = relativePath.split('api/downloads/')[1];
    }
    relativePath = relativePath.split('?')[0];

    return `${BASE_URL}/api/downloads/${relativePath}`;
};

console.log(resolveUrl('https://sutraverse.co.in/api/downloads/pyqs/FE_BEE_2019.pdf'));
console.log(resolveUrl('uploads/1775825116267_BEE_Unit_2_ppt.pptx'));
console.log(resolveUrl('/api/downloads/1775825116267_BEE_Unit_2_ppt.pptx'));
console.log(resolveUrl('https://someotherdomain.com/api/downloads/file.pdf'));
