#!/usr/bin/env node
"use strict";

exports.new = function(req, res) {
  res.render("user_new", 
             { title: "GRRA | Create a new account" });
};

exports.create = function(req, res) {
  res.send("user.create");
};

exports.show = function(req, res) {
  res.send("user.show");
};

exports.edit = function(req, res) {
  res.send("user.edit");
};

exports.update = function(req, res) {
  res.send("user.update");
};

exports.delete = function(req, res) {
  res.send("user.delete");
};