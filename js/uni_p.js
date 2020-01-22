const SEX_MALE = "MALE",
      SEX_FEMALE = "FEMALE",
      SEX_MIX = "Mix",
      CLASS_JUNIOR = "JR",
      CLASS_SENIOR = "SR";

function ParticipantEvent(evt) {
	Event.call(this, evt.index, evt.distance, evt.style, evt.sex);
	this.time = { minutes: 0, seconds: 0, hundreths: 0 };
	this.timeString = function () {
		if (this.time.minutes == 0 || this.time.seconds == 0) return "";
		return this.time.minutes + ":" + String(this.time.seconds).padStart(2, '0') + "." + String(this.time.hundreths).padStart(2, '0');
	}
}

function Event(index, distance, style, sex) {
	this.index = index;
	this.distance = distance;
	this.style = style;
	this.sex = sex;
	this.isTeamEvent = function () {
		// Team Medley
		if (this.style == "LM") return true;
		// e.g 4x25, 7x150 etc
		if (this.distance.match(/\d+\*\d{2,}/)) return true;
		return false;
	}
	this.eventName = function () {
		return this.distance + "m " + this.style;
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
	this.listeners = [];
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

			console.log("[MeetManager:importMeet catch]: " + e);
		}
	}
	this.selectMeet = function(meet) {
		this.listeners["meetSelected"].forEach((fct) => {
			fct(meet);
		});
		//Clear participants
		$(".personRow, .teamRow, .edit").remove();
		$("#noMeet").hide();
		$("#clubSettings").removeClass("hidden");
		$("#meetName").val(meet.name);
		this.activeMeet = meet;
	}
	this.attachSelector = function (selector) {
		let fetched = false;
		this.selectors.push(selector);
		_this = this;
		const dummy = $("<option>")
			.text(" -- Click to fetch -- ")
			.attr("value", "invalid")
			.appendTo(selector);

		selector.change(() => {
			if (selector.val() == "invalid") return;
			_this.importMedleyMeet(parseInt(selector.val()), (meet) => {
				if (!meet) return;
				_this.selectMeet(meet);
			});
		});
		if (fetched) return;
		dummy.text("Fetching...");
		_this.importMedleyList(() => {
			dummy.text("-- Select one --");
			fetched = true;
		});
	}
	this.attachListener = function(evt, fct) {
		this.listeners[evt] = this.listeners[evt] || [];
		this.listeners[evt].push(fct);
	}

}

function Club(name) {
	this.name = name;
	this.participants = [];
	this.addParticipant = function (p) {
		this.participants.push(p);
	}
	this.serialize = function () {
		let string = this.name + "\n";
		for (let p in this.participants) {
			string += this.participants[p].serialize();
		}
		return string;
	}
}

function Participant(name, team = false, sex = SEX_MALE, birth) {
	if (!validateName(name)) throw "Invalid name";
	if (!validateBirth(birth, team)) throw "Invalid birth";
	if (!validateSex(sex, team)) throw "Invalid sex";
	this.name = name;
	this.team = team;
	this.birthYear = birth;
	this.sex = sex;
	this.events = [];

	this.serialize = function () {
		let string = "";
		this.events.forEach((evt) => {
			console.log(this);
			const firstname = this.team ? this.name : this.name.substring(this.name.lastIndexOf(" ") + 1); // Team name or first name
			const lastname = this.team ? "" : this.name.substring(0, this.name.lastIndexOf(" ")); // Last name. Teams have no last name
			const classString = this.sex + (this.team ? this.birthYear : ("" + this.birthYear).substring(2)); // Sex + class for teams, sex + birth year for individuals
			const line = [
				evt.index, // Event index
				evt.distance, // Event distance
				evt.style, // Event style
				firstname,
				lastname,
				"", // IDK FIXME
				classString,
				this.birthYear, //Class for teams, birth year for individuals
				evt.timeString(), // Event time
				"", // IDK FIXME
				"", // IDK FIXME
				"", // IDK FIXME
				"", // IDK FIXME
				"K", // Short (K) / Long (?) Lane
				"", // IDK FIXME
				"", // IDK FIXME

			];
			string += line.join(",") + "\n";
		});
		return string;
	}
	this.participate = function (evt) {
		console.log("[Participant:participate] Adding event: " + JSON.stringify(evt));
		for (let i = 0; i < this.events.length; i++) {
			if (this.events[i].index == evt.index) return;
		}
		this.events.push(evt);
	}
	this.resign = function (evt) {
		let index = -1;
		for (let i = 0; i < this.events.length; i++) {
			if (this.events[i].index == evt.index) {
				index = i;
				break;
			}
		}
		if (index == -1) return;
		this.events = this.events.splice(index, 1);
		
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
				console.log("[uni_p:Participant/correctSex] Event corresponding to " + evt + " not found for sex " + sex + ", keeping old");
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
	this.listeners = {};
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
	this.attachListener = function(evt, fct) {
		this.listeners[evt] = this.listeners[evt] || [];
		this.listeners[evt].push(fct);
	}
	this.selectClub = function(clubname) {
		for (let i in this.clubs) {
			const club = this.clubs[i];

			if (club.name == clubname) {
				this.selectedClub = club;
				this.listeners["clubSelected"].forEach((fct) => { fct(club); });
				$("#activeClub").val(this.selectedClub.name);
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

function Editor(singleTemplate, teamTemplate, eventTemplate) {
	this.singleTables = [];
	this.teamTables = [];
	this.singleTemplate = singleTemplate;
	this.teamTemplate = teamTemplate;
	this.eventTemplate = eventTemplate;
	this.events = [];
	this.club;
	this.meet;
	this.attachSingleTable = function(table) {
		//Keep starting value for resetting
		this.singleTables.push({base: table.html(), element: table});
	}
	this.attachTeamTable = function(table) {
		this.teamTables.push({base: table.html(), element: table});
	}
	this.reset = function() {
		//Reset all tables to default state
		this.singleTables.forEach((table) => { table.element.html(table.base) });
		this.teamTables.forEach((table) => { table.element.html(table.base) });
	}
	this.setEvents = function(events) {
		this.events = events;
	}
	this.setClub = function(club) {
		this.club = club;
	}
	this.setMeet = function(meet) {
		this.meet = meet;
	}
	this.verifyParticipant = function(participant, template) {
		let error = false;
		error |= !validateName(participant.name);
		error |= !validateBirth(participant.birthYear);
		error |= !validateSex(participant.sex, participant.team);
		if (error) template.addClass("error");
		else template.removeClass("error");
	}
	this.addParticipant = function(participant) {
		this.club.addParticipant(participant);
		const template = $(participant.team ? this.teamTemplate.html() : this.singleTemplate.html());
		template.find(".name").val(participant.name).on("keyup keypress change", () => {
			participant.name = template.find(".name").val();
		});
		template.find(".birth").val(participant.birthYear).on("keyup keypress change", () => {
			participant.birthYear = template.find(".birth").val();
		});
		template.find(".sex").val(participant.sex).on("change", () => {
			participant.correctSex(template.find(".sex").val,this.meet);
		});
		template.on("change", () => { this.verifyParticipant(participant, template); });
		this.events.forEach((evt) => {
			if (evt.isTeamEvent() != participant.team) return;
			if (evt.sex != participant.sex) return;
			this.createEvent(participant, new ParticipantEvent(evt))
				.appendTo(template.find(".eventTable"));


		})
		if (participant.team) this.teamTables.forEach((table) => { template.appendTo(table.element) });
		else this.singleTables.forEach((table) => { template.appendTo(table.element) });
	}
	this.createEvent = function(participant, evt) {
		const evtTemplate = $(this.eventTemplate.html());
		evtTemplate.find(".eventId").text(evt.index);
		evtTemplate.find(".eventName").text(evt.eventName());
		evtTemplate.find(".willSwim").on("change", function () {
			if ($(this)[0].checked) {
				participant.participate(evt);
			} else {
				participant.resign(evt);
			}
		});
		evtTemplate.find(".min").on("change keyup keypress", function() {
			participant.participate(evt);
			let val = $(this).val();
			let number = parseInt(val);
			evt.time.minutes = number;
			if (val.length > 1) {
				evtTemplate.find(".sec").select();
				if (number < 10) $(this).val("0" + number);
			}
		});
		evtTemplate.find(".sec").on("change keyup keypress", function() {
			participant.participate(evt);
			let val = $(this).val();
			let number = parseInt(val);
			evt.time.seconds = number;
			if (val.length > 1) {
				evtTemplate.find(".hun").select();
				if (number < 10) $(this).val("0" + number);
			}
		});
		evtTemplate.find(".hun").on("change keyup keypress", function() {
			participant.participate(evt);
			let val = $(this).val();
			let number = parseInt(val);
			evt.time.hundreths = number;
		});
		return evtTemplate;
	}
}

function validateName(name) {
	return true;
}
function validateBirth(birth) {
	if (birth == CLASS_JUNIOR) return true;
	if (birth == CLASS_SENIOR) return true;
	const now = new Date().getFullYear();
	const min = now - 80;
	const max = now - 3;
	return birth > min && birth < max;
}
function validateSex(sex, team) {
	if (team && sex == SEX_MIX) return true;
	return sex == SEX_MALE || sex == SEX_FEMALE;
}
function ParticipantAddForm(editor, nameField, birthField, sexField, submitButton, team = false) {
	this.name = nameField;
	this.birth = birthField;
	this.sex = sexField;
	this.submit = submitButton;
	this.editor = editor; 
	this.team = team;
	this.nameSuggester = function (name, birth, sex) {
		return name;
	}
	this.suggestName = function () {
		this.name.val(this.nameSuggester(this.name.val(), this.birth.val(), this.sex.val()));
	}
	this.name.on("change", () => { this.suggestName() });
	this.birth.on("change", () => { this.suggestName() }); 
	this.sex.on("change", () => { this.suggestName() });
	this.submit.on("click", () => {
		const name = this.name.val();
		const birth = this.birth.val();
		const sex = this.sex.val();
		participant = new Participant(name, this.team, sex, birth);
		this.editor.addParticipant(participant);

	});
	this.setNameSuggester = function(fct) {
		this.nameSuggester = fct;
	}
}

function defaultNameSuggester(clubManager){
	return function (fieldName, birth, sex) {
		// Get the lowest not-taken name
		let i = 1;
		let name, found;
		do {
			found = false;
			// Construct name format "<club name> <G|J|Mix ><number> <class>"
			name = clubManager.selectedClub.name + " ";
			if (sex == SEX_MALE) name += "G";
			if (sex == SEX_FEMALE) name += "J";
			if (sex == SEX_MIX) name += "Mix ";
			name += i++; 
			name += " " + birth; 
			clubManager.selectedClub.participants.forEach((participant) => {
				if (participant.name == name) found = true;
			});
		} while (found);

		return name;
	}
}

// Attach listeners
$(() => {

	const meetManager = new MeetManager();
	const clubManager = new ClubManager();
	const editor = new Editor($("#singleTemplate"), $("#teamTemplate"), $("#eventTemplate"));
	const singleForm = new ParticipantAddForm(editor, $("#addSingleName"), $("#addSingleBirth"), $("#addSingleSex"), $("#addSingleSubmit"));
	const teamForm = new ParticipantAddForm(editor, $("#addTeamName"), $("#addTeamBirth"), $("#addTeamSex"), $("#addTeamSubmit"), true);
	teamForm.setNameSuggester(defaultNameSuggester(clubManager));

	meetManager.attachSelector($("#importMedley"));
//	meetManager.attachEditor(editor);
	meetManager.attachListener("meetSelected", (meet) => {
		if (meet.hasTeamEvents()) tabBarManager.getBar("participantBar").enableTab("participantTeam");
		tabBarManager.getBar("participantBar").enableTab("participantSingle");

		editor.reset();
		editor.setEvents(meet.events);
	});
	document.getElementById("importFile").addEventListener("change", function(e) {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.addEventListener("load", function(e) {
			const xml = parseXml(e.target.result);
			const meet = meetManager.importXmlMeet(xml);
			meetManager.selectMeet(meet);
		});
		reader.readAsText(file);

	});
	clubManager.attachSelector($("#clubList"));
	clubManager.attachNewClubInput($("#clubName"), $("#addClub"));
	clubManager.attachListener("clubSelected", (club) => {
		$("#participantsContainer").removeClass("hidden");
		editor.reset();
		editor.setClub(club);
	});

	editor.attachSingleTable($("#singleList"));
	editor.attachTeamTable($("#teamList"));
	document.getElementById("teamList").lastChild.lastElementChild.addEventListener("click", function() { appendTeam() });
	document.getElementById("makeUnip").addEventListener("click", function() {
		const unip = clubManager.selectedClub.serialize();
		download("uni_p-" + meetManager.activeMeet.name + "_" + clubManager.selectedClub.name + ".txt", unip);
	});
});
