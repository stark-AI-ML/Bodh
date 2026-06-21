import { firefox } from "playwright";

import fetch from "node-fetch";

async function getTranscript(videoUrl) {
  const browser = await firefox.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: {
      width: 1366 + Math.floor(Math.random() * 100),
      height: 768 + Math.floor(Math.random() * 100),
    },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    headless: false,
    firefoxUserPrefs: {
      "dom.ipc.processCount": 1,
      "layers.acceleration.disabled": true,
      "extensions.pocket.enabled": false,
      "gfx.webrender.force-disabled": true,
      "media.autoplay.default": 5,
      "media.block-autoplay-until-in-foreground": true,
    },
  });

  const page = await context.newPage();

  await page.route("**/*", (route) => {
    const type = route.request().resourceType();

    if (["image", "media"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  const randomNum = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const humanScroll = async () => {
    const scrolls = randomNum(2, 5);
    for (let i = 0; i < scrolls; i++) {
      await page.mouse.wheel(0, randomNum(200, 800));
      await sleep(randomNum(500000, 1500));
    }
  };

  async function tryUIExtraction() {
    await page.goto(videoUrl, { waitUntil: "domcontentloaded" });
    await sleep(randomNum(2000, 4000));

    await humanScroll();
    await sleep(randomNum(800, 2000));

    // expand description
    const expandButton = page.locator("#expand").first();
    if (await expandButton.count()) {
      await expandButton.scrollIntoViewIfNeeded();
      await sleep(randomNum(500, 1200));
      await expandButton.hover();
      await sleep(randomNum(500, 1200));
      await expandButton.click();
    }

    await sleep(randomNum(1000, 2000));

    // show transcript
    const showTranscriptBtn = page.getByRole("button", {
      name: "Show transcript",
    });

    if (!(await showTranscriptBtn.count())) {
      throw new Error("Transcript button not found");
    }

    await showTranscriptBtn.scrollIntoViewIfNeeded();
    await sleep(randomNum(500, 1200));
    await showTranscriptBtn.hover();
    await sleep(randomNum(500, 1200));
    await showTranscriptBtn.click();

    const transcriptContainer = page
      .locator('[target-id*="transcript"]')
      .first();

    await transcriptContainer.waitFor({
      state: "visible",
      timeout: 10000,
    });

    await sleep(randomNum(1500, 2500));

    const data = await transcriptContainer.innerText();

    if (!data || data.length < 50) {
      throw new Error("Empty transcript");
    }

    return data;
  }

  try {
    // if transcript didn't load do it again
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await tryUIExtraction();
        console.log("get the transcript");
        return result;
      } catch (err) {
        console.log(`attempt ${attempt + 1} failed:`, err.message);
        await sleep(randomNum(2000, 4000));
      }
    }

    console.log("switching to fallback API...");

    // simulate human pause before fallback
    await sleep(randomNum(2000, 5000));

    const videoIdMatch = videoUrl.match(/v=([^&]+)/);
    if (!videoIdMatch) return null;

    const videoId = videoIdMatch[1];

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "en-IN,en;q=0.9",
    };

    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers,
    }).then((res) => res.text());

    const captionTracksMatch = html.match(/"captionTracks":(\[.*?\])/);

    if (!captionTracksMatch) {
      console.log("np captions found in fallback");
      return null;
    }

    const captionTracks = JSON.parse(captionTracksMatch[1]);

    const track =
      captionTracks.find((t) => t.languageCode.startsWith("en")) ||
      captionTracks[0];

    await sleep(randomNum(1000, 2000));

    const transcriptXml = await fetch(track.baseUrl, { headers }).then((res) =>
      res.text(),
    );

    const text = transcriptXml
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  } catch (error) {
    console.error("all methods failed:", error.message);
    return null;
  } finally {
    await browser.close();
  }
}
getTranscript("https://www.youtube.com/watch?v=te2cyRF2tz8");
