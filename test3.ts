import axios from 'axios';

const testProxy = async () => {
    const targetUrl = "https://www.sofascore.com/api/v1/event/15632634/lineups";
    const apiKey = 'cdedd4e70b04473da8edcf42bd61f8e8';

    const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=true`;

    while(true) {
      try {
        const response = await axios.get(proxyUrl);
        console.log('Got response:', typeof response.data === 'string' ? response.data.substring(0, 500) : response.data);
        break;
      } catch(e: any) {
          if (e.response?.status === 409) {
             console.log("409, wait and retry");
             await new Promise(r => setTimeout(r, 1000));
             continue;
          }
          console.error('Error', e.response?.status, e.response?.data);
          break;
      }
    }
}
testProxy();
