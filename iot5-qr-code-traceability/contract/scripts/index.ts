import { BlockfrostProvider, MeshWallet } from "@meshsdk/core";
import { Contract } from "./offchain";
const provider = new BlockfrostProvider(process.env.BLOCKFROST_API_KEY || "");

const wallet = new MeshWallet({
  networkId: 0,
  accountIndex: 0,
  fetcher: provider,
  submitter: provider,
  key: {
    type: "mnemonic",
    words: process.env.MNEMONIC?.split(" ") || [],
  },
});

// 0 => addr_test1qrrsqzvu048737jnqq7rd3ck07e7cnk75x5wmdlt9zv7ptmqwvk3ckjxl4wcf6ehtynh8lctuu85xxdg9c8v5pfnjn4shn35yc

const owner =
  "addr_test1qrrsqzvu048737jnqq7rd3ck07e7cnk75x5wmdlt9zv7ptmqwvk3ckjxl4wcf6ehtynh8lctuu85xxdg9c8v5pfnjn4shn35yc";

export const mint = async () => {
  const contract = new Contract({
    wallet: wallet,
    provider: provider,
    owner: owner,
  });
  const assetName = "Huawei Watch GT4 Pro";
  const unsignedTx: string = await contract.mint({
    assetName: assetName,
    metadata: {
      name: "Huawei Watch GT 4 Pro - Premium Titanium Smartwatch",
      description:
        "The Huawei Watch GT 4 Pro is a high-end smartwatch featuring an aerospace-grade titanium case, spherical sapphire crystal glass, and a 1.5-inch LTPO AMOLED display (466×466 pixels, ~310 ppi). It offers up to 14 days of battery life (typical usage), HUAWEI TruSense health system (heart rate, SpO2, ECG, stress, sleep, skin temperature), 100+ sports modes, dual-band multi-system GPS, 5 ATM water resistance (50 meters), HarmonyOS, Bluetooth 5.2, NFC, and premium design for active, modern lifestyles.",
      brand: "Huawei",
      model: "Watch GT 4 Pro",
      material: "Aerospace Titanium + Sapphire Glass",
      battery: "Up to 14 days",
      image: "ipfs://QmYourIPFSHashhuaweiwatchgt4frontpng",
      mediaType: "image/png",
      roadmap: "[Ha Noi, Hung Yen, Hai Duong, Hai Phong]",
      location: "Hung Yen",
    },
  });
  const signedTx = await wallet.signTx(unsignedTx, true);
  const txHash = await wallet.submitTx(signedTx);
  console.log(`https://preprod.cexplorer.io/tx/` + txHash);
  await new Promise<void>(function (resolve) {
    provider.onTxConfirmed(txHash, () => {
      resolve();
    });
  });
};

export const update = async () => {
  const contract = new Contract({
    wallet: wallet,
    provider: provider,
    owner: owner,
  });
  const assetName = "Huawei Watch GT4 Pro";
  const unsignedTx: string = await contract.update({
    assetName: assetName,
    metadata: {
      name: "Huawei Watch GT 4 Pro - Premium Titanium Smartwatch",
      description:
        "The Huawei Watch GT 4 Pro is a high-end smartwatch featuring an aerospace-grade titanium case, spherical sapphire crystal glass, and a 1.5-inch LTPO AMOLED display (466×466 pixels, ~310 ppi). It offers up to 14 days of battery life (typical usage), HUAWEI TruSense health system (heart rate, SpO2, ECG, stress, sleep, skin temperature), 100+ sports modes, dual-band multi-system GPS, 5 ATM water resistance (50 meters), HarmonyOS, Bluetooth 5.2, NFC, and premium design for active, modern lifestyles.",
      brand: "Huawei",
      model: "Watch GT 4 Pro",
      material: "Aerospace Titanium + Sapphire Glass",
      battery: "Up to 14 days",
      image: "ipfs://QmYourIPFSHashhuaweiwatchgt4frontpng",
      mediaType: "image/png",
      roadmap: "[Ha Noi, Hung Yen, Hai Duong, Hai Phong]",
      location: "Hai Duong",
    },
  });
  const signedTx = await wallet.signTx(unsignedTx, true);
  const txHash = await wallet.submitTx(signedTx);
  console.log(`https://preprod.cexplorer.io/tx/` + txHash);
  await new Promise<void>(function (resolve) {
    provider.onTxConfirmed(txHash, () => {
      resolve();
    });
  });
};
export const burn = async () => {
  const contract = new Contract({
    wallet: wallet,
    provider: provider,
    owner: owner,
  });
  const assetName = "Huawei Watch GT4 Pro";
  const unsignedTx: string = await contract.burn({
    assetName: assetName,
  });
  const signedTx = await wallet.signTx(unsignedTx, true);
  const txHash = await wallet.submitTx(signedTx);
  console.log(`https://preprod.cexplorer.io/tx/` + txHash);
  await new Promise<void>(function (resolve) {
    provider.onTxConfirmed(txHash, () => {
      resolve();
    });
  });
};
