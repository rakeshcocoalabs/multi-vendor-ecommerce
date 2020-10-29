var commonStorePath = 'http://172.105.33.226/ecommerce-images'
module.exports = {
  gateway: {
    url: "http://localhost:5000"
  },
  otp: {
    expirySeconds: 2 * 60
  },
  user: {
    imageUploadPath: 'uploads',
    //imageUploadPath: '/var/www/html/ecommerce-images/users/',
    imageBase: commonStorePath + '/users/',
    resultsPerPage: 30
  },
  cart: {
    resultsPerPage: 30
  },
  order: {
    resultsPerPage: 30
  },
  banners: {
    imageUploadPath: 'uploads',
    //imageUploadPath: '/var/www/html/ecommerce-images/banners/',
    imageBase: commonStorePath + '/banners/'
  },
  categories: {
   imageUploadPath: 'uploads',
  //  imageUploadPath: '/var/www/html/ecommerce-images/categories/',
    imageBase: commonStorePath + '/categories/'
  },
  products: {
    imageUploadPath: 'uploads',
   //imageUploadPath: '/var/www/html/ecommerce-images/products/',
   // imageBase: commonStorePath + '/products/',
    resultsPerPage: 30

  },
  variants: {
    resultsPerPage: 30
  },
  vendors: {
    resultsPerPage: 30,
    imageUploadPath: 'uploads',
   //imageUploadPath: '/var/www/html/ecommerce-images/vendors/',
  }



}