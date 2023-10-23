import { JsonRpcProvider } from 'ethers';

export async function getLatestBlockAndTransactions(providerUrl) {
  // Initialize a provider
  const provider = new JsonRpcProvider(providerUrl);
  try {
    // Get the latest block number
    const blockNumber = await provider.getBlockNumber();

    // Get the latest block details
    const block = await provider.getBlock(blockNumber);

    // Get the list of transaction hashes in the latest block
    const transactionHashes = block.transactions;

    // Fetch transaction details for each transaction hash
    //   const transactions = await Promise.all(
    //     transactionHashes.map(async (hash) => {
    //       const tx = await provider.getTransaction(hash);
    //       return tx;
    //     })
    //   );
    return {
      blockNumber,
      block,
      transactionHashes,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Replace 'YOUR_PROVIDER_URL' with the URL of your Ethereum provider (e.g., Infura).
// const providerUrl = 'https://eth-mainnet.blastapi.io/7ba8e1ac-14a0-4e49-a96e-adb82420a114';

// getLatestBlockAndTransactions(providerUrl)
//   .then((data) => {
//     console.log('Latest Block Number:', data.blockNumber);
//     console.log('Latest Block Details:', data.block);
//     console.log('Transactions in the Latest Block:', data.transactionHashes);
//   })
//   .catch((error) => {
//     console.error('Error:', error);
//   });
