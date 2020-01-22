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
	
	describe("Theme selection", () => {
		let themeButton, themes;
		let defaultStyle;
		beforeAll(async() => {
			themeButton = await page.waitForSelector("button[data-testid='themeButton']");
			defaultStyle = await page.$eval("body", (body) => getComputedStyle(body).cssText);
		});

		test("has multiple themes", async() => {
			themes = await page.$$("div[data-testid='themeList'] > a");
			expect(themes.length).toBeGreaterThan(1);
		})

		test("selecting second theme changes style", async() => {
			// Expect multiple themes to be present
			await themeButton.click();
			await themes[1].click();
			const newStyle = await page.$eval("body", (body) => getComputedStyle(body).cssText);
			expect(newStyle).not.toBe(defaultStyle);
		});

		test("selecting first theme resets to default style", async () => {
			await themeButton.click();
			await themes[0].click();

			const newStyle = await page.$eval("body", (body) => getComputedStyle(body).cssText);
			expect(newStyle).toBe(defaultStyle);
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

