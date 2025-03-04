"use client"
import { useState } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import axios from "axios";
import { token_abi } from "./contstants";
const alchemyApiKey = "";
const infuraUrl = "https://mainnet.infura.io/v3/8c4fb08423064f668b7ba9bc188cdf9f";
const provider = new ethers.JsonRpcProvider(infuraUrl);
export default function Home() {
  const [wallet, setWallet] = useState(null);
  const [mnemonic, setMnemonic] = useState("");
  const [address, setAddress] = useState("");
  const [addressbalance, setAddressBalance] = useState("");

  const [privateKey, setPrivateKey] = useState("");
  const [balance, setBalance] = useState(null);
  const [txDetails, setTxDetails] = useState(null);
  const [tokenAddress, setTokenAddress] = useState("");
  
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const createWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    setWallet(wallet);
    setMnemonic(wallet.mnemonic.phrase);
    setAddress(wallet.address);
    setPrivateKey(wallet.privateKey);
  };

  const getBalance = async () => {
    if (!addressbalance) return alert("Enter address");
    const ethBalance = await provider.getBalance(addressbalance);
    let tokenBalance = null;
    
    if (tokenAddress) {
      const contract = new ethers.Contract(tokenAddress, token_abi, provider);
      const balance = await contract.balanceOf(addressbalance);
      const decimals = await contract.decimals();
      tokenBalance = ethers.formatUnits(balance, decimals);
    }

    setBalance({ eth: ethers.formatEther(ethBalance), token: tokenBalance });
  };

  const transfer = async () => {
    if (!privateKey || !recipient || !amount) return alert("Fill all fields");
  
    try {
      const wallet = new ethers.Wallet(privateKey, provider);
      const balance = await provider.getBalance(wallet.address);
      let tx;
  
      // Fetch gas price from provider
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice; // Use `gasPrice` from feeData
  
      if (tokenAddress) {
        const contract = new ethers.Contract(tokenAddress, token_abi, wallet);
        const decimals = await contract.decimals();
        const amountInUnits = ethers.parseUnits(amount, decimals);
  
        // Estimate gas fee
        const gasLimit = await contract.estimateGas.transfer(recipient, amountInUnits);
        const gasFee = gasLimit * gasPrice;
  
        if (balance < gasFee) return alert("Insufficient balance for gas fees.");
  
        tx = await contract.transfer(recipient, amountInUnits);
      } else {
        const amountInEther = ethers.parseEther(amount);
  
        // Estimate gas fee
        const gasLimit = await provider.estimateGas({ to: recipient, value: amountInEther });
        const gasFee = gasLimit * gasPrice;
        const totalCost = amountInEther + gasFee;
  
        if (balance < totalCost) return alert("Insufficient balance to cover amount and gas fees.");
  
        tx = await wallet.sendTransaction({ to: recipient, value: amountInEther });
      }
  
      alert("Transaction Sent: " + tx.hash);
    } catch (error) {
      alert("Transaction Failed: " + error.message);
    }
  };
  
  

  const getTxDetails = async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      setTxDetails(tx);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Ethereum Wallet</h1>
      <button 
        onClick={createWallet} 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">
        Create Wallet
      </button>
      {wallet && (
        <div className="bg-gray-800 p-4 rounded w-full max-w-lg">
          <p><strong>Mnemonic:</strong> {mnemonic}</p>
          <p><strong>Address:</strong> {address}</p>
          <p><strong>Private Key:</strong> {privateKey}</p>
        </div>
      )}
      <br />
      <input
        type="text"
        placeholder="Enter Address"
        className="p-2 rounded bg-gray-700 text-white border border-gray-500 w-full max-w-lg"
        onChange={(e) => setAddressBalance(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter Token Address (Optional)"
        className="p-2 rounded bg-gray-700 text-white border border-gray-500 w-full max-w-lg mt-2"
        onChange={(e) => setTokenAddress(e.target.value)}
      />
      <button 
        onClick={getBalance} 
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4">
        Check Balance
      </button>
      {balance && <p className="mt-2 text-lg">ETH: {balance.eth} | Token: {balance.token}</p>}
      <br />
      <input
        type="text"
        placeholder="Recipient Address"
        className="p-2 rounded bg-gray-700 text-white border border-gray-500 w-full max-w-lg"
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="text"
        placeholder="Amount"
        className="p-2 rounded bg-gray-700 text-white border border-gray-500 w-full max-w-lg mt-2"
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="text"
        placeholder="Your Private Key"
        className="p-2 rounded bg-gray-700 text-white border border-gray-500 w-full max-w-lg mt-2"
        onChange={(e) => setPrivateKey(e.target.value)}
      />
      <button 
        onClick={transfer} 
        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mt-4">
        Transfer
      </button>
      <br />
      <input
        type="text"
        placeholder="Enter Tx Hash"
        className="p-2 rounded bg-gray-700 text-white border border-gray-500 w-full max-w-lg mt-4"
        onChange={(e) => getTxDetails(e.target.value)}
      />
      {txDetails && <pre className="bg-gray-800 p-4 rounded mt-4 w-full max-w-lg overflow-auto">{JSON.stringify(txDetails, null, 2)}</pre>}
    </div>
  );
}
