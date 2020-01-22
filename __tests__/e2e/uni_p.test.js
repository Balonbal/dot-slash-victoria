const puppeteer = require("puppeteer");
const path = require("path");

const appBase = "http://localhost:5000";

const routes = {
	mainpage: appBase,
	uni_p: `${appBase}/tools/uni_p`, 
};
const NETWORK_TIMEOUT = 5000;

//Setup
beforeAll(async() => {
	try {
		await page.goto(routes.mainpage);
	} catch(err) {
		console.log(err);
	}
});

describe("uni_p", () => {
	describe("Navigation", () => {
		const id = "uni_pButton"; 
		test("navigates from mainpage", async() => {
			const link = await page.waitForSelector(`[data-testid='${id}']`);
			const url = await link.evaluate(node => node.href);
			await page.goto(url);
			expect(page.url()).toBe(routes.uni_p);
		});
		
	});
	describe("Meet selection", () => {
		let options;
		const testOptions = [ 1, 2, 3];

		test("fetches meet dropdown", async () => {
			do  {
				options = await page.$$eval("select[data-testid='meetSelect'] > option",
					opts => { 
						return opts.map(option => (
							{value: option.value, text: option.innerText}
						))}
				);
			} while (options.length < 2);
			expect(options[0].value.toLowerCase()).toBe("invalid");
			expect(parseInt(options[1].value)).toBeGreaterThanOrEqual(0);
		}, NETWORK_TIMEOUT);

		test.each(testOptions)("selecting meet from dropdown changes meet", async (index) => {
			expect(options.length).toBeGreaterThan(index);
			await page.select("select[data-testid='meetSelect']", options[index].value);

			await page.waitFor(2000);
			const meetName = await page.$eval("input[data-testid='meetDisplay']", input => { return input.value; });
			expect(meetName.length).toBeGreaterThan(0);
			expect(options[index].text).toContain(meetName.replace(/\d+/, "").trim());
		});

		test("can upload XML file", async () => {
			const XMLFile = path.relative(process.cwd(), __dirname + "/event_test_file_ts2020.xml");
			await page.waitForSelector("input[data-testid='importMeet']");
			const input = await page.$("input[data-testid='importMeet']");
			await input.uploadFile(XMLFile);
			const files = await page.$eval('input[type="file"]', input => { return input.files });
			const meetName = await page.$eval("input[data-testid='meetDisplay']", input => { return input.value; });

			// FIXME Should import xml to correct encoding
			expect(meetName).toMatch(/Tr.ndersv.m 2020/);
		});
	});

	describe("Club selection", () => {
		let input, select, button;
		beforeAll(async () => {
			input = await page.$("input[data-testid='clubInput']");
			display = await page.$("input[data-testid='clubDisplay']");
			button = await page.$("button[data-testid='clubButton']");
		});

		test("can add a club", async() => {
			const clubname = "NTNUI-Svømming";
			await input.click();
			await page.keyboard.type(clubname);
			await button.click();

			const clubtexts = await display.evaluate(d => d.value);
			expect(clubtexts).toBe(clubname);
		});
		
	});
	
});

