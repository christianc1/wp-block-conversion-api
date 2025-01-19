# Gutenberg Content Convert API

This repository sets up a simple HTTP API on AWS that helps convert regular HTML into Gutenberg blocks.  The intention for this API is to serve as a migration utility.  Instead of attempting to either recreate the `rawHandler` implementation in the `@wordpress/blocks` package in PHP, you can use this API as a utility that leverages the core Javascript implementation directly, even in a PHP based migration.  At this time, this only supports the out-of-the-box implementation of WordPress Core.  In other words, only core blocks are supported.

## Setup

After cloning this repository:

1. Install Serverless: `npm i serverless -g`
2. Install the project dependencies: `npm install`
3. Add your own token to the .env file to make authorized requests.
4. Optionally, adjust the other environmental variables in `.env` to link and identify the service in Serverless, see [Serverless Documentation](https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml).

## Usage

### Important Notes on Usage

When used as a migration utility, especially a migration that you're running locally, my recommendation would be to use this utility as a local utility on your machine. See [Local Development](#local-development) on how to do that. That way, you're not incurring costs of running this all in a cloud and potentially incurring the costs of compute time. Of course, there are also scenarios where the API must be publicly available, for example, running a migration on a remote server. In those instances, you should be aware of the potential cost. AWS has tools to help you estimate. Cold starts on Lambda are resource-intensive, mainly due to the need to shim a virtual DOM (the DOM is not available on Lambda Node.js runtimes) and then setting up a Block Editor environment where core blocks are registered. Subsequent requests to provisioned Lambdas are less intensive and typical response times are in the milliseconds. I recommend testing things out after deploying to AWS to get a feel for cold start times and setting request timeouts appropriately or looking into Provisioned Concurrency if you need to keep execution time consistently low.

### Deployment

In order to deploy the example, you need to run the following command:

```bash
serverless deploy
```

After running deploy, you should see output similar to:

```bash
Deploying "gutenberg-content-convert" to stage "dev" (us-east-1)

✔ Service deployed to stack gutenberg-content-convert-dev (91s)

endpoints:
  POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/getBlocks
  POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/getMarkup
functions:
  getBlocks: gutenberg-content-convert-dev-getBlocks (12 MB)
  getMarkup: gutenberg-content-convert-dev-getMarkup (12 MB)
```

_Note_: In current form, after deployment, your API will use a very simple token authorization check using the token you set in the `.env` file. For production deployments, you might want to configure an authorizer for more robust authentication and authorization. For details on how to do that, refer to [HTTP API (API Gateway V2) event docs](https://www.serverless.com/framework/docs/providers/aws/events/http-api).

### Invocation

After successful deployment, you can call the created application via HTTP.  Two endpoints are exposed

#### `POST`: `/getMarkup`

*Request*

```bash
curl --location 'https://xxxxxxx.execute-api.us-east-1.amazonaws.com/dev/getMarkup' \
--header 'Content-Type: application/json' \
--header 'Authorization: <your-secret-token>' \
--data '{
    "html": "<p>Hello World</p><ul><li>item 1</li><li>item 2</li></ul><img src=\"https://example.com/image.png\" alt=\"alt text\"/>"
}'
```

*Response*

`200 OK`
```js
{
    "html": "<!-- wp:paragraph -->\n<p>Hello World</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>item 1</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>item 2</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->\n\n<!-- wp:image -->\n<figure class=\"wp-block-image\"><img src=\"https://example.com/image.png\" alt=\"alt text\"/></figure>\n<!-- /wp:image -->"
}
```

#### `POST`: `/getBlocks`

*Request*

```bash
curl --location 'https://xxxxxxx.execute-api.us-east-1.amazonaws.com/dev/getBlocks' \
--header 'Content-Type: application/json' \
--header 'Authorization: ••••••' \
--data '{
    "html": "<p>Hello World</p><ul><li>item 1</li><li>item 2</li></ul><img src=\"https://example.com/image.png\" alt=\"alt text\"/>"
}'
```

*Response*

`200 OK`
```js
{
    "blocks": [
        {
            "clientId": "be4e05a9-5436-4a71-a994-a8f60747be9d",
            "name": "core/paragraph",
            "isValid": true,
            "attributes": {
                "content": "Hello World",
                "dropCap": false
            },
            "innerBlocks": []
        },
        {
            "clientId": "729b4f62-c682-4140-930d-07fd345a9611",
            "name": "core/list",
            "isValid": true,
            "attributes": {
                "ordered": false,
                "values": ""
            },
            "innerBlocks": [
                {
                    "clientId": "8743cb63-2d4d-4a53-a921-d8014966d6e3",
                    "name": "core/list-item",
                    "isValid": true,
                    "attributes": {
                        "content": "item 1"
                    },
                    "innerBlocks": []
                },
                {
                    "clientId": "77eb8440-8b87-4a71-aa55-7493a14c9bc1",
                    "name": "core/list-item",
                    "isValid": true,
                    "attributes": {
                        "content": "item 2"
                    },
                    "innerBlocks": []
                }
            ]
        },
        {
            "clientId": "7c0de4aa-609f-431a-b906-f8924192348f",
            "name": "core/image",
            "isValid": true,
            "attributes": {
                "url": "https://example.com/image.png",
                "alt": "alt text",
                "caption": ""
            },
            "innerBlocks": []
        }
    ]
}
```

### Local development

The easiest way to develop and test this API is to use the `dev` command:

```bash
serverless dev
```

This will start a local emulator of AWS Lambda and tunnel your requests to and from AWS Lambda, allowing you to interact with your function as if it were running in the cloud.

Now you can invoke the function as before, but this time the function will be executed locally. Now you can develop your function locally, invoke it, and see the results immediately without having to re-deploy.

When you are done developing, don't forget to run `serverless deploy` to deploy the function to the cloud.
