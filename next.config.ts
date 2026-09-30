import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next/types";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const isProductionBuild = process.env.NODE_ENV === "production";
// `images.remotePatterns[].hostname` must be a bare hostname. The env is set by hand in Coolify and
// has been filled with full URLs ("https://blob-preprod.devbutter.tech"), which Next silently accepts
// at build time but then refuses to optimise -- so accept either form (selolibertaria-store#211).
function toHostname(value: string) {
	try {
		return new URL(value.includes("://") ? value : `https://${value}`).hostname;
	} catch {
		return value;
	}
}

const blobHosts = (process.env.BUTTER_BLOB_PUBLIC_HOST ?? "localhost,127.0.0.1")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean)
	.map(toHostname);

const nextConfig: NextConfig = {
	reactStrictMode: true,
	reactCompiler: true,
	allowedDevOrigins: ["192.168.15.6"],
	output: process.env.DOCKER ? "standalone" : undefined,
	outputFileTracingRoot: projectRoot,
	logging: {
		fetches: {
			fullUrl: isProductionBuild,
		},
	},
	images: {
		remotePatterns: [{ hostname: "res.cloudinary.com" }, ...blobHosts.map((hostname) => ({ hostname }))],
		formats: ["image/avif", "image/webp"],
	},
	transpilePackages: ["next-mdx-remote"],
	experimental: {
		esmExternals: true,
		scrollRestoration: true,
		serverActions: {
			bodySizeLimit: "5mb",
		},
		ppr: false,
		cpus: 1,
		mdxRs: isProductionBuild,
		inlineCss: isProductionBuild,
	},
	webpack: (config) => {
		return {
			...config,
			resolve: {
				...config.resolve,
				extensionAlias: {
					".js": [".js", ".ts"],
					".jsx": [".jsx", ".tsx"],
				},
			},
		};
	},
	rewrites: async () => [
		{
			source: "/stats/:match*",
			destination: "https://eu.umami.is/:match*",
		},
	],
};

export default nextConfig;
