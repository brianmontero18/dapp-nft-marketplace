/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import Web3 from 'web3';

export const useContract = (provider: any | null, contractAddress: string, abi: any) => {
  return useMemo(() => {
    if (provider && contractAddress && abi) {
      const web3 = new Web3(provider);
      return new web3.eth.Contract(abi, contractAddress);
    }
    return null;
  }, [provider, contractAddress, abi]);
};
