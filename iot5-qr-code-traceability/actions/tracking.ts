"use server";
import { deserializeDatum } from "@/lib/utils";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";

export const getTracking = async function ({
  policyId,
  assetName,
}: {
  policyId: string;
  assetName: string;
}) {
  const blockfrostApi = new BlockFrostAPI({
    projectId: process.env.BLOCKFROST_API_KEY || "",
  });
  const transacitons = await blockfrostApi.assetsTransactions(
    policyId + assetName,
  );
  const histories = await Promise.all(
    transacitons.map(async function ({ tx_hash }) {
      const specialTransaction =
        await blockfrostApi.txs(tx_hash);
      const transaction =
        await blockfrostApi.txsUtxos(tx_hash);

      const assetInput = transaction.inputs.find(function (input) {
        const asset = input.amount.find(function (amt) {
          return amt.unit === policyId + assetName;
        });
        return asset !== undefined;
      });

      const assetOutput = transaction.outputs.find(function (output) {
        const asset = output.amount.find(function (amt) {
          return amt.unit === policyId + assetName;
        });
        return asset !== undefined;
      });

      if (!assetInput && assetOutput) {
        return {
          metadata: assetOutput.inline_datum
            ? await deserializeDatum(assetOutput.inline_datum)
            : {},
          txHash: tx_hash,
          datetime: specialTransaction.block_time,
          fee: specialTransaction.fees,
          status: "Completed",
          action: "Mint",
        };
      }

      if (!assetOutput && assetInput) {
        return {
          metadata: assetInput.inline_datum
            ? await deserializeDatum(assetInput.inline_datum)
            : {},
          txHash: tx_hash,
          datetime: specialTransaction.block_time,
          fee: specialTransaction.fees,
          status: "Completed",
          action: "Burn",
        };
      }

      if (assetInput && assetOutput) {
        return {
          metadata: assetOutput.inline_datum
            ? await deserializeDatum(assetOutput.inline_datum)
            : {},
          txHash: tx_hash,
          datetime: specialTransaction.block_time,
          fee: specialTransaction.fees,
          status: "Completed",
          action: "Update",
        };
      }
    }),
  );

  return histories;
};
