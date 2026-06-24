import { firefox } from 'playwright';

//  i have written update some where if you come here again please do....

import pool from '../DB/postgres/dbConfig.js';

import news from '../tempNewsData.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// async function getTranscript(videoUrl) {
//   const browser = await firefox.launch({
//     headless: true,
//   });

//   const context = await browser.newContext({
//     viewport: {
//       width: 1366 + Math.floor(Math.random() * 100),
//       height: 768 + Math.floor(Math.random() * 100),
//     },
//     userAgent:
//       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
//     locale: 'en-IN',
//     timezoneId: 'Asia/Kolkata',
//     headless: true,
//     firefoxUserPrefs: {
//       'dom.ipc.processCount': 1,
//       'layers.acceleration.disabled': true,
//       'gfx.webrender.force-disabled': true,
//       'media.autoplay.default': 5,
//       'media.block-autoplay-until-in-foreground': true,
//     },
//   });

//   const page = await context.newPage();

//   const randomNum = (min, max) =>
//     Math.floor(Math.random() * (max - min + 1)) + min;

//   const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

//   const humanScroll = async () => {
//     const scrolls = randomNum(2, 5);
//     for (let i = 0; i < scrolls; i++) {
//       await page.mouse.wheel(0, randomNum(200, 800));
//       await sleep(randomNum(500, 1500));
//     }
//   };

//   async function tryUIExtraction() {
//     await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
//     await sleep(randomNum(2000, 4000));

//     await humanScroll();
//     await sleep(randomNum(800, 2000));

//     // expand description
//     const expandButton = page.locator('#expand').first();
//     if (await expandButton.count()) {
//       await expandButton.scrollIntoViewIfNeeded();
//       await sleep(randomNum(500, 1200));
//       await expandButton.hover();
//       await sleep(randomNum(500, 1200));
//       await expandButton.click();
//     }

//     await sleep(randomNum(1000, 2000));

//     // show transcript
//     const showTranscriptBtn = page.getByRole('button', {
//       name: 'Show transcript',
//     });

//     if (!(await showTranscriptBtn.count())) {
//       throw new Error('Transcript button not found');
//     }

//     await showTranscriptBtn.scrollIntoViewIfNeeded();
//     await sleep(randomNum(500, 1200));
//     await showTranscriptBtn.hover();
//     await sleep(randomNum(500, 1200));
//     await showTranscriptBtn.click();

//     const transcriptContainer = page
//       .locator('[target-id*="transcript"]')
//       .first();

//     await transcriptContainer.waitFor({
//       state: 'visible',
//       timeout: 10000,
//     });

//     await sleep(randomNum(1500, 2500));

//     const data = await transcriptContainer.innerText();

//     if (!data || data.length < 50) {
//       throw new Error('Empty transcript');
//     }

//     return data;
//   }

//   try {
//     // if transcript didn't load do it again
//     for (let attempt = 0; attempt < 2; attempt++) {
//       try {
//         const result = await tryUIExtraction();
//         console.log('get the transcript');
//         return result;
//       } catch (err) {
//         console.log(`attempt ${attempt + 1} failed:`, err.message);
//         await sleep(randomNum(2000, 4000));
//       }
//     }

//     console.log('switching to fallback API...');

//     // simulate human pause before fallback

//     await sleep(randomNum(2000, 5000));

//     const videoIdMatch = videoUrl.match(/v=([^&]+)/);
//     if (!videoIdMatch) return null;

//     const videoId = videoIdMatch[1];

//     const headers = {
//       'User-Agent':
//         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
//       'Accept-Language': 'en-IN,en;q=0.9',
//     };

//     const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
//       headers,
//     }).then((res) => res.text());

//     const captionTracksMatch = html.match(/"captionTracks":(\[.*?\])/);

//     if (!captionTracksMatch) {
//       console.log('no captions found in fallback');
//       // update the backend
//       return null;
//     }

//     const captionTracks = JSON.parse(captionTracksMatch[1]);

//     const track =
//       captionTracks.find((t) => t.languageCode.startsWith('en')) ||
//       captionTracks[0];

//     await sleep(randomNum(1000, 2000));

//     const transcriptXml = await fetch(track.baseUrl, { headers }).then((res) =>
//       res.text()
//     );

//     const text = transcriptXml
//       .replace(/<[^>]+>/g, '')
//       .replace(/\s+/g, ' ')
//       .trim();

//     return text;
//   } catch (error) {
//     console.error('all methods failed:', error.message);
//     // i need to update error log to send me message that news isn't being created
//     return null;
//   } finally {
//     await browser.close();
//   }
// }

let browser = null;
let lastUsed = 0;

const BROWSER_TTL = 15 * 60 * 1000; // 15 min
// const BROWSER_TTL = 60 * 1000;
async function getBrowser() {
  const now = Date.now();

  //fix to true
  if (!browser) {
    browser = await firefox.launch({ headless: true });
  }

  lastUsed = now;
  return browser;
}

// delete browser
setInterval(async () => {
  if (!browser) return;

  const now = Date.now();

  if (now - lastUsed > BROWSER_TTL) {
    console.log('Closing idle browser...');
    await browser.close();
    browser = null;
  }
}, 60 * 1000);

export async function getTranscript(videoUrl) {
  const browserInstance = await getBrowser();

  const context = await browserInstance.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    firefoxUserPrefs: {
      'dom.ipc.processCount': 1,
      'media.autoplay.default': 5,
    },
  });

  const page = await context.newPage();

  // Block heavy resources
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'font', 'media'].includes(type)) {
      return route.abort();
    }
    route.continue();
  });

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  async function tryUIExtraction() {
    await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });

    await sleep(1500);

    const expandButton = page.locator('#expand').first();
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click({ timeout: 3000 }).catch(() => {});
    }

    const showTranscriptBtn = page.getByRole('button', {
      name: 'Show transcript',
    });

    if (!(await showTranscriptBtn.count())) {
      throw new Error('Transcript button not found');
    }

    await showTranscriptBtn.scrollIntoViewIfNeeded();
    await showTranscriptBtn.hover();
    await sleep(randomNum(500, 1200));
    await showTranscriptBtn.click();

    const transcriptContainer = page
      .locator('[target-id*="transcript"]')
      .first();

    await transcriptContainer.waitFor({
      state: 'visible',
      timeout: 8000,
    });

    await transcriptContainer.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await sleep(randomNum(1500, 2500));

    const data = await transcriptContainer.innerText();

    if (!data || data.length < 50) {
      throw new Error('Empty transcript');
    }

    return data;
  }

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await tryUIExtraction();
        console.log('get the transcript');
        return result;
      } catch (err) {
        console.warn(`Attempt ${attempt + 1} failed:`, err.message);
        await sleep(randomNum(2000, 4000));
      }
    }

    await sleep(randomNum(2000, 5000));

    const videoIdMatch = videoUrl.match(/v=([^&]+)/);
    if (!videoIdMatch) return null;

    const videoId = videoIdMatch[1];

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      'Accept-Language': 'en-IN,en;q=0.9',
    };

    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers,
    }).then((res) => res.text());

    const captionTracksMatch = html.match(/"captionTracks":(\[.*?\])/);

    if (!captionTracksMatch) {
      console.log('no captions found in fallback');
      // update the backend
      return null;
    }

    const captionTracks = JSON.parse(captionTracksMatch[1]);

    const track =
      captionTracks.find((t) => t.languageCode.startsWith('en')) ||
      captionTracks[0];

    await sleep(randomNum(1000, 2000));
    const transcriptXml = await fetch(track.baseUrl, { headers }).then((res) =>
      res.text()
    );

    const text = transcriptXml
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  } catch (err) {
    return null;
  } finally {
    await context.close();
  }
}

/* test */

// export async function getTranscript() {
//   await sleep(10000);
//   return news;
// }

function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// get transcripts for all list created by the channel queue well reduced to 3 i am optimising
// as it does break yt rate limit it blocked me today so that's a panic situation for me
// the reason why  i am writing this comment

async function getTranscripts(videoList) {
  const length = videoList.length < 3 ? videoList.length : 3;
  const transcripts = [];

  for (let i = 0; i < length; i++) {
    try {
      const transcript = await getTranscript(videoList[i].url);

      transcripts.push(transcript);
      console.log(transcript);
      await sleep(randomNum(15000, 22000));
    } catch (error) {
      console.error(error);
    }
  }

  return transcripts;
}

async function saveTranscript(
  channelId,
  stateName,
  channelType,
  isUsed = false,
  videoList
) {
  const query = `
    INSERT INTO channel_transcripts (channel_id, state_name, channel_type, transcript, is_used, created_at)
    VALUES ($1, $2, $3, $4, $5,NOW())
    RETURNING *;
  `;

  const transcripts = await getTranscripts(videoList);

  // test for random transcript array
  // const transcripts = [
  //   "helllo this is the first news",
  //   "this is the second news",
  //   "this is the third news",
  // ];
  const results = [];

  for (const t of transcripts) {
    const res = await pool.query(query, [
      channelId,
      stateName,
      channelType,
      t,
      isUsed,
    ]);
    results.push(res.rows[0]);
    console.log('pushed 1 data', res.rows);
  }

  console.log(results);
  return results;
}

export default saveTranscript;

// -----------------------testingg---------------
// const res = await getTranscript('https://www.youtube.com/watch?v=jevDvFTrxNg');

// console.log(res);
// const video = [
//   {
//     videoId: "qSbiVdmSQoE",
//     title:
//       "Top News: रात की बड़ी खबरें | Petrol-Diesel Price Hike | Trump | Twisha Case | NEET  | CBSE",
//     publishedAt: "2026-05-25T16:35:24Z",
//     thumbnail: "https://i.ytimg.com/vi/qSbiVdmSQoE/hqdefault.jpg",
//     duration: "PT3M41S",
//     url: "https://www.youtube.com/watch?v=qSbiVdmSQoE",
//   },
//   {
//     videoId: "eFlvm5zhCq0",
//     title:
//       "Top News: आज की बड़ी खबरें | Petrol-Diesel Price Hike | Trump | Twisha Case | NEET  | CBSE",
//     publishedAt: "2026-05-25T04:26:41Z",
//     thumbnail: "https://i.ytimg.com/vi/eFlvm5zhCq0/hqdefault.jpg",
//     duration: "PT19M47S",
//     url: "https://www.youtube.com/watch?v=eFlvm5zhCq0",
//   },
//   {
//     videoId: "kB3BTJxfT1s",
//     title:
//       "Top News: आज की बड़ी खबरें | Petrol-Diesel Price Hike | Trump | Twisha Case | NEET  | CBSE",
//     publishedAt: "2026-05-25T03:55:01Z",
//     thumbnail: "https://i.ytimg.com/vi/kB3BTJxfT1s/hqdefault.jpg",
//     duration: "PT18M18S",
//     url: "https://www.youtube.com/watch?v=kB3BTJxfT1s",
//   },
// ];

// saveTranscript("xyz", "uttarPradesh", "General", false, video);

// const data = await getTranscript("https://www.youtube.com/watch?v=c_EVl7agBR0");

// console.log(data);
