#!/usr/bin/env node
"use strict";

exports.loadPage = function (httpStatusCode, err, res) {
  console.error(err);

  switch (httpStatusCode) {
    case 404:
      return res.render('404', {
        title: 'Edify | Page Not Found'
      });
    case 500:
      return res.render('500', {
        title: 'Edify | Internal Server Error'
      });
  }
};
