# Bodh 

**This is an extension or a tool for BodhAPI so as i am dropping this for the developers if they want to scrape the yt based on the yt channel i will right this guidance to walkthrough my code base**

*finally somone needs this so i will write this*
---

### what you need to get started with this projects

  - ``javascript`` as much depth as you can have is good but if you are just using this as tool no need to worry i will guide you what to change for diffrent channels and all 


---

### How to use bodh-scraper 

- if you are just begineer and want to go with the current setup but want your own channel videos and transcript to be there 

- update channelList  under `/NewsRef` 

```json 
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
```
**Warning**
- if you add too much channel and don't have custom proxy server or no wireguard / telnet setup : sooner or later you will be blocked 

   -  so either buy a proxy server or don't go harsh
   - as AWS tld (is known and famous ) so keep that in mind it is blocked by the ip blocker on unusual traffic first but not instant so, again don't have unrealistic expectations without proxies 

- if you are on low end or will deploy this on ec2 free tier like me : 1gb is way too tight for playwright 

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

although i allocated 4gb but i have been running it for a week now it din't go up there mostly 800mb

*but even now remember don't try to change concurency of bullmq from 1 to 2 or more it will eat up your ram*

---

**so this is the setup for you guys** 
- you can use it for social news like of creators 
- you can run it with these env 

```bash

# adjustment for 1gb ram & playwright : 
LOCK_DURATION = 350000
BROWSER_WINDOW = 900000

#local

REDIS_HOST 
REDIS_PORT 

DB_HOST 
DB_USER 
DB_NAME

DB_PORT 
DB_PASS

#prod - with docker


# HOST = 0.0.0.0
# NODE_ENV=development
# DB_HOST:postgres
# DB_PORT=5432
# DB_NAME=news
# DB_USER=postgres

# DB_PASS

# REDIS_HOST=redis
# REDIS_PORT=6379
# REDIS_DB=0

# common

GEMINI_API_KEY 

GEMINI_KEY_YT 







 






  