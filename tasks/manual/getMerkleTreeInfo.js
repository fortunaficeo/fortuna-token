const { types } = require("hardhat/config");
const { getMerkleTree, parseCSV } = require('../../deploy/helpers');

module.exports = (task) =>
  task(
    "getMerkleTreeInfo",
    "Print Merkle Tree proof of an address.",
  )
    .addOptionalParam("path", "Define a path to csv with addresses and balances to populate the Merkle Tree.", './resources/csv/holders.csv', types.string)
    .addOptionalParam("address", "Define an address for which a proof would be generated and printed.", '0x57eb63d0aab5822EFCd7A9B56775F772D3e03CfD', types.string)
    .setAction(async ({ path, address }, hre) => {
      const addressKey = "HolderAddress";
      const balanceKey = "Balance";

      const parsedMidasSnapshot = await parseCSV(
        [addressKey, balanceKey], path
      );
      const merkleTreeBody = [];
      for (const entry of parsedMidasSnapshot) {
        merkleTreeBody.push([
          entry[addressKey],
          hre.ethers.utils.parseEther(
            entry[balanceKey].includes(",")
              ? entry[balanceKey].replace(",", "")
              : entry[balanceKey]
          ).toString()
        ]);
      }
      const merkleTree = getMerkleTree(merkleTreeBody);

      for (const [i, v] of merkleTree.entries()) {
        if (v[0] === address) {
          const proof = merkleTree.getProof(i);
          console.log(proof);
          return {
            proof,
            merkleTreeBody,
            merkleTree
          };
        }
      }

      // IF NO ADDRESS WAS FOUND TO GENERATE PROOF FOR - THEN JUST RETURN MERKLE TREE BODY
      return {
        merkleTreeBody,
        merkleTree
      };
    });
