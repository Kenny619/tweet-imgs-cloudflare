import { Resend } from "resend";
import EmailTemplate from "./emailTemplate";

interface Env {
	RESEND_API_KEY: string;
	RESEND_TO: string;
	RESEND_FROM: string;
}
export async function sendEmail(
	env: Env,
	level: string,
	title: string,
	message: string,
) {
	const resend = new Resend(env.RESEND_API_KEY);

	try {
		const data = await resend.emails.send({
			from: env.RESEND_FROM,
			to: [env.RESEND_TO],
			subject: title,
			react: EmailTemplate({ level, title, message }),
		});
	} catch (error) {
		console.error("Error sending email:", error);
	}
}
