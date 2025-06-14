
import { useState, useEffect } from 'react';
import { wooCommerceApi, WooCommerceProduct } from '../utils/woocommerceApi';
import { mapWooCommerceProducts, Product } from '../utils/dataMappers';
import { toast } from 'sonner';

interface UseProductsParams {
  category?: string;
  search?: string;
  page?: number;
  perPage?: number;
  orderby?: string;
  order?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const useProducts = (params: UseProductsParams = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const wcProducts = await wooCommerceApi.getProducts({
          page: params.page || 1,
          per_page: params.perPage || 20,
          category: params.category,
          search: params.search,
          orderby: params.orderby || 'date',
          order: params.order || 'desc',
          min_price: params.minPrice,
          max_price: params.maxPrice,
        });

        const mappedProducts = mapWooCommerceProducts(wcProducts);
        setProducts(mappedProducts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [params.category, params.search, params.page, params.perPage, params.orderby, params.order, params.minPrice, params.maxPrice]);

  return { products, loading, error };
};

export const useProduct = (id: number) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const wcProduct = await wooCommerceApi.getProduct(id);
        const mappedProduct = mapWooCommerceProducts([wcProduct])[0];
        setProduct(mappedProduct);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
};
