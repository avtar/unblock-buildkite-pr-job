"use strict";

var fluid = require("infusion");
var rp = require("request-promise-native");
var unblock = fluid.registerNamespace("unblock");

fluid.registerNamespace("unblock.job.validateAuthor");

fluid.defaults("unblock.job.validateAuthor", {
    gradeNames: ["gpii.express.middleware.requestAware"],
    handlerGrades: ["unblock.job.validateAuthor.handler"],
});

fluid.defaults("unblock.job.validateAuthor.handler", {
    gradeNames: ["unblock.job.common", "gpii.express.middleware.requestAware"],
    invokers: {
        handleRequest: {
            funcName: "unblock.job.validateAuthor.handleRequest",
            args: ["{that}"]
        }
    }
});

unblock.job.validateAuthor.handleRequest = async function (that) {
    fluid.log("Validating pull request author...");

    var accountRepoString = unblock.job.validateAuthor.getRepositoryFullName(
        that.options.request.body.pipeline.repository
    );
    var contributorsApiUrl = unblock.job.validateAuthor.constructGithubContributorsUrl(
        that.options.github.apiHost,
        accountRepoString
    );
    var result;

    try {
        result = await unblock.job.validateAuthor.getContributors(
            contributorsApiUrl,
            that.options.github.apiHost,
            that.options.github.apiVersion,
            that.options.github.userAgent,
            that.options.github.accessToken
        );
        if (!result) throw new Error(that.options.responses.contributorResultNotAvailable.message);
    } catch (error) {
        return unblock.job.common.handleError(that.options.responses.contributorResultNotAvailable, that.sendResponse);
    }

    var prRepo = that.options.request.body.build.pull_request.repository;
    var prAuthor = unblock.job.validateAuthor.getRepositoryUsername(prRepo);

    if (!result.includes(prAuthor)) {
        return unblock.job.common.handleError(that.options.responses.unrecognizedContributor, that.sendResponse);
    }

    that.options.next();
}

unblock.job.validateAuthor.constructGithubContributorsUrl = function (apiHost, accountRepoString) {
    var url = [
        "https://" + apiHost,
        "repos",
        accountRepoString,
        "contributors"
    ].join("/");

    return url;
}

// Returns "github-account/github-repository"
unblock.job.validateAuthor.getRepositoryFullName = function (url) {
    // Remove the .git extension and obtain the GitHub account and repository names
    var array = url.replace(/\.git$/, "").match(/github\.com\/(.*)\/(.*)/);
    if (!array || array.length !== 3) {
        throw new Error("Couldn't parse the repository url.");
    }

    return array.slice(1).join("/");
};

unblock.job.validateAuthor.getRepositoryUsername = function (url) {
    return unblock.job.validateAuthor.getRepositoryFullName(url).split("/")[0];
};

unblock.job.validateAuthor.getContributors = async function (url, apiHost, apiVersion, userAgent, accessToken) {
    var query = {};
    // Without this token GitHub will only allow 60 API requests per hour
    if (accessToken) {
        query.access_token = accessToken;
    }

    return unblock.job.common.makeRequest(
        "GET",
        url,
        undefined,
        {
            "User-Agent": userAgent,
            Accept: "application/vnd.github." + apiVersion + "+json"
        },
        {
            query: query
        }
    ).then(function (contributors) {
        return contributors.map(function (user) {
            return user.login;
        });
    });
};