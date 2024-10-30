import { useState, useCallback } from 'react';
import Web3 from 'web3';

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [provider, setProvider] = useState<Web3 | null>(null);

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Provider.eth.getAccounts();
        const selectedAccount = accounts[0];

        setAccount(selectedAccount);
        setProvider(web3Provider);

        const balance = await web3Provider.eth.getBalance(selectedAccount);
        setBalance(web3Provider.utils.fromWei(balance, 'ether'));
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  }, []);

  return { account, balance, provider, connectWallet };
};
