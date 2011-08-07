npm:
	npm install
	PKG_CONFIG_PATH="/usr/local/lib/pkgconfig" npm install zeromq@0.5.1
	npm ls

reset: clean npm

clean:
	rm -rf node_modules

.PHONY: npm reset clean
