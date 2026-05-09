import { parseEther } from "viem";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export const ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    name: "mintPrice",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "MAX_SUPPLY",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "deposits",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "domainSeparator",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "mintDigest",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bytes32" }],
  },
] as const;

// EIP-712 domain + type for client-side signing
export function getMintTypedData(
  contractAddress: `0x${string}`,
  chainId: number,
  userAddress: `0x${string}`,
  nonce: bigint,
  tokenName: string
) {
  return {
    domain: {
      name: tokenName,
      version: "1",
      chainId,
      verifyingContract: contractAddress,
    },
    types: {
      MintFor: [
        { name: "to",    type: "address" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "MintFor" as const,
    message: {
      to:    userAddress,
      nonce: nonce,
    },
  };
}
