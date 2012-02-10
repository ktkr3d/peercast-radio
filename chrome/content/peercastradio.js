const Cc = Components.classes;
const Ci = Components.interfaces;
const ATOM_SVC = Components.classes["@mozilla.org/atom-service;1"]
                 .getService(Components.interfaces.nsIAtomService);

if (typeof peercastRadio == 'undefined') {
	var peercastRadio = {};
}

var peercastRadioTable = null;
var peercastRadioData = null;
var peercastRadioTree;
var peercastRadioFilterText = "";
var peercastRadioFilters = null;

var peercastRadio = {
	timerCount : 0,
	debug : true,
	yellowpagesArray : null,
	filterArray : null,
	
	init : function() {
		if (Application.prefs.getValue("extensions.peercast-radio.first-kick", false)) {
			// platform detection
			// Windows: "WINNT", Linux: "Linux", Mac "Darwin"
			var osString = Components.classes["@mozilla.org/xre/app-info;1"]
							 .getService(Components.interfaces.nsIXULRuntime).OS;
			var strOptionPlayerMmsPlayer = "";
			var strOptionPlayerMmsMediatype ="WMV,WMA";
			var bOptionPlayerMmsUseMmsh = false;
			var strOptionPlayerHttpPlayer = "";
			var strOptionPlayerHttpMediatype = "OGG,MP3";
			
			if (osString == "WINNT") {
				strOptionPlayerMmsPlayer = "C:\\Program Files\\Windows Media Player\\wmplayer.exe";
				strOptionPlayerMmsMediatype ="WMV,WMA,MP3";
				strOptionPlayerHttpPlayer = "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe";
				strOptionPlayerHttpMediatype = "OGG";
			} else if (osString == "Linux") {
				strOptionPlayerMmsPlayer = "/usr/bin/vlc";
				bOptionPlayerMmsUseMmsh = true;
				strOptionPlayerHttpPlayer = "/usr/bin/vlc";
			} else if (osString == "Darwin") {
			} else {
			}
			Application.prefs.setValue("extensions.peercast-radio.option-player-mms-player", strOptionPlayerMmsPlayer);
			Application.prefs.setValue("extensions.peercast-radio.option-player-mms-mediatype", strOptionPlayerMmsMediatype);
			Application.prefs.setValue("extensions.peercast-radio.option-player-mms-use-mmsh", bOptionPlayerMmsUseMmsh);
			Application.prefs.setValue("extensions.peercast-radio.option-player-http-player", strOptionPlayerHttpPlayer);
			Application.prefs.setValue("extensions.peercast-radio.option-player-http-mediatype", strOptionPlayerHttpMediatype);

			// open option player panel
//			this.openPrefWindow("peercast-radio-pane-player");
			
			// open about page
			this.openAbout();

			// add peercast radio toolbutton?
			var nb = gBrowser.getNotificationBox();
			nb.appendNotification(
				"You can add the \"Peercast Radio\" button on your toolbar now.",
				"pcr-notification",
				"chrome://peercast-radio/skin/toolbarbutton.gif",
				nb.PRIORITY_INFO_MEDIUM,
				[
					{
						label: "Add now",
						accessKey: "",
						callback: function() {
							window.BrowserCustomizeToolbar();
						}
					}
				]
			);
			
			Application.prefs.setValue("extensions.peercast-radio.first-kick", false);
			
		}
		// get installed version number
		var strInstalledVersion = Application.prefs.getValue("extensions.peercast-radio.installed-version", "");

		// set current version number (to be modified...)
		Application.prefs.setValue("extensions.peercast-radio.installed-version", "0.1.0a10");

		// setup toolber filter
		document.getElementById("peercast-radio-toolbar-filter-toolbar").checked
			= Application.prefs.getValue("extensions.peercast-radio.status-filter-on", false);

		// setup yellow pages menupopup
		this.loadYellowPagesPrefs();

		// setup filter menupopup
		this.loadFilterPrefs();

		// open yellowpages
		if (Application.prefs.getValue("extensions.peercast-radio.option-general-open-yellowpages-onload", false)) {
			this.loadYellowPages();
		}

		// open channel information panel
		if (Application.prefs.getValue("extensions.peercast-radio.option-general-open-channelpanel-onload", false)) {
			this.openChannelInformation();
		}

		// kick peercast
		if (Application.prefs.getValue("extensions.peercast-radio.option-general-kick-peercast-onload", false)) {
			this.kickPeercast();
		}
	},
	
	loadYellowPagesPrefs: function() {
		// yellow pages
		this.yellowpagesArray = eval(Application.prefs.getValue("extensions.peercast-radio.option-yellowpages-array", null));
		var toolbarYellowpagesMenupopupEl = document.getElementById("peercast-radio-toolbar-yellow-pages-menupopup");
		while(toolbarYellowpagesMenupopupEl.firstChild) {
			toolbarYellowpagesMenupopupEl.removeChild(toolbarYellowpagesMenupopupEl.firstChild);
		}
		if (this.yellowpagesArray != null) {
			for(var i=0; i<this.yellowpagesArray.length; i++) {
				var menuItem = document.createElement("menuitem");
				menuItem.setAttribute("type", "checkbox");
				menuItem.setAttribute("label", this.yellowpagesArray[i].name);
//				menuItem.setAttribute("oncommand", "peercastRadio.saveYellowPagesPrefs()");
				if (this.yellowpagesArray[i].active)
					menuItem.setAttribute("checked", true);
				else
					menuItem.removeAttribute("checked");
				toolbarYellowpagesMenupopupEl.appendChild(menuItem);
			}
		}
	},

	saveYellowPagesPrefs: function() {
		Application.prefs.setValue("extensions.peercast-radio.option-yellowpages-array", this.yellowpagesArray.toSource());
	},

	loadFilterPrefs: function() {
		this.filterArray = eval(Application.prefs.getValue("extensions.peercast-radio.option-filter-array", null));
		var toolbarFilterMenupopupEl = document.getElementById("peercast-radio-toolbar-filter-menupopup");
		while(toolbarFilterMenupopupEl.firstChild) {
			toolbarFilterMenupopupEl.removeChild(toolbarFilterMenupopupEl.firstChild);
		}
		if (this.filterArray != null) {
			for(var i=0; i<this.filterArray.length; i++) {
				var menuItem = document.createElement("menuitem");
				menuItem.setAttribute("type", "checkbox");
				menuItem.setAttribute("label", this.filterArray[i].name);
//				menuItem.setAttribute("oncommand", "peercastRadio.saveFilterPrefs()");
				if(this.filterArray[i].active)
					menuItem.setAttribute("checked", true);
				else
					menuItem.removeAttribute("checked");
				toolbarFilterMenupopupEl.appendChild(menuItem);
			}
		}
	},

	saveFilterPrefs: function() {
		Application.prefs.setValue("extensions.peercast-radio.option-filter-array", this.filterArray.toSource());
	},

	loadYellowPages : function(el) {
		if (el != null && el.tagName == "menuitem") {
			var toolbarYellowpagesMenupopupEl = document.getElementById("peercast-radio-toolbar-yellow-pages-menupopup");
			for (var i=0; i<this.yellowpagesArray.length; i++) {
				this.yellowpagesArray[i].active = toolbarYellowpagesMenupopupEl.childNodes[i].hasAttribute("checked");
			}
			this.saveYellowPagesPrefs();
			return;
		}
		
		// Clear Table
		peercastRadioTree = document.getElementById("peercast-radio-channel-tree");
		peercastRadioData = [];

		// deselect
		peercastRadioTree.view.selection.clearSelection();

		// 
		for(var i=0; i<this.yellowpagesArray.length; i++) {
			if(this.yellowpagesArray[i].active) {
				this.getChannelData(this.yellowpagesArray[i].url);
			}
		}
	},

	getChannelData : function(targetUrl) {
		var lineData;
		var req = new XMLHttpRequest();
		req.open("GET", targetUrl + "index.txt", true);
		req.onreadystatechange = function () { 
			if (req.readyState == 4 && req.status == 200) { 
				peercastRadio.appendChannelList(req)
			}
		}
		req.send(null);
	},

	appendChannelList : function(req) {
		//receive request
		var res  = req.responseText;
		if (res.length == 0)
			return;
		var arrayChannelData = res.split("\n");

		var topVisibleRow = null;
		if (peercastRadioTable) {
			topVisibleRow = getTopVisibleRow();
		}
		
		// favorite
		var arryFavoriteChannels = [];
		for(var i=0; i<this.filterArray.length; i++) {
			if(this.filterArray[i].name == "お気に入り") {
				arryFavoriteChannels = this.filterArray[i].strvalue.split("|");
				break;
			}
		}
		var notificationBox = document.getElementById("peercast-radio-notificationbox");
				
		// Create Table
		for (var i=0; i<arrayChannelData.length; i++) {
			var channelData = arrayChannelData[i].split("<>");
			if (channelData[0] != "") {
				var channel = channelData[0].replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
				var comment = "";
				if (channelData[4].length != 0 || channelData[5].length != 0)
					comment += "[";
				if (channelData[4].length != 0)
					comment += channelData[4];
				if (channelData[4].length != 0 && channelData[5].length != 0)
					comment += " - ";
				if (channelData[5].length != 0)
					comment += channelData[5];
				if (channelData[4].length != 0 || channelData[5].length != 0)
					comment += "]";
				if ((channelData[4].length != 0 || channelData[5].length != 0) && channelData[17].length != 0)
					comment += " - ";
				if (channelData[17].length != 0)
					comment += channelData[17];
				comment = comment.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
				var strlistener = channelData[6];
				var listener = 0;
				if (isNaN(strlistener) == false) {
					listener = parseInt(strlistener);
				}
				var strTime = channelData[15].split(":");
				var numTime = parseInt(strTime[0])*60+parseInt(strTime[1]);
				var strbitrate = channelData[8];
				var bitrate = 0;
				if (isNaN(strbitrate) == false) {
					bitrate = parseInt(strbitrate);
				}
				var mediatype = channelData[9];
				var contacturl = channelData[3];
				var cid = channelData[1];
				var tip = channelData[2];
				var favorite = false;
				for(var j=0; j<arryFavoriteChannels.length; j++) {
					if (arryFavoriteChannels[j] == channel) {
						favorite = true;
						if (Application.prefs.getValue("extensions.peercast-radio.option-general-auto-reload-notify", false) &&
							Application.prefs.getValue("extensions.peercast-radio.option-general-auto-reload", false) &&
							Application.prefs.getValue("extensions.peercast-radio.option-general-auto-reload-interval", 5) > numTime) {
							var messageText = "「" + channel + "」の配信が開始されました。";
							var bFound = false;
							for (var k=0; k<notificationBox.childElementCount; k++) {
								if (notificationBox.childNodes[k].tagName == "notification" &&
									notificationBox.childNodes[k].getAttribute("label") == messageText) {
									bFound = true;
									break;
								}
							}
							if (!bFound) {
								this.addNotification(messageText);
							}
						}
						break;
					}
				}

				peercastRadioData.push({
					channel: 	channel,
					comment: 	comment,
					listener: 	listener,
					time: 		numTime,
					bitrate: 	bitrate,
					mediatype: 	mediatype,
					contacturl: contacturl,
					cid:		cid,
					tip:		tip,
					favorite:	favorite
				});
			}
		}
		
		// clears the selection and update toolbar status before clear table
		var objChannelTree = document.getElementById("peercast-radio-channel-tree");		
		objChannelTree.view.selection.clearSelection();
		document.getElementById("peercast-radio-toolbar-play")
			.setAttribute("disabled", true);
		document.getElementById("peercast-radio-toolbar-chat")
			.setAttribute("disabled", true);
		document.getElementById("peercast-radio-toolbar-play")
			.setAttribute("image", "chrome://peercast-radio/skin/nav-button-play-disable.png");
		document.getElementById("peercast-radio-toolbar-chat")
			.setAttribute("image", "chrome://peercast-radio/skin/nav-button-chat-disable.png");
		
		if (peercastRadioFilterText == "") {
			//show all of them
			peercastRadioTable = peercastRadioData;
		} else {
			//filter out the ones we want to display
			peercastRadioTable = [];
			peercastRadioData.forEach(function(element) {
				//we'll match on every property
				for (var i in element) {
					if (prepareForComparison(element[i]).indexOf(peercastRadioFilterText) != -1) {
						peercastRadioTable.push(element);
						break;
					}
				}
			});
		}

		// 	
		this.loadFilter(null);

		sort();

		//restore scroll position
		if (topVisibleRow) {
			setTopVisibleRow(topVisibleRow);
		}

		// update Channel Sum
		var sumChannel = peercastRadioData.length;
		var sumFilteredChannel = peercastRadioTable.length;
		document.getElementById("peercast-radio-channel-information-all-channel").value = sumChannel;
		document.getElementById("peercast-radio-channel-information-filtered-channel").value = sumFilteredChannel;
	},

	notificationCallback : function(notificationElement, notifcationButton) {
		// nothing to do
	},

	addNotification : function(messageText) {

		var mTop = document.getElementById("peercast-radio-notificationbox");
    
		var notificationPriority = 3;
		var notificationValue = notificationPriority;
		var notificationImage = "chrome://peercast-radio/skin/information.png";
		var notificationButtons = [{accessKey: null,
									callback: this.notificationCallback,
									label: "確認",
									popup: null}]

		var notificationLabel = messageText;

		mTop.appendNotification(notificationLabel,
								notificationValue,
								notificationImage,
								notificationPriority,
								notificationButtons);
	},

	getListenURL : function(cur) {
		
		var mediatype = peercastRadioTable[cur]["mediatype"].toLowerCase();
		var cid = peercastRadioTable[cur]["cid"];
		var tip = peercastRadioTable[cur]["tip"];
		var listenUrl = "";
		var patternMmsMediatype
			= Application.prefs.getValue("extensions.peercast-radio.option-player-mms-mediatype", "").toLowerCase();
		var patternHttpMediatype
			= Application.prefs.getValue("extensions.peercast-radio.option-player-http-mediatype", "").toLowerCase();
		var bOptionPlayerMmsUseMmsh
			= Application.prefs.getValue("extensions.peercast-radio.option-player-mms-use-mmsh", false);
		var host =	Application.prefs.getValue("extensions.peercast-radio.option-network-peercast-host", "localhost");
		var port =	Application.prefs.getValue("extensions.peercast-radio.option-network-peercast-port", 7144);


		if (patternHttpMediatype.indexOf(mediatype) != -1) {
			// Player2
			listenUrl = 
//				"http://" + host + ":" + port + "/stream/" + cid + "." + mediatype + "?tip=" + tip;
				"http://" + host + ":" + port + "/stream/" + cid + "?tip=" + tip;
		} else if (patternMmsMediatype.indexOf(mediatype) != -1) {
			// Player1
			if (bOptionPlayerMmsUseMmsh)
				listenUrl = "mmsh://";
			else
				listenUrl = "mms://";
//			listenUrl += host + ":" + port + "/stream/" + cid + "." + mediatype + "?tip=" + tip;
			listenUrl += host + ":" + port + "/stream/" + cid + "?tip=" + tip;
		} else {
			// 
			listenUrl = 
//				"http://" + host + ":" + port + "/stream/" + cid + "." + mediatype + "?tip=" + tip;
				"http://" + host + ":" + port + "/stream/" + cid + "?tip=" + tip;
		}

		if (cid == "00000000000000000000000000000000")
			listenUrl = "";
		
		return (listenUrl);
	},

// ### Nortification ###
	cancelNortification : function() {
		// hide
		document.getElementById("peercast-radio-notification-bar").hidden = true;
	},

// ### Channel Information ###
	openChannelInformation : function() {
		// show
		if (document.getElementById("peercast-radio-channel-information-bar").hidden) {
			document.getElementById("peercast-radio-channel-information-bar").hidden = false;
			document.getElementById("peercast-radio-toolbar-channel-information").setAttribute("checked", true)
		} else {
			this.cancelChannelInformation();
		}
	},
	
	cancelChannelInformation : function() {
		// hide
		document.getElementById("peercast-radio-channel-information-bar").hidden = true;
		document.getElementById("peercast-radio-toolbar-channel-information").removeAttribute("checked");
	},
	
// ### About ###
	openAbout : function() {
		// Home URL
		var targeturl = "chrome://peercast-radio/content/about.html";

		// open URL
		if (Application.activeWindow.activeTab.uri.spec == "about:blank") {
			// open in active tab
			Application.activeWindow.activeTab.load(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targeturl, null, null));		
		} else {
			// open in new tab
			Application.activeWindow.open(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targeturl, null, null)).focus();
		}
	},
	
	kickPeercast : function() {
		// check
		var strPeercastPath = Application.prefs.getValue("extensions.peercast-radio.option-general-kick-peercast-path", "");
		if (strPeercastPath != "") {
			var file = Components.classes["@mozilla.org/file/local;1"]
								 .createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(strPeercastPath);
			var process = Components.classes["@mozilla.org/process/util;1"]
									.createInstance(Components.interfaces.nsIProcess);
			process.init(file);
			var args = [];
			process.run(false, args, args.length);
		}
	},
	
// ### open URL / load URL ###	
	openURLAtNewTab : function(targetUrl, tab) {
		if (tab)
			Application.activeWindow.activeTab.load(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targetUrl, null, null));
		else
			Application.activeWindow.open(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targetUrl, null, null)).focus();
	},

	doDefaultAction : function(el) {
		if (el.tagName != "treechildren") {
			return;
		}
		
		// selected?
		var objChannelTree = document.getElementById("peercast-radio-channel-tree");		
		var cur = objChannelTree.currentIndex;
//		if (cur == -1)
		if(peercastRadioTree.view.selection.isSelected(cur) == false)
			return;
		
		// try streamurl
		var targeturl = this.getListenURL(cur);
		if (targeturl == undefined || targeturl == null || targeturl =="") {
			// try contact url
			targeturl = peercastRadioTable[cur]["contacturl"];
			if (targeturl == undefined || targeturl == null || targeturl =="") {
				return;
			} else {
				this.openContactURL();
			}
		} else {
			this.playStreamURL();
		}
	},
		
	playStreamURL : function() {


		// selected?
		var objChannelTree = document.getElementById("peercast-radio-channel-tree");		
		var cur = objChannelTree.currentIndex;
//		if (cur == -1)
		if(peercastRadioTree.view.selection.isSelected(cur) == false)
			return;
		
		// get selected item's streamurl
		var targeturl = this.getListenURL(cur);
		if (targeturl == undefined || targeturl == null || targeturl =="")
			return;

		// get selected item's mediatype
		var mediatype = peercastRadioTable[cur]["mediatype"].toLowerCase();
		var strPlayer = Application.prefs.getValue("extensions.peercast-radio.option-player-http-player", "");
		var strOption = Application.prefs.getValue("extensions.peercast-radio.option-player-http-option", "");
		if (Application.prefs.getValue("extensions.peercast-radio.option-player-mms-mediatype", "").toLowerCase().indexOf(mediatype) != -1) {
			strPlayer =Application.prefs.getValue("extensions.peercast-radio.option-player-mms-player", "");
			strOption =Application.prefs.getValue("extensions.peercast-radio.option-player-mms-option", "");
		}
		var strArgs = targeturl;
		if (strOption != "") {
			strArgs = strOption + " " + targeturl;
		}
		var args = strArgs.split(" ");

		if (true) {
			// load URL by External Application
			var file = Components.classes["@mozilla.org/file/local;1"]
								 .createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(strPlayer);
			var process = Components.classes["@mozilla.org/process/util;1"]
									.createInstance(Components.interfaces.nsIProcess);
			process.init(file);
			process.run(false, args, args.length);
//			this.logText("process.run()\nfile = " + strPlayer + "\nargs = " + strArgs);
		} else {
			// load URL by Browser
			Application.activeWindow.activeTab.load(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targeturl, null, null));
		}
	},
	
	openContactURL : function() {
		// selected?
		var objChannelTree = document.getElementById("peercast-radio-channel-tree");		
		var cur = objChannelTree.currentIndex;
//		if (cur == -1)
		if(peercastRadioTree.view.selection.isSelected(cur) == false)
			return;

		// get selected item's contacturl
		var targeturl = peercastRadioTable[cur]["contacturl"];
		if (targeturl == undefined || targeturl == null || targeturl =="")
			return;
		
		// open URL
		if (Application.activeWindow.activeTab.uri.spec == "about:blank") {
			// open in active tab
			Application.activeWindow.activeTab.load(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targeturl, null, null));		
		} else {
			// open in new tab
			Application.activeWindow.open(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targeturl, null, null)).focus();
		}
	},
	
	openHomeURL : function() {
		// Home URL
		var targeturl = "http://" +
			Application.prefs.getValue("extensions.peercast-radio.option-network-peercast-host", "localhost") + ":" +
			Application.prefs.getValue("extensions.peercast-radio.option-network-peercast-port", 7144) + "/";

		// open URL
		if (Application.activeWindow.activeTab.uri.spec == "about:blank") {
			// open in active tab
			Application.activeWindow.activeTab.load(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targeturl, null, null));		
		} else {
			// open in new tab
			Application.activeWindow.open(
				Cc["@mozilla.org/network/io-service;1"]
				.getService(Ci.nsIIOService)
				.newURI(targeturl, null, null)).focus();
		}
	},


	onItemSelected : function() {
		// selected?
		var objChannelTree = document.getElementById("peercast-radio-channel-tree");		
		var cur = objChannelTree.currentIndex;
//		if (cur == -1)
		if(peercastRadioTree.view.selection.isSelected(cur) == false)
			return;

		// update channel information
		document.getElementById("peercast-radio-channel-information-channel")
			.value = peercastRadioTable[cur]["channel"];
		document.getElementById("peercast-radio-channel-information-comment")
			.value = peercastRadioTable[cur]["comment"];
		var strListener = "" + peercastRadioTable[cur]["listener"];
		for(var i = 0; i < strListener.length/3; i++){
			strListener = strListener.replace(/^([+-]?\d+)(\d\d\d)/,"$1,$2");
		}
		document.getElementById("peercast-radio-channel-information-listener")
			.value = strListener
		var numTime = peercastRadioTable[cur]["time"];
		var days = Math.floor(numTime / (60*24));
		var hours = Math.floor((numTime - days*60*24) / 60);
		var minutes = numTime - days*60*24 - hours*60;
		var strTime = "";
		if (days > 0)
			strTime += days + " 日 ";
		strTime += hours + ":" + (minutes < 10 ? "0" : "") + minutes;
		document.getElementById("peercast-radio-channel-information-time")
			.value = strTime;
		var strBitrate = "" + peercastRadioTable[cur]["bitrate"];
		for(var i = 0; i < strBitrate.length/3; i++){
			strBitrate = strBitrate.replace(/^([+-]?\d+)(\d\d\d)/,"$1,$2");
		}
		document.getElementById("peercast-radio-channel-information-bitrate")
			.value = strBitrate; // + " kbps";
		document.getElementById("peercast-radio-channel-information-mediatype")
			.value = peercastRadioTable[cur]["mediatype"];
		
		var startdate = new Date();
		startdate.setTime(startdate.getTime() - ((days*24 + hours)*60 + minutes)*60*1000);
		var weekchars = new Array( "日", "月", "火", "水", "木", "金", "土" );
		document.getElementById("peercast-radio-channel-information-startdate").value
			= startdate.getFullYear() + "年 " + (startdate.getMonth() + 1) + "月 " +
				startdate.getDate() + "日 (" + weekchars[startdate.getDay()] + ") " +
				startdate.getHours() + ":" + (startdate.getMinutes() < 10 ? "0" : "") +  startdate.getMinutes();

		// stream is available?
		if (peercastRadioTable[cur]["cid"] != "00000000000000000000000000000000") {
			document.getElementById("peercast-radio-channel-information-play").hidden = false;
			document.getElementById("peercast-radio-toolbar-play")
				.setAttribute("disabled", false);
			document.getElementById("peercast-radio-toolbar-play")
				.setAttribute("image", "chrome://peercast-radio/skin/nav-button-play.png");
		} else {
			document.getElementById("peercast-radio-channel-information-play").hidden = true;
			document.getElementById("peercast-radio-toolbar-play")
				.setAttribute("disabled", true);
			document.getElementById("peercast-radio-toolbar-play")
				.setAttribute("image", "chrome://peercast-radio/skin/nav-button-play-disable.png");
		}

		// chat is available?
		if (peercastRadioTable[cur]["contacturl"].length != 0) {
			document.getElementById("peercast-radio-channel-information-chat").hidden = false;
			document.getElementById("peercast-radio-toolbar-chat")
				.setAttribute("disabled", false);
			document.getElementById("peercast-radio-toolbar-chat")
				.setAttribute("image", "chrome://peercast-radio/skin/nav-button-chat.png");
		} else {
			document.getElementById("peercast-radio-channel-information-chat").hidden = true;
			document.getElementById("peercast-radio-toolbar-chat")
				.setAttribute("disabled", true);
			document.getElementById("peercast-radio-toolbar-chat")
				.setAttribute("image", "chrome://peercast-radio/skin/nav-button-chat-disable.png");
		}

		// favorite?
		document.getElementById("peercast-radio-channel-information-heart").hidden = !peercastRadioTable[cur]["favorite"];
	},

// ### Filter ###	
	inputFilter : function (event) {
		var value = prepareForComparison(event.target.value);
		this.setFilter(value);

		// update Channel Sum
		var sumFilteredChannel = peercastRadioTable.length;
		document.getElementById("peercast-radio-channel-information-filtered-channel").value = sumFilteredChannel;
	},

	clearFilter : function () {
		var filterElement = document.getElementById("filter");
		filterElement.focus();
		filterElement.value = "";
		this.setFilter("");
	},

	setFilter : function (text) {
		peercastRadioFilterText = text;
		this.loadFilter();
	},

	loadFilter : function (el) {
		// check
		if (el != null && el.tagName == "toolbarbutton") {
			// toggle filter button
			document.getElementById("peercast-radio-toolbar-filter-toolbar").checked
				= !document.getElementById("peercast-radio-toolbar-filter-toolbar").checked;
			Application.prefs.setValue("extensions.peercast-radio.status-filter-on",
				document.getElementById("peercast-radio-toolbar-filter-toolbar").checked);
		} else if (el != null && el.tagName == "menuitem") {
			// toggle filter item
			var toolbarFilterMenupoupEl = document.getElementById("peercast-radio-toolbar-filter-menupopup");
			for(var i=0; i< this.filterArray.length; i++) {
				this.filterArray[i].active = toolbarFilterMenupoupEl.childNodes[i].hasAttribute("checked");
			}
			this.saveFilterPrefs();
		}

		var topVisibleRow = null;
		if (peercastRadioTable) {
			topVisibleRow = getTopVisibleRow();
		}
		if (peercastRadioData == null) {
			return;
		}

		if (document.getElementById("peercast-radio-toolbar-filter-toolbar").checked) {
			// filter
			peercastRadioTable = [];
			var bHit = false;
			for (var i=0; i<peercastRadioData.length; i++) {
				bHit = false;
				for (var j=0; j<this.filterArray.length; j++) {
					var target = this.filterArray[j].target;
					var targetValue = peercastRadioData[i][target];
					var filterStrValue = this.filterArray[j].strvalue;
					var filterNumValue = this.filterArray[j].numvalue;
					var filterCondition = this.filterArray[j].condition;
					if (this.filterArray[j].active == true) {
						if (target == "channel" || target == "comment" || target == "mediatype") {
							targetValue = targetValue.toLowerCase();
							filterStrValue = filterStrValue.toLowerCase();
							if (filterCondition == "eq") {
								if (targetValue == filterStrValue) {
									 bHit = true;
								}
							} else if (filterCondition == "ex") {
								var bFound = false;
								var arryFilterValue = filterStrValue.split("|");
								for (var k=0; k<arryFilterValue.length; k++) {
									if (arryFilterValue[k] == targetValue) {
										bFound = true;
										break;
									}
								}
								if (bHit == false) {
									bHit = bFound;
								}
							} else if (filterCondition == "in") {
								if (targetValue.indexOf(filterStrValue) != -1) {
									 bHit = true;
								}
							}
						} else if (target == "time" || target == "listener" || target == "bitrate") {
							if (filterCondition == "eq") {
								if (targetValue == filterNumValue) {
									 bHit = true;
								}
							} else if (filterCondition == "gt") {
								if (targetValue >= filterNumValue) {
									 bHit = true;
								}
							} else if (filterCondition == "lt") {
								if (targetValue <= filterNumValue) {
									 bHit = true;
								}
							}
						}
					}
				}
				if (peercastRadioFilterText != "") {
					if (peercastRadioData[i]["channel"].indexOf(peercastRadioFilterText) == -1 &&
						peercastRadioData[i]["comment"].indexOf(peercastRadioFilterText) == -1 &&
						peercastRadioData[i]["mediatype"].indexOf(peercastRadioFilterText) == -1) {
						bHit = false;
					}
				}
				if (bHit) {
					peercastRadioTable.push(peercastRadioData[i]);
				}
			}
		} else {		
			if (peercastRadioFilterText == "") {
				peercastRadioTable = peercastRadioData;
			} else {
				peercastRadioTable = [];
				peercastRadioData.forEach(function(element) {
					for (var i in element) {
						if ((typeof (element[i]) == "string") &&
							(i == "channel" || i == "comment" || i == "mediatype") &&
							prepareForComparison(element[i]).indexOf(peercastRadioFilterText) != -1) {
							peercastRadioTable.push(element);
							break;
						}
					}
				});
			}
		}
		
		sort();

		//restore scroll position
		if (topVisibleRow) {
			setTopVisibleRow(topVisibleRow);
		}
		
		// update Channel Sum
		var sumChannel = peercastRadioData.length;
		var sumFilteredChannel = peercastRadioTable.length;
		document.getElementById("peercast-radio-channel-information-all-channel").value = sumChannel;
		document.getElementById("peercast-radio-channel-information-filtered-channel").value = sumFilteredChannel;
	},
	
	addFavorite : function(channelname) {
		// get channel name
		var targetChannelName;
		if (channelname != "") {
			var objChannelTree = document.getElementById("peercast-radio-channel-tree");		
			var cur = objChannelTree.currentIndex;
//			if (cur == -1)
			if(peercastRadioTree.view.selection.isSelected(cur) == false)
				return;
			targetChannelName = peercastRadioTable[cur].channel;
		} else {
			targetChannelName = channelname;
		}

		// update table
		var idx = -1;
		for (var i=0; i<this.filterArray.length; i++) {
			if(this.filterArray[i].name == "お気に入り") {
				idx = i;
				break;
			}
		}
		if (idx != -1) {
			var arryFavoriteChannels = this.filterArray[idx].strvalue.split("|");
			var bFound = false;
			for(var i=0; i<arryFavoriteChannels.length; i++) {
				if (arryFavoriteChannels[i] == targetChannelName) {
					bFound = true;
					break;
				}
			}
			if (!bFound) {
				if (arryFavoriteChannels.length > 0 && arryFavoriteChannels[0] != "") {
					this.filterArray[idx].strvalue += "|";
				}
				this.filterArray[idx].strvalue += targetChannelName;
				this.saveFilterPrefs();
			}
		}

		// update peercastRadioData & peercastRadioTable
		for (var i=0; i<peercastRadioTable.length; i++) {
			if (peercastRadioTable[i]["channel"] == targetChannelName) {
				peercastRadioTable[i]["favorite"] = true;
				break;
			}
		}
		for (var i=0; i<peercastRadioData.length; i++) {
			if (peercastRadioData[i]["channel"] == targetChannelName) {
				peercastRadioData[i]["favorite"] = true;
				break;
			}
		}

		// redraw row
		peercastRadioTree.treeBoxObject.invalidateRow(cur);

		// refresh
		this.onItemSelected();
	},
	
	deleteFavorite : function (channelname) {
		// get channel name
		var targetChannelName;
		if (channelname != "") {
			var objChannelTree = document.getElementById("peercast-radio-channel-tree");		
			var cur = objChannelTree.currentIndex;
//			if (cur == -1)
			if(peercastRadioTree.view.selection.isSelected(cur) == false)
				return;
			targetChannelName = peercastRadioTable[cur]["channel"];
		} else {
			targetChannelName = channelname;
		}

		var idx = -1;
		for (var i=0; i<this.filterArray.length; i++) {
			if (this.filterArray[i].name == "お気に入り") {
				idx = i;
				break;
			}
		}
		if (idx != -1) {
			var arryFavoriteChannels =this.filterArray[idx].strvalue.split("|");
			var newFavoriteChannels = "";
			for (var i=0; i<arryFavoriteChannels.length; i++) {
				if (targetChannelName != arryFavoriteChannels[i]) {
					newFavoriteChannels += arryFavoriteChannels[i] + "|";
				}
			}
			newFavoriteChannels = newFavoriteChannels.replace(/\|$/, "");
			this.filterArray[idx].strvalue = newFavoriteChannels;
			this.saveFilterPrefs();
		}

		// update peercastRadioData & peercastRadioTable
		for (var i=0; i<peercastRadioTable.length; i++) {
			if (peercastRadioTable[i]["channel"] == targetChannelName) {
				peercastRadioTable[i]["favorite"] = false;
				break;
			}
		}
		for (var i=0; i<peercastRadioData.length; i++) {
			if (peercastRadioData[i]["channel"] == targetChannelName) {
				peercastRadioData[i]["favorite"] = false;
				break;
			}
		}
	
		// redraw row
		peercastRadioTree.treeBoxObject.invalidateRow(cur);

		// refresh
		this.onItemSelected();
	},
	
	searchChannelName : function (channelname) {
		// get channel name
		var targetChannelName;
		if (channelname != "") {
			var objChannelTree = document.getElementById("peercast-radio-channel-tree");		
			var cur = objChannelTree.currentIndex;
//			if (cur == -1)
			if(peercastRadioTree.view.selection.isSelected(cur) == false)
				return;
			targetChannelName = peercastRadioTable[cur]["channel"];
		} else {
			targetChannelName = channelname;
		}

      	const nsIBSS = Components.interfaces.nsIBrowserSearchService;
      	const searchService =Components.classes["@mozilla.org/browser/search-service;1"].getService(nsIBSS);
        var searcghEngine = searchService.currentEngine;
      	var submission = searcghEngine.getSubmission(targetChannelName + " peercast", null);

		// open URL
		var browser = window
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.rootTreeItem
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIDOMWindow)
					.gBrowser;
		if (Application.activeWindow.activeTab.uri.spec == "about:blank") {
			// open in active tab
			browser.loadURI(submission.uri.spec, null, submission.postData, false);
		} else {
			browser.loadOneTab(submission.uri.spec, null, null, submission.postData, false, false);
		}
	},
	
	openPrefWindow : function (paneid) {
		openDialog("chrome://peercast-radio/content/preferences.xul",
					"",
					"chrome,titlebar,toolbar,centerscreen,modal",
					paneid);
		
		// reload yellowpage
		this.loadYellowPagesPrefs();
		
		// reload filter
		this.loadFilterPrefs();
	},

// ### log ###
	logText : function (aText) {
		if (this.debug) {
			var console = Components.classes["@mozilla.org/consoleservice;1"]
					.getService(Components.interfaces.nsIConsoleService);
			console.logStringMessage("[PeercastRadio] " + aText);
		}
	}
};

function treeView(table) {
	this.rowCount = table.length;
	this.getCellText = function(row, col) {
		return table[row][col.id];
	};
	this.getCellValue = function(row, col) {
		return table[row][col.id];
	};
	this.setTree = function(treebox) {
		this.treebox = treebox;
	};
	this.isEditable = function(row, col) {
		return col.editable;
	};
	this.isContainer = function(row){ return false; };
	this.isSeparator = function(row){ return false; };
	this.isSorted = function(){ return false; };
	this.getLevel = function(row){ return 0; };
	this.getImageSrc = function(row,col){ return null; };
	this.getRowProperties = function(row,props){};
	this.getCellProperties = function(row,col,props){
		if (col.index == 0 && table[row]["favorite"])
			props.AppendElement(ATOM_SVC.getAtom("title"));
	};
	this.getColumnProperties = function(colid,col,props){};
	this.cycleHeader = function(col, elem) {};
}

function sort(column) {
	var columnName;
	var order = peercastRadioTree.getAttribute("sortDirection") == "ascending" ? 1 : -1;

	if (column) {
		columnName = column.id;
		if (peercastRadioTree.getAttribute("sortResource") == columnName) {
			order *= -1;
		}
	} else {
		columnName = peercastRadioTree.getAttribute("sortResource");
	}

	function columnSort(a, b) {
		if (prepareForComparison(a[columnName]) > prepareForComparison(b[columnName])) return 1 * order;
		if (prepareForComparison(a[columnName]) < prepareForComparison(b[columnName])) return -1 * order;
		if (columnName != "bitrate") {
			if (prepareForComparison(a["bitrate"]) > prepareForComparison(b["bitrate"])) return -1;	// 1
			if (prepareForComparison(a["bitrate"]) < prepareForComparison(b["bitrate"])) return 1;		// -1
		}
		return 0;
	}
	peercastRadioTable.sort(columnSort);

	peercastRadioTree.setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
	peercastRadioTree.setAttribute("sortResource", columnName);
	peercastRadioTree.view = new treeView(peercastRadioTable);

	var cols = peercastRadioTree.getElementsByTagName("treecol");
	for (var i = 0; i < cols.length; i++) {
		cols[i].removeAttribute("sortDirection");
	}
	document.getElementById(columnName).setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
}

function prepareForComparison(o) {
	if (typeof o == "string") {
		return o.toLowerCase();
	}
	return o;
}

function getTopVisibleRow() {
	return peercastRadioTree.treeBoxObject.getFirstVisibleRow();
}

function setTopVisibleRow(topVisibleRow) {
	return peercastRadioTree.treeBoxObject.scrollToRow(topVisibleRow);
}

// ### Timer ###	
var MyTimer = {
	init : function() {
		window.removeEventListener("load", MyTimer.init, false);
		setInterval(MyTimer.onTimer, 1 * 60 * 1000); // 1 min.
	},
	
	onTimer: function() {
		if (Application.prefs.getValue("extensions.peercast-radio.option-general-auto-reload", false)) {
			peercastRadio.timerCount++;
			if (peercastRadio.timerCount >= Application.prefs.getValue("extensions.peercast-radio.option-general-auto-reload-interval", 5)) {
				peercastRadio.loadYellowPages(null);
				peercastRadio.timerCount = 0;
			}
		}
	}
}
		
window.addEventListener('load', MyTimer.init, false);
