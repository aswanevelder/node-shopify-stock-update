# node-shopify-stock-update
Node JS function to update stock on shopify. 

**Environment Variables**

SHOPIFY_SHOPNAME: Shopify name like: myshop.myshopify.com\
SHOPIFY_APIKEY: Generated Private App API Key\
SHOPIFY_PASSWORD: Generated Private App API Password\
SHOPIFY_DBURL: MongoDB Url\
SHOPIFY_DBNAME: MongoDB Database name\
SHOPIFY_COLLECTIONNAME: MongoDB Database Collection name for Shopify Stock\
STORE_COLLECTIONNAME: MongoDB Database Collection name for Store Stock

**MongoDB Shopify Stock table definition**

```json
{
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
**MongoDB Store Stock table definition**

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
