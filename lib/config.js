"use strict";
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

const CONFIG_FILE = "~/.podcast-downloader.yml";

function resolveHome(filepath) {
    if (filepath[0] === "~") {
        return path.join(process.env.HOME, filepath.slice(1));
    }
    return filepath;
}

const config = yaml.safeLoad(fs.readFileSync(resolveHome(CONFIG_FILE), "utf8"));

["download_dir", "log_file"].forEach(
    prop => config[prop] = resolveHome(config[prop])
);

module.exports = config;
