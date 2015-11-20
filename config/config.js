var path = require('path'),
    rootPath = path.normalize(__dirname + '/..');

module.exports = {
  development: {
    db: 'mongodb://localhost/grra_dev',
    root: rootPath,
    app: {
      name: "Google Reader's Replacement App"
    }
  },
  test: {
    db: 'mongodb://localhost/grra_test',
    root: rootPath,
    app: {
      name: "Google Reader's Replacement App"
    }
  },
  production: {
    db: process.env.MONGOLAB_URI || 'mongodb://localhost/grra',
    root: rootPath,
    app: {
      name: "Google Reader's Replacement App"
    }
  }
};
