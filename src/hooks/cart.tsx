import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
        // await AsyncStorage.clear();
      } else {
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async newProduct => {
      const sameProduct = products.find(
        current => current.id === newProduct.id,
      );

      if (sameProduct) {
        const updatedProducts = products.map(current => {
          if (current.id === sameProduct.id) {
            const incrementedProduct = {
              ...current,
              quantity: current.quantity + 1,
            };
            return incrementedProduct;
          }
          return current;
        });
        setProducts(updatedProducts);
        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(updatedProducts),
        );
      } else {
        setProducts([...products, newProduct]);
        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify([...products, newProduct]),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProductsQuantity = products.map(product => {
        if (product.id === id) {
          const updatedProduct = {
            ...product,
            quantity: product.quantity + 1,
          };

          return updatedProduct;
        }
        return product;
      });

      setProducts(updatedProductsQuantity);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(updatedProductsQuantity),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProductsQuantity = products.map(product => {
        if (product.id === id && product.quantity > 1) {
          const updatedProduct = {
            ...product,
            quantity: product.quantity - 1,
          };

          return updatedProduct;
        }
        return product;
      });

      const onlyExistentProducts = updatedProductsQuantity.filter(
        product => product.quantity > 0,
      );

      setProducts(onlyExistentProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(onlyExistentProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
