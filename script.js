require('dotenv').config({ path: './secret.env' })
let { ethers } = require("ethers")

const PK = process.env.SIGNER_PRIV_KEY
const DOMAIN = process.env.ENS_DOMAIN
const infuraURL = 'https://mainnet.infura.io/v3/9dd73bc075d441f684db7bc34f4e5950'
const provider = new ethers.providers.JsonRpcProvider(infuraURL)
const signerWallet = new ethers.Wallet(PK, provider)

const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" //on all public networks
const ensABI = require("./lambda/ENS.json").abi

const main = async () => {
    console.log("Wallet Address: ", signerWallet.address)
    let subdomain = "joe"
    let sig = await signSubdomain(subdomain)
    console.log("Signature ", sig)
    let signingAddr = ethers.utils.verifyMessage(subdomain, sig)
    console.log("Signing Address: ", signingAddr)

    let fromBlock = 9864750
    let list = await getSubdomainOwnerList(fromBlock)
    console.log(list)
}

const signSubdomain = async (sub) => {
    let sig = await signerWallet.signMessage(sub)
    return sig
}

const getSubdomainOwnerList = async (fromBlock) => {
    let nodeHash = ethers.utils.namehash(DOMAIN)
    let eventName = "NewOwner(bytes32,bytes32,address)"
    let eventInterface = new ethers.utils.Interface(ensABI);
    let eid = ethers.utils.id(eventName)
    let et = {
        fromBlock,
        toBlock: "latest",
        address: ENS_REGISTRY_ADDRESS,
        topics: [eid, nodeHash]
    }
    let logs = await provider.getLogs(et)
    let ownerList = []
    for (let j = 0; j < logs.length; j++) {
        const event = logs[j];
        let x = await eventInterface.parseLog(event)
        let o = x.args['_owner']
        ownerList.push(o.toLowerCase())
    }
    return ownerList
};

main()