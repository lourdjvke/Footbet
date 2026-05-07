import axios from 'axios';

const testProxy = async () => {
    const targetUrl = "https://www.sofascore.com/api/v1/sport/football/events/live";
    const apiKey = 'cdedd4e70b04473da8edcf42bd61f8e8';

    const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=true`;

    try {
      const response = await axios.get(proxyUrl);
      console.log('Got response. First 500 chars:', typeof response.data === 'string' ? response.data.substring(0, 500) : response.data);
      let d = response.data;
      if (typeof d === 'string') {
          const preMatch = d.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
          let rawJson = preMatch ? preMatch[1] : d;
          d = JSON.parse(rawJson);
      }
      console.log('Parsed successfully. Found events:', d.events?.length);
      console.log('First event ID:', d.events[0].id);
    } catch(e: any) {
        console.error('Error', e.message);
    }
}
testProxy();
