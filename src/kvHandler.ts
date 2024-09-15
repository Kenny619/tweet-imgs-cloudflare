import { sendEmail } from "./emailHandler";

interface Env {
	KV: KVNamespace;
	RESEND_API_KEY: string;
	RESEND_TO: string;
	RESEND_FROM: string;
}

export async function getStringsFromKV(env: Env) {
	// Get values of "texts" and "hashtags" from Cloudflare KV
	try {
		const texts = await env.KV.get("texts");
		const hashtags = await env.KV.get("hashtags");
		if (!texts || !hashtags)
			return {
				texts,
				hashtags,
				error: "Failed to retrieve texts or hashtags from KV",
			};

		return { texts, hashtags, error: null };
	} catch (error) {
		await sendEmail(
			env,
			"CRITICAL",
			"CRITICAL: Faild to retrieve texts or hashtags from KV",
			"tweet-imgs aborted due to failure to retrieve texts or hashtags from KV",
		);
		return { texts: null, hashtags: null, error: error as Error };
	}
}
