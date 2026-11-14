# Dream Team Hub
This site needs some work

## Adding a project
Add it to `js/projects.js`, then run `node scripts/build-home.mjs`. That writes the cards into
`index.html` (so search engines see them without JavaScript) and refreshes `sitemap.xml`.

## Telling Bing about changes (IndexNow)
After a change goes live, run `node scripts/indexnow.mjs <changed page URLs>` (or with no URLs, every
site's home page). Each site serves the public key file `c75ce44647b970c654a57892aa7e12b2.txt`.
