module.exports = {
	launch: { 
		executablePath: "google-chrome-unstable",
		args: [ "--no-sandbox" ]
	},
	server: {
		command: "./startserver.sh",
		port: "4000"
	}
};
