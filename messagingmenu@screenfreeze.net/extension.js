/**
 * Messaging Menu - A Messaging Menu for the Gnome Shell
 * Copyright (C) 2012 Andreas Wilhelm
 * See LICENSE.txt for details
 */

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const Util = imports.misc.util;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const MessageTray = imports.ui.messageTray;
const Gettext = imports.gettext.domain("messagingmenu");
const _ = Gettext.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ICON_SIZE = 22;

let _indicator;
let originalUpdateCount;
let originalStyle;
let iconChanged = false;
let availableNotifiers = new Array();
let statusArea;
let iconBox;

let compatible_Chats = [
  "amsn",
  "caprine",
  "im.dino.Dino",
  "emesene",
  "empathy",
  "fedora-empathy",
  "gajim",
  "hexchat",
  "io.github.qtox.qTox.desktop",
  "kadu",
  "kde4-kmess",
  "kde4-konversation",
  "kde4-kopete",
  "openfetion",
  "org.gnome.Fractal",
  "org.gnome.Polari",
  "pidgin",
  "qtox",
  "qutim",
  "signal-desktop",
  "skype",
  "skypeforlinux",
  "slack",
  "telegramdesktop",
  "utox",
  "venom",
  "viber",
  "xchat",
  "discord",
];

let compatible_MBlogs = [
  "birdie",
  "corebird",
  "fedora-gwibber",
  "friends-app",
  "gfeedline",
  "gtwitter",
  "gwibber",
  "heybuddy",
  "hotot",
  "mitter",
  "org.baedert.corebird",
  "pino",
  "polly",
  "qwit",
  "turpial",
  "twitux",
  "uk.co.ibboard.cawbird",
  "com.github.bleakgrey.tootle",
];

let compatible_Emails = [
  "claws-mail",
  "evolution",
  "geary",
  "gnome-gmail",
  "icedove",
  "kde4-KMail2",
  "mozilla-thunderbird",
  "org.gnome.Evolution",
  "org.gnome.Geary",
  "postler",
  "thunderbird",
];

// Must be their Notificationtitle, because lookup_app doesnt work here
let compatible_hidden_Email_Notifiers = [
  "gmail-notify",
  "mail-notification",
  "Mailnag",
  "Thunderbird",
];

let compatible_hidden_MBlog_Notifiers = ["friends", "GFeedLine", "gwibber"];

const MessageMenuItem = GObject.registerClass(
  class MessageMenu_MessageMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(app) {
      super._init();
      this._app = app;

      this.label = new St.Label({
        text: app.get_name(),
        style_class: "program-label",
      });
      this.add_child(this.label);

      this._icon = app.create_icon_texture(ICON_SIZE);
      this.add_child(this._icon);
    }

    activate(event) {
      this._app.activate_full(-1, event.get_time());
      super.activate(event);
    }
  }
);

const MessageMenu = GObject.registerClass(
  class MessageMenu_MessageMenu extends PanelMenu.Button {
    _init() {
      super._init(0.0, "MessageMenu");
      let hbox = new St.BoxLayout({ style_class: "panel-status-menu-box" });
      let gicon = Gio.icon_new_for_string(
        Me.path + "/icons/mymail-symbolic.svg"
      );
      let icon = new St.Icon({
        gicon,
        style_class: "system-status-icon",
      });

      hbox.add_child(icon);
      this.add_child(hbox);

      this.new_msg_string = _("Compose New Message");
      this.contacts_string = _("Contacts");

      this._availableEmails = new Array();
      this._availableChats = new Array();
      this._availableMBlogs = new Array();

      this._thunderbird = null;
      this._icedove = null;
      this._kmail = null;
      this._claws = null;
      this._evolution = null;
      this._geary = null;

      let appsys = Shell.AppSystem.get_default();
      this._getAppsEMAIL(appsys);
      this._getAppsCHAT(appsys);
      this._getAppsBLOG(appsys);
      if (this._evolution != null) {
        this._buildMenuEVOLUTION();
      }
      if (this._thunderbird != null) {
        this._buildMenuTHUNDERBIRD();
      }
      if (this._icedove != null) {
        this._buildMenuICEDOVE();
      }
      if (this._kmail != null) {
        this._buildMenuKMAIL();
      }
      if (this._claws != null) {
        this._buildMenuCLAWS();
      }
      if (this._geary != null) {
        this._buildMenuGEARY();
      }
      this._buildMenu();
    }

    _buildMenuEVOLUTION() {
      let newLauncher = new MessageMenuItem(this._evolution);
      this.menu.addMenuItem(newLauncher);

      this.comp = new PopupMenu.PopupMenuItem(this.new_msg_string + "...", {
        style_class: "special-action",
      });
      this.con = new PopupMenu.PopupMenuItem(this.contacts_string, {
        style_class: "special-action",
      });

      this.con.connect("activate", this._evolutionContacts.bind(this));
      this.comp.connect("activate", this._evolutionCompose.bind(this));
      this.menu.addMenuItem(this.comp);
      this.menu.addMenuItem(this.con);
    }

    _buildMenuTHUNDERBIRD() {
      let newLauncher = new MessageMenuItem(this._thunderbird);
      this.menu.addMenuItem(newLauncher);

      this.comp_tb = new PopupMenu.PopupMenuItem(this.new_msg_string + "...", {
        style_class: "special-action",
      });
      this.con_tb = new PopupMenu.PopupMenuItem(this.contacts_string, {
        style_class: "special-action",
      });

      this.comp_tb.connect("activate", this._TbCompose.bind(this));
      this.menu.addMenuItem(this.comp_tb);

      this.con_tb.connect("activate", this._TbContacts.bind(this));
      this.menu.addMenuItem(this.con_tb);
    }

    _buildMenuICEDOVE() {
      let newLauncher = new MessageMenuItem(this._icedove);
      this.menu.addMenuItem(newLauncher);

      this.comp_icedove = new PopupMenu.PopupMenuItem(
        this.new_msg_string + "...",
        { style_class: "special-action" }
      );
      this.con_icedove = new PopupMenu.PopupMenuItem(this.contacts_string, {
        style_class: "special-action",
      });

      this.comp_icedove.connect("activate", this._icedoveCompose.bind(this));
      this.menu.addMenuItem(this.comp_icedove);

      this.con_icedove.connect("activate", this._icedoveContacts.bind(this));
      this.menu.addMenuItem(this.con_icedove);
    }

    _buildMenuKMAIL() {
      let newLauncher = new MessageMenuItem(this._kmail);
      this.menu.addMenuItem(newLauncher);

      this.comp = new PopupMenu.PopupMenuItem(this.new_msg_string + "...", {
        style_class: "special-action",
      });

      this.comp.connect("activate", this._kmailCompose.bind(this));
      this.menu.addMenuItem(this.comp);
    }

    _buildMenuCLAWS() {
      let newLauncher = new MessageMenuItem(this._claws);
      this.menu.addMenuItem(newLauncher);

      this.comp = new PopupMenu.PopupMenuItem(this.new_msg_string + "...", {
        style_class: "special-action",
      });

      this.comp.connect("activate", this._clawsCompose.bind(this));
      this.menu.addMenuItem(this.comp);
    }

    _buildMenuGEARY() {
      let newLauncher = new MessageMenuItem(this._geary);
      this.menu.addMenuItem(newLauncher);

      this.comp = new PopupMenu.PopupMenuItem(this.new_msg_string + "...", {
        style_class: "special-action",
      });

      this.comp.connect("activate", this._gearyCompose.bind(this));
      this.menu.addMenuItem(this.comp);
    }

    _buildMenu() {
      for (let e_app of this._availableEmails) {
        let newLauncher = new MessageMenuItem(e_app);
        this.menu.addMenuItem(newLauncher);
      }
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // insert Chat Clients into menu
      for (let c_app of this._availableChats) {
        let newLauncher = new MessageMenuItem(c_app);
        this.menu.addMenuItem(newLauncher);
      }
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // insert Blogging Clients into menu
      for (let mb_app of this._availableMBlogs) {
        let newLauncher = new MessageMenuItem(mb_app);
        this.menu.addMenuItem(newLauncher);
      }
    }

    _getAppsEMAIL(appsys) {
      //get available Email Apps
      for (let app_name of compatible_Emails) {
        let app = appsys.lookup_app(app_name + ".desktop");
        if (app != null) {
          // filter Apps with special Menus
          if (app_name.toLowerCase().includes("thunderbird")) {
            this._thunderbird = app;
          } else if (app_name.toLowerCase().includes("icedove")) {
            this._icedove = app;
          } else if (app_name.toLowerCase().includes("kmail")) {
            this._kmail = app;
          } else if (app_name.toLowerCase().includes("claws")) {
            this._claws = app;
          } else if (app_name.toLowerCase().includes("evolution")) {
            this._evolution = app;
          } else if (app_name.toLowerCase().includes("geary")) {
            this._geary = app;
          } else {
            this._availableEmails.push(app);
          }
          if (settings.get_boolean("notify-email")) {
            availableNotifiers.push(app);
          }
        }
      }
    }

    _getAppsCHAT(appsys) {
      //get available Chat Apps
      for (let c_app of compatible_Chats) {
        let app_name = c_app;
        let app = appsys.lookup_app(app_name + ".desktop");

        if (app != null) {
          this._availableChats.push(app);
          if (settings.get_boolean("notify-chat")) {
            availableNotifiers.push(app);
          }
        }
      }
    }

    _getAppsBLOG(appsys) {
      //get available Blogging Apps
      for (let mb_app of compatible_MBlogs) {
        let app_name = mb_app;
        let app = appsys.lookup_app(app_name + ".desktop");

        if (app != null) {
          this._availableMBlogs.push(app);
          if (settings.get_boolean("notify-mblogging")) {
            availableNotifiers.push(app);
          }
        }
      }
    }

    _TbCompose() {
      Util.trySpawnCommandLine("thunderbird -compose");
    }

    _TbContacts() {
      Util.trySpawnCommandLine("thunderbird -addressbook");
    }

    _icedoveCompose() {
      Util.trySpawnCommandLine("icedove -compose");
    }

    _icedoveContacts() {
      Util.trySpawnCommandLine("icedove -addressbook");
    }

    _kmailCompose() {
      Util.trySpawnCommandLine("kmail -compose");
    }

    _clawsCompose() {
      Util.trySpawnCommandLine("claws-mail --compose");
    }

    _evolutionCompose() {
      Util.trySpawnCommandLine("evolution mailto:");
    }

    _evolutionContacts() {
      Util.trySpawnCommandLine("evolution -c contacts");
    }

    _gearyCompose() {
      Util.trySpawnCommandLine("geary mailto:user@example.com");
    }

    destroy() {
      super.destroy();
    }
  }
);

function _updateMessageStatus() {
  // get all Messages
  let sources = Main.messageTray.getSources();
  let newMessage = false;

  for (let source of sources) {
    // check for new Chat Messages
    if (
      settings.get_boolean("notify-chat") &&
      source.isChat &&
      !source.isMuted &&
      unseenMessageCheck(source)
    ) {
      newMessage = true;
    } else if (source.app != null) {
      newMessage = _checkNotifyEmailByID(source);
    } else {
      newMessage = _checkNotifyEmailByName(source);

      if (settings.get_boolean("notify-email")) {
        newMessage = _checkNotifyHiddenEmail(source);
      }
      if (settings.get_boolean("notify-mblogging")) {
        newMessage = _checkNotifyMBlog(source);
      }
    }
  }
  _changeStatusIcon(newMessage);
}

function _checkNotifyEmailByID(source) {
  // check for Message from known Email App
  let result = false;
  for (let a_Notifier of availableNotifiers) {
    let app_id = a_Notifier.get_id(); //e.g. thunderbird.desktop
    if (source.app.get_id() == app_id && unseenMessageCheck(source)) {
      result = true;
      return result;
    }
  }
}

function _checkNotifyEmailByName(source) {
  let result = false;
  for (let a_Notifier of availableNotifiers) {
    let app_name = a_Notifier.get_name(); //e.g. Thunderbird Mail
    if (source.title == app_name && unseenMessageCheck(source)) {
      result = true;
      return result;
    }
  }
}

function _checkNotifyHiddenEmail(source) {
  let result = false;
  for (let a_Notifier of compatible_hidden_Email_Notifiers) {
    let app_name = a_Notifier; //e.g. Mailnag
    if (source.title == app_name && unseenMessageCheck(source)) {
      result = true;
      return result;
    }
  }
}

function _checkNotifyMBlog(source) {
  let result = false;
  for (let a_Notifier of compatible_hidden_MBlog_Notifiers) {
    let app_name = a_Notifier; //e.g. friends
    if (source.title == app_name && unseenMessageCheck(source)) {
      result = true;
      return result;
    }
  }
}

function _changeStatusIcon(newMessage) {
  // Change Status Icon in Panel
  if (newMessage && !iconChanged) {
    let color = settings.get_string("color");
    iconBox.set_style("color: " + color + ";");
    iconChanged = true;
  } else if (!newMessage && iconChanged) {
    iconBox.set_style(originalStyle);
    iconChanged = false;
  }
}

function unseenMessageCheck(source) {
  let unseen = false;
  if (source.unseenCount == undefined) {
    unseen =
      source._counterBin.visible && source._counterLabel.get_text() != "0";
  } else {
    unseen = source.unseenCount > 0;
  }

  return unseen;
}

function customUpdateCount() {
  originalUpdateCount.call(this);
  try {
    _updateMessageStatus();
  } catch (err) {
    /* If the extension is broken I don't want to break everything.
     * We just catch the extension, print it and go on */
    logError(err, "messagingmenu");
  }
}

function init() {
  ExtensionUtils.initTranslations("messagingmenu");
}

function enable() {
  this.settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.messagingmenu"
  );
  _indicator = new MessageMenu();

  originalUpdateCount = MessageTray.Source.prototype.countUpdated;
  MessageTray.Source.prototype.countUpdated = customUpdateCount;

  statusArea = Main.panel.statusArea;

  Main.panel.addToStatusArea("messageMenu", _indicator, 1);

  iconBox = statusArea.messageMenu;

  originalStyle = iconBox.get_style();
}

function disable() {
  MessageTray.Source.prototype.countUpdated = originalUpdateCount;
  _indicator.destroy();
  _indicator = null;
  this.settings = null;
}
