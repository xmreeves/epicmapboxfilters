function epicFiltersActive(group) {
	if(group === undefined || group === "") {
		group = "*"
	}
	else if(typeof group !== "string") {
		epicError("epicFiltersActive()", false, "group", group, "string");
		return
	}
	if(!epicRef.filters.hasOwnProperty(group)) {
		// error: no epicRef.filters[group]
		return
	}
	let ref = epicRef.filters[group];
	if(!ref.hasOwnProperty("item")) {return}
	ref.item.every(item => {
		if(!item.hasOwnProperty("active")) {return true}
		if(item.active === false) {
			item.el.style.display = "none";
			if(item.options.hasOwnProperty("filter-group")) {
				item.options["filter-group"].every(el => {
					if(el === undefined) {return true}
					if(el.hasOwnProperty("el")) {
						el = el.el
					}
					el.style.display = "none";
					return true
				})
			}
		}
		else if(item.active === true) {
			item.el.style.removeProperty("display");
			if(item.options.hasOwnProperty("filter-group")) {
				item.options["filter-group"].every(el => {
					if(el === undefined) {return true}
					if(el.hasOwnProperty("el")) {
						el = el.el
					}
					el.style.removeProperty("display");
					return true
				})
			}
		}
		//
		return true
	})
}

function epicFiltersReset(group) {
	if(group === undefined || group === "") {group = "*"}
	else if(typeof group !== "string") {
		epicError("epicFiltersReset()", false, "group", group, "string");
		return
	}
	if(!epicRef.filters.hasOwnProperty(group)) {
		// error: no matching epicRef.filters[group]
		return
	}
	if(!epicRef.filters[group].hasOwnProperty("input")) {return}
	epicRef.filters[group].input.every(input => {
		/*if(!input.el.hasAttribute("type")) {
			// error: no input.options.type
			return true
		}*/
		let type = input.el.getAttribute("type");
		let tag = input.el.tagName.toLowerCase();
		if(type === "checkbox") {
			if(input.el.checked === true) {
				input.el.click()
			}
		}
		else if(tag === "select") {
			input.el.selectedIndex = 0
		}
		//
		return true
	});
	epicFilter()
}

function epicFiltersCounters(group) {
	if(!epicRef.hasOwnProperty("filters")) {
		// error: missing filters ref
		return
	}
	if(group === undefined || group === "") {group = "*"}
	else if(typeof group !== "string") {
		// error: incompatible group
		return
	}
	if(!epicRef.filters.hasOwnProperty(group)) {
		// error: no matching group
		return
	}
	let ref = epicRef.filters[group];
	if(!ref.hasOwnProperty("counter")) {return}
	if(!ref.hasOwnProperty("item")) {
		ref.counter.every(counter => {
			counter.el.textContent = 0
		});
		return
	}
	if(!ref.hasOwnProperty("activeItems")) {
		ref.activeItems = ref.item.length;
	}
	ref.counter.every(counter => {
		counter.el.textContent = ref.activeItems
	})
}

function epicFiltersItems(group) {
	if(group === undefined || group === "") {group = "*"}
	else if(typeof group !== "string") {
		// error: incompatible group
		return
	}
	if(!epicRef.filters.hasOwnProperty(group)) {
		// error: no matching group
		return
	}
	let ref = epicRef.filters[group];
	if(!ref.hasOwnProperty("item")) {
		// error: missing item(s)
		return
	}
	if(!ref.hasOwnProperty("activeFilters")) {
		// error: missing activeFilters
		return
	}
	ref.activeItems = 0;
	ref.item.every((item, i) => {
		if(!item.options.hasOwnProperty("filter-data")) {
			// error: missing data option
			return true
		}
		if(typeof item.options["filter-data"] !== "object") {
			// error: incompatible data option
			return true
		}
		let data = item.options["filter-data"], res = {}, pass = true;
		for(name in ref.activeFilters) {
			if(!data.hasOwnProperty(name)) {
				// error: no matching data[name]
				continue
			}
			if(!res.hasOwnProperty(name)) {
				res[name] = []
			}
			// compare
			ref.activeFilters[name].every(fltr => {
				if(fltr.type === "includes") {
					let dataVal;
					if(typeof data[name] === "number") {
						dataVal = data[name].toString()
					}
					if(typeof data[name] === "string") {
						dataVal = data[name]
					}
					if(dataVal === undefined) {
						// error: incompatible data[name]
						return true
					}
					dataVal = dataVal.toLowerCase();
					if(dataVal.includes(fltr.val)) {
						res[name].push(true)
					}
					else {
						res[name].push(false)
					}
				}
				else if(fltr.type === "range") {
					// fltr.val = ["-", #] OR [#, "+"] OR [#, #]
					if(!Array.isArray(fltr.val)) {
						// error: incompatible fltr.val
						return true
					}
					if(fltr.val.length !== 2) {
						// error: incompatible fltr.val
						return true
					}
					let range = {"s": undefined, "e": undefined}
					fltr.val.forEach(val => {
						if(val === "-") {
							if(range.s !== undefined) {
								range.e = range.s
							}
							range.s = val
						}
						else if(val === "+") {
							range.e = "+"
						}
						else {
							if(typeof val === "string") {
								val = Number(val.replace(",", ""))
							}
							if(range.s === undefined) {
								range.s = val
							}
							else {
								range.e = val
							}
						}
					});
					if(typeof range.s === "number" && typeof range.e === "number") {
						if(data[name] >= range.s && data[name] <= range.e) {
							res[name].push(true)
						}
						else {
							res[name].push(false)
						}
					}
					else if(range.s === "-") {
						if(data[name] <= range.e) {
							res[name].push(true)
						}
						else {
							res[name].push(false)
						}
					}
					else if(range.e === "+") {
						if(data[name] >= range.s) {
							res[name].push(true)
						}
						else {
							res[name].push(false)
						}
					}
				}
				else {
					if(data[name] !== undefined && data[name].toLowerCase() == fltr.val) {
						res[name].push(true)
					}
					else {
						res[name].push(false)
					}
				}
				//
				return true
			})
		}
		for(name in res) {
			res[name].every((val, i) => {
				if(val === true) {
					return false
				}
				else if(i === res[name].length - 1) {
					pass = false;
					return false
				}
				return true
			})
		}
		epicRef.filters[group].item[i].active = pass;
		if(pass == true) {ref.activeItems++}
		return true
	})
}

function epicFiltersInputs(group) {
	if(group === undefined || group === "") {group = "*"}
	else if(typeof group !== "string") {
		// error: incompatible group
		return
	}
	if(!epicRef.filters.hasOwnProperty(group)) {
		// error: no matching group
		return
	}
	if(!epicRef.filters[group].hasOwnProperty("input")) {
		// error: missing input(s)
		return
	}
	epicRef.filters[group].activeFilters = {}
	epicRef.filters[group].input.every(input => {
		let name, type, val = input.el.value, fltrtype;
		if(!input.options.hasOwnProperty("filter-name")) {
			// error: missing name
			return true
		}
		name = input.options["filter-name"];
		if(typeof name !== "string") {
			// error: incompatible name
			return true
		}
		if(input.el.hasAttribute("type")) {
			type = input.el.getAttribute("type")
		}
		if(val === "") {return true}
		// formatting
		if(type === "checkbox") {
			if(input.el.checked == true) {
				if(input.options.hasOwnProperty("value")) {
					val = input.options.value
				}
				else {val = true}
			}
			else {return true}
		}
		// store
		if(val === undefined) {return true}
		if(typeof val === "string") {val = val.toLowerCase()}
		if(input.options.hasOwnProperty("filter-type")) {
			fltrtype = input.options["filter-type"]
		}
		if(!epicRef.filters[group].activeFilters.hasOwnProperty(name)) {
			epicRef.filters[group].activeFilters[name] = []
		}
		epicRef.filters[group].activeFilters[name].push({"type": fltrtype, "val": val})
		return true
	})
}

function epicFiltersCountersInit() {
	if(!epicRef.hasOwnProperty("filters")) {
		console.error("EPIC error: epicFiltersCountersInit(): missing 'filters' reference object in 'epicRef'");
		return
	}
	for(group in epicRef.filters) {
		if(!epicRef.filters[group].hasOwnProperty("counter")) {continue}
		epicRef.filters[group].counter.every(counter => {
			if(!epicRef.filters[group].hasOwnProperty("item")) {
				counter.el.textContent = 0;
				return true
			}
			counter.el.textContent = epicRef.filters[group].item.length;
			return true
		})
	}
}

function epicFiltersFormsInit() {
	if(!epicRef.hasOwnProperty("filters")) {
		console.error("EPIC error: epicFiltersFormsInit(): missing 'filters' reference object in 'epicRef'");
		return
	}
	for(group in epicRef.filters) {
		if(!epicRef.filters[group].hasOwnProperty("form")) {continue}
		epicRef.filters[group].form.every(form => {
			if(form.options.hasOwnProperty("submit")) {
				if(form.options.submit == false) {
					$(form.el).submit(() => {return false})
				}
			}
			return true
		})
	}
}

function epicFilter(group) {
	epicFiltersInputs(group);
	epicFiltersItems(group);
	epicFiltersCounters(group);
	epicFiltersActive(group)
}

function epicFiltersInit() {
	epicRefBuilder("filters");
	if(epicRef.hasOwnProperty("filters")) {
		epicFiltersFormsInit();
		epicFiltersCountersInit();
	}
	else {
		console.error("EPIC error: epicFilters.js failed to initalise")
	}
}

epicFiltersInit();
