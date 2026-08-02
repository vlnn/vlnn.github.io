serve: index.json
	python3 -m http.server 8000

index.json: notes/* tools/build_index.py
	uv run --project tools python tools/build_index.py notes index.json

rss.xml atom.xml: index.json tools/build_feed.mjs
	node tools/build_feed.mjs

test:
	uv run --project tools --group dev pytest tools -q

test-js:
	node vendor/test_app.mjs
	node vendor/test_feed.mjs

bundle:
	cd vendor && npm install && npx esbuild entry.mjs --bundle --format=esm --minify --alias:decode-named-character-reference=./node_modules/decode-named-character-reference/index.js --outfile=org.js

.PHONY: serve test test-js bundle
