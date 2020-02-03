const db = require('./helpers/db.js').db;
const bnb = require('./helpers/bnb.js');
const eth = require('./helpers/eth.js');
const models = require('./models')

const utils = {
    processDeposits() {
        utils.getTokensInfo((err, tokensInfo) => {
            if (err) {
                console.log(err)
                return
            }
            console.log("Processing eth deposits...")
            utils.processEthDeposits(tokensInfo)
            console.log("Processing bnb deposits...")
            utils.processBnbDeposits(tokensInfo)
        })
    },

    getTokensInfo(callback) {
        db.manyOrNone('select tok.uuid, tok.name, tok.symbol, tok.unique_symbol, tok.total_supply, tok.fee_per_swap, tok.minimum_swap_amount, tok.erc20_address, bnb.address as bnb_address, eth.address as eth_address from tokens tok left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid left join eth_accounts eth on eth.uuid = tok.eth_account_uuid where tok.processed = \'t\' ;')
            .then((response) => {
                callback(null, response)
            })
            .catch(callback)
    },

    async processEthDeposits(tokensInfo) {
        utils.getEthClientsAccounts(async (err, accounts) => {
            if (err) {
                console.log('getEthClientsAccounts: ' + err)
                return
            }
            for (var tokenInfo of tokensInfo) {
                for (var clientAccount of accounts) {
                    sendDeposit = () => new Promise((resolve, reject) => {
                      models.sendEthDepositToBridge(clientAccount.eth_address, tokenInfo, (err, result) => {
                        if (err) {
                            console.log('sendEthDepositToBridge: ' + err)
                            reject(err)
                        } else {
                          resolve()
                        }
                      })
                    })
                    await sendDeposit().catch(console.log)
                }
            }
        })
    },

    async processBnbDeposits(tokensInfo) {
        utils.getBnbClientsAccounts(async (err, accounts) => {
            if (err) {
                console.log('getBnbClientsAccounts: ' + err)
                return
            }
            for (var tokenInfo of tokensInfo) {
                for (var clientAccount of accounts) {
                    sendDeposit = () => new Promise((resolve, reject) => {
                      models.sendBnbDepositToBridge(clientAccount.bnb_address, tokenInfo, (err, result) => {
                          if (err) {
                              console.log('sendBnbDepositToBridge: ' + err)
                              reject(err)
                          } else {
                            resolve()
                          }
                      })
                    })

                    await sendDeposit().catch(console.log)
                }
            }
        })
    },

    getEthClientsAccounts(callback) {
        db.manyOrNone('select ca.uuid, ca.bnb_address, cea.address as eth_address from client_accounts_bnb ca left join client_eth_accounts cea on cea.uuid = ca.client_eth_account_uuid;')
            .then((response) => {
                callback(null, response)
            })
            .catch(callback)
    },

    getBnbClientsAccounts(callback) {
        db.manyOrNone('select ca.uuid, ca.eth_address, cba.address as bnb_address from client_accounts_eth ca left join client_bnb_accounts cba on cba.uuid = ca.client_bnb_account_uuid;')
            .then((response) => {
                callback(null, response)
            })
            .catch(callback)
    }
}

utils.processDeposits()
