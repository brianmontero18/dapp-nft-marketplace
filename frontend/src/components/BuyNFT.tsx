type BuyNFTProps = {
  nftId: number;
  price: string;
  sellerAddress?: string;
};

const BuyNFT: React.FC<BuyNFTProps> = ({ nftId, price, sellerAddress = '' }) => {
  const buyNFT = async () => {
    try {
      // Aquí iría la lógica para llamar a la función buyItem en el contrato de marketplace
      console.log(`Buying NFT with ID ${nftId} from ${sellerAddress} for ${price} ETH`);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <button onClick={buyNFT}>
      Buy NFT {nftId} for {price} ETH
    </button>
  );
};

export default BuyNFT;
