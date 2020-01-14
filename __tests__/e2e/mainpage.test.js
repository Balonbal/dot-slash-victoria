const puppeteer = require("puppeteer");

const appBase = "http://localhost:5000";

const routes = {
	mainpage: appBase,
};
//Setup
beforeAll(async() => {
	try {
		await page.goto(routes.mainpage);
	} catch(err) {
		console.log(err);
	}
});

describe("Mainpage", () => {
	describe("Mainpage links are visible", () => {
		const links = [ 
			{ id: "uni_pButton", text: "uni_p" } 
		];
		for (let i in links) {
			const id = links[i].id;
			const expectedText = links[i].text;
			test(`Link ${id} contains text "${expectedText}"`, async() => {
				const link = await page.waitForSelector(`[data-testid='${id}']`);
				const name = await link.evaluate(node => node.innerText);
				expect(name.toLowerCase()).toContain("uni_p");
			});
		}
	});
});

