import { WooCommerceProduct } from './woocommerceApi';

// Frontend product interface (keeping existing interface)
export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  description?: string;
  inStock?: boolean;
  stockQuantity?: number;
}

// Map WooCommerce product to frontend product
export const mapWooCommerceProduct = (wcProduct: WooCommerceProduct): Product => {
  // Extract sizes from attributes
  const sizeAttribute = wcProduct.attributes.find(attr => 
    attr.name.toLowerCase().includes('size') || attr.name.toLowerCase().includes('pa_size')
  );
  const sizes = sizeAttribute ? sizeAttribute.options : ['S', 'M', 'L', 'XL'];

  // Extract colors from attributes
  const colorAttribute = wcProduct.attributes.find(attr => 
    attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('pa_color')
  );
  const colors = colorAttribute ? colorAttribute.options : ['White', 'Black', 'Blue'];

  // Get primary category
  const category = wcProduct.categories.length > 0 ? wcProduct.categories[0].name : 'Shirts';

  // Get primary image
  const image = wcProduct.images.length > 0 ? wcProduct.images[0].src : '/placeholder.svg';

  return {
    id: wcProduct.id,
    name: wcProduct.name,
    price: parseFloat(wcProduct.price || wcProduct.regular_price || '0'),
    image,
    category,
    sizes,
    colors,
    description: wcProduct.description || wcProduct.short_description,
    inStock: wcProduct.stock_status === 'instock',
    stockQuantity: wcProduct.stock_quantity,
  };
};

// Map multiple WooCommerce products
export const mapWooCommerceProducts = (wcProducts: WooCommerceProduct[]): Product[] => {
  return wcProducts.map(mapWooCommerceProduct);
};

// Format price for display
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numPrice);
};

// Extract product attributes for variations
export const getProductAttributes = (wcProduct: WooCommerceProduct) => {
  const attributes: Record<string, string[]> = {};
  
  wcProduct.attributes.forEach(attr => {
    const key = attr.name.toLowerCase().replace('pa_', '');
    attributes[key] = attr.options;
  });
  
  return attributes;
};
