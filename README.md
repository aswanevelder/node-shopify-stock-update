# node-shopify-stock-update
Node JS function to update stock on shopify. 

**environment variables**\
SHOPIFY_SHOPNAME: Shopify name like: myshop.myshopify.com\
SHOPIFY_APIKEY: Generated Private App API Key\
SHOPIFY_PASSWORD: Generated Private App API Password\
SHOPIFY_DBNAME: MongoDB Database name\
SHOPIFY_COLLECTIONNAME: MongoDB Database Collection name for Shopify Stock\
STORE_COLLECTIONNAME: MongoDB Database Collection name for Store Stock\

**mongo db Shopify Stock table definition**\
```json
{
    "_id": {
        "$oid": "5c7cfcf321b1314355ae6325"
    },
    "sku": "00000",
    "site_productid": {
        "$numberDouble": "0000000"
    },
    "site_variantid": {
        "$numberDouble": "000000"
    },
    "site_inventoryid": {
        "$numberDouble": "000000"
    },
    "product_title": "Product Title",
    "variant_title": "Variant Title",
    "site_price": "999.90",
    "site_compareprice": "999.90",
    "site_stock": {
        "$numberInt": "1"
    },
    "store_price": "899.90",
    "store_promo": "899.90",
    "store_stock": {
        "$numberInt": "1"
    },
    "status": "SHOPIFY"
}
```
**mongo db Store Stock table definition**\
```json
{
    "sku": {
        "$numberInt": "0000"
    },
    "descr": "Title",
    "qty": "1",
    "price": "1.00",
    "promo": "0.00"
}
```
