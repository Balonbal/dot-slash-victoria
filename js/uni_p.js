function ce(i) { return document.createElement(i); }
function buildField(name, data, onChange) {
	let field;
	switch (name) {
		case "name":
			field = ce("input");
			field.type = "text";
			field.value = data.name || "";
			break;
		case "birthYear":
			field = ce("input");
			field.type = "number";
			field.min = new Date().getFullYear() - 100;
			field.max = new Date().getFullYear() - 5;
			field.value = data.birthYear || new Date().getFullYear() - 14;
			break;
		case "sex":
			field = ce("select");
			field.innerHTML = "<option value='M'" + (data.sex == "M" ? " selected" : "") + ">M</option><option value='K' " + (data.sex == "K" ? "selected" : "") + ">F</option>";
			break;

	}
	if (field) field.addEventListener("DOMSubtreeModified", function() {
		onChange(field);
	});
	if (field) field.addEventListener("change", function() {
		onChange(field);
	});
	return field;
}

function makeParticipant(data) {
	//Make elements
	data = data || {};
	const columns = {
		name: {}, 
		birthYear: {},
		sex: {},
		events: {},
		actions: {}
	};

	const row = ce("tr");
	for (let i in columns) {
		columns[i].td = ce("td");
		const text = ce("span");
		text.innerText = typeof data[i] != "object" ? (data[i] || "-") : "-";
		columns[i].td.appendChild(text);
		row.appendChild(columns[i].td);
		const field = buildField(i, data, function (field) {
			//text.innerText = newData;
			console.log(field);
			if (text.innerText == field.value) return;
			text.innerText = field.value;
			text.classList.remove("hidden");
			if (field) field.classList.add("hidden");

		});
		if (field) columns[i].td.appendChild(field);
		columns[i].td.addEventListener("click", function() {
			text.classList.add("hidden");
			if (field) field.classList.remove("hidden");
		});
	}

	// Fill values
	columns.events.innerText = "";
	for (i in data.events) {
		columns.events.innerText += data.events[i].distance + "m " + data.events[i].style;
		if (i != data.events.length -1) columns.events.innerText += ", ";
	}

	return row;
}

