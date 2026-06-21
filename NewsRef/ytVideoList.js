import { google } from 'googleapis';

import ChannelsConfig from './channelList.js';
import dotenv from 'dotenv';

dotenv.configDotenv();

class VIDEO_LIST {
  #ChannelConfig;
  #API_KEY;

  constructor(ChannelConfig, API_KEY) {
    this.#API_KEY = API_KEY;
    this.#ChannelConfig = ChannelConfig;
  }

  #stringDurationToObj(iso) {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    let num = 0;

    for (let i = 0; i < iso.length; i++) {
      const code = iso.charCodeAt(i) - 48;

      // digit
      if (code >= 0 && code <= 9) {
        num = num * 10 + code;
      } else {
        const ch = iso[i];

        if (ch === 'H') {
          hours = num;
        } else if (ch === 'M') {
          minutes = num;
        } else if (ch === 'S') {
          seconds = num;
        }

        num = 0;
      }
    }

    return {
      hours,
      minutes,
      seconds,

      totalSeconds: hours * 3600 + minutes * 60 + seconds,

      totalMinutes: hours * 60 + minutes + seconds / 60,
    };
  }

  #matchesPattern(text) {
    return this.#ChannelConfig.regex.some((regexObj) => {
      let regex;
      // if it is directly regex then
      if (regexObj instanceof RegExp) {
        regex = regexObj;
      } else if (regexObj && typeof regexObj.pattern === 'string') {
        // if passed the object like you stored
        try {
          regex = new RegExp(regexObj.pattern, regexObj.flags || '');
        } catch (err) {
          console.warn('Invalid regex object:', regexObj, err);
          return false;
        }
      } else {
        console.warn('Invalid regex:', regexObj);
        return false;
      }

      return regex.test(text);
    });
  }

  #subtractISO(iso1, iso2) {
    const d1 = new Date(iso1);
    const d2 = new Date(iso2);

    const diffMs = d1.getTime() - d2.getTime();

    return {
      milliseconds: diffMs,
      seconds: diffMs / 1000,
      minutes: diffMs / (1000 * 60),
      hours: diffMs / (1000 * 60 * 60),
    };
  }

  #sortMatureNews(list) {
    const freshnessHours = this.#ChannelConfig.freshnessHours || 5;
    return (
      list

        // for regex
        .filter((item) => {
          return this.#matchesPattern(item.title);
        })

        //for latest time i.e fresh news
        .filter((item) => {
          const diff = this.#subtractISO(
            new Date().toISOString(),
            item.publishedAt
          );

          return diff.hours <= freshnessHours;
        })

        // sorting latest first
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
    );
  }

  async fetchNewsUrl() {
    const CHANNEL_ID = this.#ChannelConfig.channelId;

    const youtube = google.youtube({
      version: 'v3',
      auth: this.#API_KEY,
    });

    try {
      // STEP 1
      const channelResponse = await youtube.channels.list({
        part: 'contentDetails',
        id: CHANNEL_ID,
      });

      const uploadsPlaylistId =
        channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

      let nextPageToken = null;

      let collectedVideos = [];

      while (collectedVideos.length < 21) {
        const searchResponse = await youtube.search.list({
          part: 'snippet',
          channelId: CHANNEL_ID,
          maxResults: 50,
          order: 'date',
          type: 'video',
          pageToken: nextPageToken,
        });

        const searchItems = searchResponse.data.items;
        nextPageToken = searchResponse.data.nextPageToken;

        if (!searchItems.length) break;

        const videoIds = searchItems.map((item) => item.id.videoId);

        const videosResponse = await youtube.videos.list({
          part: 'contentDetails',
          id: videoIds.join(','),
        });

        const durationMap = {};
        videosResponse.data.items.forEach((video) => {
          durationMap[video.id] = video.contentDetails.duration;
        });

        const filtered = searchItems
          .map((item) => {
            const videoId = item.id.videoId;

            return {
              videoId,
              title: item.snippet.title,
              publishedAt: item.snippet.publishedAt,
              thumbnail: item.snippet.thumbnails?.high?.url,
              duration: durationMap[videoId],
              url: `https://www.youtube.com/watch?v=${videoId}`,
            };
          })
          .filter((item) => {
            if (!item.duration) return false;
            const duration = this.#stringDurationToObj(item.duration);
            const { min, max } = this.#ChannelConfig.duration;
            return duration.totalMinutes >= min && duration.totalMinutes <= max;
          });

        collectedVideos.push(...filtered);

        if (!nextPageToken) break;
      }
      // console.log(collectedVideos);
      const sortedMature = this.#sortMatureNews(collectedVideos);

      sortedMature.sort(
        (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
      );

      // FINAL LIMIT
      return sortedMature;
    } catch (err) {
      console.error('Error:', err.message);

      return [];
    }
  }
}

function sleep(ms) {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

const key = process.env.GEMINI_KEY_YT;

export default VIDEO_LIST;

// --------------------------------------------------------------------------

// const n = new VIDEO_LIST(ChannelsConfig[2], key);
// const data = await n.fetchNewsUrl();
// console.log(data);

// I will use BullMq for this so no need to get all channel list at once cuz transript thing also has to be done
// async function getAllList() {
//   const key = process.env.GEMINI_KEY_YT;

//   const allChannelList = [];

//   for (let i = 0; i < ChannelsConfig.length; i++) {
//     const trial = new VIDEO_LIST(ChannelsConfig[i], key);
//     const data = await trial.fetchNewsUrl();

//     allChannelList.push({
//       // `${ ChannelsConfig[i].channelId}`: data,  --- wrong way to do this
//       [ChannelsConfig[i].channelId]: data, // see for dynamic entry of key use []
//     });
//     // console.log("Fetched:", data);
//     await new Promise((resolve) => setTimeout(resolve, 15000));
//   }

//   return allChannelList;
// }

// const data = await getAllList();

// for (let i = 0; i < data.length; i++) {
//   console.log(data[i]);
// }

// export default getAllList;
