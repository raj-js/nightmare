
/**
 * Module dependencies.
 */

var Nightmare = require('..');
var should = require('chai').should();
var after = require('after');
var url = require('url');
var server = require('./server');
var fs = require('fs');
var util = require('util');
var thunkify = require('thunkify');
var mkdirp = thunkify(require('mkdirp'));

/**
 * Get rid of a warning.
 */

process.setMaxListeners(0);

/**
 * Locals.
 */

var base = 'http://localhost:7500/';

describe('Nightmare', function () {
  before(function (done) {
    server.listen(7500, done);
  });

  it('should be constructable', function*() {
    var nightmare = Nightmare();
    nightmare.should.be.ok;
    yield nightmare.end();
  });

  describe('navigation', function () {
    var nightmare;

    beforeEach(function() {
      nightmare = Nightmare();
    });

    afterEach(function*() {
      yield nightmare.end();
    });

    it('should click on a link and then go back', function*() {
      var title = yield nightmare
        .goto(fixture('navigation'))
        .click('a')
        .title()

      title.should.equal('A')

      var title = yield nightmare
        .back()
        .title()

      title.should.equal('Navigation')
    });

    it('should work for links that dont go anywhere', function*() {
      var title = yield nightmare
        .goto(fixture('navigation'))
        .click('a')
        .title()

      title.should.equal('A')

      var title = yield nightmare
        .click('.d')
        .title()

      title.should.equal('A')
    })

    it('should click on a link, go back, and then go forward', function*() {
      yield nightmare
        .goto(fixture('navigation'))
        .click('a')
        .back()
        .forward();
    });

    it('should refresh the page', function*() {
      yield nightmare
        .goto(fixture('navigation'))
        .refresh();
    });

    it('should wait until element is present', function*() {
      yield nightmare
        .goto(fixture('navigation'))
        .wait('a');
    });

    it('should escape the css selector correctly when waiting for an element', function*() {
      yield nightmare
        .goto(fixture('navigation'))
        .wait('#escaping\\:test');
    });

    it('should wait until evaluate returns the right value', function*() {
      yield nightmare
        .goto(fixture('navigation'))
        .wait(function () {
          var text = document.querySelector('a').textContent;
          return (text === 'A');
        });
    });

    /*it('should emit the timeout event if the check does not pass while waiting for selector', function (done) {
      var timeoutMessageReceived = false;

      new Nightmare({
          timeout: 1000
        })
        .on('timeout', function (msg) {
          timeoutMessageReceived = true;
        })
        .goto(fixture('navigation'))
        .wait('bbb')
        .run(function () {
          timeoutMessageReceived.should.be.true;
          done();
        });
    });

    it('should emit the timeout event if the check does not pass while waiting for fn==val', function (done) {
      var timeoutMessageReceived = false;

      new Nightmare({
          timeout: 1000
        })
        .on('timeout', function (message) {
          timeoutMessageReceived = true;
        })
        .goto(fixture('navigation'))
        .wait(function () {
          return 'abc';
        }, 1)
        .run(function () {
          timeoutMessageReceived.should.be.true;
          done();
        });
    });*/
  });

  describe('evaluation', function () {
    var nightmare;

    beforeEach(function() {
      nightmare = Nightmare();
    });

    afterEach(function*() {
      yield nightmare.end();
    });

    it('should get the title', function*() {
      var title = yield nightmare
        .goto(fixture('evaluation'))
        .title();
      title.should.eql('Evaluation');
    });

    it('should get the url', function*() {
      var url = yield nightmare
        .goto(fixture('evaluation'))
        .url();
      url.should.have.string(fixture('evaluation'));
    });

    it('should check if the selector exists', function*() {
      // existent element
      var exists = yield nightmare
        .goto(fixture('evaluation'))
        .exists('h1.title');
      exists.should.be.true;

      // non-existent element
      exists = yield nightmare.exists('a.blahblahblah');
      exists.should.be.false;
    });

    it('should check if an element is visible', function*() {
      // visible element
      var visible = yield nightmare
        .goto(fixture('evaluation'))
        .visible('h1.title');
      visible.should.be.true;

      // hidden element
      visible = yield nightmare
        .visible('.hidden');
      visible.should.be.false;

        // non-existent element
      visible = yield nightmare
        .visible('#asdfasdfasdf');
      visible.should.be.false;
    });

    it('should evaluate javascript on the page, with parameters', function*() {
      var title = yield nightmare
        .goto(fixture('evaluation'))
        .evaluate(function (parameter) {
          return document.title + ' -- ' + parameter;
        }, 'testparameter');
      title.should.equal('Evaluation -- testparameter');
    });
  });

  describe('manipulation', function () {
    var nightmare;

    beforeEach(function() {
      nightmare = Nightmare();
    });

    afterEach(function*() {
      yield nightmare.end();
    });

    it('should inject javascript onto the page', function*() {
      var globalNumber = yield nightmare
        .goto(fixture('manipulation'))
        .inject('js', 'test/files/globals.js')
        .evaluate(function () {
          return globalNumber;
        });
      globalNumber.should.equal(7);

      var numAnchors = yield nightmare
        .goto(fixture('manipulation'))
        .inject('js', 'test/files/jquery-2.1.1.min.js')
        .evaluate(function () {
          return $('h1').length;
        });
      numAnchors.should.equal(1);
    });

    it('should inject css onto the page', function*() {
      var color = yield nightmare
        .goto(fixture('manipulation'))
        .inject('js', 'test/files/jquery-2.1.1.min.js')
        .inject('css', 'test/files/test.css')
        .evaluate(function () {
          return $('body').css('background-color');
        });
      color.should.equal('rgb(255, 0, 0)');
    });

    it('should not inject unsupported types onto the page', function*() {
      var color = yield nightmare
        .goto(fixture('manipulation'))
        .inject('js', 'test/files/jquery-2.1.1.min.js')
        .inject('pdf', 'test/files/test.css')
        .evaluate(function () {
          return $('body').css('background-color');
        });
      color.should.not.equal('rgb(255, 0, 0)');
    });

    it('should type and click', function*() {
      var title = yield nightmare
        .goto(fixture('manipulation'))
        .type('input[type=search]', 'nightmare')
        .click('button[type=submit]')
        .wait(500)
        .title();

      title.should.equal('Manipulation - Results');
    });

    it('should type and click several times', function*() {
      var title = yield nightmare
        .goto(fixture('manipulation'))
        .type('input[type=search]', 'github nightmare')
        .click('button[type=submit]')
        .wait(500)
        .click('a')
        .wait(500)
        .title();
      title.should.equal('Manipulation - Result - Nightmare');
    });

    it('should checkbox', function*() {
      var checkbox = yield nightmare
        .goto(fixture('manipulation'))
        .check('input[type=checkbox]')
        .evaluate(function () {
          return document.querySelector('input[type=checkbox]').checked;
        });
      checkbox.should.be.true;
    });

    it('should select', function*() {
      var select = yield nightmare
        .goto(fixture('manipulation'))
        .select('select', 'b')
        .evaluate(function () {
          return document.querySelector('select').value;
        });
      select.should.equal('b');
    });

    it('should scroll to specified position', function*() {
      // start at the top
      var coordinates = yield nightmare
        .viewport(320, 320)
        .goto(fixture('manipulation'))
        .evaluate(function () {
          return {
            top: document.body.scrollTop,
            left: document.body.scrollLeft
          };
        });
      coordinates.top.should.equal(0);
      coordinates.left.should.equal(0);

      // scroll down a bit
      coordinates = yield nightmare
        .scrollTo(100, 50)
        .evaluate(function () {
          return {
            top: document.body.scrollTop,
            left: document.body.scrollLeft
          };
        });
      coordinates.top.should.equal(100);
      // TODO: fix this in the fixture
      // coordinates.left.should.equal(50);
    });

    it('should hover over an element', function*() {
      var color = yield nightmare
        .goto(fixture('manipulation'))
        .mouseover('h1')
        .evaluate(function () {
          var element = document.querySelector('h1');
          return element.style.background;
        });
      color.should.equal('rgb(102, 255, 102)');
    });
  });


  describe('rendering', function () {
    var nightmare;

    beforeEach(function() {
      nightmare = Nightmare();
    });

    afterEach(function*() {
      yield nightmare.end();
    });

    it('should take a screenshot', function*() {
      yield mkdirp('/tmp/nightmare');
      yield nightmare
        .goto('http://google.com/')
        .screenshot('/tmp/nightmare/test.png');
      var stats = fs.statSync('/tmp/nightmare/test.png');
      stats.size.should.be.at.least(1000);
    });

    it('should render a PDF', function*() {
      yield mkdirp('/tmp/nightmare');
      yield nightmare
        .goto(fixture('manipulation'))
        .pdf('/tmp/nightmare/test.pdf');
      var stats = fs.statSync('/tmp/nightmare/test.pdf');
      stats.size.should.be.at.least(1000);
    });
  });

  /*describe('events', function () {
    it.skip('should fire an event on initialized', function (done) {
      var fired = false;
      new Nightmare()
        .on('initialized', function () {
          fired = true;
        })
        .goto(fixture('events'))
        .wait(1000)
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire an event on load started', function (done) {
      var fired = false;
      new Nightmare()
        .on('loadStarted', function () {
          fired = true;
        })
        .goto(fixture('events'))
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire an event on load finished', function (done) {
      var fired = false;
      new Nightmare()
        .on('loadFinished', function (status) {
          fired = (status === 'success');
        })
        .goto(fixture('events'))
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire an event when a resource is requested', function (done) {
      var fired = false;
      new Nightmare()
        .on('resourceRequested', function () {
          fired = true;
        })
        .goto(fixture('events'))
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire an event when a resource is received', function (done) {
      var fired = false;
      new Nightmare()
        .on('resourceReceived', function () {
          fired = true;
        })
        .goto(fixture('events'))
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire an event when navigation requested', function (done) {
      var fired = false;
      new Nightmare()
        .on('navigationRequested', function (url) {
          fired = true;
        })
        .goto(fixture('events'))
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire an event when the url changes', function (done) {
      var fired = false;
      new Nightmare()
        .on('urlChanged', function (url) {
          url.should.startWith(fixture('events'));
          fired = true;
        })
        .goto(fixture('events'))
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it.skip('should fire an event when a console message is seen', function (done) {
      var fired = false;
      new Nightmare()
        .on('consoleMessage', function () {
          fired = true;
        })
        .goto(fixture('events'))
        .evaluate(function () {
          console.log('message');
        })
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it.skip('should fire an event when an alert is seen', function (done) {
      var fired = false;
      new Nightmare()
        .on('alert', function () {
          fired = true;
        })
        .goto(fixture('events'))
        .evaluate( function () {
          alert('ohno');
        })
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire an event when a prompt is seen', function (done) {
      var fired = false;
      new Nightmare()
        .on('prompt', function () {
          fired = true;
        })
        .goto(fixture('events'))
        .evaluate(function () {
          prompt('whowhatwherehow???');
        })
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire an event when an error occurs', function (done) {
      var fired = false;
      new Nightmare()
        .on('error', function () {
          fired = true;
        })
        .goto(fixture('events'))
        .evaluate(function () {
          return aaa;
        })
        .run(function () {
          fired.should.be.true;
          done();
        });
    });

    it('should fire the exit handler once the process exits', function (done) {
      new Nightmare()
        .on('exit', function (code, signal) {
          done();
        })
        .goto('http://example.com')
        .run(function (err, nightmare) {
          if (err) return done(err);
          nightmare.phantomJS.process.kill(); // force the handler above to fire
        });
    });

    it('should throw when an exit handler is not defined', function (done) {
      // we need to override mocha's listener, but not remove them forever (just for this test)
      var listeners = process.listeners('uncaughtException');
      process.removeAllListeners('uncaughtException');
      // now, we can add our own listener (as a one-time so it will be removed automatically)
      process.once('uncaughtException', function (err) {
        // re-attach the listeners we saved earlier
        listeners.forEach(function (fn) {
          process.on('uncaughtException', fn);
        });

        // now run our assertions
        checkError(err);
      });

      new Nightmare()
        .goto('http://example.com')
        .run(function (err, nightmare) {
          if (err) return done(err);
          nightmare.phantomJS.process.kill(); // force the uncaught exception
        });

      function checkError(err) {
        err.message.should.equal('the phantomjs process ended unexpectedly');
        done();
      }
    });

  });*/

  describe('options', function () {

    /*
    PENDING FIX UPSTREAM
    https://github.com/atom/electron/issues/1362

    it('should set authentication', function*() {
      var data = yield Nightmare()
        .authentication('my', 'auth')
        .goto(fixture('auth'))
        .evaluate(function () {
          return JSON.parse(document.querySelector('pre').innerHTML);
        });
      data.should.eql({ name: 'my', pass: 'auth' });
    });
    */

    it('should set viewport', function*() {
      var size = { width: 400, height: 1000, 'use-content-size': true };
      var result = yield Nightmare(size)
        .goto(fixture('options'))
        .evaluate(function () {
          return {
            width: window.innerWidth,
            height: window.innerHeight
          };
        });
      result.width.should.eql(size.width);
      result.height.should.eql(size.height);
    });

    /*
    NOT AVAILABLE UPSTREAM in electron

    it('should set headers', function*() {
      var headers = yield Nightmare()
        .headers({ 'X-Nightmare-Header': 'hello world' })
        .goto(fixture('headers'))
        .evaluate(function () {
          return JSON.parse(document.querySelector('pre').innerHTML);
        });
      headers['x-nightmare-header'].should.equal('hello world');
    });
    */
  });
});

/**
 * Generate a URL to a specific fixture.
 *
 * @param {String} path
 * @returns {String}
 */

function fixture(path) {
  return url.resolve(base, path);
}
