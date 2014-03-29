#!/usr/bin/env node
"use strict";

exports.index = function(req, res) {
  res.send("feed.index");
}

exports.new = function(req, res) {
  res.send("feed.new");
};

exports.create = function(req, res) {
  res.send("feed.create");
};

exports.show = function(req, res) {
  res.send("feed.show");
};

exports.edit = function(req, res) {
  res.send("feed.edit");
};

exports.update = function(req, res) {
  res.send("feed.update");
};

exports.delete = function(req, res) {
  res.send("feed.delete");
};