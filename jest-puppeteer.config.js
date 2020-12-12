module.exports = {
	launch: { 
		executablePath: "google-chrome-unstable",
		args: [ "--no-sandbox" ],
	},
	server: {
		command: "yarn serve _site -l 5000",
		port: "5000"
	}
};
