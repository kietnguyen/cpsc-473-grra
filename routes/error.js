#!/usr/bin/env node
"use strict";

exports.loadPage = function (httpStatusCode, err, res) {
  console.error(err);

  switch (httpStatusCode) {
    case 404:
      return res.render('404', {
        title: 'GRRA | Page Not Found'
      });
    case 500:
      return res.render('500', {
        title: 'GRRA | Internal Server Error'
      });
  }
};
