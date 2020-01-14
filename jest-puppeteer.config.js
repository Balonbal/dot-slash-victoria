module.exports = {
	launch: { 
		executablePath: "google-chrome-unstable",
		args: [ "--no-sandbox" ]
	},
	server: {
		command: "yarn serve _site",
		port: "5000"
	}
};
