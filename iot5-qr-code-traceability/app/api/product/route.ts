import { NextResponse } from "next/server";
import { CIP68_100, stringToHex } from "@meshsdk/core";
import { getProduct } from "@/actions/product"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetName = searchParams.get('product_name');
  const owner = searchParams.get("issuer_address")

  if (!assetName) {
    return NextResponse.json({ error: "Missing assetName query param" }, { status: 400 });
  }

   if (!owner) {
    return NextResponse.json({ error: "Missing owner query param" }, { status: 400 });
  }

  const product = await  getProduct({
      owner: owner,
      assetName: assetName
  })
  return NextResponse.json(product);
}
