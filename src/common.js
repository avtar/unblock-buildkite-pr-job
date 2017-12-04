"use strict";
var fluid = require("infusion");
var rp = require("request-promise-native");
var unblock = fluid.registerNamespace("unblock");
var URL = require("url").URL;

fluid.registerNamespace("unblock.job.common");

fluid.defaults("unblock.job.common", {
    gradeNames: ["fluid.component"],
    buildkite: {
        accessToken: "{gpii.launcher.resolver}.env.BUILDKITE_ACCESS_TOKEN",
        accountName: "{gpii.launcher.resolver}.env.BUILDKITE_ACCOUNT_NAME",
        accountEmail: "{gpii.launcher.resolver}.env.BUILDKITE_ACCOUNT_EMAIL",
        jobLabel: "{gpii.launcher.resolver}.env.BUILDKITE_JOB_LABEL",
        webhookToken: "{gpii.launcher.resolver}.env.BUILDKITE_WEBHOOK_TOKEN",
        apiHost: "api.buildkite.com",
        apiVersion: "v2"
    },
    github: {
        apiHost: "api.github.com",
        apiVersion: "v3",
        userAgent: "Node.js",
        accessToken: "{gpii.launcher.resolver}.env.GITHUB_ACCESS_TOKEN"
    },
    responses: {
        invalidWebhookToken: {
            message: "Invalid Buildkite webhook token",
            statusCode: 401,
            isError: true
        },
        invalidWebhookPayload: {
            message: "Invalid Buildkite webhook payload",
            statusCode: 401,
            isError: true
        },
        unblockUrlNotAvailable: {
            message: "Buildkite unblock job URL could not be found",
            statusCode: 400,
            isError: true
        },
        contributorResultNotAvailable: {
            message: "GitHub contributors list could not be found",
            statusCode: 400,
            isError: true
        },
        contributorUrlNotAvailable: {
            message: "GitHub contributors URL not available",
            statusCode: 400,
            isError: true
        },
        unrecognizedContributor: {
            message: "Unrecognized pull request author",
            statusCode: 401,
            isError: true
        },
        jobNotUnblocked: {
            message: "Could not unblock job",
            statusCode: 400,
            isError: true
        },
        success: {
            message: "Job successfully unblocked",
            statusCode: 200,
            isError: false
        }
    }
});

unblock.job.common.handleError = function (error, sendResponse) {
    fluid.log(error.message);
    return sendResponse(error.statusCode, error);
}

unblock.job.common.isUrl = function (url) {
    var test = new URL(url);
    // Only https URLs are expected in payloads
    return test.protocol === "https:" ? true : false;
};

unblock.job.common.makeRequest = async function (method, url, body, headers, query) {
    var options = {
        method: method,
        url: url,
        body: body,
        headers: headers,
        qs: query,
        json: true
    };

    return rp(options);
};
