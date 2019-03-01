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
				style: getStyle(getNode(evt, "Eventart")), 
				sex: getNode(evt, "Sex") == "MALE" ? "M" : (getNode(evt, "Sex") == "FEMALE" ? "K" : "Mix"),
			}
			meet.events.push(e);
		}
		//Successful import
		meetData = meet;
		document.getElementById("noMeet").classList.add("hidden");
		document.getElementById("participantBar").classList.remove("hidden");
		document.getElementById("meetName").value = meetData.name;

	} catch (e) { console.log(e) };
}

function isTeamEvent(evt) {
	if (evt.style == "LM") return true;
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
	enableTab("participantBar", "participantSingle");
	if (hasTeamEvents()) enableTab("participantBar", "participantTeam");
}

function addClubSelection(clubName) {
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

function createUNIP(meetData) {
	meetData.participants.sort();

	str = club + "\n";
	for (let i in meetData.participants) {
		const person = meetData.participants[i];
		let params = [];
		for (let j in person.events) {
			const evt = person.events[j];
			params = [
				evt.index,
				getEvent(evt.index).distance,
				getEvent(evt.index).style,
				person.name.substring(person.name.lastIndexOf(" ") + 1),
				person.name.substring(0, person.name.lastIndexOf(" ")),
				"",
				person.sex + ("" + person.birthYear).substring(2),
				person.birthYear,
				evt.min+":"+evt.sec+"."+evt.hun,
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
	if (s == "") s = "<a href='#'>Add events...</a>";
	return s;
}


function initEditor(person, table, span) {
	const t = document.getElementById("eventDummy");

	for (let i in meetData.events) {
		const e = meetData.events[i];
		if (e.sex != person.sex) continue;
		if (isTeamEvent(e) && !person.team) continue;

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
		personEvent = personEvent || { index: e.index, distance: e.distance, style: e.style, min: 0, sec: 0, hun: 0 };
		index.innerText = e.index;

		name.innerText = e.distance + "m " + e.style;
		
		getE(time, "min").value = personEvent.min;
		getE(time, "sec").value = personEvent.sec;
		getE(time, "hun").value = personEvent.hun;
		
		const addTimeListener = function (name) {
			const func = function() {
				let value = getE(time, name).value;
				if (value < 0) value = 0;
				if (value > 59 && name != "hun") value = 59;
				if (value > 99) value = 99;
				getE(time, name).value = value;
				personEvent[name] = value;
				getT(willSwim, "input").checked = true;
				const evt = document.createEvent("HTMLEvents");
				evt.initEvent("change", false, true);
				getT(willSwim, "input").dispatchEvent(evt);
			}

			getE(time, name).addEventListener("change", func);
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

function appendParticipant(person) {
	person = person || {};
	person.name = person.name || "";
	person.sex = person.sex || "M";
	person.birthYear = person.birthYear || new Date().getFullYear() - 14;
	person.events = person.events || [];
	person.club = person.club || club;

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
	});


	
	const editor = n.children[1];
	events.addEventListener("click", function () {
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
}

window.addEventListener("load", function() {
	document.getElementById("participantList").lastChild.lastElementChild.addEventListener("click", function () {appendParticipant(); });
	document.getElementById("makeUnip").addEventListener("click", function() {
		const unip = createUNIP(meetData);
		document.getElementById("unip").innerText = unip;
		download("uni_p-" + club + ".txt", unip);
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
	document.getElementById("activeClub").addEventListener("change", function() {
		club = document.getElementById("activeClub").value;
		updateClubSelection(club);
	});
	document.getElementById("addClub").addEventListener("click", function() {
		addClubSelection(document.getElementById("clubName").value);
		document.getElementById("clubSelection").classList.remove("hidden");
		showTab(document.getElementById("participantBar"), document.getElementById("participantSingle"));
	});
	document.getElementById("importMedley").addEventListener("click", function() {
		if (typeof allMeets == "undefined") {
			getMedleyList(function (list) { addMeets(list); });
		}
	});
	document.getElementById("importMedley").addEventListener("change", function() {
		const meet = allMeets[document.getElementById("importMedley").value];
		console.log("Fetching " + meet.url);
		getMedleyMeet(meet.url, function (text) {
			const xml = parseXml(text);
			importMeet(xml.MeetSetUp);
		});
	});
});
