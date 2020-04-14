let { ethers } = require("ethers")

const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" //on all public networks
const ENS_PUBLIC_RESOLVER_MAINNET = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41"
const DOMAIN = process.env.ENS_DOMAIN

const ensABI = require("./ENS.json").abi

const namehash = ethers.utils.namehash
const ethersId = ethers.utils.id
const verifyMessage = ethers.utils.verifyMessage

const ETHEREUM_NETWORK = process.env.ETHEREUM_NETWORK

const infuraURL = `https://${ETHEREUM_NETWORK}.infura.io/v3/9dd73bc075d441f684db7bc34f4e5950`
const provider = new ethers.providers.JsonRpcProvider(infuraURL)
const signerWallet = new ethers.Wallet(process.env.SIGNER_PRIV_KEY, provider)

const getContract = (address, abi) => {
    return new ethers.Contract(address, abi, signerWallet)
}

const getSubdomainOwnerList = async (fromBlock) => {
    let nodeHash = ethers.utils.namehash(process.env.ENS_DOMAIN)
    let eventName = "NewOwner(bytes32,bytes32,address)"
    let eventInterface = new ethers.utils.Interface(ensABI);
    let eventTopic = ethers.utils.id(eventName)
    let filter = {
        fromBlock,
        toBlock: "latest",
        address: ENS_REGISTRY_ADDRESS,
        topics: [eventTopic, nodeHash]
    }
    let logs = await provider.getLogs(filter)
    let ownerList = []
    for (let j = 0; j < logs.length; j++) {
        const event = logs[j];
        let log = await eventInterface.parseLog(event)
        let o = log.args['_owner']
        ownerList.push(o.toLowerCase())
    }
    return ownerList
}

module.exports = {
    signerWallet,
    namehash,
    ethersId,
    getContract,
    getSubdomainOwnerList,
    ENS_REGISTRY_ADDRESS,
    ENS_PUBLIC_RESOLVER_MAINNET,
    DOMAIN,
    verifyMessage
}