# tweet-imgs - Cloudflare Worker

## Overview

This Cloudflare Worker script automates the process of posting an image and a message to X (formerly Twitter) every set interval. The text message and hashtags used in the posts are stored in Cloudflare KV (Key-Value storage) and remain consistent across all posts. Each time a post is created, a unique image is selected from an R2 bucket. The script also sends notifications to the admin via email using Resend integration when warnings are issued or if the program is aborted.

## Features

- **Automated Posting**: Posts an image and message to X every 6 hours.
- **Dynamic Image Selection**: Selects a unique image from an R2 bucket for each post.
- **Consistent Messaging**: Retrieves text messages and hashtags from Cloudflare KV.
- **Email Notifications**: Sends notifications to the admin via email when warnings are issued or if the program is aborted.
- **Environment Variables**: Stores sensitive information such as Twitter API keys, Resend API key, and email addresses in environment variables.

## Prerequisites

- A Cloudflare account with access to Workers, R2, and KV.
- A Twitter Developer account with API keys.
- A Resend account for email notifications.

## Setup Instructions

### 1. Create a Cloudflare Worker

1. Log in to your Cloudflare account.
2. Navigate to the **Workers** section.
3. Click on **Create a Service** and follow the prompts to set up a new worker.

### 2. Set Up R2 Bucket

1. In the Cloudflare dashboard, go to the **R2** section.
2. Create a new bucket named `imgs` to store your images.
3. Create "candidates" folder inside the bucket.  This is where you store your images you want to potentially post.
4. Create "uploaded" folder inside the bucket.  This is where images that have been posted to X will be moved to.

### 3. Set Up KV Namespace

1. In the Cloudflare dashboard, go to the **Workers** section.
2. Click on **KV** and create a new namespace.
3. Note the namespace ID for later use.
4. Create a new key in the KV namespace with the name "texts" and the value as the message you want to use for the posts.
5. Create a new key in the KV namespace with the name "hashtags" and the value as the hashtags you want to use for the posts.
texts followed by hashtags will be displayed on top of the image on the post.

### 4. Configure Environment Variables

In Worker setting for variables, set the following environment variables:

TWITTER_API_KEY = "your_twitter_api_key"
TWITTER_API_SECRET = "your_twitter_api_secret"
TWITTER_ACCESS_TOKEN = "your_twitter_access_token"
TWITTER_ACCESS_SECRET = "your_twitter_access_secret"
RESEND_API_KEY = "your_resend_api_key"
RESEND_TO = "recipient_email@example.com"
RESEND_FROM = "sender_email@example.com"

### 5. Bind KV Namespace

Add the KV namespace binding in your `wrangler.toml`:

wrangler.toml
```
[[kv_namespaces]]
binding = "KV"
id = "your_namespace_id"
```
### 6. Setup cron

Setup cron on your wrangler.toml file.  Below sample is for every 6 hours.

wrangler.toml
```
[triggers]
crons = ["0 */6 * * *"]
```
### 7. Deploy the Worker

test the code on local machine and then deploy to Cloudflare.

1. Install Wrangler if you haven't already:

   ```bash
   npm install -g wrangler
   ```

2. Deploy your worker:

   ```bash
   wrangler deploy
   ```

## Usage

Once deployed, the worker will automatically run every 6 hours, posting an image and message to X. The worker will also send email notifications for any warnings or errors encountered during execution.

## Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements.

## License

This project is licensed under the MIT License.

