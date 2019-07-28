function ce(i) { return document.createElement(i); }

let meetData = {
	events: [
	],
	participants: [],
}

let club;

let allMeets;

function addMeets(meets) {
	allMeets = meets;
	const select = document.getElementById("importMedley");
	for (let i in meets) {
		const meet = meets[i];
		const node = document.createElement("option");
		node.innerText = "[" + meet.startDate.toLocaleDateString() + "] " + meet.organizer + ": " + meet.name;
		node.value = i;
		select.appendChild(node);
	}
}

function importMeet(data) {
	const changeMeet = function(data) {
		try {
			const meet = {
				name: getNode(data, "MeetName"),
				events: [],
				participants: [],
			}
			for (let i in data.Events.Event) {
				const evt = data.Events.Event[i];
				const e = {

					index: parseInt(getNode(evt, "EventNumber")),
					distance: getNode(evt, "EventLength"),
					style: getStyle(getNode(evt, "Eventart") || getNode(evt, "EventArt")),
					sex: getNode(evt, "Sex") == "MALE" ? "M" : (getNode(evt, "Sex") == "FEMALE" ? "K" : "Mix"),
				}
				meet.events.push(e);
			}
			//Successful import
			meetData = meet;

			$(".personRow, .teamRow, .edit").remove();
			document.getElementById("noMeet").classList.add("hidden");
			document.getElementById("clubSettings").classList.remove("hidden");
			document.getElementById("meetName").value = meetData.name;

		} catch (e) { console.log(e) };

	}
	if (meetData.participants.length != 0) {
		showModal("confirmationBox",
			document.createTextNode("You have entered participants to the selected meet, are you sure you want to change meet? All unsaved data will be discarded."),
			function () { changeMeet(data); },
			function () {},
			{ header: "Are you sure you want to change meet?" });
	} else {
		changeMeet(data);
	}
}

function isTeamEvent(evt) {
	if (evt.style == "LM") return true;
	if (evt.distance.match(/\d+\*\d{2,}/)) return true;
	return false;
}

function hasTeamEvents() {
	for (let i in meetData.events) {
		const e = meetData.events[i];
		if (isTeamEvent(e)) return true;
	}
	return false;
}

function updateClubSelection(clubName) {
	document.getElementById("participantsContainer").classList.remove("hidden");
	enableTab("participantBar", "participantSingle", false);
	if (hasTeamEvents()) enableTab("participantBar", "participantTeam");
}

function addClubSelection(clubName) {
	if (clubInList(clubName)) {
		updateClubSelection(clubName);
		return;
	}
	const node = document.createElement("option");
	node.selected = true;
	node.innerText = clubName;
	node.value = clubName;
	document.getElementById("activeClub").appendChild(node);
	document.getElementById("activeClub").disabled = false;
	const evt = document.createEvent("HTMLEvents");
	evt.initEvent("change", false, true);
	document.getElementById("activeClub").dispatchEvent(evt);

}

function getEvent(index) {
	for (let i in meetData.events) {
		const evt = meetData.events[i];
		if (evt.index == index) return evt;
	}
	return false;
}

function hideEditors() {
	const editors = document.getElementsByClassName("edit");
	for (let i = 0; i < editors.length; i++) {
		editors[i].classList.add("hidden");
	}
}

function createUNIP(meetData) {
	meetData.participants.sort();

	str = club + "\n";
	for (let i in meetData.participants) {
		const person = meetData.participants[i];
		let params = [];
		for (let j in person.events) {
			const evt = person.events[j];
			const meetEvent = getEvent(evt.index);
			const time = (evt.min != "00" || evt.sec != "00" || evt.hun != "00") ? evt.min +":" + evt.sec + "." + evt.hun : "";

			params = [
				evt.index,
				getEvent(evt.index).distance,
				getEvent(evt.index).style,
				person.team ? person.name : person.name.substring(person.name.lastIndexOf(" ") + 1),
				person.team ? "" : person.name.substring(0, person.name.lastIndexOf(" ")),
				"",
				meetEvent.sex + person.team ? person.class :("" + person.birthYear).substring(2),
				person.team ? person.class : person.birthYear,
				time,
				"",
				"",
				"",
				"",
				"K",
				"",
				""
			];
			str += params.join(",") + "\n";
		}

	}
	return str;
}

function fixSex(person) {
	for (let i in person.events) {
		const e = person.events[i];
		for (let j in meetData.events) {
			const candidate = meetData.events[j];
			if (candidate.sex != person.sex) continue;
			if (candidate.distance != e.distance) continue;
			if (candidate.style != e.style) continue;
			e.index = candidate.index;
			break;
		}
	}
}

function getE(node, name) {
	return node.querySelectorAll("." + name)[0];
}

function getT(node, name) {
	return node.getElementsByTagName(name)[0];
}

function setFields(node, value) {
	getT(node, "input").value = value;
}

function colChangeListener(node, func, type) {
	type = type || "input";
	getT(node, type).addEventListener("input", func);
	getT(node, type).addEventListener("change", func);
	getT(node, type).addEventListener("keyup", func);
}

function getEventString(person) {
	let s = "";
	for (let i = 0; i < person.events.length; i++) {
		const e = person.events[i];
		s += e.distance + "m " + e.style;
		if (i != person.events.length -1) s += ", ";
	}
	if (s == "") s = "<a href='javascript:void(0)'>Add events...</a>";
	return s;
}


function initEditor(person, table, span) {
	const t = document.getElementById("eventDummy");

	for (let i in meetData.events) {
		const e = meetData.events[i];
		if (e.sex != "Mix" && e.sex != person.sex) continue;
		if (isTeamEvent(e) ^ person.team) continue;

		const node = document.importNode(t.content, true);
		const willSwim = getE(node, "willSwim");
		const index = getE(node, "eventId");
		const name = getE(node, "eventName");
		const time = getE(node, "eventTime");

		getT(willSwim, "input").checked = false;
		let personEvent;
		for (let j in person.events) {
			const c = person.events[j];
			if (c.index == e.index) {
				personEvent = c;
				getT(willSwim, "input").checked = true;
			}
		}
		personEvent = personEvent || { index: e.index, distance: e.distance, style: e.style, min: "00", sec: "00", hun: "00" };
		index.innerText = e.index;

		name.innerText = e.distance + "m " + e.style;

		getE(time, "min").value = personEvent.min;
		getE(time, "sec").value = personEvent.sec;
		getE(time, "hun").value = personEvent.hun;

		const addTimeListener = function (name) {
			const func = function() {
				let value = parseInt(getE(time, name).value);
				if (value < 0) value = 0;
				if (value > 59 && name != "hun") value = 59;
				if (value > 99) value = 99;
				value = (value < 10 ? "0" : "") + value;

				["min", "sec", "hun"].forEach(function (el) {
					if (!validateEventTime(personEvent)) {
						getE(time, el).setCustomValidity("This does not look like a time for " + personEvent.distance + "m " + personEvent.style);
					} else {
						getE(time, el).setCustomValidity("");
					}
				});
				getE(time, name).value = value;
				personEvent[name] = value;
				getT(willSwim, "input").checked = true;
				const evt = document.createEvent("HTMLEvents");
				evt.initEvent("change", false, true);
				getT(willSwim, "input").dispatchEvent(evt);
			}
			const next = function() {
				//Both numbers
				if (getE(time, name).value.length == 2) {
					if (name == "min") getE(time, "sec").focus();
					if (name == "sec") getE(time, "hun").focus();
					getE(time, name).blur();
					func();
				}
			}
			const focus = function () {
				getE(time, name).select();
			}
			getE(time, name).addEventListener("change", func);
			getE(time, name).addEventListener("keyup", next);
			getE(time, name).addEventListener("focus", focus);

		}


		addTimeListener("min");
		addTimeListener("sec");
		addTimeListener("hun");

		//Add event listeners
		colChangeListener(willSwim, function() {
			let pos;
			for (let k = 0; k < person.events.length; k++) {
				if (personEvent.index == person.events[k].index) pos = k;
			}
			if (getT(willSwim, "input").checked) {
				if (typeof pos == "undefined") person.events.push(personEvent);
			} else {
				if (typeof pos !== "undefined") person.events.splice(pos, 1);
			}
			person.events.sort(function (a,b) { return a.index - b.index; });
			span.innerHTML = getEventString(person);
		});
		span.innerHTML = getEventString(person);

		table.appendChild(node);
	}
}

function appendTeam(team) {
	team = team || {};
	team.name = team.name || "";
	team.sex = team.sex || "M";
	team.class = team.class || "JR";
	team.events = team.events || [];
	team.club = team.club || club;
	team.team = true;

	hideEditors();
	const t = document.getElementById("teamDummy");
	const n = document.importNode(t.content, true);
	const node = n.children[0];

	const name = getE(node, "teamName");
	const cls = getE(node, "teamClass");
	const sex = getE(node, "teamSex");
	const events = getE(node, "teamEvents");

	sex.getElementsByTagName("option")[["M", "K", "MIX"].indexOf(team.sex)].selected = true;
	cls.getElementsByTagName("option")[["JR", "SR"].indexOf(team.class)].selected = true;

	const suggestName = function () {
		let i = 1;
		for (let p in meetData.participants) {
			const t = meetData.participants[p];
			if (!t.team) continue;
			if (t == team) break;
			if (t.sex != team.sex) continue;
			if (t.class != team.class) continue;
			i++;
		}
		let gender = "Mix ";
		if (team.sex == "M") gender = "G";
		if (team.sex == "K") gender = "J";
		team.name = club + " " + gender + i + " " + team.class;
		setFields(name, team.name);
	}
	suggestName();
	colChangeListener(cls, function () {
		team.class = getT(cls, "select").value;
		suggestName();
	}, "select");
	colChangeListener(sex, function () {
		team.sex = getT(sex, "select").value;
		fixSex(team);
		const evs = getE(editor, "eventTable").firstElementChild;
		getE(editor, "eventTable").innerHTML = "";
		getE(editor, "eventTable").appendChild(evs);
		initEditor(team, getE(editor, "eventTable"), events);

		suggestName();
	}, "select");
	colChangeListener(name, function () {
		team.name = getT(name, "input").value;
	});

	const editor = n.children[1];
	initEditor(team, getE(editor, "eventTable"), events);

	node.addEventListener("click", function() {
		hideEditors();
		if (editor.classList.contains("hidden")) editor.classList.remove("hidden");
		else editor.classList.add("hidden");
	});

	meetData.participants.push(team);
	const prev = document.getElementById("teamList").lastChild.lastElementChild;
        document.getElementById("teamList").lastChild.insertBefore(node, prev);
        document.getElementById("teamList").lastChild.insertBefore(editor, prev);

	if (translator) translator.Translate();
}

function appendParticipant(person) {
	person = person || {};
	person.name = person.name || "";
	person.sex = person.sex || "M";
	person.birthYear = person.birthYear || new Date().getFullYear() - 14;
	person.events = person.events || [];
	person.club = person.club || club;

	hideEditors();
	const t = document.getElementById("participantDummy");
	const n = document.importNode(t.content, true);;
	const node = n.children[0];

	const name = getE(node, "personName");
	const age = getE(node, "age");
	const sex = getE(node, "sex");
	const events = getE(node, "events");

	setFields(name, person.name);
	setFields(age, person.birthYear);
	sex.getElementsByTagName("option")[person.sex == "M" ? 0 : 1].selected = true;

	colChangeListener(name, function() {
		person.name = getT(name, "input").value;
	});

	colChangeListener(age, function () {
		person.birthYear = getT(age, "input").value;
		const valid = validateAge(person.birthYear);
		if (valid !== true) {
			getT(age, "input").setCustomValidity(valid.error);
		} else {
			getT(age, "input").setCustomValidity("");
		}
	});



	const editor = n.children[1];
	node.addEventListener("click", function () {
		hideEditors();
		if (editor.classList.contains("hidden")) editor.classList.remove("hidden");
		else editor.classList.add("hidden");
	});

	initEditor(person, getE(editor, "eventTable"), events);
	meetData.participants.push(person);
	colChangeListener(sex, function () {
		person.sex = getT(sex, "select").value;
		fixSex(person);
		const evs = getE(editor, "eventTable").firstElementChild;
		getE(editor, "eventTable").innerHTML = "";
		getE(editor, "eventTable").appendChild(evs);
		initEditor(person, getE(editor, "eventTable"), events);
	}, "select");
	const prev = document.getElementById("participantList").lastChild.lastElementChild;
	document.getElementById("participantList").lastChild.insertBefore(node, prev);
	document.getElementById("participantList").lastChild.insertBefore(editor, prev);

	if (translator) translator.Translate();
}

	/* check for errors first and enable make UNI_p file
	 after error checks are complete, check for warnings
	 write DONE if front of each point when they are implemented

	 Errors:
	 - no meet selected
	 - club name is not set
	 - No Athlete or no relay Teams are registered correctlly
	 - Athlete has no name and are active
	 - relay team has no name and are active
	 - qualification time is too low (world record or something like that)


	 Warnings:
	 - No qualification time is registered for athlete or Team relays
	 - qualification time is too high (maybe it should be based on speed in water?)
	 - Age is out of sensible range (5 - 100 years)
	 - Athletes name contains less than two words (no last name registered)
	 - Athlete has registered qualification time but is not activated. They will not be registered
	 - relay team har registered qualification time but is not activated. They will not be registered
	 - There are more athlete spots in relays than total number of athletes in individuals

	 Info:
	 - No Teams are registered though individual athletes are registered
	 - No individual athletes are registered though relay teams are registered
	 - Relay team's name does not follow recomended naming convention (might create a duplicate in JechSoft Victoria)
	 */

function validateTeamName(name) {
	return name.length > 1;
}

function validatePersonName(name) {
	if (name.length < 3) return {error: "Too short", value: name};
	if (!name.match(/^(.+) (.+)$/)) return {error: "notTwoNames", value: name};
	return true;
}

function validateAge(age) {
	const i = parseInt(age);
	if (!i) return {error: "NaN", value: age};
	const year = new Date().getFullYear();
	if (year - i < 5) return {error: "tooYoung", value: year-i};
	if (year - i >120) return {error: "tooOld", value: year-i};
	return true;
}

function validateEventTime(evt) {
	if (evt.min == "00" && evt.sec == "00" && evt.hun == "00") return true;

	//TODO add plausable time range for events
	return false;
}

function validateParticipant(participant) {
	let errors = [];
	const nameValid = participant.team ? validateTeamName(participant.name) : validatePersonName(participant.name);
	const ageValid = participant.team ? true : validateAge(participant.birthYear);
	if (nameValid !== true) errors.push({error: nameValid.error, value: participant});
	if (ageValid !== true) errors.push({error: ageValid.error, value: participant});
	for (let i in participant.events) {
		const evt = participant.events[i];
		if (!validateEventTime(evt)) errors.push({type:"invalidTime", value: {participant: participant, evt: evt}});
	}

	return errors;
}

function clubInList(club) {
	return ($("#" + club).filter(function() {
		return $(this).text().toLowerCase() == club.toLowerCase()
	})).length != 0;
}

function validateClub() {
	if (club.length < 1) return {error: "tooShort", value: club};
	return true;
}

function getParticipantEl(part) {
	const els = document.getElementsByClassName(part.team ? "teamRow" : "personRow");
	for (let i in els) {
		const e = els[i];
		if (getT(getE(e, "personName"), "input").value != part.name) continue;
		if (getT(getE(e, "age"), "input").value != part.birthYear) continue;
		return e;
	}
	return false;
}

function getEventEl(editor, index) {
	return $(editor).find("td.eventId").filter((i, node) => {
		return node.innerText == index;
	}).parent();
}

function validateAll() {
	let errors = [];
	for (let i in meetData.participants) {
		const p = meetData.participants[i];
		const err = validateParticipant(p);
		const el = getParticipantEl(p);
		const editor = el.nextSibling;
		$(el).removeClass("table-warning");
		$(editor).find("tr").removeClass("table-warning");
		for (let j in err) {
			const e = err[j];

					console.log(e.value);
			switch (e.type) {
				case "invalidTime":
					getEventEl(editor, e.value.evt.index).addClass("table-warning");
					break;
				default:
					el.classList.add("table-warning");
			}
			errors.push(e);
		}
	}
}

window.addEventListener("load", function() {
	document.getElementById("participantList").lastChild.lastElementChild.addEventListener("click", function () {appendParticipant(); });
	document.getElementById("teamList").lastChild.lastElementChild.addEventListener("click", function() { appendTeam() });
	document.getElementById("makeUnip").addEventListener("click", function() {
		const unip = createUNIP(meetData);
		download("uni_p-" + meetData.name + "_" + club + ".txt", unip);
	});
	document.getElementById("importFile").addEventListener("change", function(e) {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.addEventListener("load", function(e) {
			const xml = parseXml(e.target.result);
			importMeet(xml.MeetSetUp);
		});
		reader.readAsText(file);

	});
	const clubs = [];
	$("#activeClub").on("click", () => {
		if (clubs.length == 0) {
			const dummy = $("<option>")
				.text("Fetching...")
				.val("-1")
				.attr("selected", "selected")
				.appendTo("#activeClub");
			getClubList(function (cs) {
				for (let i in cs) {
					const c = cs[i];
					$("<option>")
						.text(c)
						.val(c)
						.appendTo($("#activeClub"));
					clubs.push(c);
				}
				dummy.text("-- Select one --");
			});
		}

	});
	document.getElementById("activeClub").addEventListener("change", function() {
		club = document.getElementById("activeClub").value;
		if (club == "-1") return;
		updateClubSelection(club);
	});
	$("#showAddClub").on("click", () => {
		$("#showAddClub").addClass("hidden");
		$("#setClubName").removeClass("hidden");
	});
	document.getElementById("addClub").addEventListener("click", function() {
		clubs.push($("#clubName").val);
		addClubSelection(document.getElementById("clubName").value);
		document.getElementById("clubSelection").classList.remove("hidden");
		showTab(document.getElementById("participantBar"), document.getElementById("participantSingle"), false);
	});
	document.getElementById("importMedley").addEventListener("click", function() {
		if (typeof allMeets == "undefined") {
			const node = document.createElement("option");
			node.value = "invalid";
			node.innerText = "Fetching list...";
			document.getElementById("importMedley").appendChild(node);
			getMedleyList(function (list) {
				addMeets(list);
				node.innerText = "-- Select one --";
			});
		}
	});
	document.getElementById("importMedley").addEventListener("change", function() {
		if (document.getElementById("importMedley").value == "invalid") return;
		const meet = allMeets[document.getElementById("importMedley").value];
		console.log("Fetching " + meet.url);
		getMedleyMeet(meet.url, function (text) {
			const xml = parseXml(text);
			importMeet(xml.MeetSetUp);
		});
	});

});


const expectedTimes = {
	"BF":
	{
		"25" : { "min" : 10, "max" : 3600 },
		"50" : { "min" : 22 , "max" : 3600 },
		"100" : { "min" : 49 , "max" : 3600 },
		"200" : { "min" : 91 , "max" : 3600 }
	},
	"RY":
	{
		"25" : { "min" : 11 , "max" : 3600 },
		"50" : { "min" : 24 , "max" : 3600 },
		"100" : { "min" : 51 , "max" : 3600 },
		"200" : { "min" : 91 , "max" : 3600 }

	},
	"BR":
	{
		"25" : {"min" : 12 , "max" :	3600 },
		"50" : {"min" : 25 , "max" : 3600 },
		"100" : {"min" : 57, "max" : 3600 },
		"200" : {"min" : 126 , "max" : 3600 }
	},
	"FR":
	{
		"25" : {"min" : 9 , "max" : 3600	},
		"50" : {"min" : 20 , "max" : 3600 },
		"100" : {"min" : 46 , "max" : 3600 },
		"200" : {"min" : 82 , "max" : 3600 },
		"400" : {"min" : 220 , "max" : 3600 },
		"800" : {"min" : 452 , "max" : 3600 },
		"1500" : {"min" : 871 , "max" : 3600 }
	},
	"IM":
	{
		"100" : {"min" : 46 , "max" : 3600 },
		"200" : {"min" : 94 , "max" : 3600 },
		"400" : {"min" : 188 , "max" : 3600 }
	}
}