# Publishing blog posts

The blog is file-based and works with this static website. Add or edit posts directly in GitHub; no CMS account, API key, or database is needed.

The root `.nojekyll` file keeps Markdown files available to the site's renderer on GitHub Pages. Posts not listed in `blog/posts.json` remain unpublished.

## Publish a post

1. Copy `blog/posts/_template.md` to a new file such as `blog/posts/web3-security-notes.md`.
2. Write the article in Markdown.
3. Add an entry to `blog/posts.json`:

   ```json
   [
     {
       "slug": "web3-security-notes",
       "title": "Web3 Security Notes",
       "date": "2026-11-25",
       "summary": "A short introduction shown in the writing list.",
       "tags": ["Web3", "Security"]
     }
   ]
   ```

4. Commit and push both files. The post appears once the site is deployed.

To edit a post, update its Markdown file. To change the title, date, summary, or tags, edit the matching entry in `blog/posts.json`. Keep each slug lowercase, use hyphens between words, and make it match the Markdown filename.

Supported Markdown includes headings, paragraphs, bold and italic text, inline and fenced code, links, lists, and blockquotes. Raw HTML is not rendered.

The writing list can be filtered by tag. Article pages show estimated reading time and build a table of contents from Markdown headings.

## Generate the RSS feed

After changing `blog/posts.json`, generate `feed.xml` with the actual public site URL (including a GitHub Pages repository path if applicable):

```sh
python tools/generate_rss.py --site-url https://your-published-site.example/
```

Commit the generated `feed.xml` with the post files. The generator uses only Python's standard library; the site URL is required so feed readers receive valid absolute links.
