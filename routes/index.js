const express = require('express');
const router = express.Router();
const axios = require('axios');
const jsonFile = require('jsonfile');
const config = jsonFile.readFileSync('./config.json');

async function getAddress(address) {
    let result = null;
    try {
        const data = (await axios.get(config.node + '/api/wallets/' + address)).data.data;
        let attributes = data.attributes;
        if (attributes['delegate']) {
            attributes['voteBalance'] = (attributes['voteBalance'] / 1e8).toFixed(8);
            attributes['forgedFees'] = (attributes['forgedFees'] / 1e8).toFixed(8);
            attributes['forgedRewards'] = (attributes['forgedRewards'] / 1e8).toFixed(8);
            if (attributes['delegate']['lastBlock']) {
                let lastBlock = attributes['delegate']['lastBlock'];
                lastBlock['totalAmount'] = (lastBlock['totalAmount'] / 1e8).toFixed(8);
                lastBlock['totalFee'] = (lastBlock['totalFee'] / 1e8).toFixed(8);
                lastBlock['reward'] = (lastBlock['reward'] / 1e8).toFixed(8);
                attributes['delegate']['lastBlock'] = lastBlock;
            }
        }

        result = {
            address: data.address,
            publicKey: data.publicKey || false,
            balance: (data.balance / 1e8).toFixed(8),
            nonce: data.nonce,
            attributes: attributes,

        }
    } catch (e) {

    }
    return result;
}


async function getSupply() {
    let result = null;
    const burnAddress = await getAddress(config['burn']);


    try {
        const data = (await axios.get(config.node + '/api/blockchain')).data.data;
        const totalSupply = (data.supply / 1e8)

        result = {
            symbol: "STH",
            chainId: data.block.id,
            height: data.block.height,
            totalSupply: totalSupply.toFixed(8),
            circulation: (totalSupply - burnAddress.balance * 1).toFixed(8),
            burned: {
                address: burnAddress.address,
                amount: burnAddress.balance
            }
        }

    } catch (e) {

    }
    return result;
}


async function getLastBlock() {
    let result = null;
    try {
        result = (await axios.get(config.node + '/api/blocks/last')).data.data;
    } catch(e) {

    }
    return result;
}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'SmartHoldem API Wrapper'});
});

router.get('/trng', async function (req, res, next) {
    res.json(await getSupply())
});


router.get('/blockchain', async function (req, res, next) {
    res.json(await getSupply())
});

module.exports = router;
