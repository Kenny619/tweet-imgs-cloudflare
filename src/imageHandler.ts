import { sendEmail } from "./emailHandler";

interface Env {
	BUCKET: R2Bucket;
	RESEND_API_KEY: string;
	RESEND_TO: string;
	RESEND_FROM: string;
}
export async function getImage(env: Env): Promise<{
	img: { path: string; arrayBuffer: ArrayBuffer } | null;
	error: string | null;
}> {
	const listed = await env.BUCKET.list();

	// Create an array to store file and folder names
	const items = listed.objects
		.map((object) => object.key)
		.filter((key) => !key.endsWith("/"));

	// return error if no items where found
	if (items.length === 0) {
		await sendEmail(
			env,
			"CRITICAL",
			"CRITICAL: No image in bucket",
			"tweet-imgs aborted due to missing image files in R2 bucket.  Add new image files to appropriate R2 bucket. ",
		);
		return { img: null, error: "No items found" };
	}

	if (items.length < 50) {
		await sendEmail(
			env,
			"WARNING",
			`WARNING: ${items.length} images left in bucket`,
			`There are ${items.length} images left in bucket.  Program would abort in ${Math.floor(items.length / 4)}days if no new images were added to the bucket.`,
		);
	}

	const firstImg = items[0];

	//get image of first item in the list
	const object = await env.BUCKET.get(firstImg);

	// return error if no object was found
	if (!object) {
		return { img: null, error: "Object not found" };
	}

	//convert object to arraybuffer
	const arrayBuffer = await object.arrayBuffer();
	if (!arrayBuffer) {
		await sendEmail(
			env,
			"CRITICAL",
			"CRITICAL: Faild to create arrayBuffer from an image object.",
			`tweet-imgs aborted.  Faild to create arrayBuffer from an image object.  Image: ${firstImg}`,
		);

		return {
			img: null,
			error: "Faild to create arrayBuffer from an image object.",
		};
	}

	// return image as path and blob
	return {
		img: { path: firstImg, arrayBuffer },
		error: null,
	};
}

export async function moveImage(
	env: Env,
	img: { path: string; arrayBuffer: ArrayBuffer },
) {
	try {
		const sourceKey = img.path;
		const destinationKey = img.path.replace("candidates/", "uploaded/");

		// Copy the object to the new location
		await env.BUCKET.put(destinationKey, img.arrayBuffer, {
			customMetadata: { originalPath: sourceKey },
		});

		// Delete the original object
		await env.BUCKET.delete(sourceKey);
		console.log(`Successfully moved ${sourceKey} to ${destinationKey}`);
	} catch (error) {
		console.error("Error moving file in R2:", error);
		await sendEmail(
			env,
			"WARNING",
			"WARNING: Faild to move image to uploaded folder.",
			`Faild to move image to uploaded folder.  Manually move the image to the appropriate folder.  image: ${img.path}`,
		);
		return new Response("Failed to move file in R2", { status: 500 });
	}
}
