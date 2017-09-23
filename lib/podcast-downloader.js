const Promise = require("bluebird");
const axios = require("axios");
const fs = Promise.promisifyAll(require("fs"));
const path = require("path");

const Source = require("./source.js");
const Counter = require("./counter.js");
const leftpad = require("./leftpad.js");

const MAX_CONCURRENT_DOWNLOADS = 10;
const MAX_LOAD_DAYS = 14;
const MAX_FILENAME_LENGTH = 200;

const mime_to_filetype = {
	"audio/mpeg": "mp3"
};

const PATH_INVALID_CHARS_REGEX = /[\\\/\.\/\*:?"']/g;

const dateSlug = function(date) {
	return `${leftpad(date.getMonth() + 1, 2, "0")}-${leftpad(
		date.getDate(),
		2,
		"0"
	)}`;
};

function PodcastDownloader(config) {
	this.sources = config.podcasts.map(url => new Source(url));

	this.generatePodcastDirname = function(ep, absolute) {
		if (absolute === undefined) absolute = true;
		const dirname = ep.podcast.title
			.replace(PATH_INVALID_CHARS_REGEX, "-")
			.slice(0, MAX_FILENAME_LENGTH / 3);
		if (absolute) return path.resolve(config.download_dir, dirname);
		else return dirname;
	};

	this.generateEpisodeFilename = function(ep) {
		const self = this;
		const date = new Date(ep.published);
		const date_slug = dateSlug(date);
		return (
			date_slug +
			" " +
			ep.title
				.replace(PATH_INVALID_CHARS_REGEX, "-")
				.slice(
					0,
					MAX_FILENAME_LENGTH -
						self.generatePodcastDirname(ep, true).length -
						4 -
						date_slug.length
				) +
			"." +
			mime_to_filetype[ep.enclosure.type]
		);
	};

	this.generatePathForEp = function(ep) {
		const self = this;
		const dir = self.generatePodcastDirname(ep, true);
		return Promise.resolve(
			new Promise(function(resolve, reject) {
				fs.stat(dir, function(err, data) {
					if (err !== null && err.code === "ENOENT")
						fs
							.mkdirAsync(dir)
							.catch(e => e.code === "EEXIST", () => null)
							.then(resolve);
					else if (err !== null) reject(err);
					else resolve();
				});
			})
		).then(function() {
			return dir + "/" + self.generateEpisodeFilename(ep);
		});
	};

	this.mark_as_downloaded = function(url) {
		return fs.appendFileAsync(config.log_file, url + "\n");
	};

	this.was_downloaded = function(url) {
		return fs
			.readFileAsync(config.log_file, "utf8")
			.then(s => s.split("\n"))
			.then(a => a.indexOf(url) !== -1)
			.catch(e => e.code === "ENOENT", () => false);
	};

	this.generateDownloadFnForEp = function(ep, cnt) {
		//cnt = counter
		const self = this;
		if (!(ep.enclosure && ep.enclosure.url)) {
			console.error("Could not download this episode: ", ep);
			return () => Promise.resolve();
		} else {
			return function() {
				return self
					.was_downloaded(ep.enclosure.url)
					.then(function(was_downloaded) {
						if (was_downloaded) {
							cnt.increment();
							console.log(
								ep.title,
								"already downloaded, skipping"
							);
							return null;
						} else {
							console.log("downloading", ep.title);

							return Promise.all([
								axios.request(ep.enclosure.url, {
									responseType: "stream",
									onDownloadProgress: function() {
										console.log(arguments);
									}
								}),
								self.generatePathForEp(ep)
							])
								.spread(function(response, file_path) {
									return new Promise(function(
										resolve,
										reject
									) {
										console.log(
											"Saving file",
											file_path,
											"..."
										);
										const destination = fs.createWriteStream(
											file_path
										);
										response.data.pipe(destination);
										response.data.on("end", resolve);
										destination.on("error", reject);
									});
								})
								.then(function() {
									cnt.increment();
									return self.mark_as_downloaded(
										ep.enclosure.url
									);
								})
								.then(
									() =>
										self.generatePodcastDirname(ep, false) +
										"/" +
										self.generateEpisodeFilename(ep)
								)
								.catch(function() {
									console.log(arguments);
								});
						}
					});
			};
		}
	};

	this.addPathsToWhatsNewPlaylist = function(paths_array) {
		const date_slug = dateSlug(new Date());
		return fs.writeFileAsync(
			path.resolve(config.download_dir, "new_on_" + date_slug + ".m3u"),
			paths_array.join("\n"),
			{ flag: "a" }
		);
	};

	this.downloadAll = function() {
		const self = this;
		return Promise.all(
			self.sources.map(source =>
				source.generateGettersForEpisodesFromLastNDays(MAX_LOAD_DAYS)
			)
		)
			.reduce((a, b) => a.concat(b), [])
			.then(function(eps) {
				const cnt = new Counter(eps.length);
				return Promise.map(
					eps.map(ep => self.generateDownloadFnForEp(ep, cnt)),
					fn => Promise.resolve(fn()),
					{
						concurrency: MAX_CONCURRENT_DOWNLOADS
					}
				);
			})
			.filter(e => e !== null)
			.then(self.addPathsToWhatsNewPlaylist)
			.then(() => console.log("ALL DONE"));
	};
}

module.exports = PodcastDownloader;
