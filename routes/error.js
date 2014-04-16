#!/usr/bin/env node
"use strict";

exports.loadPage = function (httpStatusCode, err, res) {
	console.error(err);

	return res.render("errorPage", {
		title: "Edify | Something has gone wrong",
		httpStatusCode: httpStatusCode
	} );
};
