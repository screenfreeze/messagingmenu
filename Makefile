#=============================================================================
UUID=messagingmenu@screenfreeze.net
NAME=gnome-shell-extensions
FILES=metadata.json *.js stylesheet.css schemas icons locale/**/
#=============================================================================
default_target: all
.PHONY: clean all zip prod

MSGLANGS=$(notdir $(wildcard po/*po))
MSGOBJS=$(addprefix $(UUID)/locale/,$(MSGLANGS:.po=/LC_MESSAGES/$(NAME).mo))

all: clean locales schemas

clean:
	rm -f $(UUID).zip* $(UUID)/schemas/gschemas.compiled
	rm -rf $(UUID)/locale/**/

locales: $(MSGOBJS)

$(UUID)/locale/%/LC_MESSAGES/$(NAME).mo: po/%.po
	mkdir -p $(dir $@)
	msgfmt -c -o $@ po/$*.po

schemas: $(UUID)/schemas/
	glib-compile-schemas $(UUID)/schemas

zip: all
	zip -rq $(UUID).zip $(FILES:%=$(UUID)/%)

prod: zip
	md5sum $(UUID).zip > $(UUID).zip.md5
	gpg --detach-sign --use-agent --yes $(UUID).zip
