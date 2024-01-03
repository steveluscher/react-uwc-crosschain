import pack from "./package.json";

const external = [
  "@solana/spl-token",
  "@solana/web3.js",
  "ethers",
  "jotai",
  "react",
];

export const build = async () => {
  const entrypoints = Object.values(pack.exports).map((v) => v.default);

  await Bun.build({
    entrypoints,
    outdir: "./dist",
    external,
  });
};

build();
