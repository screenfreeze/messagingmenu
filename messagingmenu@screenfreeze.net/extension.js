const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Gio = imports.gi.Gio;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const MessageTray = imports.ui.messageTray;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const ICON_SIZE = 22;

let compatible_Chats = [
	"skype",
	"pidgin",
	"empathy",
	"fedora-empathy",
	"xchat",
	"hexchat",
	"kde4-konversation",
	"kde4-kopete",
	"kde4-kmess",
	"gajim",
	"emesene",
	"qutim",
	"amsn",
	"openfetion",
	"org.gnome.Polari"
];
let compatible_MBlogs = [
	"gwibber",
	"fedora-gwibber",
	"pino",
	"hotot",
	"turpial",
	"twitux",
	"gtwitter",
	"qwit",
	"mitter",
	"polly",
	"birdie",
	"friends-app",
	"gfeedline",
	"corebird",
	"heybuddy"
];
let compatible_Emails = [
	"thunderbird",
	"mozilla-thunderbird",
	"evolution",
	"postler",
	"claws-mail",
	"kde4-KMail2",
	"gnome-gmail",
	"geary",
	"icedove"
];

// Must be their Notificationtitle, because lookup_app doesnt work here
let compatible_hidden_Email_Notifiers = [
	"Mailnag",
	"Thunderbird",
	"gmail-notify",
	"mail-notification"
];
let compatible_hidden_MBlog_Notifiers = [
	"friends",
	"gwibber",
	"GFeedLine"
];


const MessageMenuItem = new Lang.Class({
	Name: 'MessageMenu.MessageMenuItem',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function(app) {
	this.parent();
	this._app = app;

	this.label = new St.Label({ text:app.get_name(), style_class: 'program-label' });
	this.actor.add_child(this.label);

	this._icon = app.create_icon_texture(ICON_SIZE);
	this.actor.add_child(this._icon, { align: St.Align.END, span: -1 });

	},

	activate: function(event) {

	this._app.activate_full(-1, event.get_time());
	this.parent(event);
	}
});

const MessageMenu = new Lang.Class({
	Name: 'MessageMenu.MessageMenu',
	Extends: PanelMenu.Button,

	_init: function() {
		this.parent(0.0, "MessageMenu");
		let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
		let icon = new St.Icon({ icon_name: 'mymail-symbolic',
								 style_class: 'system-status-icon' });

		hbox.add_child(icon);
		this.actor.add_child(hbox);

		this.new_msg_string = _("Compose New Message");
		this.contacts_string = _("Contacts");

		this._availableEmails = new Array ();
		this._availableChats = new Array ();
		this._availableMBlogs = new Array ();

		this._thunderbird = null;
		this._icedove = null;
		this._kmail = null;
		this._claws = null;
		this._evolution = null;
		this._geary = null;

		this._getApps();
		this._buildMenu();
	},

	_buildMenu: function()
	{

		// insert Email Clients into menu

		// Special Evolution Menu Entry
		if (this._evolution != null) {
			let newLauncher = new MessageMenuItem(this._evolution);
			this.menu.addMenuItem(newLauncher);

			this.comp = new PopupMenu.PopupMenuItem("		 "+this.new_msg_string+"...");
			this.con =	new PopupMenu.PopupMenuItem("		 "+this.contacts_string);

			this.con.connect('activate', Lang.bind(this, this._evolutionContacts));
			this.comp.connect('activate', Lang.bind(this, this._evolutionCompose));
			this.menu.addMenuItem(this.comp);
			this.menu.addMenuItem(this.con);
		}

		// Special Thunderbird Menu Entry
		if (this._thunderbird != null) {
			let newLauncher = new MessageMenuItem(this._thunderbird);
			this.menu.addMenuItem(newLauncher);

			this.comp_tb = new PopupMenu.PopupMenuItem("		"+this.new_msg_string+"...");
			this.con_tb =  new PopupMenu.PopupMenuItem("		"+this.contacts_string);

			this.comp_tb.connect('activate', Lang.bind(this, this._TbCompose));
			this.menu.addMenuItem(this.comp_tb);

			this.con_tb.connect('activate', Lang.bind(this, this._TbContacts));
			this.menu.addMenuItem(this.con_tb);
		}

		// Special Icedove Menu Entry
		if (this._icedove != null) {
			let newLauncher = new MessageMenuItem(this._icedove);
			this.menu.addMenuItem(newLauncher);

			this.comp_icedove = new PopupMenu.PopupMenuItem("		 "+this.new_msg_string+"...");
			this.con_icedove =	new PopupMenu.PopupMenuItem("		 "+this.contacts_string);

			this.comp_icedove.connect('activate', Lang.bind(this, this._icedoveCompose));
			this.menu.addMenuItem(this.comp_icedove);

			this.con_icedove.connect('activate', Lang.bind(this, this._icedoveContacts));
			this.menu.addMenuItem(this.con_icedove);
		}

		// Special Kmail Menu Entry
		if (this._kmail != null) {
			let newLauncher = new MessageMenuItem(this._kmail);
			this.menu.addMenuItem(newLauncher);

			this.comp =  new PopupMenu.PopupMenuItem("		  "+this.new_msg_string+"...");

			this.comp.connect('activate', Lang.bind(this, this._kmailCompose));
			this.menu.addMenuItem(this.comp);
		}

		// Special Claws Menu Entry
		if (this._claws != null) {
			let newLauncher = new MessageMenuItem(this._claws);
			this.menu.addMenuItem(newLauncher);

			this.comp =  new PopupMenu.PopupMenuItem("		  "+this.new_msg_string+"...");

			this.comp.connect('activate', Lang.bind(this, this._clawsCompose));
			this.menu.addMenuItem(this.comp);
		}

		// Special Geary Menu Entry
		if (this._geary != null) {
			let newLauncher = new MessageMenuItem(this._geary);
			this.menu.addMenuItem(newLauncher);

			this.comp =  new PopupMenu.PopupMenuItem("		  "+this.new_msg_string+"...");

			this.comp.connect('activate', Lang.bind(this, this._gearyCompose));
			this.menu.addMenuItem(this.comp);
		}


		for (var t=0; t<this._availableEmails.length; t++) {
			let e_app=this._availableEmails[t];
			let newLauncher = new MessageMenuItem(e_app);
			this.menu.addMenuItem(newLauncher);
		}
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

		// insert Chat Clients into menu
		for (var k=0; k<this._availableChats.length; k++) {
			let newLauncher = new MessageMenuItem(this._availableChats[k]);
			this.menu.addMenuItem(newLauncher);
		}
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

		// insert Blogging Clients into menu
		for (var l=0; l<this._availableMBlogs.length; l++) {
			let newLauncher = new MessageMenuItem(this._availableMBlogs[l]);
			this.menu.addMenuItem(newLauncher);
		}

	},

	_getApps: function() {
		let appsys = Shell.AppSystem.get_default();
		//get available Email Apps
		for (var p=0; p<compatible_Emails.length; p++) {
			let app_name = compatible_Emails[p];
			let app = appsys.lookup_app(app_name+'.desktop');

			if (app != null) {
				// filter Apps with special Menus
				if (app_name == 'thunderbird' || app_name == 'mozilla-thunderbird') {
					this._thunderbird = app;
				}
				else if (app_name == 'icedove') {
					this._icedove = app;
				}
				else if (app_name == 'KMail2') {
					this._kmail = app;
				}
				else if (app_name == 'claws-mail') {
					this._claws = app;
				}
				else if (app_name == 'evolution') {
					this._evolution = app;
				}
				else if (app_name == 'geary') {
					this._geary = app;
				}
				else {
					this._availableEmails.push(app);
				}
				if (settings.get_boolean('notify-email')) {
					availableNotifiers.push(app);
				}
			}
		}
		//get available Chat Apps
		for (var o=0; o<compatible_Chats.length; o++) {
			let app_name = compatible_Chats[o];
			let app = appsys.lookup_app(app_name+'.desktop');

			if (app != null) {
				this._availableChats.push(app);
				if (settings.get_boolean('notify-chat')) {
					availableNotifiers.push(app);
				}
			}
		}
		//get available Blogging Apps
		for (var u=0; u<compatible_MBlogs.length; u++) {
			let app_name = compatible_MBlogs[u];
			let app = appsys.lookup_app(app_name+'.desktop');

			if (app != null) {
				this._availableMBlogs.push(app);
				if (settings.get_boolean('notify-mblogging')) {
					availableNotifiers.push(app);
				}
			}
		}

	},

	_TbCompose: function() {
		Main.Util.trySpawnCommandLine('thunderbird -compose');
	},

	_TbContacts: function() {
		Main.Util.trySpawnCommandLine('thunderbird -addressbook');
	},

	_icedoveCompose: function() {
		Main.Util.trySpawnCommandLine('icedove -compose');
	},

	_icedoveContacts: function() {
		Main.Util.trySpawnCommandLine('icedove -addressbook');
	},

	_kmailCompose: function() {
		Main.Util.trySpawnCommandLine('kmail -compose');
	},

	_clawsCompose: function() {
		Main.Util.trySpawnCommandLine('claws-mail --compose');
	},

	_evolutionCompose: function() {
		Main.Util.trySpawnCommandLine('evolution mailto:');
	},

	_evolutionContacts: function() {
		Main.Util.trySpawnCommandLine('evolution -c contacts');
	},

	_gearyCompose: function() {
		Main.Util.trySpawnCommandLine('geary');
		//geary 0.3.1 workaround (geary must be started)
		imports.mainloop.timeout_add(3000,function() {	Main.Util.trySpawnCommandLine('geary mailto:'); });
	},

	destroy: function() {

		this.parent();
	},

});

function _updateMessageStatus() {
	// get all Messages
	let items;

	try{
		items = Main.messageTray.getSummaryItems();
	}
	catch(e){
		// GS 3.8 Support
		items = Main.messageTray.getSources();
	}

	let newMessage = false;
	for (let i = 0; i < items.length; i++) {
		let source;
		if (items[i].source != undefined) {source = items[i].source;}
		else {source = items[i];} // GS 3.8

		// check for new Chat Messages
		if (settings.get_boolean('notify-chat') && source.isChat && !source.isMuted && unseenMessageCheck(source)) { newMessage = true; }
		else if (source.app != null) {
			// check for Message from known Email App
			for (let j = 0; j < availableNotifiers.length; j++) {
				let app_id = availableNotifiers[j].get_id();   //e.g. thunderbird.desktop
				if (source.app.get_id() == app_id && unseenMessageCheck(source)) {
					newMessage = true;
				}
			}
		}
		else {
			for (let k = 0; k < availableNotifiers.length; k++) {
				let app_name = availableNotifiers[k].get_name();   //e.g. Thunderbird Mail
				if (source.title == app_name && unseenMessageCheck(source) ) {
					newMessage = true;
				}
			}
			if (settings.get_boolean('notify-email')) {
				for (let l = 0; l < compatible_hidden_Email_Notifiers.length; l++) {
					let app_name = compatible_hidden_Email_Notifiers[l];   //e.g. Mailnag
					if (source.title == app_name && unseenMessageCheck(source) ) {
						newMessage = true;
					}
				}
			}

			if (settings.get_boolean('notify-mblogging')) {
				for (let m = 0; m < compatible_hidden_MBlog_Notifiers.length; m++) {
					let app_name = compatible_hidden_MBlog_Notifiers[m];   //e.g. friends
					if (source.title == app_name && unseenMessageCheck(source) ) {
						newMessage = true;
					}
				}
			}
		}
	}

	// Change Status Icon in Panel
	if (newMessage && !iconChanged) {
		//let messMenu = statusArea.messageMenu;
		let color = settings.get_string('color');
		let style = "color: "+color;
		iconBox.set_style(style);
		iconChanged = true;
	}
	else if (!newMessage && iconChanged) {
		//let messMenu = statusArea.messageMenu;
		iconBox.set_style(originalStyle);
		iconChanged = false;
	}
}

function unseenMessageCheck(source) {
	let unseen = false;
	if (source.unseenCount == undefined) {
		unseen = (source._counterBin.visible &&
		source._counterLabel.get_text() != '0');
	}
	else {
		unseen = source.unseenCount > 0;
	}

	return unseen;
}

function customUpdateCount() {
  originalUpdateCount.call(this);
	try {
		_updateMessageStatus();
	}
	catch (err) {
		/* If the extension is broken I don't want to break everything.
		 * We just catch the extension, print it and go on */
		logError (err, err);
	}
}

function init(extensionMeta) {
	Convenience.initTranslations();
	settings = Convenience.getSettings();
	let theme = imports.gi.Gtk.IconTheme.get_default();
	theme.append_search_path(extensionMeta.path + "/icons");
}

let _indicator;
let settings;
let originalUpdateCount;
let originalStyle;
let iconChanged = false;
let availableNotifiers = new Array ();
let statusArea;
let iconBox;

function enable() {
	_indicator = new MessageMenu;

	originalUpdateCount = MessageTray.SourceActor.prototype._updateCount;
	MessageTray.SourceActor.prototype._updateCount = customUpdateCount;

	statusArea =  Main.panel.statusArea;

	Main.panel.addToStatusArea('messageMenu', _indicator,1);

	iconBox =  statusArea.messageMenu.actor;

	originalStyle = iconBox.get_style();
}

function disable() {
	MessageTray.SourceActor.prototype._updateCount = originalUpdateCount;
	_indicator.destroy();
}
