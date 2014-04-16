#!/usr/bin/env node
"use strict";

// login & create account page
exports.index = function(req, res) {
	if (req.session.uid === undefined) {
		res.render("index",
		{ title: "Edify | News at your fingertips" });
	}
	else {
		res.redirect("/user/" + req.session.uid + "/feeds");
	}
};
