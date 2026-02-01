import { NextResponse } from "next/server";
import { Contract } from "@/contract/scripts/offchain";
import { deserializeDatum } from "@/lib/utils";
import { blockfrostProvider } from "@/providers/cardano";
import { CIP68_100, MeshWallet, stringToHex } from "@meshsdk/core";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetName = searchParams.get('product_name');
  const owner = searchParams.get("issuer_name")

  if (!assetName) {
    return NextResponse.json({ error: "Missing assetName query param" }, { status: 400 });
  }

   if (!owner) {
    return NextResponse.json({ error: "Missing owner query param" }, { status: 400 });
  }

  const wallet = new MeshWallet({
    networkId: 0,
    accountIndex: 0,
    fetcher: blockfrostProvider,
    submitter: blockfrostProvider,
    key: {
      type: "mnemonic",
      words: process.env.MNEMONIC?.split(" ") || [],
    },
  });
  const contract = new Contract({
    owner: owner,
    wallet: wallet,
    provider: blockfrostProvider,
  });
  const policyId = contract.policyId;
  const contractAddress = contract.contractAddress;

  const utxo = (
    await blockfrostProvider.fetchAddressUTxOs(
      contractAddress,
      policyId + CIP68_100(stringToHex(assetName)),
    )
  )[0];

  if (!utxo) {
    throw new Error("No Asset Not Found From UTxOs.");
  }

  const metadata = await deserializeDatum(utxo.output.plutusData as string);

  return NextResponse.json({
    policyId: policyId,
    assetName: CIP68_100(stringToHex(assetName)),
    metadata: metadata,
  });
}
