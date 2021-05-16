import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let atualCart = [...cart];
      const { data: stockItem } = await api.get<Stock>(`/stock/${productId}`)
      if(stockItem.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      let { data: product } = await api.get<Product>(`/products/${productId}`)

      let existAtualCart = atualCart.find(item => item.id === productId)

      if(existAtualCart) {
        existAtualCart.amount++;
        setCart(atualCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      } else {
        product.amount = 1;
        setCart([...atualCart, product])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...atualCart, product]))
        return;
      }
    } catch {
      toast.error('Erro na adição do produto');
      return;
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let atualCart = [...cart];
      const existProduct = atualCart.find(product => product.id === productId)
      if(existProduct) {
        existProduct.amount--;
        setCart(atualCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
      return
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let atualCart = [...cart];
      const { data: stockItem } = await api.get<Stock>(`/stock/${productId}`)
      if(amount <= 0) {
        return;
      }
      if(stockItem.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      let existAtualCart = atualCart.find(item => item.id === productId)
      if(existAtualCart){
        existAtualCart.amount = amount
        setCart(atualCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      } else {
        return
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
