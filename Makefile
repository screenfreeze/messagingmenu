UUID=messagingmenu@screenfreeze.net
NAME=gnome-shell-extensions

MSGLANGS=$(notdir $(wildcard po/*po))
MSGOBJS=$(addprefix $(UUID)/locale/,$(MSGLANGS:.po=/LC_MESSAGES/$(NAME).mo))

all: locales schemas

locales: $(MSGOBJS)

$(UUID)/locale/%/LC_MESSAGES/$(NAME).mo: po/%.po
	mkdir -p $(dir $@)
	msgfmt -c -o $@ po/$*.po

schemas: $(UUID)/schemas/
	glib-compile-schemas $(UUID)/schemas
