"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";

type AddToCartButtonProps = {
  productId: string;
  className?: string;
};

export default function AddToCartButton({ productId, className }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  function handleClick() {
    addToCart(productId, 1);
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1200);
  }

  return (
    <button className={className} type="button" onClick={handleClick}>
      {isAdded ? "تمت الإضافة" : "أضيفي للسلة"}
    </button>
  );
}
