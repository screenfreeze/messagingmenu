appdir=messagingmenu@screenfreeze.net
appname=gnome-shell-extensions

MSGLANGS=$(notdir $(wildcard po/*po))
MSGOBJS=$(addprefix $(appdir)/locale/,$(MSGLANGS:.po=/LC_MESSAGES/$(appname).mo))

locales: $(MSGOBJS)

$(appdir)/locale/%/LC_MESSAGES/$(appname).mo: po/%.po
	mkdir -p $(dir $@)
	msgfmt -c -o $@ po/$*.po
