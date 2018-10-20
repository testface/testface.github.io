# JSON Load

A sample of rendering a JSON data file (a list of articles) into a page with thumbnails, titles, and descriptions.

# Demo

https://testface.github.io/json-load

# Structure

This is a Vue app built from three components:
* The list of articles (loads a JSON data file)
* Each article summary (enumerates with v-for)
* The video modal (shows/hides with v-if)

The `article-list` component fetches the data file using AJAX.

The `article-summary` component is rendered in a list inside `article-list`.

When a video article link is clicked, it activated the `video-modal` component, which loads the video by ID.

