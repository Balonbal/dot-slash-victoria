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

		// Check if the name has trailing whitespaces
		nameChecked = false
		while(!nameChecked){
			nameChecked = true
			// remove whitespace at the start of the name
			if(person.name[0] == " "){
				person.name = person.name.substring(1,length(person.name) - 1)
				nameChecked = false
			}
			// remove whitespace at the end of the name
			if(person.name[length(name) -1 ] == " "){
				person.name = person.name.substring(0,length(person.name) - 2)
				nameChecked = false
			}
		}

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
				person.team ? "" + person.sex + person.class : "" + person.sex + ("" + person.birthYear).substring(2), 
				person.team ? person.class : person.birthYear,
				time,
				"",
				"",
				"",
				"K",
				"",
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
let pavel;
window.addEventListener("load", function() {
	document.getElementById("participantList").lastChild.lastElementChild.addEventListener("click", function () {appendParticipant(); });
	document.getElementById("teamList").lastChild.lastElementChild.addEventListener("click", function() { appendTeam() });
	document.getElementById("makeUnip").addEventListener("click", function() {
		const unip = createUNIP(meetData);
		download(club + " uni_p.txt", unip);
	});
	document.getElementById("importFile-meetSetup").addEventListener("change", function(e) {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.addEventListener("load", function(e) {
			const xml = parseXml(e.target.result);
			importMeet(xml.MeetSetUp);
		});
		reader.readAsText(file);

	});
	document.getElementById("importFile-tryggivann").addEventListener("change", function(e) {
		// Open file
		const file = e.target.files[0];
		if (!file) return;
		// parse csv
		Papa.parse(file, {
			complete: function(results, file) {
				// on parse complete:
				// console.log("Parsing complete:", results, file);
				let headerIndex;
				// find the header index
				for(i = 0; i < results.data.length -1; i++){
					if(results.data[i][0] == "Navn"){
						headerIndex = i;
						break;
					}
				}
				// for each line create a new person and add to participants list.
				for(i = headerIndex + 1; (results.data.length - 1) - (headerIndex + 1); i++){
					if(results.data[i][1] == "Uthevet fødselsdato betyr bursdag i kursperioden."){
						// break out of last line
						break;
					}

					let person = {};
					person.name = results.data[i][0]
					results.data[i][4] == "G" ? person.sex = "M" : person.sex = "K"  
					person.birthYear = results.data[i][5].substring(6)
					appendParticipant(person);

				}
			},
			encoding: "ISO-8859-1" // needed for "æ", "ø" and "å"
		})

	});

	document.getElementById("activeClub").addEventListener("change", function() {
		club = document.getElementById("activeClub").value;
		updateClubSelection(club);
	});
	document.getElementById("addClub").addEventListener("click", function() {
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
