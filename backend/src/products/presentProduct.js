const presentProduct = (product) => {
  const value = product.toObject ? product.toObject() : product;
  const retailer = value.retailerId && typeof value.retailerId === 'object'
    ? {
      id: value.retailerId._id,
      name: value.retailerId.name,
      businessName: value.retailerId.businessName,
      businessCategory: value.retailerId.businessCategory,
      city: value.retailerId.city,
      state: value.retailerId.state
    }
    : null;

  return {
    ...value,
    id: value._id.toString(),
    category: value.categoryId?.name || value.category || '',
    images: value.images?.length ? value.images : (value.image ? [value.image] : []),
    availability: value.stock > 0 ? 'available' : 'out-of-stock',
    retailer
  };
};

module.exports = { presentProduct };