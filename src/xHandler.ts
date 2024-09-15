import OAuth from "oauth-1.0a";
import { HmacSHA1, enc } from "crypto-js";
import { sendEmail } from "./emailHandler";
interface Env {
	TWITTER_API_KEY: string;
	TWITTER_API_SECRET: string;
	TWITTER_ACCESS_TOKEN: string;
	TWITTER_ACCESS_SECRET: string;
	RESEND_API_KEY: string;
	RESEND_TO: string;
	RESEND_FROM: string;
}

export async function uploadImageToX(
	env: Env,
	img: { path: string; arrayBuffer: ArrayBuffer },
) {
	const oauth = getOAauth(env);

	const oauthToken = getOauthToken(env);

	const formData = new FormData();
	formData.append("media", new Blob([img.arrayBuffer]), "image.jpg");
	formData.append("media_category", "tweet_image");

	const postOptions = {
		url: "https://upload.twitter.com/1.1/media/upload.json",
		method: "POST",
		headers: {
			...oauth.toHeader(
				oauth.authorize(
					{
						url: "https://upload.twitter.com/1.1/media/upload.json",
						method: "POST",
					},
					oauthToken,
				),
			),
			"Content-Type": "multipart/form-data",
		},
		body: formData,
	};

	delete postOptions.headers["Content-Type"];

	try {
		const response = await fetch(postOptions.url, postOptions);
		const responseData: { [key: string]: any } = await response.json();
		console.log("responseData media_id_string", responseData.media_id_string);
		return { media_id: responseData.media_id_string, error: null };
	} catch (error) {
		await sendEmail(
			env,
			"CRITICAL",
			"CRITICAL: Faild to upload image to X.",
			`tweet-imgs aborted due to failure to upload image to X.   image: ${img.path}`,
		);
		return { media_id: null, error: error as Error };
	}
}

export async function postToX(
	env: Env,
	texts: string,
	hashtags: string,
	media_id: string,
) {
	// Create a post using X API
	const oauth = getOAauth(env);
	const oauthToken = getOauthToken(env);

	// Concatenate all texts and hashtags
	const text = `${texts} ${hashtags}`;

	const data = JSON.stringify({
		text,
		media: { media_ids: [media_id] },
	});

	const postOptions = {
		url: "https://api.x.com/2/tweets",
		method: "POST",
		headers: {
			...oauth.toHeader(
				oauth.authorize(
					{
						url: "https://api.x.com/2/tweets",
						method: "POST",
					},
					oauthToken,
				),
			),
			"Content-Type": "application/json",
		},
		body: data,
	};

	const response = await fetch(postOptions.url, postOptions);
	const responseJson: { [key: string]: any } = await response.json();

	if (!("data" in responseJson)) {
		await sendEmail(
			env,
			"CRITICAL",
			"CRITICAL: Faild to post to X.",
			"tweet-imgs aborted due to failure to post to X.",
		);
		return { tweet_id: null, error: responseJson };
	}

	await sendEmail(
		env,
		"SUCCESS",
		"SUCCESS: Successfully posted to X.",
		`tweet-imgs successfully posted to X. 
          tweetID: ${responseJson.data.id}`,
	);
	return { tweet_id: responseJson.data.id, error: null };
}

function getOAauth(env: Env) {
	// Create a post using X API
	return new OAuth({
		consumer: { key: env.TWITTER_API_KEY, secret: env.TWITTER_API_SECRET },
		signature_method: "HMAC-SHA1",
		hash_function(baseString, key) {
			return HmacSHA1(baseString, key).toString(enc.Base64);
		},
	});
}

function getOauthToken(env: Env) {
	return {
		key: env.TWITTER_ACCESS_TOKEN,
		secret: env.TWITTER_ACCESS_SECRET,
	};
}
