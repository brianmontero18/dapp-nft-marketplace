import { useState } from 'react';
import { ethers } from 'ethers';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import MyERC721CollectionAbi from '../abis/MyERC721Collection.json';

const SwapForm = () => {
  const [contractAddress, setContractAddress] = useState(''); // Address of the target contract
  const [tokenId, setTokenId] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleSwap = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const myContract = new ethers.Contract(contractAddress, MyERC721CollectionAbi, signer);

    try {
      const tx = await myContract.swapERC721(
        signer.address,
        tokenId,
        recipient,
        tokenId // Assuming same tokenId for demonstration
      );
      await tx.wait();
      alert('Swap successful!');
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed!');
    }
  };

  return (
    <form>
      <TextField
        label="Contract Address"
        variant="outlined"
        value={contractAddress}
        onChange={(e) => setContractAddress(e.target.value)}
      />
      <TextField label="Token ID" variant="outlined" value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
      <TextField
        label="Recipient Address"
        variant="outlined"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleSwap}>
        Execute Swap
      </Button>
    </form>
  );
};

export default SwapForm;
