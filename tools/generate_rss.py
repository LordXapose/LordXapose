#!/usr/bin/env python3
"""Generate the static RSS feed from the published blog index."""

import argparse
import json
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site-url", required=True, help="Published site root URL, including any path prefix")
    args = parser.parse_args()
    parsed_url = urlparse(args.site_url)
    if parsed_url.scheme != "https" or not parsed_url.netloc:
        parser.error("--site-url must be an absolute HTTPS URL")
    site_url = args.site_url.rstrip("/") + "/"

    posts = json.loads((ROOT / "blog/posts.json").read_text(encoding="utf-8"))
    if not isinstance(posts, list):
        raise ValueError("blog/posts.json must contain a JSON array")

    rss = ET.Element("rss", {"version": "2.0"})
    channel = ET.SubElement(rss, "channel")
    ET.SubElement(channel, "title").text = "Kaushal Patidar — Writing"
    ET.SubElement(channel, "link").text = urljoin(site_url, "index.html#blog")
    ET.SubElement(channel, "description").text = "Security research, engineering, and field notes."
    ET.SubElement(channel, "language").text = "en"
    ET.SubElement(channel, "lastBuildDate").text = datetime.now(timezone.utc).strftime(
        "%a, %d %b %Y %H:%M:%S GMT"
    )

    for post in sorted(posts, key=lambda entry: entry["date"], reverse=True):
        post_date = date.fromisoformat(post["date"])
        link = urljoin(site_url, f"blog.html?slug={quote(post['slug'])}")
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = post["title"]
        ET.SubElement(item, "link").text = link
        ET.SubElement(item, "guid", {"isPermaLink": "false"}).text = link
        ET.SubElement(item, "description").text = post["summary"]
        ET.SubElement(item, "pubDate").text = datetime.combine(
            post_date, datetime.min.time(), timezone.utc
        ).strftime("%a, %d %b %Y %H:%M:%S GMT")
        for tag in post.get("tags", []):
            ET.SubElement(item, "category").text = tag

    ET.indent(rss, space="  ")
    output = ROOT / "feed.xml"
    ET.ElementTree(rss).write(output, encoding="utf-8", xml_declaration=True)
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
