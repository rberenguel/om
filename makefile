ifeq ($(origin .RECIPEPREFIX), undefined)
	$(error This Make does not support .RECIPEPREFIX. Please use GNU Make 4.0 or later)
endif
.RECIPEPREFIX = >
.ONESHELL: #

# TODO(me) fix sed/gsed

all: dist/weave.html

serve:
> echo "http://127.0.0.1:8000/src/"
> python3 -m http.server 8000
