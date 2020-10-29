module.exports = {
    paginate:  function (products,perPage,page) {
    return products.slice((page - 1) * perPage, page * perPage);
    }
}
