/* @license searchjs | (c) Searchjs Team and other contributors | https://github.com/deitch/searchjs */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.SEARCHJS = {})));
}(this, (function (exports) { 'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  //https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
  function toType(obj) {
  	return {}.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  }

  // returns the item in the object that matches a key
  // but is smart enough to handle dot-notation
  // so "a.b" returns obj["a.b"] or obj["a"]["b"] if it exists
  function deepField(data, propertyPath, propertySearch, propertySearchDepth) {
  	var ret = null,
  	    i = void 0,
  	    copyPropertyPath = void 0,
  	    itemValue = void 0,
  	    parameter = void 0,
  	    newPropertySearchDepth = -1;
  	// Check if the max-search depth got reached when propertySearch is activated
  	if (propertySearch) {
  		if (propertySearchDepth === 0) {
  			// Max depth reached
  			return null;
  		} else if (propertySearchDepth !== -1) {
  			newPropertySearchDepth = propertySearchDepth - 1;
  		}
  	}

  	if (data === null || data === undefined || propertyPath === null || propertyPath === undefined || !Array.isArray(propertyPath) || propertyPath.length < 1) {
  		ret = null;
  	} else if (Array.isArray(data)) {
  		// If it is an Array we have to check all the items for the value
  		// Go through each of the items and return all the values that have it
  		ret = [];
  		for (i = 0; i < data.length; i++) {
  			// We copy the value because it is just a reference the first round would delete it and the second one would
  			// not know anymore what to look for
  			copyPropertyPath = propertyPath.slice(0);

  			// First try to find the value
  			itemValue = deepField(data[i], copyPropertyPath, propertySearch, newPropertySearchDepth - 1);

  			// We return all the values that match
  			if (itemValue) {
  				ret.push(itemValue);
  			}
  		}
  		if (ret.length === 0) {
  			ret = null;
  		}
  	} else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
  		// It is an object so we can proceed normally

  		// Get the parameter
  		parameter = propertyPath[0];

  		// If propertySearch is activated we go on to look on lower levels
  		if (!data.hasOwnProperty(parameter) && propertySearch) {
  			var propertyNames = Object.keys(data);
  			ret = [];

  			for (i = 0; i < propertyNames.length; i++) {
  				var propertyData = data[propertyNames[i]];

  				if (propertyData === null || propertyData === undefined) {
  					continue;
  				}

  				// If the property contains an array or an object we have to dig deeper
  				if (Array.isArray(propertyData)) {

  					// Is an array so we have to check every item
  					propertyData.forEach(function (propertyDataItem) {
  						var foundValue = deepField(propertyDataItem, propertyPath, propertySearch, newPropertySearchDepth);
  						if (foundValue !== null) {
  							ret.push(foundValue);
  						}
  					});
  				} else if (propertyData.constructor.name === 'Object') {
  					// Is a single object so we can check it directly
  					var foundValue = deepField(propertyData, propertyPath, propertySearch, newPropertySearchDepth);
  					if (foundValue !== null) {
  						ret.push(foundValue);
  					}
  				}
  			}

  			if (ret.length === 0) {
  				ret = null;
  			} else if (ret.length === 1) {
  				ret = ret[0];
  			}
  		} else if (propertyPath.length < 2) {
  			// If the current one was the last parameter part left we can directly return
  			ret = data[parameter];
  		} else {
  			// If there are more parts left we go on with the search

  			// We get rid of the first parameter
  			ret = deepField(data[parameter], propertyPath.slice(1), propertySearch, newPropertySearchDepth);
  		}
  	}

  	return ret;
  }

  function _getSingleOpt(first, override, fallback) {
  	var ret = void 0;
  	if (first !== undefined) {
  		ret = first;
  	} else if (override !== undefined) {
  		ret = override;
  	} else {
  		ret = fallback;
  	}
  	return ret;
  }

  function _getOptions(search, _defaults) {
  	var options = {};

  	search = search || {};

  	// did we have a negator?
  	//options.negator = search._not ? true : _defaults.negator || false;
  	options.negator = _getSingleOpt(search._not, _defaults.negator, false);
  	// do we join via AND or OR
  	//options.joinAnd = search._join && search._join === "OR" ? false : _defaults.join || true;
  	options.joinAnd = _getSingleOpt(search._join, _defaults.join, "AND") !== "OR";

  	// did we have text, word, start or end search?
  	options.text = _getSingleOpt(search._text, _defaults.text, false);
  	options.word = _getSingleOpt(search._word, _defaults.word, false);
  	options.start = _getSingleOpt(search._start, _defaults.start, false);
  	options.end = _getSingleOpt(search._end, _defaults.end, false);

  	options.separator = search._separator || _defaults.separator || '.';
  	options.propertySearch = _getSingleOpt(search._propertySearch, _defaults.propertySearch, false);
  	options.propertySearchDepth = _getSingleOpt(search._propertySearchDepth, _defaults.propertySearchDepth, -1);

  	return options;
  }

  var _defaults = {};

  // Allows to overwrite the global default values
  function setDefaults(options) {
  	for (var key in options) {
  		_defaults[key] = options[key];
  	}
  }

  function resetDefaults() {
  	_defaults = {};
  }

  function singleMatch(field, s, text, word, start, end) {
  	var oneMatch = false,
  	    t = void 0,
  	    re = void 0,
  	    j = void 0,
  	    from = void 0,
  	    to = void 0;
  	// for numbers, exact match; for strings, ignore-case match; for anything else, no match
  	t = typeof field === 'undefined' ? 'undefined' : _typeof(field);
  	if (field === null) {
  		oneMatch = s === null;
  	} else if (field === undefined) {
  		oneMatch = s === undefined;
  	} else if (t === "boolean") {
  		oneMatch = s === field;
  	} else if (t === "number" || field instanceof Date) {
  		if (s !== null && s !== undefined && toType(s) === "object") {
  			if (s.from !== undefined || s.to !== undefined || s.gte !== undefined || s.lte !== undefined) {
  				from = s.from || s.gte;
  				to = s.to || s.lte;
  				oneMatch = (s.from !== undefined || s.gte !== undefined ? field >= from : true) && (s.to !== undefined || s.lte !== undefined ? field <= to : true);
  			} else if (s.gt !== undefined || s.lt !== undefined) {
  				oneMatch = (s.gt !== undefined ? field > s.gt : true) && (s.lt !== undefined ? field < s.lt : true);
  			}
  		} else {
  			if (field instanceof Date && s instanceof Date) {
  				oneMatch = field.getTime() === s.getTime();
  			} else {
  				oneMatch = field === s;
  			}
  		}
  	} else if (t === "string") {
  		if (typeof s === "string") {
  			s = s.toLowerCase();
  		}
  		field = field.toLowerCase();
  		if (text) {
  			oneMatch = field.indexOf(s) !== -1;
  		} else if (word) {
  			re = new RegExp("(\\s|^)" + s + "(?=\\s|$)", "i");
  			oneMatch = field && field.match(re) !== null;
  		} else if (start) {
  			re = new RegExp("^" + s, "i");
  			oneMatch = field && field.match(re) !== null;
  		} else if (end) {
  			re = new RegExp(s + "$", "i");
  			oneMatch = field && field.match(re) !== null;
  		} else if (s !== null && s !== undefined && toType(s) === "object") {
  			if (s.from !== undefined || s.to !== undefined || s.gte !== undefined || s.lte !== undefined) {
  				from = s.from || s.gte;
  				to = s.to || s.lte;
  				oneMatch = (s.from !== undefined || s.gte !== undefined ? field >= from : true) && (s.to !== undefined || s.lte !== undefined ? field <= to : true);
  			} else if (s.gt !== undefined || s.lt !== undefined) {
  				oneMatch = (s.gt !== undefined ? field > s.gt : true) && (s.lt !== undefined ? field < s.lt : true);
  			}
  		} else {
  			oneMatch = s === field;
  		}
  	} else if (field.length !== undefined) {
  		// array, so go through each
  		for (j = 0; j < field.length; j++) {
  			oneMatch = singleMatch(field[j], s, text, word, start, end);
  			if (oneMatch) {
  				break;
  			}
  		}
  	} else if (t === "object") {
  		oneMatch = field[s] !== undefined;
  	}
  	return oneMatch;
  }

  function matchArray(ary, search) {
  	var matched = false,
  	    i = void 0,
  	    ret = [],
  	    options = _getOptions(search, _defaults);
  	if (ary && ary.length > 0) {
  		for (i = 0; i < ary.length; i++) {
  			matched = _matchObj(ary[i], search, options);
  			if (matched) {
  				ret.push(ary[i]);
  			}
  		}
  	}
  	return ret;
  }

  function matchObject(obj, search) {
  	var options = _getOptions(search, _defaults);
  	return _matchObj(obj, search, options);
  }

  function _matchObj(obj, search, options) {
  	var i = void 0,
  	    j = void 0,
  	    matched = void 0,
  	    oneMatch = void 0,
  	    ary = void 0,
  	    searchTermParts = void 0;
  	search = search || {};

  	// if joinAnd, then matched=true until we have a single non-match; if !joinAnd, then matched=false until we have a single match
  	matched = !!options.joinAnd;

  	// are we a primitive or a composite?
  	if (search.terms) {
  		for (j = 0; j < search.terms.length; j++) {
  			oneMatch = matchObject(obj, search.terms[j]);
  			if (options.negator) {
  				oneMatch = !oneMatch;
  			}
  			// if AND, a single match failure makes all fail, and we break
  			// if OR, a single match success makes all succeed, and we break
  			if (options.joinAnd && !oneMatch) {
  				matched = false;
  				break;
  			} else if (!options.joinAnd && oneMatch) {
  				matched = true;
  				break;
  			}
  		}
  	} else {
  		// match to the search field
  		for (i in search) {
  			if (search.hasOwnProperty(i) && i.indexOf("_") !== 0) {
  				// match each one, if search[i] is an array - just concat to be safe
  				searchTermParts = i.split(options.separator);
  				ary = [].concat(search[i]);
  				for (j = 0; j < ary.length; j++) {
  					oneMatch = singleMatch(deepField(obj, searchTermParts, options.propertySearch, options.propertySearchDepth), ary[j], options.text, options.word, options.start, options.end);
  					if (oneMatch) {
  						break;
  					}
  				}
  				// negator
  				if (options.negator) {
  					oneMatch = !oneMatch;
  				}

  				// if AND, a single match failure makes all fail, and we break
  				// if OR, a single match success makes all succeed, and we break
  				if (options.joinAnd && !oneMatch) {
  					matched = false;
  					break;
  				} else if (!options.joinAnd && oneMatch) {
  					matched = true;
  					break;
  				}
  			}
  		}
  	}
  	return matched;
  }

  exports.setDefaults = setDefaults;
  exports.resetDefaults = resetDefaults;
  exports.singleMatch = singleMatch;
  exports.matchArray = matchArray;
  exports.matchObject = matchObject;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
