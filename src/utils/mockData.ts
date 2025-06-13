
export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
}

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Classic White Dress Shirt",
    price: 89,
    image: "https://images.unsplash.com/photo-1602810319428-019690571b5b?w=400&h=400&fit=crop&crop=center",
    category: "Formal",
    description: "A timeless white dress shirt perfect for business meetings and formal occasions. Made from premium cotton with a comfortable fit.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Light Blue"],
    inStock: true,
  },
  {
    id: 2,
    name: "Casual Navy Blue Shirt",
    price: 65,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop&crop=center",
    category: "Casual",
    description: "Comfortable navy blue shirt perfect for casual outings. Soft fabric blend with a relaxed fit.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Navy", "Black", "Gray"],
    inStock: true,
  },
  {
    id: 3,
    name: "Striped Business Shirt",
    price: 95,
    image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop&crop=center",
    category: "Business",
    description: "Professional striped shirt that adds sophistication to your business wardrobe. Premium quality fabric.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Blue/White", "Gray/White"],
    inStock: true,
  },
  {
    id: 4,
    name: "Premium Black Shirt",
    price: 79,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
    category: "Premium",
    description: "Elegant black shirt suitable for both formal and casual occasions. High-quality fabric with excellent drape.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Charcoal"],
    inStock: true,
  },
  {
    id: 5,
    name: "Cotton Check Shirt",
    price: 72,
    image: "https://images.unsplash.com/photo-1603252109612-ffd69d6080c6?w=400&h=400&fit=crop&crop=center",
    category: "Casual",
    description: "Comfortable cotton check shirt perfect for weekend wear. Classic pattern with modern fit.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Red/White", "Blue/White", "Green/White"],
    inStock: true,
  },
  {
    id: 6,
    name: "Linen Summer Shirt",
    price: 85,
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop&crop=center",
    category: "Summer",
    description: "Lightweight linen shirt perfect for summer days. Breathable fabric with a relaxed, comfortable fit.",
    sizes: ["M", "L", "XL"],
    colors: ["Beige", "White", "Light Blue"],
    inStock: true,
  },
];
