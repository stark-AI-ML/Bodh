import { firefox } from "playwright";

async function getTranscript(videoUrl) {
  const browser = await firefox.launch({
    headless: true,
    firefoxUserPrefs: {
      "dom.ipc.processCount": 1,
      "layers.acceleration.disabled": true,
      "gfx.webrender.force-disabled": true,
      "extensions.pocket.enabled": false,
      "pdfjs.disabled": true,
      "media.volume_scale": "0.0",
      "media.autoplay.default": 5,
      "media.block-autoplay-until-in-foreground": true,
    },
  });

  const page = await browser.newPage();

  await page.route("**/*", (route) => {
    const type = route.request().resourceType();

    if (["image", "media"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  console.log(`Navigating to ${videoUrl}...`);

  try {
    await page.goto(videoUrl, { waitUntil: "networkidle" });
    console.log("Page title:", await page.title());

    await page.waitForTimeout(3000);

    console.log("Expanding video description...");
    const expandButton = page.locator("#expand").first();
    await expandButton.scrollIntoViewIfNeeded();
    await expandButton.waitFor({ state: "visible", timeout: 10000 });
    await expandButton.click();

    console.log("Looking for 'Show transcript' button...");
    const showTranscriptBtn = page.getByRole("button", {
      name: "Show transcript",
    });
    await showTranscriptBtn.scrollIntoViewIfNeeded();
    await showTranscriptBtn.waitFor({ state: "visible", timeout: 10000 });
    await showTranscriptBtn.click();

    // 3. Wait for the transcript side-panel to load
    console.log("Waiting for transcript panel...");
    const transcriptContainer = page
      .locator('[target-id*="transcript"]')
      .first();

    // Wait specifically for the container to become visible in the DOM
    await transcriptContainer.waitFor({ state: "visible", timeout: 15000 });

    // buffertime of web
    await page.waitForTimeout(2000);

    // 4. Extract the text (with the required 'await')
    console.log("Extracting text...");
    const data = await transcriptContainer.innerText();

    console.log("--- Transcript Successfully Extracted ---");

    return data;
  } catch (error) {
    console.error("Scraping failed:", error.message);
  } finally {
    console.log("Closing browser...");
    await browser.close();
  }
}

getTranscript("https://www.youtube.com/watch?v=wiU9c3hZCyI");
