const ExtensionUtils = imports.misc.extensionUtils;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

let settings;

function createColorSettingWidget() {
	let hbox1 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
							margin_top: 5});

	let color_setting_label = new Gtk.Label({label: _("Notification Color (Hex):"),
										xalign: 0 });

	let color_setting_string = new Gtk.Entry({text: settings.get_string('color')});
	color_setting_string.connect('notify::text', function(entry) {
		// only save correct color hexcode
		if (entry.text.length == 7 && entry.text.charAt(0) == '#') {
			settings.set_string('color', entry.text);
		}
	});

	hbox1.pack_start(color_setting_label, true, true, 0);
	hbox1.add(color_setting_string);

	return hbox1;
}

function createNotificationSettingsWidget() {
	let vbox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL});

	let hbox1 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
							margin_top: 5});

	let email_setting_label = new Gtk.Label({label: _("Email Notification:"),
									   xalign: 0 });

	let email_setting_switch = new Gtk.Switch({active: settings.get_boolean('notify-email')});
	email_setting_switch.connect('notify::active', function(button) {
		settings.set_boolean('notify-email', button.active);
	});

	hbox1.pack_start(email_setting_label, true, true, 0);
	hbox1.add(email_setting_switch);
	vbox.add(hbox1);

	let hbox2 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
							margin_top: 5});

	let chat_setting_label = new Gtk.Label({label: _("Chat Notification:"),
									   xalign: 0 });

	let chat_setting_switch = new Gtk.Switch({active: settings.get_boolean('notify-chat')});
	chat_setting_switch.connect('notify::active', function(button) {
		settings.set_boolean('notify-chat', button.active);
	});

	hbox2.pack_start(chat_setting_label, true, true, 0);
	hbox2.add(chat_setting_switch);
	vbox.add(hbox2);

	let hbox3 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
							margin_top: 5});

	let mblogging_setting_label = new Gtk.Label({label: _("Micro Blogging Notification:"),
									   xalign: 0 });

	let mblogging_setting_switch = new Gtk.Switch({active: settings.get_boolean('notify-mblogging')});
	mblogging_setting_switch.connect('notify::active', function(button) {
		settings.set_boolean('notify-mblogging', button.active);
	});

	hbox3.pack_start(mblogging_setting_label, true, true, 0);
	hbox3.add(mblogging_setting_switch);
	vbox.add(hbox3);

	return vbox;
}

function buildPrefsWidget() {
  let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
						   border_width: 10});
  let vbox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
						  margin: 20, margin_top: 10});
  let notifySettings = createNotificationSettingsWidget();
  let colorSetting = createColorSettingWidget();
	vbox.add(notifySettings);
	vbox.add(colorSetting);
	frame.add(vbox);
	frame.show_all();

	return frame;
}

function init() {
	settings = Convenience.getSettings();
	Convenience.initTranslations();
}
