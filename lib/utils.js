var utils = {};
/**
 * Install an around function; AOP.
 */

utils.around = function around(obj, method, fn) {

  var old = obj[method]

  obj[method] = function () {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) args[i] = arguments[i]
    return fn.call(this, old, args)
  }
}

/**
 * Install a before function; AOP.
 */

utils.before = function(obj, method, fn) {

  var old = obj[method];

  obj[method] = function () {
    fn.call(this);
    old.apply(this, arguments);
  };
}

/**
 * 确认是否继续操作
 */

utils.confirm = function(msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(msg, function (input) {
    rl.close();
    callback(/^Y|y|yes|ok|true$/i.test(input));
  });
}


utils.exit = function(code) {
  // flush output for Node.js Windows pipe bug
  function done() {
    if (!(draining--)) _exit(code);
  }

  var draining = 0;
  var streams = [process.stdout, process.stderr];

  exit.exited = true;

  streams.forEach(function(stream){
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });

  done();
}

module.exports = utils;
