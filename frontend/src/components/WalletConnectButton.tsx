import Button from '@mui/material/Button';

const WalletConnectButton = ({
  account,
  balance,
  connectWallet,
}: {
  account: string | null;
  balance: string | null;
  connectWallet: () => Promise<void>;
}) => {
  const formatAccount = (account: string) => `${account.slice(0, 6)}...${account.slice(-4)}`;

  return (
    <div>
      <Button variant="contained" onClick={connectWallet}>
        {account ? formatAccount(account) : 'Connect Wallet'}
      </Button>
      {balance && <p>Balance: {balance} ETH</p>}
    </div>
  );
};

export default WalletConnectButton;
