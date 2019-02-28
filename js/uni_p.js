function ce(i) { return document.createElement(i); }

const meetData = {
	events: [
		{ index: 1, distance: "25", style: "FR", sex: "M" },
		{ index: 2, distance: "25", style: "FR", sex: "K" },
		{ index: 3, distance: "50", style: "BR", sex: "M" },
		{ index: 4, distance: "50", style: "BR", sex: "K" },
	],
	participants: [],
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
		if (e.team) continue;

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
});
