export interface ERC721Listing {
  tokenId: number;
  price: string; // usually a string in wei format
  seller: string;
  uri: string;
}

export interface ERC1155Listing {
  tokenId: number;
  price: string; // usually a string in wei format
  seller: string;
  amount: number;
  uri: string;
}

export interface DetailedNFTsResponse {
  erc721: ERC721Listing[];
  erc1155: ERC1155Listing[];
}
