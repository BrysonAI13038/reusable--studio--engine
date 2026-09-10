# Reusable Studio Engine

Run this command from the project folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/ in your integrated browser. Keep the terminal
running while using the preview; press Ctrl+C to stop the server.

The project uses JavaScript modules, so serve it over HTTP instead of opening
`index.html` as a `file://` URL. Use a browser preview that runs JavaScript.

You should see a white ring on a dark background. Move the pointer over the
preview and scroll up to build fracture intensity. Scroll down to lower it.
Intensity starts at zero, so scrolling down first has no visible effect.
When scrolling stops, the stored intensity slowly relaxes toward zero.
