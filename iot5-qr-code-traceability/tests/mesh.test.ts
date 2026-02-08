import { getProduct } from "@/actions/product";
import { getTracking } from "@/actions/tracking";
import { mint, update, burn } from "@/contract/scripts";

describe("Mint, Burn, Update, Remove Assets (NFT/TOKEN) CIP68", function () {
  jest.setTimeout(600000000);

  test("Mint", async function () {
    await mint();
  });

  // test("Update", async function () {
  //    await update()
  // });

  // test("Burn", async function () {
  //    await burn()
  // });

  // test("Product", async function () {
  //   const product = await getProduct({
  //     owner:
  //       "addr_test1qrrsqzvu048737jnqq7rd3ck07e7cnk75x5wmdlt9zv7ptmqwvk3ckjxl4wcf6ehtynh8lctuu85xxdg9c8v5pfnjn4shn35yc",
  //     assetName: "Huawei Watch GT5 Pro",
  //   });
  //   console.log(product);
  // });

  // test("Transaction", async function () {
  //   const tracking = await getTracking({
  //     unit: "2e5547c6bda9531d326087ce89864b260d097988bc04220cca4e42f9000643b0000643b0487561776569205761746368204754342050726f",
  //   });
  //   console.dir(tracking, {
  //     depth: null,
  //     colors: true
  //   });
  // });
});
