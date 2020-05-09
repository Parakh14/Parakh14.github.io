//JQuery Module Pattern

// An object literal
var app = {
  init: function() {
    app.functionOne();
  },
  functionOne: function () {
    console.log("a")
  }
};
$("document").ready(function () {
  app.init();
});