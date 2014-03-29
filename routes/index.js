#!/usr/bin/env node
"use strict";

// login & create account page
exports.index = function(req, res){
  res.render('index', 
             { title: "Google Reader's Replacement App" });
};