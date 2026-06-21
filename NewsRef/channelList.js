const ChannelsConfig = [
  {
    channelName: 'ABP_NEWS',
    channelId: 'UCRWFSbif-RFENbBrSiez1DA',

    topNewsTiming: ['9 AM'],

    // learned : you can't pass regex instance directly to json as this is class instance and not supported by json
    regex: [
      { pattern: '.*Top\\s+News:\\s*.+$', flags: 'iu' },
      { pattern: 'Top\\s+News:\\s*आज\\s+की\\s+बड़ी\\s+खबरें$', flags: 'u' },
    ],

    scope: 'National',
    type: 'General',

    duration: {
      min: 3,
      max: 30,
    },
    freshnessHours: 10,
    state: 'National',
  },

  {
    channelName: 'CNB',
    channelId: 'UCQIycDaLsBpMKjOCeaKUYVg',

    topNewsTiming: ['9 AM'],

    regex: [
      { pattern: '^Top\\s+News:\\s*.+$', flags: 'u' },

      {
        pattern: '.*\\b(?:Top\\s+\\d+\\s+Stocks|Trending\\s+Stocks)(?:\\b.*)?',
        flags: 'i',
      },
    ],

    scope: 'National',
    type: 'Finance',

    duration: {
      min: 3,
      max: 30,
    },
    freshnessHours: 5,
    state: 'National',
  },
  {
    channelName: 'DD-News',
    channelId: 'UCKwucPzHZ7zCUIf7If-Wo1g',

    topNewsTiming: ['9 AM'],

    regex: [
      {
        pattern: '.*(?:तेज़\\s+रफ़्तार|tez\\s+raftaar).*',
        flags: 'iu',
      },
    ],

    scope: 'National',
    type: 'General',

    duration: {
      min: 3,
      max: 30,
    },
    freshnessHours: 10,
    state: 'National',
  },
];

export default ChannelsConfig;
