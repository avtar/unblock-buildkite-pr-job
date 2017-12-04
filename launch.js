"use strict";

var fluid = require("infusion");
var unblock = fluid.registerNamespace("unblock");

require("./src");
require("gpii-launcher");

fluid.setLogging(true);

fluid.defaults("unblock.launcher", {
    gradeNames: ["gpii.launcher"],
    yargsOptions: {
        env: true,
        defaults: {
            optionsFile: "./config.json"
        }
    }
});

unblock.launcher();
