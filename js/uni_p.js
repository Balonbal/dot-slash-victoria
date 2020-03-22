let meetData = {
	events: [],
	participants: [],
}

let club;
let allMeets;
let validClubs = [];
const ENCODING = "ISO-8859-1";

// list available meets from medley.no
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

// Import selected meet
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
			document.getElementById("clubSettings").classList.remove("hidden");
			document.getElementById("meetName").value = meetData.name;
			updateClubSelection();

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

function updateClubSelection() {
	$("#participantsContainer").removeClass("hidden");
	enableTab("participantBar", "participantSingle", false);
	if (hasTeamEvents()){
		enableTab("participantBar", "participantTeam");
	}else{
		disableTab("participantBar", "participantTeam");
	}
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

		person.name = sanitizeName(person.name);

		for (let j in person.events) {
			const evt = person.events[j];
			const meetEvent = getEvent(evt.index);
			const time = (evt.min != "00" || evt.sec != "00" || evt.hun != "00") ? evt.min +":" + evt.sec + "." + evt.hun : "";
			if(!isValidBirthYear(person.birthYear)){
				console.log("[Warning]: " + person.name + "has an invalid birth year.\n birthYear: " + person.birthYear)
			}
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
// Find and det correct index for person when gender has been changed
function fixSex(person) { // updateEventIndexes update
	for(let person_event = 0; person_event < person.events.length; person_event++){
		for(let meet_event = 0; meet_event < meetData.events.length; meet_event++){

			if (meet_event.sex != person.sex) continue;
			if (meet_event.distance != person_event.distance) continue;
			if (meet_event.style != person_event.style) continue;

			// correct event has been found. Set event index to person
			person_event.index = meet_event.index;
			break;

		}
	}
}

function getE(node, name) {
	return node.querySelectorAll("." + name)[0];
}
// get first element with tag name
function getT(node, tagName) {
	return node.getElementsByTagName(tagName)[0];
}

function setFields(node, value) {
	getT(node, "input").value = value;
}

function colChangeListener(node, func, type) {
	type = type || "input";
	getT(node, type).addEventListener("change", func);
	getT(node, type).addEventListener("keyup", func);
}

// get name of the excersize e.g. 100m freestyle
function getEventString(person) {
	let s = "";
	for (let i = 0; i < person.events.length; i++) {
		const e = person.events[i];
		s += e.distance + "m " + e.style;
		if (i != person.events.length -1) s += ", ";
	}
	if (s == "") s = "<a href='javascript:void(0)' class='t'>Add events...</a>";
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

// Please rewrite me
function appendParticipant(person) {
	// use input or standard
	person = person || {};
	person.name = person.name || "";
	person.sex = person.sex || "M";
	person.birthYear = person.birthYear || new Date().getFullYear() - 14;
	person.events = person.events || [];
	person.club = person.club || club;

	hideEditors();

	// make a copy of template
	const personRow = document.importNode(document.getElementById("participantDummy").content, true).children[0];
	const editor = document.importNode(document.getElementById("participantDummy").content, true).children[1];

	// get DOM objects from the copy
	const name = getE(personRow, "personName");
	const age = getE(personRow, "age");
	const sex = getE(personRow, "sex");
	const events = getE(personRow, "events");

	// Set name, age and gender to the new copy
	setFields(name, person.name);
	setFields(age, person.birthYear);
	sex.getElementsByTagName("option")[person.sex == "M" ? 0 : 1].selected = true;

	// on change update meet participants
	colChangeListener(name, () => { person.name = getT(name, "input").value; });
	colChangeListener(age , () => { person.birthYear = getT(age, "input").value; });
	colChangeListener(sex , () => {
		// get new value from table
		person.sex = getT(sex, "select").value;
		fixSex(person);
		const evs = getE(editor, "eventTable").firstElementChild;
		getE(editor, "eventTable").innerHTML = "";
		getE(editor, "eventTable").appendChild(evs);
		initEditor(person, getE(editor, "eventTable"), events);
	}, "select");

	// editor eventlistener
	personRow.addEventListener("click", function () {
		hideEditors();
		if (editor.classList.contains("hidden")){
			editor.classList.remove("hidden");
		}else{
			editor.classList.add("hidden");
		}
	});

	initEditor(person, getE(editor, "eventTable"), events);
	meetData.participants.push(person);



	const prev = document.getElementById("participantList").lastChild.lastElementChild;
	document.getElementById("participantList").lastChild.insertBefore(personRow, prev);
	document.getElementById("participantList").lastChild.insertBefore(editor, prev);



	if (translator) translator.Translate();
}

function deleteAthlete(buttonObject){
	// extract the name
	const name = buttonObject.parentNode.parentNode.children[0].children[0].value;

	// delete the DOM objects
	buttonObject.parentNode.parentNode.nextSibling.remove();
	buttonObject.parentNode.parentNode.remove();

	// delete from meetData
	for( i = 0; i < meetData.participants.length; i++){
		if(meetData.participants[i].name == name){
			meetData.participants.splice(i, 1);
			return;
		}
	}
}

// When everyinging is loaded
window.addEventListener("load", function() {

	// load meets from medley server
	if (typeof allMeets == "undefined") {
		const node = document.createElement("option");
		node.value = "invalid";
		node.innerText = "Loading...";
		$("#importMedley").append(node);
		getMedleyList(function (list) {
			addMeets(list);
			node.innerText = "-- Select one --";
		});
	}

	// Meet change eventlistener
	$("#importMedley").on("change", () => {
		if ($("#importMedley").val() == "invalid") return;
		$("#importMedley option:first").remove();
		const meet = allMeets[$("#importMedley").val()];
		console.log("Fetching " + meet.url);
		getMedleyMeet(meet.url, function (text) {
			const xml = parseXml(text);
			importMeet(xml.MeetSetUp);
		});
		updateClubSelection();
		$("#clubName").focus();
	});

	// Eventlisteners for new athletes / "Add more..." links
	$("#participantList tr:last-child").children().last().on("click", () => {appendParticipant();});
	$("#teamList tr:last-child").children().last().on("click", () => {appendTeam();});

	// Make uni_p.txt button
	$("#makeUnip").on("click", function() {
		const unip = createUNIP(meetData);
		download(club + " uni_p.txt", unip);
	});

	// Import meet setup from XML
	$("#importFile-meetSetup").on("change", function(e) {
		const file = e.target.files[0];
		if (!file) return;

		// check if the file is a .xml file.
		if(file.name.substring(file.name.length - 4) != ".xml"){
			console.error("Cannot open non .xml files. File open attempt: " + file.name);
			return;
		}

		// parse and import meet
		const reader = new FileReader();
		reader.addEventListener("load", function(e) {
			const xml = parseXml(e.target.result);
			importMeet(xml.MeetSetUp);
		});
		reader.readAsText(file, ENCODING);

	});

	// Import csv file with entries
	$("#importFile-tryggivann").on("change", function(e) {
		// Open file
		const file = e.target.files[0];
		if (!file) return;

		// check if the file is a .csv file.
		if(file.name.substring(file.name.length - 4) != ".csv"){
			console.error("Cannot open non .csv files. File open attempt: " + file.name);
			return;
		}

		// Open a loading modal
		$("#modal-import-csv").modal("show");

		// parse file
		let skippedLines = 0;
		Papa.parse(file, {
			encoding: ENCODING,
			worker: true,

			// for each line do this:
			step: function(results, file) {
				// skip the first 8 lines
					if(skippedLines < 8){
						skippedLines++;
						return;
					}
					// break out of last line
					if(results.data[1] == "Uthevet fødselsdato betyr bursdag i kursperioden."){
						file.abort();
					}

					let person = {};

					// set name
					person.name = sanitizeName(results.data[0])
					if(!person.name){
						// no name
						return;
					}

					// set gender
					results.data[4] == "G" ? person.sex = "M" : person.sex = "K";

					// set birthYear
					person.birthYear = results.data[5].substring(6);

					// add if not in list
					if(!isDuplicate(meetData.participants,person)){
						$("#modal-import-csv-body-status").text(person.name);
						appendParticipant(person);
					}

				},
				// closes the modal
				complete: ()=>{$("#modal-import-csv").modal("hide")}
			})
	});

	// Eventlistener club settings
	$.getJSON( "/assets/clubs.json", function( data ) {
		$.each( data, function( key, val ) {
			validClubs.push(val);
		});
	});

	// Set up suggestions for club names
	$("#clubName").autocomplete({
			lookup: validClubs,
			lookupLimit: 5,
			onSelect: (suggestion)=>{
				$("#clubName").val(suggestion);
				club = $("#clubName").val();
				updateClubSelection();
				showTab(document.getElementById("participantBar"), document.getElementById("participantSingle"), false);
			}
		}
	);

	// add new club event listener
	$("#add-new-club-link").on("click",()=>{
		$("#modal-add-club").modal("show");
	});

	$("#modal-add-club-button-success").on("click", ()=>{
		let customCreatedClub = $("#modal-add-club-content").val()
		$("#modal-add-club").modal("hide");
		$("#clubName").val(customCreatedClub);
		validClubs.push(customCreatedClub);
		club = customCreatedClub;
		updateClubSelection();
		showTab(document.getElementById("participantBar"), document.getElementById("participantSingle"), false);
	});

});
