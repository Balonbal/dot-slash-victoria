module.exports = {
	launch: { 
		executablePath: "google-chrome-unstable",
		args: [ "--no-sandbox" ]
	},
	server: {
		command: "bundle exec jekyll serve --trace",
		port: "4000"
	}
};
