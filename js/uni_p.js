const SEX_MALE = "M",
      SEX_FEMALE = "K",
      SEX_MIX = "Mix";


function Event(index, distance, style, sex) {
	this.index = index;
	this.distance = distance;
	this.style = style;
	this.sex = sex;
	this.isTeamEvent = function () {
		// Team Medley
		if (evt.style == "LM") return true;
		// e.g 4x25, 7x150 etc
		if (evt.distance.match(/\d+\*\d{2,}/)) return true;
		return false;
	}
}
	
function Meet(name = "", events = [], participants = []) {
	this.name = name;
	this.events = events;
	this.participants = participants;
	this.isEmpty = function () {
		return name == "" && events.length == 0 && participants.length == 0
	}
	this.addEvent = function(evt) {
		this.events.push(evt);
	}
	this.hasTeamEvents = function() {
		for (let e in this.events) {
			if (this.events[e].isTeamEvent()) return true;
		}
		return false;
	}
	this.findEvent = function(style, distance, sex) {
		for (let e in this.events) {
			const evt = this.events[e];
			if (evt.style != style) continue;
			if (evt.distance != distance) continue;
			if (evt.sex != sex) continue;
			return evt;
		}
		return false;
	}
}

function MeetManager() {
	this.meets = [];
	this.activeMeet = undefined; 
	this.selectors = [];
	this.importList = function (meets) {
		const _this = this;
		meets.forEach((meet) => {
			const index = _this.meets.push(meet) - 1;
			//Add new meets to selectors
			_this.selectors.forEach((selector) => {
				$("<option>")
					.text("[" + meet.startDate.toLocaleDateString() + "] " + meet.organizer + ": " + meet.name)
					.attr("value",  index)
					.appendTo(selector);
			});
		});
	}
	this.importMedleyList = function(callback) {
		getMedleyList((list) => {
			this.importList(list);
			if (callback) callback(list);
		});
	}
	this.importMedleyMeet = function(index, callback) {
		//XML already downloaded
		if (this.meets[index].hasOwnProperty("events")) {
			callback(this.meets[index]);
			return;
		}
		//Download and import from medley
		getMedleyMeet(this.meets[index].url, (text) => {
			const xml = parseXml(text);
			const meet = this.importXmlMeet(xml, index);
			if (callback) callback(meet);
		});
	}
	this.importXmlMeet = function(xml, index) {
		try {
			xml = xml.MeetSetUp;
			let meet = new Meet(getNode(xml, "MeetName"));
			xml.Events.Event.forEach((evt) => {
				meet.addEvent(new Event(
					parseInt(getNode(evt, "EventNumber")),
					getNode(evt, "EventLength"),
					getStyle(getNode(evt, "Eventart")),
					getNode(evt, "Sex")
				));
			});

			if (typeof index == "undefined") index = this.meets.push(meet) - 1;
			else this.meets[index] = meet;

			return meet;
		} catch (e) {

			console.log(e);
		}
	}
	this.showMeet = function(meet) {
		//Clear participants
		$(".personRow, .teamRow, .edit").remove();
		$("#noMeet").hide();
		$("#clubSettings").removeClass("hidden");
		$("#meetName").text(meet.name);
	}
	this.attachSelector = function (selector) {
		let fetched = false;
		this.selectors.push(selector);
		_this = this;
		selector.on({
			click: () => {
				if (fetched) return;
				const dummy = $("<option>")
					.text("Fetching list...")
					.attr("value", "invalid")
					.appendTo(selector);
				_this.importMedleyList(() => {
					dummy.text("-- Select one --");
					fetched = true;
				});
			}, change: () => {
				if (selector.val() == "invalid") return;
				_this.importMedleyMeet(parseInt(selector.val()), (meet) => {
					if (!meet) return;
					_this.showMeet(meet);
				});
			}
		});
	}
}

function Club(name) {
	this.name = name;
	this.participants = [];
	this.addParticipant = function (p) {
		this.participants.push(p);
	}
	this.serialize = function () {
		let string = "";
		for (let p in this.participants) {
			string += this.participants[p].serialize();
		}

		return string;
	}
}

function Participant(name, team = false, sex = SEX_MALE) {
	this.name = name;
	this.team = team;
	this.sex = sex;
	this.events = [];

	this.serialize = function () {
		let string = "";
		//TODO
		return string;
	}
	this.participate = function (evt) {
		this.events.push(evt);
	}
	this.correctSex = function (sex, meet) {
		this.sex = sex;
		if (sex != SEX_MALE && sex != SEX_FEMALE) return;
		for (let e in this.events) {
			const evt = this.events[e];
			if (evt.sex == sex) continue;
			if (evt.sex == SEX_MIX) continue;
			const correctEvent = meet.findEvent(evt.style, evt.distance, sex);
			if (!correctEvent) {
				//TODO display error
				console.log("[uni_p:Participant/correctSex] Event corresponding to " + evt + " not found for sex " + sexx + ", keeping old");
				continue;
			}
			this.events[e] = correctEvent;
		}
	}
	
}

function ClubManager() {
	this.clubs = [];
	this.selectedClub;
	this.selectors = [];
	this.attachSelector = function(selector) {
		selector.on("click", () => {
			if (selector.val() == "") return;
			this.selectClub(selector.val());
		})
		this.selectors.push(selector);
	}
	this.attachNewClubInput = function(input, button) {
		input.on("submit", () => {
			if (input.val() == "") return;
			this.selectClub(input.val());
		})
		if (typeof button != "undefined") {
			button.on("click", () => {input.submit();});
		}
	}
	this.selectClub = function(clubname) {
		for (let i in this.clubs) {
			const club = this.clubs[i];

			if (club.name == clubname) {
				this.selectedClub = club;
				$("#participantsContainer").removeClass("hidden");
				//tabBarManager.getBar("participantBar").enableTab("participantSingle");
				return;

			}
		}

		//Not found - add club
		this.addClub(clubname);
		this.selectClub(clubname);
	}
	this.addClub = function(clubname) {
		this.clubs.push(new Club(clubname));
		this.selectors.forEach((selector) => { 
			$("<option>").val(clubname).appendTo(selector);
		});

	}
}

function updateClubSelection(clubName) {
	document.getElementById("participantsContainer").classList.remove("hidden");
	tabBarManager.getBar("participantBar").enableTab("participantSingle");
	if (hasTeamEvents()) tabBarManager.getBar("participantBar").enableTab("participantTeam");
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
		if (e.sex != person.sex) continue;
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

// Attach listeners
$(() => {

	const meetManager = new MeetManager();
	const clubManager = new ClubManager();

	meetManager.attachSelector($("#importMedley"));
	clubManager.attachSelector($("#clubList"));
	clubManager.attachNewClubInput($("#clubName"), $("#addClub"));
	clubManager.attachEditor($("#participantBar"));

	/*
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
	document.getElementById("activeClub").addEventListener("change", function() {
		club = document.getElementById("activeClub").value;
		updateClubSelection(club);
	});
	document.getElementById("addClub").addEventListener("click", function() {
		addClubSelection(document.getElementById("clubName").value);
		document.getElementById("clubSelection").classList.remove("hidden");
		tabBarManager.getBar("participantBar").showTab("participantSingle");
	});
	*/
});
