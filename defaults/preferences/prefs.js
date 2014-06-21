/* debugging prefs */
pref("browser.dom.window.dump.enabled", true);
pref("javascript.options.showInConsole", true);
pref("javascript.options.strict", true);
pref("nglayout.debug.disable_xul_cache", true);
pref("nglayout.debug.disable_xul_fastload", true);

/* application prefs*/
pref("extensions.peercast-radio.first-kick", true);
pref("extensions.peercast-radio.installed-version", "0.1.12");

pref("extensions.peercast-radio.status-filter-on", false);

pref("extensions.peercast-radio.option-general-open-yellowpages-onload", false);
pref("extensions.peercast-radio.option-general-open-channelpanel-onload", true);
pref("extensions.peercast-radio.option-general-kick-peercast-onload", false);
pref("extensions.peercast-radio.option-general-kick-peercast-path", "");
pref("extensions.peercast-radio.option-general-auto-reload", false);
pref("extensions.peercast-radio.option-general-auto-reload-interval", 5);
pref("extensions.peercast-radio.option-general-auto-reload-notify", false);

pref("extensions.peercast-radio.option-network-peercast-host", "localhost");
pref("extensions.peercast-radio.option-network-peercast-port", 7144);

pref("extensions.peercast-radio.option-yellowpages-array", '[{name:"TEMPORARY YP",url:"http://temp.orz.hm/yp/",active:true},{name:"SP",url:"http://bayonet.ddo.jp/sp/",active:true},{name:"Multi-YP",url:"http://peercast.takami98.net/multi-yp/",active:false},{name:"Livion-YP",url:"http://livion.tv/yp/",active:false},{name:"Niconama-YP",url:"http://niconama-yp.dyndns.info/",active:false}]');

pref("extensions.peercast-radio.option-filter-array", '[{name:"お気に入り",target:"channel",condition:"ex", strvalue:"",numvalue:0,active:true},{name:"人気のチャンネル",target:"listener",condition:"gt",strvalue:"",numvalue:100,active:false},{name:"視聴者数非公開",target:"listener",condition:"eq", strvalue:"",numvalue:-1,active:false},{name:"新しいチャンネル",target:"time",condition:"lt", strvalue:"",numvalue:15,active:false},{name:"高ビットレート",target:"bitrate",condition:"gt", strvalue:"",numvalue:1000,active:false},{name:"GAME",target:"comment",condition:"in", strvalue:"GAME",numvalue:0,active:false},{name:"ラジオ",target:"mediatype",condition:"ex", strvalue:"OGG|MP3",numvalue:0,active:false},{name:"YP 運用",target:"listener",condition:"eq", strvalue:"",numvalue:-9,active:false}]');

pref("extensions.peercast-radio.option-player-mms-player", "");
pref("extensions.peercast-radio.option-player-mms-option", "");
pref("extensions.peercast-radio.option-player-mms-mediatype", "");
pref("extensions.peercast-radio.option-player-mms-use-mmsh", false);
pref("extensions.peercast-radio.option-player-http-player", "");
pref("extensions.peercast-radio.option-player-http-option", "");
pref("extensions.peercast-radio.option-player-http-mediatype", "");

// See http://kb.mozillazine.org/Localize_extension_descriptions
// pref("extensions.{5cc1a3ac-3835-4415-8523-c8bcb69a421a}.description", "chrome://peercast-radio/locale/peercast-radio.properties");
