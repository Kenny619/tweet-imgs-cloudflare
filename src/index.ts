/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { getImage, moveImage } from "./imageHandler";
import { uploadImageToX, postToX } from "./xHandler";
import { getStringsFromKV } from "./kvHandler";
export interface Env {
	BUCKET: R2Bucket;
	TWITTER_API_KEY: string;
	TWITTER_API_SECRET: string;
	TWITTER_ACCESS_TOKEN: string;
	TWITTER_ACCESS_SECRET: string;
	R2_API_TOKEN: string;
	KV: KVNamespace;
	RESEND_API_KEY: string;
	RESEND_TO: string;
	RESEND_FROM: string;
}
export default {
	async scheduled(
		event: ScheduledEvent,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		await main(env);
	},
};

async function main(env: Env) {
	//get image from r2
	const { img, error } = await getImage(env);
	if (img === null || error) return false;

	//auth and upload image to twitter api.  get media id
	const result = await uploadImageToX(env, img);
	if (result.error) return false;

	//get texts and hashtags from kv
	const { texts, hashtags, error: kvError } = await getStringsFromKV(env);
	if (kvError && texts === null && hashtags === null) return false;

	//post to x
	const postResult = await postToX(
		env,
		texts as string,
		hashtags as string,
		result.media_id,
	);

	if (postResult.error) return false;

	//move and delete image after a successful post
	if (postResult.tweet_id) await moveImage(env, img);

	return true;
}
