"use strict";

var fluid = require("infusion");
var rp = require("request-promise-native");
var unblock = fluid.registerNamespace("unblock");

require("gpii-express");

require("./common");
require("./validatePayload");
require("./validateAuthor");

fluid.defaults("unblock.job.server", {
    gradeNames: ["gpii.express"],
    port: 3000,
    components: {
        json: {
            type: "gpii.express.middleware.bodyparser.json",
            options: {
                priority: "first"
            }
        },
        validatePayload: {
            type: "unblock.job.validatePayload",
            options: {
                priority: "after:json"
            }
        },
        validateAuthor: {
            type: "unblock.job.validateAuthor",
            options: {
                priority: "after:validatePayload"
            }
        },
        unblock: {
            type: "gpii.express.middleware.requestAware",
            options: {
                path: "/unblock",
                method: "post",
                handlerGrades: ["unblock.job.handler"]
            }
        }
    }
});

fluid.defaults("unblock.job.handler", {
    gradeNames: ["unblock.job.common", "gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "unblock.job.handleRequest",
            args: ["{that}"]
        }
    }
});

unblock.job.handleRequest = async function (that) {
    fluid.log("Attempting to unblock job...")

    try {
        var buildUrl = that.options.request.body.build.url;
        var bkAccessToken = that.options.buildkite.accessToken;
        var jobLabel = that.options.buildkite.jobLabel;
        var unblockUrl = await unblock.job.getUnblockUrl(buildUrl, bkAccessToken, jobLabel);
        var isUnblocked = await unblock.job.unblockJob(
            unblockUrl,
            that.options.buildkite.accountEmail,
            that.options.buildkite.accountName,
            bkAccessToken
        );
        if (!isUnblocked) throw new Error(that.options.responses.jobNotUnblocked.message);
    } catch (error) {
        return unblock.job.common.handleError(that.options.responses.jobNotUnblocked, that.sendResponse);
    }

    fluid.log(that.options.responses.success.message);
    that.sendResponse(that.options.responses.success.statusCode, that.options.responses.success);
};

unblock.job.getUnblockUrl = async function (buildUrl, accessToken, jobLabel) {
    return unblock.job.common.makeRequest(
        "GET",
        buildUrl,
        undefined,
        { Authorization: "Bearer " + accessToken }
    ).then(function (result) {
        var job = result.jobs.filter(function (job) {
            return job.label === jobLabel;
        })[0];

        return job.unblock_url;
    });
};

unblock.job.unblockJob = async function (unblockUrl, accountEmail, accountName, accessToken) {
    return unblock.job.common.makeRequest(
        "PUT",
        unblockUrl,
        {
            fields: {
                email: accountEmail,
                name: accountName
            }
        },
        { Authorization: "Bearer " + accessToken }
    ).then(function (result) {
        return result.state === "unblocked" ? true : false;
    });
};
