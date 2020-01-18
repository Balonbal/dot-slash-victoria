const puppeteer = require("puppeteer");
const path = require("path");
const faker = require("faker");

const appBase = "http://localhost:5000";

const routes = {
	mainpage: appBase,
	uni_p: `${appBase}/tools/uni_p`, 
};
const NETWORK_TIMEOUT = 5000;
const events = {
	"individual": [
		{ style: "FR", length: 400 },
		{ style: "RY", length: 50  },
		{ style: "BR", length: 100 },
		{ style: "BU", length: 100 },
		{ style: "RY", length: 100 },
		{ style: "BR", length: 50  },
		{ style: "IM", length: 200 },
		{ style: "FR", length: 100 },
		{ style: "BU", length: 50  },
		{ style: "BR", length: 200 },
		{ style: "FR", length: 50  },
		{ style: "BU", length: 200 },
	],
	"team": [
		{ style: "FR", length: "4*50"  },
		{ style: "LM", length: "4*50"  },
		{ style: "FR", length: "4*100" },
	]
}

function create_individual(num_events) {
	const now = new Date();
	const individual = {
		name: faker.name.findName(),
		sex: Math.round(Math.random()) ? "FEMALE" : "MALE",
		birthYear: faker.date.between(new Date(now.getFullYear() - 60), new Date(now.getFullYear()) - 10).getFullYear(),
		events: [],
	};
	num_events = num_events || (1 + Math.floor(Math.random()*4));
	while (individual.events.length < num_events) {
		const index = Math.floor(Math.random() * events.individual.length);
		const evt = events.individual[index];
		let skip = false;
		for (let j = 0; j < individual.events; ++j) {
			const ievt = individual.events[j];
			if (ievt.style == evt.style && ievt.length == evt.length) skip = true;
		}
		if (!skip) individual.events.push(evt);
	}

	return individual

}

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
			await page.click("select[data-testid='meetSelect']");
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
			// TODO Await network indication that we can wait on
			// for now, add a delay such that the event can be fetched before we continue
			// as the callback function will overwrite the selected meet
			await page.waitFor(2000);
			const meetName = await page.$eval("input[data-testid='meetDisplay']", input => { return input.value; });
			// For whatever reason the title does not have to be the same as in the event list
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
			select = await page.$("select[data-testid='clubSelect']");
			button = await page.$("button[data-testid='clubButton']");
		});


		const clubname = "__dsv_e2e_test_club__";
		test("can add a club", async() => {
			await input.click();
			await page.keyboard.type(clubname);
			await button.click();

			const selectedVal = await select.evaluate((sel) => sel.value);
			expect(selectedVal).toBe(clubname);
		});

		test("adding another club changes active club", async () => {
			const testClub = "__dsv_e2e_other_test_club__";
			// Clear input field
			await input.click({clickCount: 3}); // Clicking three times selects all text
			await input.press("Backspace");
			const inputVal = await input.evaluate((inp) => inp.value);
			expect(inputVal).toBe("");

			// Set new name
			await page.keyboard.type(testClub);
			await button.click();

			// Verify the active club has changed
			const selectedVal = await select.evaluate((sel) => sel.value);
			expect(selectedVal).toBe(testClub);
		});

		test("changing with select is possible", async () => {
			await select.select(clubname);
			const selectedVal = await select.evaluate((sel) => sel.value);
			expect(selectedVal).toBe(clubname);
		})
		
	});
	
	describe("Event Editor", () => {
		const individuals = [];
		for (let i = 0; i < 5; ++i) individuals.push(create_individual());

		describe.each(individuals)("Add individual", (individual) => {
			let name;
			let birth;
			let sex;
			let eventList;
			let eventTable;
			// Add person 
			test("add person", async () => {

				const numberOfIndividuals = (await page.$$(".personRow")).length;
				//TODO remove the need for this wait
				await page.waitFor(1000);
				const button = await page.$("a[data-testid='addPersonButton']");
				expect(button).toBeDefined();
				await button.click(); 
				const n = (await page.$$(".personRow")).length;
			
				expect(n).toBe(numberOfIndividuals + 1);

				const nameFields = await page.$$(".personName > input");
				name = nameFields[nameFields.length - 1];
				expect(name).toBeDefined();
				const birthFields = await page.$$(".age > input");
				birth = birthFields[birthFields.length - 1];
				expect(birth).toBeDefined();
				const sexFields = await page.$$(".sex > select");
				sex = sexFields[sexFields.length - 1];
				expect(sex).toBeDefined();
				const eventListFields = await page.$$(".events");
				eventList = eventListFields[eventListFields.length - 1];
				expect(eventList).toBeDefined();
				const eventTables = await page.$$(".eventTable");
				eventTable = eventTables[eventTables.length - 1];
				expect(eventTable).toBeDefined();
			});

			test("set name", async () => {
				await name.type(individual.name);
				const nameValue = await name.evaluate((node) => node.value);
				expect(nameValue).toBe(individual.name);
			});

			test("set age", async () => {
				await birth.click({clickCount: 3});
				await birth.press("Backspace");

				await birth.type(String(individual.birthYear));
				const ageValue = parseInt(await birth.evaluate((node) => node.value));
				expect(ageValue).toBe(individual.birthYear);
			});

			test("set sex", async() => {
				await sex.select(individual.sex == "FEMALE" ? "K" : "M");
				const selectedSex = await sex.evaluate((node) => node.value);
				if (individual.sex == "FEMALE") {
					expect(selectedSex).toBe("K");
				} else {
					expect(selectedSex).toBe("M");
				}

			});

			test.each(individual.events)("add event", async(evt) => {
				// Assert there is exactly one event selected
				expect.assertions(1)
				page.waitFor(500);
				const events = await eventTable.$$("tr");
				
				for (let i = 1; i < events.length; ++i) {
					const ievt = events[i];
					const evtName = await ievt.$eval(".eventName", (node) => node.innerText);
					if (evtName == evt.length + "m " + evt.style) {
						const willSwim = await ievt.$(".willSwim > input");
						let checked;
						// FIXME this should only have to be clicked once
						do {
							await willSwim.click();
							checked = await willSwim.evaluate((node) => node.checked);
						} while (!checked)

						const evtString = await eventList.evaluate((node) => node.innerText);
						expect(evtString).toContain(evtName);
					}
				}
			});
		});
	});
});

