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

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const ICON_SIZE = 22;

let compatible_Chats = [ "skype" , "pidgin", "empathy", "fedora-empathy", "xchat", "kmess", "gajim", "emesene", "qutim", "amsn", "openfetion" ];
let compatible_MBlogs = [ "gwibber", "pino", "hotot", "turpial", "twitux", "gtwitter",  "qwit", "mitter", "polly" ];
let compatible_Emails = [ "thunderbird", "mozilla-thunderbird", "evolution", "postler", "claws-mail", "KMail2", "gnome-gmail", "geary", "icedove" ];





const MessageMenuItem = new Lang.Class({
    Name: 'MessageMenu.MessageMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(app) {
	this.parent();
	this._app = app;

	this.label = new St.Label({ text:app.get_name(), style_class: 'program-label' });
	this.addActor(this.label);

	this._icon = app.create_icon_texture(ICON_SIZE);
	this.addActor(this._icon, { align: St.Align.END, span: -1 });
	
    },

    activate: function(event) {

	this._app.activate_full(-1, event.get_time());
	this.parent(event);
    }
});

const MessageMenu = new Lang.Class({
    Name: 'MessageMenu.MessageMenu',
    Extends: PanelMenu.SystemStatusButton,

    _init: function() {
        this.parent('mymail-symbolic');

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

			this.comp = new PopupMenu.PopupMenuItem("        "+this.new_msg_string+"...");
			this.con =  new PopupMenu.PopupMenuItem("        "+this.contacts_string);
			
			this.con.connect('activate', Lang.bind(this, this._evolutionContacts));
			this.comp.connect('activate', Lang.bind(this, this._evolutionCompose));
			this.menu.addMenuItem(this.comp);
			this.menu.addMenuItem(this.con);
		}

		// Special Thunderbird Menu Entry
		if (this._thunderbird != null) {
			let newLauncher = new MessageMenuItem(this._thunderbird);
			this.menu.addMenuItem(newLauncher);

			this.comp_tb = new PopupMenu.PopupMenuItem("        "+this.new_msg_string+"...");
			this.con_tb =  new PopupMenu.PopupMenuItem("        "+this.contacts_string);
			
			this.comp_tb.connect('activate', Lang.bind(this, this._TbCompose));
			this.menu.addMenuItem(this.comp_tb);
			
			this.con_tb.connect('activate', Lang.bind(this, this._TbContacts));
			this.menu.addMenuItem(this.con_tb);
		}

		// Special Icedove Menu Entry
		if (this._icedove != null) {
			let newLauncher = new MessageMenuItem(this._icedove);
			this.menu.addMenuItem(newLauncher);

			this.comp_icedove = new PopupMenu.PopupMenuItem("        "+this.new_msg_string+"...");
			this.con_icedove =  new PopupMenu.PopupMenuItem("        "+this.contacts_string);
			
			this.comp_icedove.connect('activate', Lang.bind(this, this._icedoveCompose));
			this.menu.addMenuItem(this.comp_icedove);
			
			this.con_icedove.connect('activate', Lang.bind(this, this._icedoveContacts));
			this.menu.addMenuItem(this.con_icedove);
		}

		// Special Kmail Menu Entry
		if (this._kmail != null) {
			let newLauncher = new MessageMenuItem(this._kmail);
			this.menu.addMenuItem(newLauncher);

			this.comp =  new PopupMenu.PopupMenuItem("        "+this.new_msg_string+"...");
			
			this.comp.connect('activate', Lang.bind(this, this._kmailCompose));
			this.menu.addMenuItem(this.comp);
		}

		// Special Claws Menu Entry
		if (this._claws != null) {
			let newLauncher = new MessageMenuItem(this._claws);
			this.menu.addMenuItem(newLauncher);
		
			this.comp =  new PopupMenu.PopupMenuItem("        "+this.new_msg_string+"...");
			
			this.comp.connect('activate', Lang.bind(this, this._clawsCompose));
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
				else {
					this._availableEmails.push(app);
				}				
			}
		}
		//get available Chat Apps
		for (var o=0; o<compatible_Chats.length; o++) {
			let app_name = compatible_Chats[o];
			let app = appsys.lookup_app(app_name+'.desktop');
		
			if (app != null) {
				this._availableChats.push(app);
			}
		}
		//get available Blogging Apps
		for (var u=0; u<compatible_MBlogs.length; u++) {
			let app_name = compatible_MBlogs[u];
			let app = appsys.lookup_app(app_name+'.desktop');
		
			if (app != null) {
				this._availableMBlogs.push(app);
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

    destroy: function() {

        this.parent();
    },

});

function init(extensionMeta) {
    Convenience.initTranslations();
    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(extensionMeta.path + "/icons");
}

let _indicator;

function enable() {
    _indicator = new MessageMenu;
    Main.panel.addToStatusArea('message-menu', _indicator,1);
}

function disable() {
    _indicator.destroy();
}
