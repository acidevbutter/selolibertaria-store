import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next/types";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const isProductionBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	reactCompiler: true,
	output: process.env.DOCKER ? "standalone" : undefined,
	outputFileTracingRoot: projectRoot,
	logging: {
		fetches: {
			fullUrl: isProductionBuild,
		},
	},
	images: {
		remotePatterns: [{ hostname: "res.cloudinary.com" }],
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
