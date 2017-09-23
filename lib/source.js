"use strict";
const axios = require("axios");
const Promise = require("bluebird");
const parsePodcast = Promise.promisify(require("node-podcast-parser"));

function Source(url) {
	this.url = url;
	this.loaded = false;
	this.data = null;
	this.title = null;
}

Source.prototype = {
	load: function() {
		const self = this;
		if (self.loaded) return Promise.resolve();
		else {
			console.log("Loading", this.url, "...");
			return axios
				.get(this.url)
				.then(function(response) {
					return parsePodcast(response.data);
				})
				.then(function(podcast_data) {
					console.log("Loaded!", self.url);
					self.loaded = true;
					self.data = podcast_data;
					self.title = podcast_data.title;
					self.episodes = podcast_data.episodes;
					return podcast_data;
				})
				.catch(function(error) {
					console.error(
						`Erorr while loading source: '${self.url}`,
						error
					);
					throw error;
				});
		}
	},
	generateGettersForEpisodesFromLastNDays: function(n) {
		const self = this;
		const max_distance = n * 24 * 60 * 60 * 1000;
		const now = Date.now();
		return self.load().then(function(podcast_data) {
			return self.episodes
				.map(ep => {
					ep.published = new Date(ep.published);
					return ep;
				})
				.filter(ep => now - ep.published < max_distance)
				.map(ep => {
					ep.podcast = self.data;
					return ep;
				});
		});
	}
};

module.exports = Source;
