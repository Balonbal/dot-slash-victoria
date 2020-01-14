module.exports = {
	launch: { 
		executablePath: "google-chrome-unstable",
		args: [ "--no-sandbox" ]
	},
	server: {
		command: "yarn run serve",
		port: "4000"
	}
};
