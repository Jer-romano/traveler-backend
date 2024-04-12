"use strict";
// starts the app
const app = require("./app");
const { PORT } = require("./config");

app.listen(PORT, function () {
  console.log(`Started on https://localhost:${PORT}`);
});
