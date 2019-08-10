/////////////////// SECTION START: globals
// Global meet data variable
// Stores one meet at a time
let meetData = {
	events: [],
	participants: [],
}
let club;
let allMeets;

/////////////////// SECTION END: globals
/////////////////// SECTION START: WTF
function ce(i) { return document.createElement(i); }

function fixGender(person) {
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

// gets an element from the html document using id (i think)
function getE(node, name) {
	return node.querySelectorAll("." + name)[0];
}

// gets an element from html document using magic
function getT(node, name) {
	return node.getElementsByTagName(name)[0];
}

// wtf is this thing? what fields?
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

/////////////////// SECTION END: WTF
/////////////////// SECTION Start: meet settings

// called when XML file is selected or meet from medley.no is selected
function importMeet(xmlData) {
	if (meetData.participants.length != 0) {
		showModal("confirmationBox",
			document.createTextNode("You have entered participants to the selected meet,\
			are you sure you want to change meet? All unsaved data will be discarded."),
			() => { changeMeet(xmlData); },
			() => { },
			{ header: "Are you sure you want to change meet?" });
	} else { changeMeet(xmlData); }
}

function changeMeet(xmlData) {
	try {
		const meet = {
			name: getNode(xmlData, "MeetName"),
			events: [],
			participants: [],
		}
		// for every event in eventlist, extract all info and...
		for (let i in xmlData.Events.Event) {
			const evt = xmlData.Events.Event[i];
			const e = {
				index: parseInt(getNode(evt, "EventNumber")),
				distance: getNode(evt, "EventLength"),
				style: getStyle(getNode(evt, "Eventart") || getNode(evt, "EventArt")),
				sex: getNode(evt, "Sex") == "MALE" ? "M" : (getNode(evt, "Sex") == "FEMALE" ? "K" : "Mix"),
			}
			// ... push it to the meet variable
			meet.events.push(e);
		}
		//Successful import, export to global
		meetData = meet;
		// remove the participant editor
		$(".personRow, .teamRow, .edit").remove();
		// remove the no meet warning
		$("#noMeet").addClass("hidden");
		$("#clubSettings").removeClass("hidden");
		$("#meetName").val(meetData.name);
	} catch (e) { console.log(e) };
}

function addMeets(meets) {
	allMeets = meets;
	// Selected meet from the dropdown menu
	const select = document.getElementById("importMedley");
	// Create an option for each meet that is found
	for (let i in meets) {
		const meet = meets[i];

		const node = document.createElement("option");
		node.innerText = "[" + meet.startDate.toLocaleDateString() + "] " + meet.organizer + ": " + meet.name;
		node.value = i;
		select.appendChild(node);
	}
}

// returns event object from meetData given an event number as input
function getEvent(eventNumber) {
	for (let i in meetData.events) {
		const evt = meetData.events[i];
		if (evt.index == eventNumber) return evt;
	}
	return false;
}

/////////////////// SECTION END: meet settings
/////////////////// SECTION Start: club settings

function updateClubSelection(clubName) {
	document.getElementById("participantsContainer").classList.remove("hidden");
	enableTab("participantBar", "participantSingle", false);
	if (hasTeamEvents()) enableTab("participantBar", "participantTeam");
	club = clubName;
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

/////////////////// SECTION END: club settings
/////////////////// SECTION START: Editor
function hideEditors() {
	const editors = document.getElementsByClassName("edit");
	for (let i = 0; i < editors.length; i++) {
		editors[i].classList.add("hidden");
	}
}

function isTeamEvent(evt) {
	if (evt.style == "LM") return true;
	if (evt.distance.match(/\d+\*\d{2,}/)) return true;
	return false;
}

function initEditor(person, table, span) {
	for (let i in meetData.events)
	{
		const evnt = meetData.events[i];
		// skip this event if the athlete cannot join based on gender
		if (evnt.sex != "Mix" && evnt.sex != person.sex) continue;
		// skip this event if the "person" is not a team
		if (isTeamEvent(evnt) ^ person.team) continue;

		// get the event template from the document and assign to some variables
		const template = document.getElementById("eventDummy");
		const node = document.importNode(template.content, true);
		const willSwim = getE(node, "willSwim");
		const index = getE(node, "eventId");
		const name = getE(node, "eventName");
		const time = getE(node, "eventTime");

		// check if athlete has already registered for some events and set Willswim to true
		getT(willSwim, "input").checked = false;
		let personEvent;
		for (let j in person.events)
		{
			const c = person.events[j];
			if (c.index == evnt.index)
			{
				personEvent = c;
				getT(willSwim, "input").checked = true;
			}
		}

		// use saved values. if none is present use standard / empty values
		personEvent = personEvent || { index: evnt.index, distance: evnt.distance, style: evnt.style, min: "00", sec: "00", hun: "00" };
		index.innerText = evnt.index;
		name.innerText = evnt.distance + "m " + evnt.style;

		getE(time, "min").value = personEvent.min;
		getE(time, "sec").value = personEvent.sec;
		getE(time, "hun").value = personEvent.hun;

		// time validator and auto focus on next
		const addTimeListener = function (name)
		{
			const func = function()
			{
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
			const next = function()
			{
				//Both numbers
				if (getE(time, name).value.length == 2) {
					if (name == "min") getE(time, "sec").focus();
					if (name == "sec") getE(time, "hun").focus();
					getE(time, name).blur();
				}
			}
			const focus = function ()
			{
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
		colChangeListener(willSwim, function()
		{
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
} // init Editor

function hasTeamEvents() {
	for (let i in meetData.events) {
		const e = meetData.events[i];
		if (isTeamEvent(e)) return true;
	}
	return false;
}
/////////////////// SECTION END: Editor
/////////////////// SECTION START: Individuals
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
		fixGender(person);
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

///////////////////// SECTION END: Individuals
///////////////////// SECTION START: TEAMS
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
		let sex = "Mix ";
		if (team.sex == "M") sex = "G";
		if (team.sex == "K") sex = "J";
		team.name = club + " " + sex + i + " " + team.class;
		setFields(name, team.name);
	}
	suggestName();
	colChangeListener(cls, function () {
		team.class = getT(cls, "select").value;
		suggestName();
	}, "select");
	colChangeListener(sex, function () {
		team.sex = getT(sex, "select").value;
		fixGender(team);
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
///////////////////// SECTION END: TEAMS
///////////////////// SECTION START: Downlaod button uni_p
function downloadUniP(meetData) {
	meetData.participants.sort();

	str = club + "\n";
	for (let i in meetData.participants) {
		const person = meetData.participants[i];
		let params = [];
		for (let j in person.events) {
			const evt = person.events[j];
			const meetEvent = getEvent(evt.index);
			const time = (evt.min != "00" || evt.sec != "00" || evt.hun != "00") ? evt.min +":" + evt.sec + "." + evt.hun : "";

			// eventNumber, distanse, style, lastName, firstName,,class,birthYear,qyalification time,,date when this time was archived (not nessesarry),Location where qualification time has been archeve (not nessesarry), shor course or longcourse (K | L),,
			// class = first letter of the gender + two last digits of birthYear,
			// example:
			// 5,100,FR,Johnson,John Smith,,M94,1994,01:00.00,,20200517,Pirbadet,K,,
			// 9,20*50,LM,NTNUI Mix 2 sr,,,KSR,SENIOR,,,,,K,,
			params = [
				evt.index,
				getEvent(evt.index).distance,
				getEvent(evt.index).style,
				person.team ? person.name : person.name.substring(person.name.lastIndexOf(" ") + 1),
				person.team ? "" : person.name.substring(0, person.name.lastIndexOf(" ")),
				"",
				// meetEvent.sex + person.team ? person.class : ("" + person.birthYear).substring(2),
				person.team ? person.sex + person.class : person.sex + ("" + person.birthYear).substring(2),
				person.team ? person.class : person.birthYear,
				time,
				"",
				"",
				"",
				"",
				"K", //K = kortbane , L = langbane
				"",
				""
			];
			str += params.join(",") + "\n";
		}

	}
	return str;
}
///////////////////// SECTION END: Downlaod button uni_p



// onLoad:
window.addEventListener("load", ()=>{
	// Add more athletes link
	$("#addMoreAthletes").on("click",appendParticipant);
	// add more teams link
	$("#addMoreTeams").on("click",appendTeam);
	// download button
	$("#makeUnip").on("click",()=>{
		const unip = downloadUniP(meetData);
		download("uni_p-" + meetData.name + "_" + club + ".txt", unip);
	});

// Import XML file button in step 1
$("#importFile").on("change",(e)=>{
	const file = e.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.addEventListener("load", function(file) {
		const xml = parseXml(file.target.result);
		importMeet(xml.MeetSetUp);
	});
	// laod the file
	reader.readAsText(file);
});

// Change club if club dropdown thing has been chagned
$("#activeClub").on("change",()=>{
	updateClubSelection($("#activeClub").val());
});

$("#addClub").on("click",()=>{
	addClubSelection($("#clubName").val());
	$("#clubSelection").removeClass("hidden");
	// I don't know what line below does
	showTab(document.getElementById("participantBar"), document.getElementById("participantSingle"), false);
});


// Import from medley first click gets the list
$("#importMedley").on("click",()=>{
	// allMeets contains all meets from medley.no
	if (typeof allMeets == "undefined") {
		const node = document.createElement("option");
		node.value = "invalid";
		node.innerText = "Loading...";
		document.getElementById("importMedley").appendChild(node);
		getMedleyList(function (list) {
			addMeets(list);
			node.innerText = "-- Select one --";
		});
	}
});
// Import medley dropdown selects active meet
$("#importMedley").on("change",()=>{
	const selectedValue = $("#importMedley").val();
	if (selectedValue == "invalid") return;
	const meet = allMeets[selectedValue];
	console.log("Fetching " + meet.url);
	getMedleyMeet(meet.url, (urlResponse)=>{
		const xml = parseXml(urlResponse);
		importMeet(xml.MeetSetUp);
	});
});
});
