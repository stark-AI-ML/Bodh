const key = process.env.GEMINI_KEY_YT;

const n = new VIDEO_LIST(ChannelsConfig[2], key);
const data = await n.fetchNewsUrl();
console.log(data);
