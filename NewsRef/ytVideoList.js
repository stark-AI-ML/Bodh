import { google } from 'googleapis';

import ChannelsConfig from './channelList.js';
import dotenv from 'dotenv';

dotenv.configDotenv();

/* 
after almost 3-4 weeks i revisted this  even i get overwhelmed how much perfection i tried here 
      yeah did take the help of ai in iso, but still all this algos were mine 
      so i shouldn't be burning out during debug but... i did so : 

      -- if you are seeing this don't be overwhelmed it is just few wrapper i have created to filter
      aggressively... based on the time freshenes hours and all 
      see as i have channel config all i did is create a good architecture around : 

      have config : ->>> then use that config to filter things out : 

      eg : regex, time, duration 


what google api will return : but not everything is relevance : so ... need my config 
  [
  {
    videoId: 'GJ7DuXR_zuA',
    title: 'Stocks In news | Top 5 Stocks to Focus On Today– 25th May 2026 | First Trade | Intraday Stocks',
    publishedAt: '2026-05-26T03:38:25Z',
    thumbnail: 'https://i.ytimg.com/vi/GJ7DuXR_zuA/hqdefault.jpg',
    duration: 'PT5M54S',
    url: 'https://www.youtube.com/watch?v=GJ7DuXR_zuA'
  }
 more ..... like this 
]



*/

class VIDEO_LIST {
  #ChannelConfig;
  #API_KEY;

  constructor(ChannelConfig, API_KEY) {
    this.#API_KEY = API_KEY;
    this.#ChannelConfig = ChannelConfig;
  }

  #stringDurationToObj(strDuration) {
    // duration: 'PT17M16S'  to {hours: 3, minutes: 3, seconds:3} -->
    // simple logic just playing with ascii value like we do all the time in cpp

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    let num = 0;

    for (let i = 0; i < strDuration.length; i++) {
      const code = strDuration.charCodeAt(i) - 48;

      // digit
      if (code >= 0 && code <= 9) {
        num = num * 10 + code;
      } else {
        const ch = strDuration[i];

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
        // if passed the object like we stored earlier
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

        // sorting latest first  /fix - try do that for duration baseed
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
      const channelResponse = await youtube.channels.list({
        part: 'contentDetails',
        id: CHANNEL_ID,
      });

      const uploadsPlaylistId =
        channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

      let nextPageToken = null;

      let collectedVideos = [];

      while (collectedVideos.length < 19) {
        const searchResponse = await youtube.search.list({
          part: 'snippet',
          channelId: CHANNEL_ID,
          maxResults: 40,
          order: 'date',
          type: 'video',
          pageToken: nextPageToken,
        });
        console.log(searchResponse);

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

export default VIDEO_LIST;

// test --------------------------------------------------------------------------

const key = process.env.GEMINI_KEY_YT;

const n = new VIDEO_LIST(ChannelsConfig[1], key);
const data = await n.fetchNewsUrl();
console.log(data);

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
