let { 
    signerWallet,
    namehash,
    ethersId,
    getContract,
    getSubdomainOwnerList,
    ENS_REGISTRY_ADDRESS,
    ENS_PUBLIC_RESOLVER_MAINNET,
    DOMAIN,
    verifyMessage
} = require("./utils")


let FROM_BLOCK = parseInt(process.env.FROM_BLOCK) || 9864750
exports.handler = async (ev) => {

    if (ev.httpMethod === 'GET') {
        return success( { signer: signerWallet.address } )
    } else if (ev.httpMethod === 'POST') {
        try {
            console.log('ENS Signer starting...')
            const body = JSON.parse(ev.body)
    
            let {signature, address, subdomain} = body
            let signedAddress = verifyMessage(subdomain, signature)
            if (signedAddress.toLowerCase() !== address.toLowerCase()) {
                return fail("signer address (" + signedAddress +") did not match input address " + address, 202)
            }
            console.log("Attempting to set " + address + " as the owner of " + subdomain)

            let domainHash = namehash(DOMAIN)
            let subdomainHash = ethersId(subdomain)

            // check logs for address
            let ownerList = await getSubdomainOwnerList(FROM_BLOCK)
            if (ownerList.includes(address.toLowerCase())) {
                return fail("address already owns an ENS subdomain of " + DOMAIN, 202)
            }

            let ensContract =  getContract(ENS_REGISTRY_ADDRESS, ensABI)
            
            let tx = await ensContract.setSubnodeRecord(domainHash, subdomainHash, address, ENS_PUBLIC_RESOLVER_MAINNET, 0)
            return success({ tx })
        } catch (err) {
            console.log("ERROR OCCURRED in execution")
            console.log(err)
            return fail(err, 500)
        }
    }
}

const success = (s) => {
    return {
        headers: {
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
            "Access-Control-Allow-Origin": "*"
        },
        statusCode: 200,
        body: JSON.stringify(s) || "ok",
    }
}

const fail = (err, code) => {
    return {
        headers: {
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
            "Access-Control-Allow-Origin": "*"
        },
        statusCode: code || 400,
        body: JSON.stringify({ error: err }),
    }
}