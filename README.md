# Podcast Downloader

A simple node.js-based tool that fetches RSS feeds for podcasts and downloads them to a spceified directory.

It doesn't download the episodes it already has downloaded.

My personal setup for this is to run the script once every week and copy all the files to my mp3. Once I'm finished listening to an episode, I delete it from the mp3.

## Configuration

The script will look for the configuration in `~/.podcast-downloader.yml`.

Example configuration:


```yaml
download_dir: "~/podcasts"  # where to download the podcasts
log_file: "~/.podcast-downloader.log" # where to store the download log (better to keep as-is).
podcasts:
# Hidden Brain    
    - https://www.npr.org/rss/podcast.php?id=510308
# On Being with Krista Tippet
    - https://onbeing.org/feed/podcast
# TED Radio Hour    
    - https://www.npr.org/rss/podcast.php?id=510298
# Mozilla IRL	
    - https://feeds.mozilla-podcasts.org/irl
```
