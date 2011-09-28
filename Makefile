npm:
	npm install

reset: clean npm

clean:
	rm -rf node_modules

.PHONY: npm reset clean
