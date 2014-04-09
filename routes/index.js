#!/usr/bin/env node
"use strict";

// login & create account page
exports.index = function(req, res) {
	if (req.session.uid === undefined) {
	  res.render('index',
	             { title: "Google Reader's Replacement App" });
	} else {
		res.redirect("/user/" + req.session.uid + "/feeds");
	}
};
