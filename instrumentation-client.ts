import { datadogRum } from "@datadog/browser-rum";
import { env } from "@/env.mjs";

if (env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID && env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN) {
	datadogRum.init({
		applicationId: env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID,
		clientToken: env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN,
		site: env.NEXT_PUBLIC_DD_SITE as Parameters<typeof datadogRum.init>[0]["site"],
		service: env.NEXT_PUBLIC_DD_SERVICE,
		env: env.NEXT_PUBLIC_DD_ENV,
		version: env.NEXT_PUBLIC_DD_VERSION,
		sessionSampleRate: Number(env.NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE ?? 100),
		sessionReplaySampleRate: Number(env.NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE ?? 0),
		trackUserInteractions: true,
		trackResources: true,
		trackLongTasks: true,
		defaultPrivacyLevel: env.NEXT_PUBLIC_DD_DEFAULT_PRIVACY_LEVEL as Parameters<
			typeof datadogRum.init
		>[0]["defaultPrivacyLevel"],
	});
}
