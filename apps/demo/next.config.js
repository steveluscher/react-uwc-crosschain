/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ["@ada-anvil/react-uwc-crosschain"],
  experimental: {
    forceSwcTransforms: true,
  },
};
