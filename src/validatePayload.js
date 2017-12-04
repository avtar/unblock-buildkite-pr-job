"use strict";

var fluid = require("infusion");
var unblock = fluid.registerNamespace("unblock");

fluid.registerNamespace("unblock.job.validatePayload");

fluid.defaults("unblock.job.validatePayload", {
    gradeNames: ["gpii.express.middleware.requestAware"],
    handlerGrades: ["unblock.job.validatePayload.handler"],
});

fluid.defaults("unblock.job.validatePayload.handler", {
    gradeNames: ["unblock.job.common", "gpii.express.middleware.requestAware"],
    invokers: {
        handleRequest: {
            funcName: "unblock.job.validatePayload.handleRequest",
            args: ["{that}"]
        }
    }
});

unblock.job.validatePayload.handleRequest = function (that) {
    fluid.log("Validating payload...");

    var clientWebhookToken = that.options.request.headers["x-buildkite-token"];
    var validWebhookToken = that.options.buildkite.webhookToken;

    if (!unblock.job.validatePayload.isBuildkiteWebhookTokenValid(clientWebhookToken, validWebhookToken)) {
        return unblock.job.common.handleError(that.options.responses.invalidWebhookToken, that.sendResponse);
    }

    var payload = that.options.request.body.event;
    var isBuildBlocked = that.options.request.body.build.blocked;
    var buildUrl = that.options.request.body.build.url;

    if (!unblock.job.validatePayload.isBuildkiteWebhookPayloadValid(payload, isBuildBlocked, buildUrl)) {
        return unblock.job.common.handleError(that.options.responses.invalidWebhookPayload, that.sendResponse);
    }

    that.options.next();
}

unblock.job.validatePayload.isBuildkiteWebhookTokenValid = function (clientToken, validToken) {
    return clientToken === validToken ? true : false;
};

unblock.job.validatePayload.isBuildkiteWebhookPayloadValid = function (event, isBuildBlocked, buildUrl) {
    if (event === "build.finished" && isBuildBlocked && unblock.job.common.isUrl(buildUrl)) {
        return true;
    }

    return false;
};