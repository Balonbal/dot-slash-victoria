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
	
	describe.skip("Theme selection", () => {
		let themeButton, themes;
		beforeAll(async() => {
			themeButton = await page.waitForSelector("button[data-testid='themeButton']");
			themes = await page.$$("div[data-testid='themeList']");
		});

		const styles = [2, 1];
		test.todo("selecting second theme changes style", async() => {
			await themeButton.click();
			
		});
	});

	describe("Language selection", () => {
		let languageButton, languages;
		beforeAll(async() => {
			languageButton = await page.waitForSelector("button[data-testid='languageButton']");
			languages = await page.$$("div[data-testid='languageList'] > a");
		});

		const languagesToTest = [ 
			{id: 1, expectedHeader: "./victoria - hjelpeverktøy for svømmere"},
			{id: 0, expectedHeader: "./victoria - helper tools for swimmers" },
		];
		test.each(languagesToTest)("changing language changes text", async (language) => {
			const id = language.id;
			const expectedHeader = language.expectedHeader;
			await languageButton.click();
			await page.waitForSelector(`div[data-testid='languageList'] > a:nth-child(${id + 1})`, { visible: true });
			await languages[id].click();
			const text = await page.$eval("h1[data-testid='header']", node => node.innerText );
			expect(text).toBe(expectedHeader);
		});
	})
});

