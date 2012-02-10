const Cc = Components.classes;
const Ci = Components.interfaces;
const ATOM_SVC = Components.classes["@mozilla.org/atom-service;1"]
                 .getService(Components.interfaces.nsIAtomService);

// Make a namespace.
if (typeof peercastRadio == 'undefined') {
	var peercastRadio = {};
}

var peercastRadioPrefs = {

	yellowpagesArray : null,
	filterArray : null,

	init : function() {
		// yellow pages pane
		var yellowpagesMenuListEl = document.getElementById("peercast-radio-prefspane-yellowpages-name-menulist");
		var yellowpagesMenuPopupEl = document.getElementById("peercast-radio-prefspane-yellowpages-name-menupopup");
		while (yellowpagesMenuPopupEl.firstChild) {
			yellowpagesMenuPopupEl.removeChild(yellowpagesMenuPopupEl.firstChild);
		}

		this.yellowpagesArray = eval(Application.prefs.getValue("extensions.peercast-radio.option-yellowpages-array", null));
		if(this.yellowpagesArray.length > 0) {
			for (var i=0; i<this.yellowpagesArray.length; i++) {
				var menuItem = document.createElement('menuitem');
				menuItem.setAttribute("label", this.yellowpagesArray[i].name);
				yellowpagesMenuPopupEl.appendChild(menuItem);
			}
			yellowpagesMenuListEl.selectedIndex = 0;
			this.onSelectYellowpagesName();
		}

		// filter pane
		var filterNameListEl = document.getElementById("peercast-radio-prefspane-filter-name-menulist");
		var filterNamePopupEl = document.getElementById("peercast-radio-prefspane-filter-name-menupopup");

		while (filterNamePopupEl.firstChild) {
			filterNamePopupEl.removeChild(filterNamePopupEl.firstChild);
		}

		this.filterArray = eval(Application.prefs.getValue("extensions.peercast-radio.option-filter-array", null));
		if(this.filterArray.length > 0) {
			for (var i=0; i<this.filterArray.length; i++) {
				var menuItem = document.createElement('menuitem');
				menuItem.setAttribute("label", this.filterArray[i].name);
				filterNamePopupEl.appendChild(menuItem);
			}
			filterNameListEl.selectedIndex = 0;
			this.onSelectFilterName();
		}
	},

// ### Yellow Pages ###
	addYellowpage : function() {
		var nameListEl = document.getElementById("peercast-radio-prefspane-yellowpages-name-menulist");
		var namePopupEl = document.getElementById("peercast-radio-prefspane-yellowpages-name-menupopup");

		// get label & idx
		var yellowpagesName = nameListEl.value;
		var idx = -1;
		for(var i=0; i<namePopupEl.childElementCount; i++) {
			if(yellowpagesName == namePopupEl.childNodes[i].getAttribute("label")) {
				idx = i;
				break;
			}
		}
		url = document.getElementById("peercast-radio-prefspane-yellowpages-url").value;
		active = document.getElementById("peercast-radio-prefspane-yellowpages-active").checked;

		// check data & alert
		if (idx != -1) {
			window.alert("登録されていないイエローページ名を指定してくだい。");
			return;
		}

		// confirm  
		var ret = window.confirm("イエローページ「" + yellowpagesName + "」を追加します。よろしいですか？");
		if (!ret) {
			retuen;
		}
		
		// append
		idx = this.yellowpagesArray.length;
		this.yellowpagesArray.push({
			name: yellowpagesName,
			url: url,
			active: active
			});
		var menuItem = document.createElement('menuitem');
		menuItem.setAttribute("label", yellowpagesName);
		namePopupEl.appendChild(menuItem);

		// select
		nameListEl.selectedIndex = idx;

		// onselect
		this.onSelectYellowpagesName();

		// savePrefs
		this.saveYellowpagesPrefs();
	},

	updateYellowpage : function() {
		var nameListEl = document.getElementById("peercast-radio-prefspane-yellowpages-name-menulist");
		var namePopupEl = document.getElementById("peercast-radio-prefspane-yellowpages-name-menupopup");

		// get label & idx
		var yellowpagesName = nameListEl.value;
		var idx = -1;
		for(var i=0; i<namePopupEl.childElementCount; i++) {
			if(yellowpagesName == namePopupEl.childNodes[i].getAttribute("label")) {
				idx = i;
				break;
			}
		}
		url = document.getElementById("peercast-radio-prefspane-yellowpages-url").value;
		active = document.getElementById("peercast-radio-prefspane-yellowpages-active").checked;
		
		// check data & alert
		if (idx == -1) {
			window.alert("登録されているイエローページ名を指定してくだい。");
			return;
		}

		// confirm  
		var ret = window.confirm("イエローページ「" + yellowpagesName + "」を更新します。よろしいですか？");
		if (!ret) {
			retuen;
		}

		// update
		this.yellowpagesArray[idx].name = yellowpagesName;
		this.yellowpagesArray[idx].url = url;
		this.yellowpagesArray[idx].active = active;

		// select
		nameListEl.selectedIndex = idx;

		// onselect
		this.onSelectYellowpagesName();

		// savePrefs
		this.saveYellowpagesPrefs();
	},

	deleteYellowpage : function() {
		var nameListEl = document.getElementById("peercast-radio-prefspane-yellowpages-name-menulist");
		var namePopupEl = document.getElementById("peercast-radio-prefspane-yellowpages-name-menupopup");

		// get label & idx
		var yellowpagesName = nameListEl.value;
		var idx = -1;
		for(var i=0; i<namePopupEl.childElementCount; i++) {
			if(yellowpagesName == namePopupEl.childNodes[i].getAttribute("label")) {
				idx = i;
				break;
			}
		}
		
		// check data & alert
		if (idx == -1) {
			window.alert("登録されているイエローページを指定してくだい。");
			return;
		}
		
		// confirm  
		var ret = window.confirm("イエローページ「" + yellowpagesName + "」を削除します。よろしいですか？");
		if (!ret) {
			retuen;
		}
		
		// delete
		this.yellowpagesArray.splice(idx, 1);
		namePopupEl.removeChild(namePopupEl.childNodes[idx]);
		
		// select
		nameListEl.selectedIndex = 0;

		// onselect
		this.onSelectYellowpagesName();

		// savePrefs
		this.saveYellowpagesPrefs();
	},
	
	onSelectYellowpagesName : function() {
		var idx = document.getElementById("peercast-radio-prefspane-yellowpages-name-menulist").selectedIndex;
		if (this.yellowpagesArray.length > 0) {
			document.getElementById("peercast-radio-prefspane-yellowpages-name-menulist").value
				= this.yellowpagesArray[idx].name;
			document.getElementById("peercast-radio-prefspane-yellowpages-url").value
				= this.yellowpagesArray[idx].url;
			document.getElementById("peercast-radio-prefspane-yellowpages-active").checked
				= this.yellowpagesArray[idx].active;
		} else {
			document.getElementById("peercast-radio-prefspane-yellowpages-name-menulist").value
				= "";
			document.getElementById("peercast-radio-prefspane-yellowpages-url").value
				= "";
			document.getElementById("peercast-radio-prefspane-yellowpages-active").checked
				= true;
		}
	},

	saveYellowpagesPrefs : function() {
		Application.prefs.setValue("extensions.peercast-radio.option-yellowpages-array", this.yellowpagesArray.toSource());
	},


// ### Filter ###
	addFilter : function() {
		var nameListEl = document.getElementById("peercast-radio-prefspane-filter-name-menulist");
		var namePopupEl = document.getElementById("peercast-radio-prefspane-filter-name-menupopup");
		var targetListEl = document.getElementById("peercast-radio-prefspane-filter-target-menulist");
		var conditionListEl = document.getElementById("peercast-radio-prefspane-filter-condition-menulist");

		// get label & idx
		var filterName = nameListEl.value;
		var idx = -1;
		for(var i=0; i<namePopupEl.childElementCount; i++) {
			if(filterName == namePopupEl.childNodes[i].getAttribute("label")) {
				idx = i;
				break;
			}
		}
		var target = targetListEl.selectedItem.getAttribute("target");
		var condition = conditionListEl.selectedItem.getAttribute("condition");
		var strvalue = document.getElementById("peercast-radio-prefspane-filter-strvalue").value;
		var numvalue = document.getElementById("peercast-radio-prefspane-filter-numvalue").value;
		var active = document.getElementById("peercast-radio-prefspane-filter-active").checked;
		var category = "string";
		if (target == "listener" || target == "time" || target == "bitrate") {
			category = "number";
		}

		// check data & alert
		if (idx != -1) {
			window.alert("登録されていないフィルタ名を指定してくだい。");
			return;
		}

		// confirm  
		var ret = window.confirm("フィルタ「" + filterName + "」を追加します。よろしいですか？");
		if (!ret) {
			retuen;
		}
		
		// append
		idx = this.filterArray.length;
		if (category == "string") {
			numvalue = 0;
		} else {
			srvalue = "";
		}
		this.filterArray.push({
			name: filterName,
			target: target,
			condition: condition,
			strvalue: strvalue,
			numvalue: numvalue,
			active: active
			});
		var menuItem = document.createElement('menuitem');
		menuItem.setAttribute("label", filterName);
		namePopupEl.appendChild(menuItem);

		// select
		nameListEl.selectedIndex = idx;

		// onselect
		this.onSelectFilterName();

		// savePrefs
		this.saveFilterPrefs();
	},

	updateFilter : function() {
		var nameListEl = document.getElementById("peercast-radio-prefspane-filter-name-menulist");
		var namePopupEl = document.getElementById("peercast-radio-prefspane-filter-name-menupopup");
		var targetListEl = document.getElementById("peercast-radio-prefspane-filter-target-menulist");
		var conditionListEl = document.getElementById("peercast-radio-prefspane-filter-condition-menulist");

		// get label & idx
		var filterName = nameListEl.value;
		var idx = -1;
		for(var i=0; i<namePopupEl.childElementCount; i++) {
			if(filterName == namePopupEl.childNodes[i].getAttribute("label")) {
				idx = i;
				break;
			}
		}
		var target = targetListEl.selectedItem.getAttribute("target");
		var condition = conditionListEl.selectedItem.getAttribute("condition");
		var strvalue = document.getElementById("peercast-radio-prefspane-filter-strvalue").value;
		var numvalue = document.getElementById("peercast-radio-prefspane-filter-numvalue").value;
		var active = document.getElementById("peercast-radio-prefspane-filter-active").checked;
		var category = "string";
		if (target == "listener" || target == "time" || target == "bitrate") {
			category = "number";
		}
		
		// check data & alert
		if (idx == -1) {
			window.alert("登録されているフィルタ名を指定してくだい。");
			return;
		}

		// confirm  
		var ret = window.confirm("フィルタ「" + filterName + "」を更新します。よろしいですか？");
		if (!ret) {
			retuen;
		}

		// update
		if (category == "string") {
			numvalue = 0;
		} else {
			srvalue = "";
		}
		this.filterArray[idx].name = filterName;
		this.filterArray[idx].target = target;
		this.filterArray[idx].condition = condition;
		this.filterArray[idx].strvalue = strvalue;
		this.filterArray[idx].numvalue = numvalue;
		this.filterArray[idx].active = active;

		// select
		nameListEl.selectedIndex = idx;

		// onselect
		this.onSelectFilterName();

		// savePrefs
		this.saveFilterPrefs();
	},

	deleteFilter : function() {
		var nameListEl = document.getElementById("peercast-radio-prefspane-filter-name-menulist");
		var namePopupEl = document.getElementById("peercast-radio-prefspane-filter-name-menupopup");

		// get label & idx
		var filterName = nameListEl.value;
		var idx = -1;
		for(var i=0; i<namePopupEl.childElementCount; i++) {
			if(filterName == namePopupEl.childNodes[i].getAttribute("label")) {
				idx = i;
				break;
			}
		}
		
		// check data & alert
		if (idx == -1) {
			window.alert("登録されているフィルタ名を指定してくだい。");
			return;
		}
		if (filterName == "お気に入り") {
			window.alert("フィルタ「お気に入り」は削除できません。");
			return;
		}
		
		// confirm  
		var ret = window.confirm("フィルタ「" + filterName + "」を削除します。よろしいですか？");
		if (!ret) {
			retuen;
		}
		
		// delete
		this.filterArray.splice(idx, 1);
		namePopupEl.removeChild(namePopupEl.childNodes[idx]);
		
		// select
		nameListEl.selectedIndex = 0;

		// onselect
		this.onSelectFilterName();

		// savePrefs
		this.saveFilterPrefs();
	},
	
	onSelectFilterName : function() {
		var nameListEl = document.getElementById("peercast-radio-prefspane-filter-name-menulist");
		var namePopupEl = document.getElementById("peercast-radio-prefspane-filter-name-menupopup");
		var targetListEl = document.getElementById("peercast-radio-prefspane-filter-target-menulist");
		var targetPopupEl = document.getElementById("peercast-radio-prefspane-filter-target-menupopup");
		var conditionListEl = document.getElementById("peercast-radio-prefspane-filter-condition-menulist");
		var conditionPopupEl = document.getElementById("peercast-radio-prefspane-filter-condition-menupopup");

		var idx = nameListEl.selectedIndex;
		var target = this.filterArray[idx].target;
		var condition = this.filterArray[idx].condition;
		var category = "string";
		if (target == "listener" || target == "time" || target == "bitrate")
			category = "number";
		for(var i=0; i<targetPopupEl.childElementCount; i++) {
			if(targetPopupEl.childNodes[i].getAttribute("target") == target) {
				targetListEl.selectedIndex = i;
				break;
			}
		}
		for(var i=0; i<conditionPopupEl.childElementCount; i++) {
			if(conditionPopupEl.childNodes[i].getAttribute("category") == category) {
				conditionPopupEl.childNodes[i].hidden = false;
				if(conditionPopupEl.childNodes[i].getAttribute("condition") == condition) {
					conditionListEl.selectedIndex = i;
				}
			} else {
				conditionPopupEl.childNodes[i].hidden = true;
			}
		}
		if (category == "string") {
			document.getElementById("peercast-radio-prefspane-filter-strvalue").hidden = false;
			document.getElementById("peercast-radio-prefspane-filter-numvalue").hidden = true;
		} else {
			document.getElementById("peercast-radio-prefspane-filter-strvalue").hidden = true;
			document.getElementById("peercast-radio-prefspane-filter-numvalue").hidden = false;
		}
		if (this.filterArray.length > 0) {
			document.getElementById("peercast-radio-prefspane-filter-strvalue").value
				= this.filterArray[idx].strvalue;
			document.getElementById("peercast-radio-prefspane-filter-numvalue").value
				= this.filterArray[idx].numvalue;
			document.getElementById("peercast-radio-prefspane-filter-active").checked
				= this.filterArray[idx].active;
		} else {
			document.getElementById("peercast-radio-prefspane-filter-strvalue").value
				= "";
			document.getElementById("peercast-radio-prefspane-filter-numvalue").value
				= 0;
			document.getElementById("peercast-radio-prefspane-filter-active").checked
				= true;
		}
	},
	
	onSelectTargetName : function() {
		var targetListEl = document.getElementById("peercast-radio-prefspane-filter-target-menulist");
		var targetPopupEl = document.getElementById("peercast-radio-prefspane-filter-target-menupopup");
		var conditionListEl = document.getElementById("peercast-radio-prefspane-filter-condition-menulist");
		var conditionPopupEl = document.getElementById("peercast-radio-prefspane-filter-condition-menupopup");

		var category = targetListEl.selectedItem.getAttribute("category");
		for(var i=0; i<conditionPopupEl.childElementCount; i++) {
			if(conditionPopupEl.childNodes[i].getAttribute("category") == category) {
				conditionPopupEl.childNodes[i].hidden = false;
				if(conditionPopupEl.childNodes[i].getAttribute("condition") == "eq") {
					conditionListEl.selectedIndex = i;
				}
			} else {
				conditionPopupEl.childNodes[i].hidden = true;
			}
		}
		if (category == "string") {
			document.getElementById("peercast-radio-prefspane-filter-strvalue").hidden = false;
			document.getElementById("peercast-radio-prefspane-filter-numvalue").hidden = true;
		} else {
			document.getElementById("peercast-radio-prefspane-filter-strvalue").hidden = true;
			document.getElementById("peercast-radio-prefspane-filter-numvalue").hidden = false;
		}
		document.getElementById("peercast-radio-prefspane-filter-strvalue").value
			= "";
		document.getElementById("peercast-radio-prefspane-filter-numvalue").value
			= 0;
		document.getElementById("peercast-radio-prefspane-filter-active").checked
			= true;
	},
	
	onSelectConditionName : function() {
		// do nothing
	},
	
	saveFilterPrefs : function() {
		Application.prefs.setValue("extensions.peercast-radio.option-filter-array", this.filterArray.toSource());
	}
}
