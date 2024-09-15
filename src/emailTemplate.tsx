import * as React from "react";

interface EmailTemplateProps {
	level: string;
	title: string;
	message: string;
}

const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
	level,
	title,
	message,
}) => (
	<>
		<style>
			{`
			div {
				background-color: black;
				color: white;
				padding: 4px;
			}
		`}
		</style>
		<div>
			<h1
				style={{
					color:
						level === "SUCCESS"
							? "green"
							: level === "WARNING"
								? "orange"
								: level === "CRITICAL"
									? "red"
									: "white",
				}}
			>
				{level}
			</h1>
			<h2>{title}</h2>
			<p>{message}</p>
		</div>
	</>
);

export default EmailTemplate;
