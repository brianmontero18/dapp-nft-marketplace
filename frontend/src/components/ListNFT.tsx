/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
// import { NFT } from '../types';

type ListNFTProps = {
  userNFTs: any;
};

const ListNFT: React.FC<ListNFTProps> = ({ userNFTs }) => {
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [price, setPrice] = useState<string>('');

  const handleListNFT = async () => {
    try {
      console.log(selectedNFT);
      // Llama a la función listItemForSale en el contrato marketplace
    } catch (error) {
      console.error('Listing failed:', error);
    }
  };

  return (
    <div>
      <select onChange={(e) => setSelectedNFT(e.target.value)}>
        <option value="">Select NFT</option>
        {userNFTs.map((nft: any) => (
          <option key={nft.id} value={nft.id.toString()}>
            NFT #{nft.id}
          </option>
        ))}
      </select>
      <input type="number" placeholder="Set price" value={price} onChange={(e) => setPrice(e.target.value)} />
      <button onClick={handleListNFT}>List for Sale</button>
    </div>
  );
};

export default ListNFT;
