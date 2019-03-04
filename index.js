const MongoClient = require('mongodb').MongoClient;
const Shopify = require('shopify-api-node');
const environment = require('./environment');

const SHOPIFY_LIMIT = 10;
let shopifyCollection;
let storeCollection;
let shopify;
let shopifyLocationId;
let limiterInterval;

exports.handler = function (event, context, callback) {
    //Initialize Shopify
    shopify = new Shopify({
        shopName: environment.SHOPIFY_SHOPNAME,
        apiKey: environment.SHOPIFY_APIKEY,
        password: environment.SHOPIFY_PASSWORD
    });

    //Get Location Id
    getLocationId((err, data) => {
        if (err) {
            console.error(err);
        }
        else {
            shopifyLocationId = data;
            console.log(`Location ID: ${shopifyLocationId}`);

            //Initialize MongoDB
            MongoClient.connect(environment.SHOPIFY_DBURL, function (err, client) {
                if (!err) {
                    console.log("Connected successfully to server");
                    const db = client.db(environment.SHOPIFY_DBNAME);
                    shopifyCollection = db.collection(environment.SHOPIFY_COLLECTIONNAME);
                    storeCollection = db.collection(environment.STORE_COLLECTIONNAME);

                    //Get Shopify Collection records
                    limiterInterval = setInterval(() => updateRecords(client), 10000);
                }
                else
                    console.error(err);
            });
        }
    });
};

async function updateRecords(client) {
    try {
        const dataCursor = shopifyCollection.find({ "status": "SHOPIFY" });
        const cursorCount = await dataCursor.count();
        console.log('Records remaining: ' + cursorCount);
        for (let x = 0; x < SHOPIFY_LIMIT; x++) {
            if (await dataCursor.hasNext()) {
                const record = await dataCursor.next();
                await updateShopify(record);
            }
            else {
                clearInterval(limiterInterval);
                await client.close();
            }
        }
    }
    catch (err) {
        console.log(err);
    }
}

async function updateShopify(shopify_record) {
    try {
        if (shopify_record) {
            const sku = shopify_record.sku;

            const store_record = await storeCollection.findOne({ sku: parseInt(sku, 10) });
            if (store_record) {
                await updateStock(shopify_record, store_record, sku, async (err, status) => {
                    const stockStatus = status;

                    if (err)
                        console.error(err);

                    await updateDatabase(sku, store_record, status);                        

                    if (store_record.promo == '0.00') {
                        await updatePromoPrice(shopify_record, store_record, sku, async (err, status) => {
                            if (err)
                                console.error(err);

                            if (status == 'NO_CHANGE') status = stockStatus;
                            await updateDatabase(sku, store_record, status);
                        });
                    }
                    else {
                        await updateNormalPrice(shopify_record, store_record, sku, async (err, status) => {
                            if (err)
                                console.error(err);

                            if (status == 'NO_CHANGE') status = stockStatus;
                            await updateDatabase(sku, store_record, status);
                        });
                    }
                });
            }
            else {
                await updateDatabase(sku, store_record, 'NO_RECORD');
            }
        }
        else
            console.log('Invalid Record' + data.sku);
    }
    catch (e) {
        console.log(e);
    }
}

async function updateDatabase(sku, store_record, status) {
    try {
        if (store_record) {
            await shopifyCollection.updateMany({ sku: `${sku}` }, {
                $set: {
                    store_price: store_record.price,
                    store_promo: store_record.promo,
                    store_stock: parseInt(store_record.qty, 10),
                    site_stock: parseInt(store_record.qty, 10),
                    status: status
                }
            });
            console.log(`db updated: ${sku}`);
        }
        else {
            await shopifyCollection.updateMany({ sku: `${sku}` }, {
                $set: {
                    status: status
                }
            });
        }
    }
    catch(err) {
        console.log(err);
    }
}

function getLocationId(callback) {
    shopify.location.list()
        .then(stockLocations => {
            if (stockLocations.length !== 1)
                callback(new Error('The implementation only cater for 1 location at the moment'));
            else {
                callback(null, stockLocations[0].id);
            }
        })
        .catch(err => callback(err));
}

async function updateShopifyPrice(id, price, comparePrice, callback) {
    try {
        await shopify.productVariant.update(id, {
            price: price,
            compare_at_price: comparePrice
        })
        callback();
    }
    catch(err) {
        callback(err);
    }
}

async function updateNormalPrice(shopify_record, store_record, sku, callback) {
    if (shopify_record.site_price !== store_record.promo) {
        await updateShopifyPrice(shopify_record.site_variantid, store_record.promo, store_record.price, (err) => {
            if (err) {
                callback(err, 'SHOPIFY_ERROR');
            }
            else {
                console.log(`Updated Price for ${sku} to ${store_record.promo} with original price at ${store_record.price}`);
                callback(err, 'SHOPIFY_UPDATED');
            }
        });
    }
    else
        callback(null, 'NO_CHANGE');
}

async function updatePromoPrice(shopify_record, store_record, sku, callback) {
    if (shopify_record.site_price !== store_record.price) {
        await updateShopifyPrice(shopify_record.site_variantid, store_record.price, null, (err) => {
            if (err) {
                callback(err, 'SHOPIFY_ERROR');
            }
            else {
                console.log(`Updated Price for ${sku} to ${store_record.price} with promo at 0.00`);
                callback(err, 'SHOPIFY_UPDATED');
            }
        });
    }
    else
        callback(null, 'NO_CHANGE');
}

async function updateStock(shopify_record, store_record, sku, callback) {
    if (shopify_record.site_stock !== parseInt(store_record.qty, 10)) {
        await updateShopifyStock(shopify_record.site_inventoryid, parseInt(store_record.qty, 10), (err) => {
            if (err) {
                callback(err, 'SHOPIFY_ERROR');
            }
            else {
                console.log(`Updated Stock for ${sku} to ${store_record.qty}`);
                callback(err, 'SHOPIFY_UPDATED');
            }
        });
    }
    else
        callback(null, 'NO_CHANGE');

    async function updateShopifyStock(inventoryId, stockQty, callback) {
        try {
            await shopify.inventoryLevel.set({
                "location_id": shopifyLocationId,
                "inventory_item_id": inventoryId,
                "available": stockQty
            });
            callback();
        }
        catch(err) {
            callback(err)
        }
    }
}
