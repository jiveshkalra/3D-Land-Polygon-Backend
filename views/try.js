const main = async () => {
  let signer = null;

  let provider;
  if (window.ethereum == null) { 
    console.log("MetaMask not installed; using read-only defaults");
    provider = ethers.getDefaultProvider();
  } else { 
    provider = new ethers.BrowserProvider(window.ethereum); 
    const account = await provider.send("eth_requestAccounts",[]);
    console.log("Connected to MetaMask account", account);
    signer = await provider.getSigner();
  }
};
