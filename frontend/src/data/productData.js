/**
 * Formatting utilities for product values
 */
export const formatPrice = (price) => {
  return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
};

export const formatPriceNumber = (price) => {
  return price;
};
export default [];
