function epicArray(x) {
	let y = [];
	if(x !== undefined) {
		for(let i = 0; i < x.length; i++) {
			y.push(x[i])
		}
	}
	return y
}

function epicError(fn, msng, name, param, type) {
	let msg = "EPIC error";
	if(fn !== undefined && typeof fn === "string") {
		msg = msg + ": " + fn;
		if(msng !== undefined && msng == true || msng !== undefined && msng == false) {
			if(msng == true) {
				msg = msg + " missing"
			}
			else if(msng == false) {
				msg = msg + " incompatible"
			}
			if(name !== undefined && typeof name === "string") {
				msg = msg + " '" + name + "' parameter.";
				if(param !== undefined) {
					msg = msg + " '" + name + "' is currently a/an '" + typeof param + "'";
					if(type !== undefined && typeof type === "string") {
						msg = msg + " when it should be a/an '" + type + "'"
					}
				}
			}
		}
		else {
			msg = msg + " missing or incompatible parameter."
		}
	}
	console.error(msg)
}

var epicIntFns = {
	"ref": (els, el) => {
		if(els === undefined) {
			// error: missing els
			return
		}
		if(typeof els !== "string" && typeof els !== "object") {
			// error: incompatible els
			return
		}
		if(typeof els === "string") {
			if(els === "") {return epicRef}
			if(els === "this") {els = [el]}
			else {
				// error: unrecognised els
				return
			}
		}
		if(!Array.isArray(els)) {els = [els]}
		let refItems = [];
		els.every(elx => {
			if(!elx.hasAttribute("epic-ref")) {
				// error: no epic-ref attribute
				return true
			}
			let refAttrs = elx.getAttribute("epic-ref").split("&");
			refAttrs.every(x => {
				x = x.split(".");
				if(x.length !== 4) {
					// error: incompatible refAttr
					return true
				}
				if(!isNaN(x[3])) {x[3] = Number(x[3])}
				if(epicRef.hasOwnProperty(x[0]) 
					&& epicRef[x[0]].hasOwnProperty(x[1]) 
					&& epicRef[x[0]][x[1]].hasOwnProperty(x[2]) 
					&& x[3] < epicRef[x[0]][x[1]][x[2]].length) {
					refItems.push(epicRef[x[0]][x[1]][x[2]][x[3]])
				}
				else {
					// error: no matching ref item
					return true
				}
				return true
			});
			return true
		});
		if(refItems.length === 1) {refItems = refItems[0]}
		return refItems
	},
	"get": (sels, el) => {
		if(sels === undefined) {
			// error: missing sels
			return
		}
		if(typeof sels !== "string") {
			// error: incompatble sels
			return
		}
		let x = document, qs = true;
		if(sels.substr(0, 4) === "this") {
			x = el;
			if(sels.length === 4) {qs = false}
			else {sels = sels.slice(4)}
		}
		else if(sels.substr(0, 6) === "parent") {
			x = el.parentNode;
			if(sels.length === 6) {qs = false}
			else {sels = sels.slice(6)}
		}
		if(qs === false) {return x}
		return epicArray(x.querySelectorAll(sels))
	},
	"attr": (attr, attrEl, el) => {
		if(attr === undefined) {
			// error: missing attr
			return
		}
		if(typeof attr !== "string") {
			// error: incompatible attr
			return
		}
		if(attrEl === undefined) {
			// error: missing attrEl
			return
		}
		if(typeof attrEl !== "object") {
			// error: incompatible attrEl
			return
		}
		if(Array.isArray(attrEl)) {attrEl = attrEl[0]}
		if(!attrEl.hasAttribute(attr)) {
			// error: missing attr
			return
		}
		return epicAttribute(attrEl.getAttribute(attr), el)
	}
}

function epicObject(x, el, call) {
	if(x === undefined) {
		// error: missing x
		return
	}
	if(typeof x !== "string") {
		// error: incompatible x
		return
	}
	function patch(arr, div) {
		if(arr === undefined || div === undefined) {return}
		if(!Array.isArray(arr)) {
			// error: incompatible arr
			return
		}
		if(typeof div !== "string") {
			// error: incompatible div
			return
		}
		let pass = false, cycle = 0;
		while(cycle !== true && cycle < 20) {
			let tempArr = [], str;
			let x = {"s": 0, "e": 0, "pass": false}
			arr.every((item, i) => {
				if(x.pass === true) {
					tempArr.push(item);
					return true
				}
				if(str !== undefined) {
					str += div + item;
					if(item.includes(")")) {
						tempArr.push(str);
						x.pass = true
					}
					return true
				}
				if(!item.includes("(")) {
					tempArr.push(item);
					return true
				}
				x.s = 0;
				x.e = 0;
				for(let j = 0; j < item.length; j++) {
					if(item[j] === "(") {x.s++}
					else if(item[j] === ")") {x.e++}
				}
				if(x.s > x.e) {str = item}
				else {tempArr.push(item)}
				return true
			});
			arr = tempArr;
			arr.every((item, i) => {
				x.s = 0;
				x.e = 0;
				for(let j = 0; j < item.length; j++) {
					if(item[j] === "(") {x.s++}
					else if(item[j] === ")") {x.e++}
				}
				if(x.s !== x.e) {return false}
				else if(i === arr.length - 1) {pass = true}
				return true
			});
			cycle++
		}
		return arr
	}
	if(x.includes(".")) {
		x = patch(x.split("."), ".")
	}
	else {x = [x]}
	let obj;
	x.every((y, i) => {
		let j = y.indexOf("(");
		if(j === -1) {
			let z = obj;
			if(z === undefined) {z = window}
			if(!z.hasOwnProperty(y) && z[y] === undefined) {
				// error: no matching object
				obj = undefined;
				return false
			}
			obj = z[y];
			return true
		}
		let name = y.slice(0, j), params = y.slice(j);
		if(params === "()") {params = ""}
		else {params = params.slice(1, -1)}
		params = patch(params.split(","), ",");
		params.forEach((param, k) => {
			if(param !== "") {
				params[k] = epicConverter(param, el)
			}
		});
		if(obj === undefined && epicIntFns.hasOwnProperty(name)) {
			params.push(el);
			obj = epicIntFns[name].apply(null, params);
			return true
		}
		let z = obj;
		if(z === undefined) {z = window}
		if(!z.hasOwnProperty(name) && z[name] === undefined) {
			// error: no matching function
			obj = undefined;
			return false
		}
		obj = z[name].apply(null, params);
		return true
	});
	return obj
}

function epicConverter(str, el, fn) {
	if(str === undefined) {
		epicError("epicConverter()", true, "str");
		return
	}
	else if(typeof str !== "string") {
		epicError("epicConverter()", false, "str", str, "string");
		return str
	}
	// empty
	if(str === "") {str = undefined}
	// booleans / null / undefined / number
	else if(str === "true") {str = true}
	else if(str === "false") {str = false}
	else if(str === "null") {str = null}
	else if(str === "undefined") {str = undefined}
	else if(!isNaN(str)) {str = Number(str)}
	// date
	// array
	else if(str.charAt(0) === "[" && str.charAt(str.length - 1) === "]") {
		str = str.slice(1, str.length - 1).split(",");
		str.forEach((x, i) => {
			str[i] = epicConverter(x, el, fn)
		})
	}
	// object
	else if(str.charAt(0) === "{" && str.charAt(str.length - 1) === "}") {
		str = str.slice(1, str.length - 1).split(",");
		let temp = {}
		str.forEach(x => {
			x = x.split(":");
			temp[x[0]] = epicConverter(x[1], el, fn)
		});
		str = temp
	}
	// function
	else if(str.includes("(") && str.includes(")")) {
		str = epicObject(str, el, fn)
	}
	return str
}

function epicAttribute(val, el) {
	let obj = {}
	if(val === undefined) {
		// error: missing val
		return obj
	}
	else if(typeof val !== "string") {
		// error: incompatible val
		return obj
	}
	if(val.indexOf("&") === -1 && val.indexOf("=") === -1) {
		return epicConverter(val, el)
	}
	val = val.split("&");
	val.forEach(x => {
		let i = x.indexOf("=");
		if(i !== -1) {
			obj[x.slice(0, i)] = epicConverter(x.slice(i + 1), el)
		}
		else {
			// error: incompatible var
		}
	});
	return obj
}

function epicRefBuilder(sys, attrs, els) {
	if(sys === undefined) {
		// error: missing sys
		return
	}
	else if(typeof sys !== "string") {
		// error: incompatible sys
		return
	}
	// formatting attributes
	if(attrs === undefined) {attrs = ["options"]}
	else if(typeof attrs !== "string" || !Array.isArray(attrs)) {
		// error: incompatible attrs
		return
	}
	else {
		if(typeof attrs === "string") {
			attrs = [attrs]
		}
		let tempAttrs = ["options"];
		attrs.forEach(attr => {
			if(typeof attr === "string") {
				if(attr !== "options") {
					tempAttrs.push(attr)
				}
			}
			else {
				// error: incomaptible attr
			}
		});
		attrs = tempAttrs
	}
	// formatting elements
	if(els === undefined) {
		els = epicArray(document.querySelectorAll("[epic-" + sys + "]"))
	}
	else if(typeof els !== "object") {
		// error: incompatible els
		return
	}
	else {
		if(!Array.isArray(els)) {els = [els]}
		let tempEls = [];
		els.forEach(el => {
			if(typeof el === "object") {
				tempEls.push(el)
			}
			else {
				// error: incompatible el
			}
		});
		els = tempEls
	}
	// reference building
	if(!epicRef.hasOwnProperty(sys)) {
		epicRef[sys] = {"*": {}}
	}
	els.forEach(el => {
		let groups = ["*"], id = el.getAttribute("epic-" + sys), ref = {"el": el}
		attrs.forEach(attr => {
			let val, str = "epic-" + sys + "-" + attr;
			if(el.hasAttribute(str)) {
				val = el.getAttribute(str)
			}
			if(val !== undefined) {
				ref[attr] = epicAttribute(val, el)
			}
		});
		if(ref.hasOwnProperty("options") && ref.options.hasOwnProperty("group")) {
			if(typeof ref.options.group === "string") {
				groups = [ref.options.group]
			}
			else if(Array.isArray(ref.options.group)) {
				groups = ref.options.group
			}
			else {
				// error: incompatible group
			}
		}
		groups.forEach(group => {
			if(!epicRef[sys].hasOwnProperty(group)) {
				epicRef[sys][group] = {}
			}
			if(!epicRef[sys][group].hasOwnProperty(id)) {
				epicRef[sys][group][id] = []
			}
			epicRef[sys][group][id].push(ref);
			// epic-ref attribute
			let num = epicRef[sys][group][id].length - 1;
			let str = sys + "." + group + "." + id + "." + num;
			if(el.hasAttribute("epic-ref")) {
				str = el.getAttribute("epic-ref") + "&" + str
			}
			el.setAttribute("epic-ref", str)
		})
	})
}

function epicActions() {
	epicArray(document.querySelectorAll("[epic-actions]")).forEach(el => {
		let actions = el.getAttribute("epic-actions").split("&");
		actions.forEach(act => {
			let i = act.indexOf("=");
			act = {"ev": act.slice(0, i), "fn": {"name": "epicConverter", "params": [act.slice(i + 1), el, false]}}
			if(act.ev !== undefined && act.fn !== undefined) {
				if(typeof act.fn === "object" && act.fn.hasOwnProperty("name") && act.fn.hasOwnProperty("params") && Array.isArray(act.fn.params)) {
					el.addEventListener(act.ev, (ev) => {
						window[act.fn.name].apply(null, act.fn.params)
					})
				}
			}
		})
	})
}

if(!String.prototype.includes) {
	String.prototype.includes = (search, start) => {
		'use strict';
		if(search instanceof RegExp) {
			throw TypeError("string.includes(): First argument must not be a RegExp")
		}
		if(start === undefined) {start = 0}
		return this.indexOf(search, start) !== -1
	}
}

var epicRef = {}
window.addEventListener("DOMContentLoaded", () => {
	epicActions();
})
