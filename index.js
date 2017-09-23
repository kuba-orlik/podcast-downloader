const PodcastDownloader = require("./lib/podcast-downloader.js");
const config = require("./lib/config.js");

const downloader = new PodcastDownloader(config);

downloader.downloadAll();
