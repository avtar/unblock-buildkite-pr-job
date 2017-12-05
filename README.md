## About

This web service processes incoming [Buildkite webhook events](https://buildkite.com/docs/webhooks). When a ``POST`` request is sent to its ``/unblock`` endpoint the following takes place:
* Verification of the incoming Buildkite payload
* A [GitHub contributors API](https://developer.github.com/v3/repos/#list-contributors) request to verify the PR author is a recognized contributor
* If all of the above test cases pass then a Buildkite API request is issued to unblock the blocked PR job

## Block pull request jobs in pipelines

It is necessary that all [Buildkite pipeline](https://buildkite.com/docs/pipelines/pipelines) configurations start with the following snippet:

```
steps:
  # The CI job will be paused for third-party PR branches. It can be resumed from the Buildkite dashboard.
  - block: "Run this CI job"
    # Buildkite uses an "account:branch" naming pattern for third-party branches.
    branches: "*:*"
```

## Configure Buildkite webhook

A webhook needs to be set up by visiting your project's dashboard ``https://buildkite.com/organizations/<project name>/services/webhook/new``.
* The ``Webhook URL`` needs to point to wherever this web service will be hosted, for example ``https://domain.lol/unblock``
* Make a note of the ``Token``
* Only the ``build.finished`` event should be checked
* ``Branch filtering`` should be set to ``*:*``

## Environment Variables

The following environment variables are mandatory: 

* ``BUILDKITE_ACCESS_TOKEN``: A [token needs to be generated](https://buildkite.com/user/api-access-tokens/new) with access to the ``read_builds`` and ``write_builds`` scopes 
* ``BUILDKITE_WEBHOOK_TOKEN``: The token provided by Buildkite when setting up a webhook as detailed above
* ``BUILDKITE_ACCOUNT_NAME``: The account name used to unblock jobs
* ``BUILDKITE_ACCOUNT_EMAIL``: The email address associated with account used to unblock jobs
* ``BUILDKITE_JOB_LABEL``: The blocked job label used in pipeline configs, for example ``Run this CI job``

These variables are optional:

* ``GITHUB_ACCESS_TOKEN``: There is no default but GitHub will limit unauthenticated requests to 60 per hour. To have a higher limit please provide [a token](https://github.com/settings/tokens/new) with the ``repo`` scope
* ``TCP_PORT``: Defaults to 3000

## Build image

    docker build --rm -t <docker repository account>/unblock-buildkite-pr-job .

## Start container

```
docker run \
-d \
-p 3000:3000 \
--name="unblock-buildkite-pr-job" \
-e BUILDKITE_ACCESS_TOKEN="your token" \
-e BUILDKITE_WEBHOOK_TOKEN="token provided in buildkite webhook settings" \
-e BUILDKITE_ACCOUNT_NAME="account name used to unblock jobs" \
-e BUILDKITE_ACCOUNT_EMAIL="email associated with account used to unblock jobs" \
-e BUILDKITE_JOB_LABEL="Blocked job label used in your pipeline config" \
avtar/unblock-buildkite-pr-job
```
