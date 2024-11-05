import { Address, toNano } from "@ton/ton";
import { getUnprocessedRows, setProcToTrue } from "../helpers/queryDb";
import dotenv from "dotenv";
import { send } from "process";
import sendMintMsg from "../helpers/sendMintMsg";
dotenv.config();

function calculateJettonAmount(value: string): bigint {
  const jettonAmount = BigInt(value) / toNano(process.env.JETTON_PRICE!);
  return jettonAmount;
}

async function jettonMinter() {
  console.log("jettonMinter ");
  while (true) {
    const unprocessedRows = await getUnprocessedRows();
    // console.log('unprocessedRows ', unprocessedRows);
    if (unprocessedRows.length === 0) {
      console.log("No unprocessed rows found, waiting...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    for (const row of unprocessedRows) {
      let jAmount: bigint;
      try {
        console.log("row.amount ", row.amount);
        jAmount = calculateJettonAmount(row.amount);
        console.log("jetton amount: ", jAmount);
        console.log("sender ", row.sender);
      } catch (e) {
        console.log("calculateJettonAmount error ");
        await setProcToTrue(row);
        continue;
      }

      try {
        let senderAddress = Address.parse(row.sender).toString({bounceable: false});
        console.log('senderAddress ', senderAddress);
        let senderNonBuonceAddress = Address.parseFriendly(senderAddress);
        console.log('sender address ', senderNonBuonceAddress.address);
        await sendMintMsg(senderNonBuonceAddress.address, jAmount);
      } catch (error) {
        console.log("Error during sending mint message: ", error);
        await setProcToTrue(row);
        continue;
      }
      await setProcToTrue(row);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

export default jettonMinter;