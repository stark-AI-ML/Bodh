import insertNews from "./saveFinalNews.js";

class handleAIAndSave {
  #newsJson;

  constructor(newsJson) {
    this.#newsJson = newsJson;
  }

  #validator() {
    return this.#newsJson.filter((item) => {
      return (
        item.headline != null &&
        item.category != null &&
        item.impact_scope != null
      );
    });
  }

  #sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async saveData() {
    const news = this.#validator();

    for (let i = 0; i < news.length; i++) {
      try {
        await insertNews(news[i]);
        console.log("insert SuccessFul");
        await this.#sleep(1000);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

export default handleAIAndSave;


